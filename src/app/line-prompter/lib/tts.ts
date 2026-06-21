export interface TtsOptions {
  rate?: number;
  pitch?: number;
  /** When set, use this voice by name. When omitted, pick the best natural English voice. */
  voiceName?: string;
}

/** Known high-quality voices in Chrome, Edge, and modern Safari. Earlier = higher priority. */
const PREFERRED_VOICE_PATTERNS: RegExp[] = [
  /google us english/i,
  /google uk english/i,
  /google.*english.*(natural|network|neural)/i,
  /microsoft (aria|guy|jenny|andrew|sonia|ryan).*natural/i,
  /microsoft.*natural.*english/i,
  /(natural|premium|enhanced).*english/i,
  /samantha.*premium|karen.*premium|aaron.*premium|nicky.*premium/i,
  /google.*english/i,
  /microsoft.*english/i,
];

const NOVELTY_VOICE =
  /cellos|superstar|fred|junior|trinoids|whisper|zarvox|baby|bahh|bells|boing|bubbles|good news|pipe organ|princess|ralph|robot|albert|bad news|eddy|grandma|grandpa|compact/i;

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!isTtsSupported()) return [];
  return window.speechSynthesis.getVoices();
}

export function isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.replace('_', '-').toLowerCase().startsWith('en');
}

function preferredPatternBoost(voice: SpeechSynthesisVoice): number {
  for (let i = 0; i < PREFERRED_VOICE_PATTERNS.length; i += 1) {
    if (PREFERRED_VOICE_PATTERNS[i].test(voice.name)) {
      return 60 - i * 4;
    }
  }
  return 0;
}

/** Higher score = more natural / preferred for partner lines. */
export function scoreVoiceQuality(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.replace('_', '-').toLowerCase();
  let score = preferredPatternBoost(voice);

  if (/premium|enhanced|natural|neural|wavenet|network|hd/.test(name)) score += 28;
  if (/google/.test(name)) score += 12;
  if (/microsoft/.test(name)) score += 10;
  if (/apple/.test(name)) score += 8;
  if (lang.startsWith('en-us')) score += 14;
  else if (lang.startsWith('en-gb')) score += 10;
  else if (isEnglishVoice(voice)) score += 5;

  if (/google|microsoft/.test(name) && !voice.localService) score += 18;
  else if (voice.localService && !/compact|legacy|basic/.test(name)) score += 6;

  if (NOVELTY_VOICE.test(name)) score -= 80;

  return score;
}

export function sortEnglishVoices(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice[] {
  return voices
    .filter(isEnglishVoice)
    .sort((a, b) => {
      const diff = scoreVoiceQuality(b) - scoreVoiceQuality(a);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
}

export function formatVoiceLabel(voice: SpeechSynthesisVoice): string {
  const tags: string[] = [];
  if (/google us english/i.test(voice.name)) tags.push('recommended');
  else if (/natural|neural|premium|enhanced|wavenet|network/i.test(voice.name)) {
    tags.push('natural');
  }
  if (voice.localService) tags.push('local');
  else tags.push('online');
  const suffix = tags.length > 0 ? ` (${tags.join(', ')})` : '';
  return `${voice.name}${suffix}`;
}

export function pickVoice(preferredName?: string): SpeechSynthesisVoice | null {
  const voices = getVoices();
  if (voices.length === 0) return null;

  if (preferredName) {
    return voices.find((v) => v.name === preferredName) ?? null;
  }

  const ranked = sortEnglishVoices(voices);
  return ranked[0] ?? voices.find(isEnglishVoice) ?? voices[0];
}

export function getDefaultPartnerVoiceName(): string {
  return pickVoice()?.name ?? '';
}

function findVoiceByName(name: string): SpeechSynthesisVoice | null {
  return getVoices().find((v) => v.name === name) ?? null;
}

function resolveSpeechVoice(voiceName?: string): SpeechSynthesisVoice | null {
  if (voiceName) {
    return findVoiceByName(voiceName) ?? pickVoice();
  }
  return pickVoice();
}

let intentionalCancel = false;

const SPEAK_TIMEOUT_MS = 120_000;

function resumeSynth(): void {
  const synth = window.speechSynthesis;
  synth.resume();
  if (synth.paused) {
    window.setTimeout(() => synth.resume(), 0);
  }
}

function speakOnce(
  text: string,
  options: TtsOptions,
  assignVoice: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;

    if (assignVoice) {
      const voice = resolveSpeechVoice(options.voiceName);
      if (voice) utterance.voice = voice;
    }

    let settled = false;
    let started = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      fn();
    };

    const timeoutId = window.setTimeout(() => {
      intentionalCancel = true;
      synth.cancel();
      intentionalCancel = false;
      finish(() =>
        reject(new Error('Speech timed out — try another voice or browser.'))
      );
    }, SPEAK_TIMEOUT_MS);

    utterance.onstart = () => {
      started = true;
    };

    utterance.onend = () => {
      if (!started && assignVoice) {
        finish(() => {
          void speakOnce(text, options, false).then(resolve).catch(reject);
        });
        return;
      }
      finish(() => resolve());
    };

    utterance.onerror = (event) => {
      if (event.error === 'canceled') {
        if (intentionalCancel) {
          finish(() => resolve());
          return;
        }
        if (assignVoice) {
          finish(() => {
            void speakOnce(text, options, false).then(resolve).catch(reject);
          });
          return;
        }
        finish(() => reject(new Error('Speech was canceled.')));
        return;
      }

      if (assignVoice) {
        finish(() => {
          void speakOnce(text, options, false).then(resolve).catch(reject);
        });
        return;
      }

      finish(() => reject(new Error(event.error || 'Text-to-speech failed')));
    };

    resumeSynth();
    synth.speak(utterance);
  });
}

export function speakText(
  text: string,
  options: TtsOptions = {}
): Promise<void> {
  if (!isTtsSupported()) {
    return Promise.reject(
      new Error('Text-to-speech is not supported in this browser.')
    );
  }

  if (!text.trim()) {
    return Promise.resolve();
  }

  const synth = window.speechSynthesis;

  const start = () => speakOnce(text, options, true);

  if (synth.speaking || synth.pending) {
    intentionalCancel = true;
    synth.cancel();
    intentionalCancel = false;
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        void start().then(resolve).catch(reject);
      }, 100);
    });
  }

  return start();
}

export function stopSpeaking(): void {
  if (!isTtsSupported()) return;
  intentionalCancel = true;
  window.speechSynthesis.cancel();
  intentionalCancel = false;
}

export function pauseSpeaking(): void {
  if (!isTtsSupported()) return;
  window.speechSynthesis.pause();
}

export function resumeSpeaking(): void {
  if (!isTtsSupported()) return;
  resumeSynth();
}

export function isSpeakingActive(): boolean {
  if (!isTtsSupported()) return false;
  const synth = window.speechSynthesis;
  return synth.speaking || synth.pending;
}

export function isSpeakingPaused(): boolean {
  if (!isTtsSupported()) return false;
  return window.speechSynthesis.paused;
}

/** Some browsers load voices asynchronously */
export function waitForVoices(timeoutMs = 3000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    const onVoicesChanged = () => {
      const loaded = getVoices();
      if (loaded.length > 0) {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        clearTimeout(timer);
        resolve(loaded);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    const timer = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(getVoices());
    }, timeoutMs);
  });
}

/** Warm up speech synthesis and voice list after a user click (before the first line). */
export async function primeSpeechVoices(): Promise<void> {
  await waitForVoices();
  if (!isTtsSupported()) return;
  resolveSpeechVoice();
  resumeSynth();
}

/** Quick preview for the voice picker. */
export function previewVoice(voiceName: string, rate = 1): Promise<void> {
  const sample = 'Hello, this is how I will read your partner lines.';
  return speakText(sample, {
    rate,
    voiceName: voiceName || undefined,
  });
}
