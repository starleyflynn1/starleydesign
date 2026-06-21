import type { RehearsalStatus } from '../types/script';

interface ControlsProps {
  status: RehearsalStatus;
  canStart: boolean;
  canGoBack: boolean;
  readThrough: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onBack: () => void;
  onReset: () => void;
  onEndScene: () => void;
}

export function Controls({
  status,
  canStart,
  canGoBack,
  readThrough,
  onStart,
  onPause,
  onResume,
  onBack,
  onReset,
  onEndScene,
}: ControlsProps) {
  const isActive = status === 'speaking' || status === 'listening' || status === 'prompting';
  const canEndScene = isActive || status === 'paused';

  return (
    <div className="controls">
      {status === 'idle' || status === 'complete' ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canStart}
          onClick={onStart}
        >
          Start {readThrough ? 'Read-Through' : 'Rehearsal'}
        </button>
      ) : null}

      {status === 'paused' ? (
        <button type="button" className="btn btn-primary" onClick={onResume}>
          Resume
        </button>
      ) : null}

      {isActive ? (
        <button type="button" className="btn btn-secondary" onClick={onPause}>
          Pause
        </button>
      ) : null}

      {isActive && canGoBack ? (
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back one line
        </button>
      ) : null}

      {canEndScene && !readThrough ? (
        <button type="button" className="btn btn-secondary" onClick={onEndScene}>
          End scene &amp; report
        </button>
      ) : null}

      <button
        type="button"
        className="btn btn-ghost"
        onClick={onReset}
        disabled={status === 'idle' && !canStart}
      >
        Reset
      </button>
    </div>
  );
}
