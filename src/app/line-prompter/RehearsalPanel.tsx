import { useEffect, useMemo } from 'react';
import { SpeechErrorBanner } from './components/SpeechErrorBanner';
import { Controls } from './components/Controls';
import { RehearsalReport } from './components/RehearsalReport';
import { PrompterStage } from './components/PrompterStage';
import { ScriptPreview } from './components/ScriptPreview';
import { useRehearsal } from './hooks/useRehearsal';
import { isSttSupported } from './lib/stt';
import { isTtsSupported } from './lib/tts';
import type { ParsedScript, RehearsalSettings } from './types/script';

interface RehearsalPanelProps {
  parsedScript: ParsedScript;
  userCharacters: string[];
  settings: RehearsalSettings;
  parseError: string | null;
  bookmarkLineIndex: number;
  onBookmarkLineChange: (lineIndex: number) => void;
  onRunningChange?: (running: boolean) => void;
}

export default function RehearsalPanel({
  parsedScript,
  userCharacters,
  settings,
  parseError,
  bookmarkLineIndex,
  onBookmarkLineChange,
  onRunningChange,
}: RehearsalPanelProps) {
  const browserOk = useMemo(
    () => ({
      tts: isTtsSupported(),
      stt: isSttSupported(),
    }),
    []
  );

  const rehearsal = useRehearsal({
    script: parsedScript,
    userCharacters,
    settings,
    bookmarkLineIndex,
    onBookmarkLineChange,
  });

  const isRunning =
    rehearsal.status === 'speaking' ||
    rehearsal.status === 'listening' ||
    rehearsal.status === 'prompting';

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  const readThrough = userCharacters.length === 0;

  const previewLineIndex =
    rehearsal.status === 'idle' ||
    rehearsal.status === 'complete' ||
    rehearsal.status === 'paused'
      ? bookmarkLineIndex
      : rehearsal.lineIndex;

  return (
    <>
      {(!browserOk.tts || !browserOk.stt) && (
        <div className="banner banner-warn" role="alert">
          Use <strong>Chrome</strong> or <strong>Edge</strong> for full speech
          recognition and text-to-speech support.
        </div>
      )}

      {parseError && (
        <div className="banner banner-error" role="alert">
          {parseError}
        </div>
      )}

      {rehearsal.error && <SpeechErrorBanner message={rehearsal.error} />}

      <ScriptPreview
        lines={parsedScript.lines}
        characters={parsedScript.characters}
        userCharacters={userCharacters}
        currentLineIndex={previewLineIndex}
        onJumpToLine={rehearsal.jumpToLine}
      />

      <PrompterStage
        status={rehearsal.status}
        currentLine={rehearsal.currentLine}
        lineIndex={
          rehearsal.status === 'idle' ||
          rehearsal.status === 'complete' ||
          rehearsal.status === 'paused'
            ? bookmarkLineIndex
            : rehearsal.lineIndex
        }
        totalLines={rehearsal.totalLines}
        userCharacters={userCharacters}
        readThrough={readThrough}
        liveTranscript={rehearsal.liveTranscript}
        title={parsedScript.title}
      />

      {rehearsal.status === 'complete' ? (
        <RehearsalReport
          script={parsedScript}
          userCharacters={userCharacters}
          lineResults={rehearsal.lineResults}
        />
      ) : null}

      <Controls
        status={rehearsal.status}
        canStart
        canGoBack={rehearsal.lineIndex > 0}
        readThrough={readThrough}
        onStart={rehearsal.begin}
        onPause={rehearsal.pause}
        onResume={rehearsal.resume}
        onBack={rehearsal.goBackLine}
        onReset={rehearsal.reset}
        onEndScene={rehearsal.endScene}
      />
    </>
  );
}
