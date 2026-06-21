import { useRef, useState } from 'react';
import { DEFAULT_SAMPLE, loadSampleScript } from '../lib/samples';

interface ScriptUploadProps {
  onLoad: (
    text: string,
    fileName: string,
    options?: { sampleId?: string }
  ) => void;
  fileName: string | null;
  disabled?: boolean;
}

export function ScriptUpload({
  onLoad,
  fileName,
  disabled = false,
}: ScriptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setSampleError(null);
    const text = await file.text();
    onLoad(text, file.name);
  };

  const reloadSample = async () => {
    setSampleError(null);
    setLoadingSample(true);
    try {
      const { text, fileName: name } = await loadSampleScript(DEFAULT_SAMPLE);
      onLoad(text, name, { sampleId: DEFAULT_SAMPLE.id });
    } catch (err) {
      setSampleError(
        err instanceof Error ? err.message : 'Failed to load sample script'
      );
    } finally {
      setLoadingSample(false);
    }
  };

  const activeName = fileName ?? DEFAULT_SAMPLE.name;

  return (
    <div className="upload-card">
      <h2>Script</h2>
      <p className="hint">
        Demo scene: <strong>{DEFAULT_SAMPLE.name}</strong>. Upload your own{' '}
        <code>.txt</code> to replace it.
      </p>

      <p className="sample-loaded" aria-live="polite">
        Loaded: {loadingSample ? 'Loading…' : activeName}
      </p>

      <button
        type="button"
        className="btn btn-secondary btn-compact"
        disabled={disabled || loadingSample}
        onClick={() => void reloadSample()}
      >
        Reload demo scene
      </button>

      {sampleError && (
        <p className="sample-error" role="alert">
          {sampleError}
        </p>
      )}

      <div className="upload-divider">
        <span>or</span>
      </div>

      <label className="sr-only" htmlFor="script-file-input">
        Upload script file
      </label>
      <input
        id="script-file-input"
        ref={inputRef}
        type="file"
        accept=".txt,text/plain"
        className="sr-only"
        disabled={disabled}
        aria-label="Upload script file (.txt)"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled}
        aria-controls="script-file-input"
        onClick={() => inputRef.current?.click()}
      >
        Upload script file
      </button>
    </div>
  );
}
