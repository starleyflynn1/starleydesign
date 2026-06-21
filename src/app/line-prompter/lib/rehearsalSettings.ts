import { DEFAULT_SETTINGS, type RehearsalSettings } from '../types/script';

export const SETTINGS_STORAGE_KEY = 'starleydesign-line-prompter-settings';

export function loadStoredSettings(): RehearsalSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
    const record = parsed as Partial<RehearsalSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...record,
      partnerVoiceName:
        typeof record.partnerVoiceName === 'string' ? record.partnerVoiceName : '',
      readCharacterNames:
        typeof record.readCharacterNames === 'boolean'
          ? record.readCharacterNames
          : DEFAULT_SETTINGS.readCharacterNames,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
