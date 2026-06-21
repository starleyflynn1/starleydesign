import { useEffect, useState } from 'react';
import {
  formatVoiceLabel,
  getDefaultPartnerVoiceName,
  isTtsSupported,
  previewVoice,
  sortEnglishVoices,
  waitForVoices,
} from '../lib/tts';

interface PartnerVoiceSelectProps {
  value: string;
  onChange: (voiceName: string) => void;
  disabled?: boolean;
}

export function PartnerVoiceSelect({
  value,
  onChange,
  disabled,
}: PartnerVoiceSelectProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [defaultVoiceName, setDefaultVoiceName] = useState<string>('');

  useEffect(() => {
    if (!isTtsSupported()) return;

    const load = async () => {
      const loaded = await waitForVoices();
      const english = sortEnglishVoices(loaded);
      setVoices(english);
      setDefaultVoiceName(getDefaultPartnerVoiceName());
    };

    void load();

    const onVoicesChanged = () => {
      void load();
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
    };
  }, []);

  useEffect(() => {
    if (!value || voices.length === 0) return;
    if (!voices.some((voice) => voice.name === value)) {
      onChange('');
    }
  }, [value, voices, onChange]);

  const autoLabel = defaultVoiceName
    ? `Automatic (${defaultVoiceName})`
    : 'Automatic (best natural English voice)';

  const handlePreview = () => {
    if (disabled) return;
    void previewVoice(value, 1).catch(() => {
      /* ignore preview errors */
    });
  };

  return (
    <div className="setting-row">
      <label htmlFor="partner-voice-select">Partner voice</label>
      <div className="voice-select-row">
        <select
          id="partner-voice-select"
          className="select"
          value={value}
          disabled={disabled || voices.length === 0}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{autoLabel}</option>
          {voices.map((voice) => (
            <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
              {formatVoiceLabel(voice)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-secondary btn-compact"
          disabled={disabled || voices.length === 0}
          aria-label="Test partner voice"
          onClick={handlePreview}
        >
          Test
        </button>
      </div>
      <p className="setting-hint">
        Automatic mode prefers modern natural voices such as Google US English in
        Chrome or Edge. Online Google and Microsoft Natural voices usually sound best.
      </p>
    </div>
  );
}
