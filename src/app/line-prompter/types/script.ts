export interface ScriptLine {
  index: number;
  character: string;
  text: string;
}

export interface ParsedScript {
  lines: ScriptLine[];
  characters: string[];
  title?: string;
}

export type RehearsalStatus =
  | 'idle'
  | 'speaking'
  | 'listening'
  | 'prompting'
  | 'paused'
  | 'complete';

export interface RehearsalSettings {
  /** 0–1: how closely the user must match their line (default 0.75) */
  matchSensitivity: number;
  /** Speak the full current line when user says "line" */
  promptFullLine: boolean;
  /** Words per minute-ish for TTS rate (0.5–2) */
  speechRate: number;
  /** Partner TTS voice name; empty = pick best available automatically */
  partnerVoiceName: string;
  /** When false, partner TTS reads dialogue only (no "CHARACTER:" prefix) */
  readCharacterNames: boolean;
}

export const DEFAULT_SETTINGS: RehearsalSettings = {
  matchSensitivity: 0.75,
  promptFullLine: true,
  speechRate: 1,
  partnerVoiceName: '',
  readCharacterNames: true,
};

export type LineResultReason = 'correct' | 'skipped' | 'prompted' | 'imperfect';

/** @deprecated Use LineResultReason */
export type MissedLineReason = Exclude<LineResultReason, 'correct'>;

export type WordMatchStatus = 'correct' | 'wrong' | 'missing' | 'pending';

export interface AlignedWord {
  word: string;
  status: WordMatchStatus;
  spoken?: string;
  isCurrent?: boolean;
}

export interface LineResultEntry {
  lineIndex: number;
  character: string;
  text: string;
  reason: LineResultReason;
  spokenAttempt?: string;
  wordAlignment: AlignedWord[];
}

/** @deprecated Use LineResultEntry */
export type MissedLineEntry = LineResultEntry;
