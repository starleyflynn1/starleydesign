import { useCallback, useEffect, useRef, useState } from 'react';
import {
  afterPromptComplete,
  afterSpeakComplete,
  afterUserMatch,
  createInitialState,
  getCurrentLine,
  goToLine,
  isUserLine,
  onLinePrompt,
  pauseRehearsal,
  previousLine,
  resetRehearsal,
  resolveLineAction,
  resumeRehearsal,
  startRehearsal,
  type RehearsalEngineState,
} from '../lib/rehearsalEngine';
import {
  containsBackLineKeyword,
  containsLinePromptKeyword,
  containsNextLineKeyword,
  isLineMatch,
} from '../lib/lineMatcher';
import {
  computeWordAlignment,
  hasWordIssues,
} from '../lib/wordAlignment';
import { SpeechListener } from '../lib/stt';
import { speakText, stopSpeaking, pauseSpeaking, resumeSpeaking, isSpeakingActive, isSpeakingPaused, primeSpeechVoices } from '../lib/tts';
import type {
  LineResultEntry,
  LineResultReason,
  ParsedScript,
  RehearsalSettings,
  RehearsalStatus,
} from '../types/script';

const MATCH_HOLD_MS = 400;

const REASON_PRIORITY: Record<LineResultReason, number> = {
  correct: 1,
  imperfect: 2,
  prompted: 3,
  skipped: 4,
};

type PausedActivity = 'speaking' | 'listening' | 'prompting';

interface UseRehearsalOptions {
  script: ParsedScript | null;
  userCharacters: string[];
  settings: RehearsalSettings;
  bookmarkLineIndex: number;
  onBookmarkLineChange?: (lineIndex: number) => void;
}

export function useRehearsal({
  script,
  userCharacters,
  settings,
  bookmarkLineIndex,
  onBookmarkLineChange,
}: UseRehearsalOptions) {
  const [engineState, setEngineState] = useState<RehearsalEngineState>(() =>
    createInitialState(script?.lines ?? [])
  );
  const [status, setStatus] = useState<RehearsalStatus>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastPromptAt, setLastPromptAt] = useState<number | null>(null);
  const [lineResults, setLineResults] = useState<LineResultEntry[]>([]);

  const listenerRef = useRef(new SpeechListener());
  const lineResultsRef = useRef<LineResultEntry[]>([]);
  const liveTranscriptRef = useRef('');
  const matchTimerRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const engineRef = useRef(engineState);
  const bookmarkRef = useRef(bookmarkLineIndex);
  const statusRef = useRef<RehearsalStatus>('idle');
  const pausedRef = useRef(false);
  const pausedActivityRef = useRef<PausedActivity | null>(null);
  const runActionRef = useRef<(state: RehearsalEngineState) => Promise<void>>(
    async () => {}
  );
  const partnerSkipRef = useRef(false);
  engineRef.current = engineState;
  bookmarkRef.current = bookmarkLineIndex;
  statusRef.current = status;

  const commitEngineState = useCallback((state: RehearsalEngineState) => {
    engineRef.current = state;
    setEngineState(state);
  }, []);

  const clearLineResults = useCallback(() => {
    lineResultsRef.current = [];
    setLineResults([]);
  }, []);

  const recordLineResult = useCallback(
    (reason: LineResultReason, transcript: string) => {
      const state = engineRef.current;
      if (!isUserLine(state)) return;

      const line = getCurrentLine(state);
      if (!line) return;

      const wordAlignment = computeWordAlignment(line.text, transcript, {
        lineEnded: true,
      });

      const entry: LineResultEntry = {
        lineIndex: line.index,
        character: line.character,
        text: line.text,
        reason,
        spokenAttempt: transcript.trim() || undefined,
        wordAlignment,
      };

      const existingIndex = lineResultsRef.current.findIndex(
        (item) => item.lineIndex === line.index
      );
      if (existingIndex >= 0) {
        const existing = lineResultsRef.current[existingIndex];
        const updated = [...lineResultsRef.current];
        updated[existingIndex] = {
          ...existing,
          reason:
            REASON_PRIORITY[reason] >= REASON_PRIORITY[existing.reason]
              ? reason
              : existing.reason,
          spokenAttempt: entry.spokenAttempt ?? existing.spokenAttempt,
          wordAlignment: entry.wordAlignment,
        };
        lineResultsRef.current = updated;
      } else {
        lineResultsRef.current = [...lineResultsRef.current, entry];
      }
    },
    []
  );

  const clearMatchTimer = useCallback(() => {
    if (matchTimerRef.current) {
      window.clearTimeout(matchTimerRef.current);
      matchTimerRef.current = null;
    }
  }, []);

  const flushPendingUserLine = useCallback(() => {
    const hadPendingMatch = matchTimerRef.current !== null;
    clearMatchTimer();

    const state = engineRef.current;
    if (!isUserLine(state)) return;

    const line = getCurrentLine(state);
    if (!line) return;

    if (lineResultsRef.current.some((item) => item.lineIndex === line.index)) {
      return;
    }

    const transcript = liveTranscriptRef.current.trim();
    if (!transcript) return;

    if (containsNextLineKeyword(transcript)) {
      recordLineResult('skipped', transcript);
      return;
    }

    if (containsBackLineKeyword(transcript)) {
      return;
    }

    if (containsLinePromptKeyword(transcript)) {
      recordLineResult('prompted', transcript);
      return;
    }

    const alignment = computeWordAlignment(line.text, transcript, {
      lineEnded: true,
    });
    const matched =
      hadPendingMatch ||
      isLineMatch(transcript, line.text, settings.matchSensitivity, {
        utteranceComplete: true,
      });

    recordLineResult(
      matched && !hasWordIssues(alignment) ? 'correct' : 'imperfect',
      transcript
    );
  }, [clearMatchTimer, recordLineResult, settings.matchSensitivity]);

  const finishRehearsal = useCallback(() => {
    flushPendingUserLine();
    setLineResults([...lineResultsRef.current]);
    setStatus('complete');
  }, [flushPendingUserLine]);

  useEffect(() => {
    commitEngineState(createInitialState(script?.lines ?? []));
    setStatus('idle');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    clearLineResults();
  }, [script, commitEngineState, clearLineResults]);

  const stopAll = useCallback(() => {
    clearMatchTimer();
    stopSpeaking();
    listenerRef.current.stop();
    processingRef.current = false;
  }, [clearMatchTimer]);

  const goBackLine = useCallback(() => {
    if (engineRef.current.lineIndex <= 0) {
      setLiveTranscript('');
      liveTranscriptRef.current = '';
      return;
    }

    clearMatchTimer();
    const prevIndex = engineRef.current.lineIndex - 1;
    lineResultsRef.current = lineResultsRef.current.filter(
      (item) => item.lineIndex !== prevIndex
    );

    listenerRef.current.stop();
    stopSpeaking();
    processingRef.current = false;

    const backState = previousLine(engineRef.current);
    commitEngineState(backState);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    void runActionRef.current(backState);
  }, [clearMatchTimer, commitEngineState]);

  const isPaused = useCallback(
    () => pausedRef.current || statusRef.current === 'paused',
    []
  );

  const skipPartnerLine = useCallback(() => {
    if (isPaused()) return;

    partnerSkipRef.current = true;
    stopSpeaking();
    processingRef.current = false;

    const { state: nextState, event } = afterSpeakComplete(engineRef.current);
    commitEngineState(nextState);
    setLiveTranscript('');
    liveTranscriptRef.current = '';

    if (event?.type === 'COMPLETE') {
      partnerSkipRef.current = false;
      finishRehearsal();
      return;
    }

    void runActionRef.current(nextState);
  }, [commitEngineState, finishRehearsal, isPaused]);

  const advanceAfterMatch = useCallback(
    (transcript?: string, options?: { recordResult?: boolean }) => {
      if (isPaused()) return;

      if (options?.recordResult !== false && transcript?.trim()) {
        const line = getCurrentLine(engineRef.current);
        if (line) {
          const alignment = computeWordAlignment(line.text, transcript, {
            lineEnded: true,
          });
          recordLineResult(
            hasWordIssues(alignment) ? 'imperfect' : 'correct',
            transcript
          );
        }
      }

      clearMatchTimer();
      listenerRef.current.stop();
      const { state: advanced, event: next } = afterUserMatch(engineRef.current);
      setEngineState(advanced);
      setLiveTranscript('');
      liveTranscriptRef.current = '';
      if (next?.type === 'COMPLETE') {
        finishRehearsal();
        return;
      }
      void runActionRef.current(advanced);
    },
    [clearMatchTimer, finishRehearsal, isPaused, recordLineResult]
  );

  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isPaused()) return;

      if (statusRef.current === 'speaking') {
        if (containsNextLineKeyword(transcript)) {
          skipPartnerLine();
          return;
        }
        if (containsBackLineKeyword(transcript)) {
          partnerSkipRef.current = true;
          stopSpeaking();
          processingRef.current = false;
          goBackLine();
          return;
        }
        return;
      }

      liveTranscriptRef.current = transcript;
      setLiveTranscript(transcript);
      const current = getCurrentLine(engineRef.current);
      if (!current) return;

      if (containsLinePromptKeyword(transcript)) {
        clearMatchTimer();
        recordLineResult('prompted', transcript);
        const { state: promptState, event } = onLinePrompt(engineRef.current);
        if (event.type === 'COMPLETE') {
          finishRehearsal();
          return;
        }
        setEngineState(promptState);
        setStatus('prompting');
        setLastPromptAt(Date.now());
        listenerRef.current.stop();
        void speakText(current.text, { rate: settings.speechRate }).then(() => {
          if (pausedRef.current) return;
          const resumed = afterPromptComplete(promptState);
          setEngineState(resumed);
          setStatus('listening');
          listenerRef.current.start({
            onResult: (t, final) => handleTranscript(t, final),
            onError: (msg) => {
              if (msg !== 'aborted') setError(msg);
            },
          });
        });
        return;
      }

      if (containsNextLineKeyword(transcript)) {
        recordLineResult('skipped', transcript);
        advanceAfterMatch(transcript, { recordResult: false });
        return;
      }

      if (containsBackLineKeyword(transcript)) {
        goBackLine();
        return;
      }

      const matched = isLineMatch(transcript, current.text, settings.matchSensitivity, {
        utteranceComplete: isFinal,
      });
      if (matched) {
        clearMatchTimer();
        matchTimerRef.current = window.setTimeout(() => {
          if (isPaused()) return;
          advanceAfterMatch(transcript);
        }, MATCH_HOLD_MS);
      } else {
        clearMatchTimer();
      }
    },
    [advanceAfterMatch, clearMatchTimer, finishRehearsal, goBackLine, isPaused, recordLineResult, settings.matchSensitivity, settings.speechRate, skipPartnerLine]
  );

  const startListening = useCallback(() => {
    listenerRef.current.start({
      onResult: handleTranscript,
      onError: (msg) => {
        if (msg !== 'aborted') setError(msg);
      },
    });
  }, [handleTranscript]);

  const runAction = useCallback(
    async (state: RehearsalEngineState) => {
      if (processingRef.current || isPaused()) return;
      const action = resolveLineAction(state);
      if (!action) return;

      processingRef.current = true;
      setEngineState(state);
      setLiveTranscript('');

      try {
        if (action.type === 'SPEAK') {
          setStatus('speaking');
          startListening();
          await speakText(
            settings.readCharacterNames
              ? `${action.line.character}: ${action.line.text}`
              : action.line.text,
            {
              rate: settings.speechRate,
              voiceName: settings.partnerVoiceName || undefined,
            }
          );
          if (partnerSkipRef.current) {
            partnerSkipRef.current = false;
            processingRef.current = false;
            return;
          }
          if (isPaused()) {
            processingRef.current = false;
            return;
          }
          const { state: nextState, event } = afterSpeakComplete(state);
          setEngineState(nextState);
          if (event?.type === 'COMPLETE') {
            finishRehearsal();
            processingRef.current = false;
            return;
          }
          processingRef.current = false;
          await runAction(nextState);
          return;
        }

        if (action.type === 'LISTEN') {
          setStatus('listening');
          stopSpeaking();
          processingRef.current = false;
          startListening();
          return;
        }

        if (action.type === 'COMPLETE') {
          finishRehearsal();
          processingRef.current = false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rehearsal error');
        setStatus('idle');
        processingRef.current = false;
      }
    },
    [finishRehearsal, isPaused, settings.speechRate, settings.partnerVoiceName, settings.readCharacterNames, startListening]
  );

  runActionRef.current = runAction;

  const begin = useCallback(async () => {
    if (!script || script.lines.length === 0) {
      setError('Upload a script first.');
      return;
    }
    setError(null);
    pausedRef.current = false;
    pausedActivityRef.current = null;
    clearLineResults();
    stopAll();
    await primeSpeechVoices();
    const lineIndex = Math.min(
      bookmarkRef.current,
      Math.max(0, script.lines.length - 1)
    );
    const initial = startRehearsal(
      { ...createInitialState(script.lines), lineIndex },
      userCharacters
    );
    commitEngineState(initial);
    await runAction(initial);
  }, [script, userCharacters, stopAll, runAction, commitEngineState, clearLineResults]);

  const pause = useCallback(() => {
    const currentStatus = statusRef.current;

    pausedRef.current = true;

    pausedActivityRef.current =
      currentStatus === 'listening'
        ? 'listening'
        : currentStatus === 'prompting'
          ? 'prompting'
          : currentStatus === 'speaking'
            ? 'speaking'
            : null;

    clearMatchTimer();

    if (currentStatus === 'listening' || currentStatus === 'prompting') {
      listenerRef.current.stop();
    } else if (currentStatus === 'speaking') {
      listenerRef.current.stop();
    }

    if (
      (currentStatus === 'speaking' || currentStatus === 'prompting') &&
      isSpeakingActive()
    ) {
      pauseSpeaking();
    }

    processingRef.current = false;
    commitEngineState(pauseRehearsal(engineRef.current));
    setStatus('paused');
  }, [clearMatchTimer, commitEngineState]);

  const resume = useCallback(async () => {
    setError(null);
    pausedRef.current = false;
    const activity = pausedActivityRef.current;
    pausedActivityRef.current = null;

    const state = engineRef.current;

    if (activity === 'speaking' && isSpeakingPaused()) {
      setStatus('speaking');
      commitEngineState({ ...state, status: 'speaking' });
      resumeSpeaking();
      return;
    }

    if (activity === 'prompting' && isSpeakingPaused()) {
      setStatus('prompting');
      commitEngineState({ ...state, status: 'prompting' });
      resumeSpeaking();
      return;
    }

    if (activity === 'prompting') {
      const listeningState = afterPromptComplete(state);
      commitEngineState(listeningState);
      setStatus('listening');
      processingRef.current = false;
      startListening();
      return;
    }

    const resumed = resumeRehearsal(state);
    commitEngineState(resumed);

    if (activity === 'listening') {
      setStatus('listening');
      processingRef.current = false;
      startListening();
      return;
    }

    await primeSpeechVoices();
    await runAction(resumed);
  }, [runAction, commitEngineState, startListening]);

  const reset = useCallback(() => {
    stopAll();
    pausedRef.current = false;
    pausedActivityRef.current = null;
    onBookmarkLineChange?.(0);
    const resetState = resetRehearsal(
      createInitialState(script?.lines ?? [])
    );
    if (userCharacters.length > 0) {
      commitEngineState(startRehearsal(resetState, userCharacters));
    } else {
      commitEngineState(resetState);
    }
    setStatus('idle');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    clearLineResults();
  }, [script, userCharacters, stopAll, onBookmarkLineChange, commitEngineState, clearLineResults]);

  const endScene = useCallback(() => {
    flushPendingUserLine();
    stopAll();
    pausedRef.current = false;
    pausedActivityRef.current = null;
    processingRef.current = false;
    setLineResults([...lineResultsRef.current]);
    setStatus('complete');
  }, [flushPendingUserLine, stopAll]);

  const jumpToLine = useCallback(
    async (lineIndex: number) => {
      if (!script || lineIndex < 0 || lineIndex >= script.lines.length) return;

      const wasActive =
        status === 'speaking' ||
        status === 'listening' ||
        status === 'prompting';
      const stayPaused = status === 'paused';

      stopAll();
      setError(null);
      pausedRef.current = false;
      pausedActivityRef.current = null;

      onBookmarkLineChange?.(lineIndex);
      const nextState = goToLine(engineRef.current, lineIndex);
      commitEngineState(nextState);
      setLiveTranscript('');

      if (wasActive) {
        await runAction(nextState);
      } else if (stayPaused) {
        setStatus('paused');
      } else {
        setStatus('idle');
      }
    },
    [script, status, stopAll, runAction, onBookmarkLineChange, commitEngineState]
  );

  useEffect(() => () => stopAll(), [stopAll]);

  const currentLine = getCurrentLine(engineState);

  return {
    status,
    currentLine,
    lineIndex: engineState.lineIndex,
    totalLines: engineState.lines.length,
    liveTranscript,
    error,
    lastPromptAt,
    lineResults,
    begin,
    pause,
    resume,
    reset,
    endScene,
    goBackLine,
    jumpToLine,
    setError,
  };
}
