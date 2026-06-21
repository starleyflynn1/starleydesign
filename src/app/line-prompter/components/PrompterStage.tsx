import type { RehearsalStatus, ScriptLine } from '../types/script';
import { characterMatches } from '../lib/scriptParser';
import { MicVisualizer } from './MicVisualizer';
import { WordTrackedLine } from './WordTrackedLine';

interface PrompterStageProps {
  status: RehearsalStatus;
  currentLine: ScriptLine | null;
  lineIndex: number;
  totalLines: number;
  userCharacters: string[];
  readThrough: boolean;
  liveTranscript: string;
  title?: string;
}

function statusLabel(status: RehearsalStatus, readThrough: boolean): string {
  if (status === 'speaking' && readThrough) return 'Reading scene…';
  return STATUS_LABELS[status];
}

const STATUS_LABELS: Record<RehearsalStatus, string> = {
  idle: 'Ready',
  speaking: 'Partner speaking…',
  listening: 'Your line — speak now',
  prompting: 'Line prompt',
  paused: 'Paused',
  complete: 'Scene complete',
};

export function PrompterStage({
  status,
  currentLine,
  lineIndex,
  totalLines,
  userCharacters,
  readThrough,
  liveTranscript,
  title,
}: PrompterStageProps) {
  const isUserTurn =
    currentLine &&
    userCharacters.some((name) => characterMatches(name, currentLine.character));

  const isLiveUserLine =
    Boolean(isUserTurn) &&
    (status === 'listening' || status === 'prompting');

  return (
    <section className="prompter-stage" aria-live="polite">
      <div className="prompter-meta">
        {title && <span className="prompter-title">{title}</span>}
        <span className={`status-pill status-${status}`}>
          {statusLabel(status, readThrough)}
        </span>
        <span className="line-counter">
          Line {Math.min(lineIndex + 1, totalLines)} of {totalLines}
        </span>
      </div>

      {currentLine ? (
        <div
          className={`current-line ${
            isUserTurn ? 'current-line-user' : 'current-line-partner'
          }${isLiveUserLine ? ' current-line-user--live' : ''}`}
        >
          <p className="line-character">{currentLine.character}</p>
          {isLiveUserLine && status === 'listening' ? (
            <WordTrackedLine text={currentLine.text} transcript={liveTranscript} />
          ) : (
            <p className="line-text">{currentLine.text}</p>
          )}
        </div>
      ) : (
        <div className="current-line current-line-empty">
          <p className="line-text muted">
            {status === 'complete'
              ? 'Great work — scene finished.'
              : 'Load a script and press Start Rehearsal.'}
          </p>
        </div>
      )}

      {status === 'listening' && (
        <div className="transcript-box">
          <div className="transcript-header">
            <p className="transcript-label">Hearing you say:</p>
            <MicVisualizer active />
          </div>
          <p className="transcript-text">
            {liveTranscript || <span className="muted">Listening…</span>}
          </p>
          <p className="transcript-hint">
            Words turn <span className="line-word line-word--correct">green</span> as
            you say them correctly. Voice commands:{' '}
            <strong>&quot;line&quot;</strong> for a prompt,{' '}
            <strong>&quot;next&quot;</strong> to skip (works during partner lines too),{' '}
            <strong>&quot;back&quot;</strong> to return to the previous line.
          </p>
        </div>
      )}
    </section>
  );
}
