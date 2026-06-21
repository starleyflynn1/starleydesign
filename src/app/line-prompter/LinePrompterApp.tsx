import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { CharacterPicker } from './components/CharacterPicker';
import { RehearsalSettingsPanel } from './components/RehearsalSettings';
import { ScriptUpload } from './components/ScriptUpload';
import { loadStoredSettings, SETTINGS_STORAGE_KEY } from './lib/rehearsalSettings';
import {
  getInitialCharacters,
  loadPersistedSession,
  loadScriptFromSession,
  savePersistedSession,
  type ScriptSource,
} from './lib/rehearsalSession';
import { DEFAULT_SAMPLE, loadSampleScript } from './lib/samples';
import { characterMatches, parseScript } from './lib/scriptParser';
import type { ParsedScript, RehearsalSettings } from './types/script';
import './styles/line-prompter.css';

interface ScriptLoadOptions {
  sampleId?: string;
  bookmarkLineIndex?: number;
  userCharacters?: string[];
  persist?: boolean;
}

interface RehearsalPanelProps {
  parsedScript: ParsedScript;
  userCharacters: string[];
  settings: RehearsalSettings;
  parseError: string | null;
  bookmarkLineIndex: number;
  onBookmarkLineChange: (lineIndex: number) => void;
  onRunningChange?: (running: boolean) => void;
}

function RehearsalPlaceholder({ scriptLoaded = false }: { scriptLoaded?: boolean }) {
  return (
    <>
      <section className="prompter-stage" aria-live="polite">
        <div className="prompter-meta">
          <span className="status-pill status-idle">Ready</span>
          <span className="line-counter">Line 0 of 0</span>
        </div>
        <div className="current-line current-line-empty">
          <p className="line-text muted">
            {scriptLoaded
              ? 'Loading rehearsal controls…'
              : 'Loading sample scene…'}
          </p>
        </div>
      </section>

      <div className="controls">
        <button type="button" className="btn btn-primary" disabled>
          Start Rehearsal
        </button>
        <button type="button" className="btn btn-ghost" disabled>
          Reset
        </button>
      </div>
    </>
  );
}

export function LinePrompterApp() {
  const [parsedScript, setParsedScript] = useState<ParsedScript | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [scriptSource, setScriptSource] = useState<ScriptSource | null>(null);
  const [userCharacters, setUserCharacters] = useState<string[]>(getInitialCharacters);
  const [parseError, setParseError] = useState<string | null>(null);
  const [RehearsalPanel, setRehearsalPanel] =
    useState<ComponentType<RehearsalPanelProps> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [bookmarkLineIndex, setBookmarkLineIndex] = useState(0);
  const [settings, setSettings] = useState<RehearsalSettings>(loadStoredSettings);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const sessionReadyRef = useRef(false);
  const handleScriptLoadRef = useRef<
    (text: string, name: string, options?: ScriptLoadOptions) => void
  >(() => {});

  const handleScriptLoad = useCallback(
    (text: string, name: string, options: ScriptLoadOptions = {}) => {
      if (text.trim().startsWith('<!') || text.includes('<html')) {
        setParseError(
          `Could not load "${name}" from the server. Try uploading the file manually.`
        );
        setParsedScript(null);
        setFileName(null);
        setScriptSource(null);
        return;
      }

      const parsed = parseScript(text);
      if (parsed.lines.length === 0) {
        setParseError(
          'No dialogue found. Use CHARACTER: line, CHARACTER. line, or CHARACTER on one line with dialogue below.'
        );
        setParsedScript(null);
        setFileName(null);
        setScriptSource(null);
        return;
      }

      const nextCharacters = (
        options.userCharacters ??
        userCharacters.filter((character) =>
          parsed.characters.some((scriptChar) => characterMatches(scriptChar, character))
        )
      ).filter((character) =>
        parsed.characters.some((scriptChar) => characterMatches(scriptChar, character))
      );

      const nextBookmark = Math.min(
        options.bookmarkLineIndex ?? 0,
        Math.max(0, parsed.lines.length - 1)
      );

      const nextSource: ScriptSource = options.sampleId
        ? { type: 'sample', sampleId: options.sampleId, fileName: name }
        : { type: 'upload', fileName: name, text };

      setParseError(null);
      setParsedScript(parsed);
      setFileName(name);
      setScriptSource(nextSource);
      setUserCharacters(nextCharacters);
      setBookmarkLineIndex(nextBookmark);

      if (options.persist !== false && sessionReadyRef.current) {
        savePersistedSession({
          version: 1,
          script: nextSource,
          userCharacters: nextCharacters,
          bookmarkLineIndex: nextBookmark,
        });
      }
    },
    [userCharacters]
  );

  handleScriptLoadRef.current = handleScriptLoad;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const session = loadPersistedSession();

      if (session) {
        try {
          const { text, fileName: name } = await loadScriptFromSession(session.script);
          if (cancelled) return;
          handleScriptLoadRef.current(text, name, {
            sampleId: session.script.type === 'sample' ? session.script.sampleId : undefined,
            bookmarkLineIndex: session.bookmarkLineIndex,
            userCharacters: session.userCharacters,
            persist: false,
          });
          sessionReadyRef.current = true;
          if (!cancelled) setIsRestoringSession(false);
          return;
        } catch {
          if (!cancelled) {
            setParseError('Could not restore your last session. Loading the demo scene…');
          }
        }
      }

      try {
        const { text, fileName: name } = await loadSampleScript(DEFAULT_SAMPLE);
        if (cancelled) return;
        handleScriptLoadRef.current(text, name, {
          sampleId: DEFAULT_SAMPLE.id,
          persist: false,
        });
      } catch (err) {
        if (!cancelled) {
          setParseError(
            err instanceof Error ? err.message : 'Failed to load the demo scene.'
          );
        }
      } finally {
        sessionReadyRef.current = true;
        if (!cancelled) setIsRestoringSession(false);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!parsedScript || !scriptSource || !sessionReadyRef.current || isRestoringSession) {
      return;
    }

    savePersistedSession({
      version: 1,
      script: scriptSource,
      userCharacters,
      bookmarkLineIndex,
    });
  }, [parsedScript, scriptSource, userCharacters, bookmarkLineIndex, isRestoringSession]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  useEffect(() => {
    if (!parsedScript) {
      setRehearsalPanel(null);
      setIsRunning(false);
      if (!isRestoringSession) {
        setBookmarkLineIndex(0);
      }
      return;
    }

    let cancelled = false;
    import('./RehearsalPanel').then((mod) => {
      if (!cancelled) setRehearsalPanel(() => mod.default);
    });

    return () => {
      cancelled = true;
    };
  }, [parsedScript, isRestoringSession]);

  return (
    <div className="line-prompter-root">
      <div className="app">
        <header className="app-header">
          <h1>Line Prompter</h1>
          <p className="tagline">
            Rehearse with spoken partner lines, mic listening, and voice commands
            (&quot;line&quot;, &quot;next&quot;, and &quot;back&quot;). Demo scene:{' '}
            <em>The Importance of Being Earnest</em>.
          </p>
        </header>

        <main id="line-prompter-main">
          {isRestoringSession && (
            <div className="banner banner-warn" role="status">
              Loading rehearsal…
            </div>
          )}

          {parseError && !parsedScript && (
            <div className="banner banner-error" role="alert">
              {parseError}
            </div>
          )}

          <div className="setup-grid">
            <ScriptUpload
              onLoad={handleScriptLoad}
              fileName={fileName}
              disabled={isRunning || isRestoringSession}
            />
            <CharacterPicker
              characters={parsedScript?.characters ?? []}
              value={userCharacters}
              onChange={setUserCharacters}
              disabled={isRunning || isRestoringSession}
            />
          </div>

          {parsedScript && (
            <RehearsalSettingsPanel
              settings={settings}
              disabled={isRunning}
              onChange={setSettings}
            />
          )}

          {parsedScript && RehearsalPanel ? (
            <RehearsalPanel
              parsedScript={parsedScript}
              userCharacters={userCharacters}
              settings={settings}
              parseError={parseError}
              bookmarkLineIndex={bookmarkLineIndex}
              onBookmarkLineChange={setBookmarkLineIndex}
              onRunningChange={setIsRunning}
            />
          ) : (
            <RehearsalPlaceholder scriptLoaded={Boolean(parsedScript)} />
          )}
        </main>

        <footer className="app-footer">
          <p>All speech processing runs in your browser. Scripts never leave your device.</p>
        </footer>
      </div>
    </div>
  );
}
