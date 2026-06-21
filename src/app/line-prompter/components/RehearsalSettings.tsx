import { PartnerVoiceSelect } from './PartnerVoiceSelect';
import type { RehearsalSettings } from '../types/script';

interface RehearsalSettingsProps {
  settings: RehearsalSettings;
  disabled?: boolean;
  onChange: (settings: RehearsalSettings) => void;
}

export function RehearsalSettingsPanel({
  settings,
  disabled = false,
  onChange,
}: RehearsalSettingsProps) {
  return (
    <details className="preview-details settings-details">
      <summary>Settings</summary>
      <p className="preview-hint">
        Partner voice, speech rate, and line-matching options.
      </p>
      <PartnerVoiceSelect
        value={settings.partnerVoiceName}
        disabled={disabled}
        onChange={(partnerVoiceName) =>
          onChange({ ...settings, partnerVoiceName })
        }
      />
      <label className="setting-row setting-check" htmlFor="read-character-names">
        <input
          id="read-character-names"
          type="checkbox"
          checked={settings.readCharacterNames}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...settings, readCharacterNames: e.target.checked })
          }
        />
        Read character names when speaking partner lines
      </label>
      <label className="setting-row" htmlFor="match-sensitivity">
        Match sensitivity ({Math.round(settings.matchSensitivity * 100)}%)
        <input
          id="match-sensitivity"
          type="range"
          min={0.5}
          max={0.95}
          step={0.05}
          value={settings.matchSensitivity}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...settings,
              matchSensitivity: Number(e.target.value),
            })
          }
        />
      </label>
      <label className="setting-row" htmlFor="speech-rate">
        Speech rate ({settings.speechRate.toFixed(1)}×)
        <input
          id="speech-rate"
          type="range"
          min={0.7}
          max={1.4}
          step={0.1}
          value={settings.speechRate}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...settings,
              speechRate: Number(e.target.value),
            })
          }
        />
      </label>
    </details>
  );
}
