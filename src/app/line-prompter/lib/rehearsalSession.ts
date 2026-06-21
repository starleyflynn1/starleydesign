import { SAMPLE_SCRIPTS, loadSampleScript } from './samples';

export const SESSION_STORAGE_KEY = 'starleydesign-line-prompter-session';
const LEGACY_CHARACTERS_KEY = 'starleydesign-line-prompter-characters';
const LEGACY_CHARACTER_KEY = 'starleydesign-line-prompter-character';

export type ScriptSource =
  | { type: 'sample'; sampleId: string; fileName: string }
  | { type: 'upload'; fileName: string; text: string };

export interface PersistedRehearsalSession {
  version: 1;
  script: ScriptSource;
  userCharacters: string[];
  bookmarkLineIndex: number;
}

function loadLegacyCharacters(): string[] {
  try {
    const raw = localStorage.getItem(LEGACY_CHARACTERS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((c): c is string => typeof c === 'string' && c.length > 0);
      }
    }
    const legacy = localStorage.getItem(LEGACY_CHARACTER_KEY);
    return legacy ? [legacy] : [];
  } catch {
    return [];
  }
}

function parseSession(raw: string): PersistedRehearsalSession | null {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') return null;

  const record = parsed as Partial<PersistedRehearsalSession>;
  if (record.version !== 1 || !record.script || typeof record.script !== 'object') {
    return null;
  }

  const script = record.script as ScriptSource;
  if (script.type === 'sample') {
    if (typeof script.sampleId !== 'string' || typeof script.fileName !== 'string') {
      return null;
    }
    if (!SAMPLE_SCRIPTS.some((sample) => sample.id === script.sampleId)) {
      return null;
    }
  } else if (script.type === 'upload') {
    if (typeof script.fileName !== 'string' || typeof script.text !== 'string') {
      return null;
    }
    if (!script.text.trim()) return null;
  } else {
    return null;
  }

  const userCharacters = Array.isArray(record.userCharacters)
    ? record.userCharacters.filter(
        (character): character is string =>
          typeof character === 'string' && character.length > 0
      )
    : [];

  const bookmarkLineIndex =
    typeof record.bookmarkLineIndex === 'number' && record.bookmarkLineIndex >= 0
      ? Math.floor(record.bookmarkLineIndex)
      : 0;

  return {
    version: 1,
    script,
    userCharacters,
    bookmarkLineIndex,
  };
}

export function loadPersistedSession(): PersistedRehearsalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) return parseSession(raw);
  } catch {
    /* ignore */
  }
  return null;
}

export function savePersistedSession(session: PersistedRehearsalSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    if (session.userCharacters.length > 0) {
      localStorage.setItem(
        LEGACY_CHARACTERS_KEY,
        JSON.stringify(session.userCharacters)
      );
    } else {
      localStorage.removeItem(LEGACY_CHARACTERS_KEY);
    }
    localStorage.removeItem(LEGACY_CHARACTER_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearPersistedSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getInitialCharacters(): string[] {
  const session = loadPersistedSession();
  if (session) return session.userCharacters;
  return loadLegacyCharacters();
}

export async function loadScriptFromSession(
  script: ScriptSource
): Promise<{ text: string; fileName: string }> {
  if (script.type === 'sample') {
    const sample = SAMPLE_SCRIPTS.find((entry) => entry.id === script.sampleId);
    if (!sample) {
      throw new Error(`Unknown sample "${script.sampleId}"`);
    }
    return loadSampleScript(sample);
  }

  return { text: script.text, fileName: script.fileName };
}
