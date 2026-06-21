import type { RehearsalStatus, ScriptLine } from '../types/script';
import { characterMatches } from './scriptParser';

export interface RehearsalEngineState {
  status: RehearsalStatus;
  lineIndex: number;
  userCharacters: string[];
  lines: ScriptLine[];
}

export type RehearsalEvent =
  | { type: 'SPEAK'; line: ScriptLine }
  | { type: 'LISTEN'; line: ScriptLine }
  | { type: 'PROMPT'; line: ScriptLine }
  | { type: 'ADVANCE' }
  | { type: 'COMPLETE' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' };

export function createInitialState(lines: ScriptLine[]): RehearsalEngineState {
  return {
    status: 'idle',
    lineIndex: 0,
    userCharacters: [],
    lines,
  };
}

export function isUserLine(state: RehearsalEngineState): boolean {
  if (state.userCharacters.length === 0) return false;
  const line = state.lines[state.lineIndex];
  if (!line) return false;
  return state.userCharacters.some((name) =>
    characterMatches(name, line.character)
  );
}

export function getCurrentLine(state: RehearsalEngineState): ScriptLine | null {
  return state.lines[state.lineIndex] ?? null;
}

/** What should happen when rehearsal starts or advances to the next line */
export function resolveLineAction(
  state: RehearsalEngineState
): RehearsalEvent | null {
  const line = getCurrentLine(state);
  if (!line) return { type: 'COMPLETE' };

  if (isUserLine(state)) {
    return { type: 'LISTEN', line };
  }
  return { type: 'SPEAK', line };
}

export function startRehearsal(
  state: RehearsalEngineState,
  userCharacters: string[]
): RehearsalEngineState {
  return {
    ...state,
    status: 'idle',
    userCharacters,
  };
}

export function afterSpeakComplete(
  state: RehearsalEngineState
): { state: RehearsalEngineState; event: RehearsalEvent | null } {
  const nextIndex = state.lineIndex + 1;
  if (nextIndex >= state.lines.length) {
    return {
      state: { ...state, status: 'complete', lineIndex: nextIndex },
      event: { type: 'COMPLETE' },
    };
  }
  const nextState: RehearsalEngineState = {
    ...state,
    lineIndex: nextIndex,
    status: 'idle',
  };
  return { state: nextState, event: resolveLineAction(nextState) };
}

export function afterUserMatch(
  state: RehearsalEngineState
): { state: RehearsalEngineState; event: RehearsalEvent | null } {
  return afterSpeakComplete(state);
}

export function onLinePrompt(
  state: RehearsalEngineState
): { state: RehearsalEngineState; event: RehearsalEvent } {
  const line = getCurrentLine(state);
  if (!line) {
    return {
      state: { ...state, status: 'complete' },
      event: { type: 'COMPLETE' },
    };
  }
  return {
    state: { ...state, status: 'prompting' },
    event: { type: 'PROMPT', line },
  };
}

export function afterPromptComplete(
  state: RehearsalEngineState
): RehearsalEngineState {
  return { ...state, status: 'listening' };
}

export function pauseRehearsal(
  state: RehearsalEngineState
): RehearsalEngineState {
  return { ...state, status: 'paused' };
}

export function resumeRehearsal(
  state: RehearsalEngineState
): RehearsalEngineState {
  const line = getCurrentLine(state);
  if (!line) return { ...state, status: 'complete' };
  if (isUserLine(state)) return { ...state, status: 'listening' };
  return { ...state, status: 'speaking' };
}

export function resetRehearsal(
  state: RehearsalEngineState
): RehearsalEngineState {
  return {
    ...state,
    status: 'idle',
    lineIndex: 0,
  };
}

export function goToLine(
  state: RehearsalEngineState,
  lineIndex: number
): RehearsalEngineState {
  if (state.lines.length === 0) return state;
  const index = Math.max(0, Math.min(lineIndex, state.lines.length - 1));
  return {
    ...state,
    lineIndex: index,
    status: 'idle',
  };
}

export function previousLine(
  state: RehearsalEngineState
): RehearsalEngineState {
  return {
    ...state,
    lineIndex: Math.max(0, state.lineIndex - 1),
    status: 'idle',
  };
}
