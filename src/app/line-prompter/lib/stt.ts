export interface SttCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (message: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSttSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

function appendPiece(base: string, piece: string): string {
  if (!piece) return base;
  if (!base) return piece;
  if (base.endsWith(' ') || piece.startsWith(' ')) return base + piece;
  return `${base} ${piece}`;
}

export class SpeechListener {
  private recognition: SpeechRecognition | null = null;
  private active = false;
  private callbacks: SttCallbacks | null = null;
  /** Finalized speech for the current listening session (persists across auto-restarts). */
  private sessionFinal = '';

  start(callbacks: SttCallbacks): void {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      callbacks.onError(
        'Speech recognition is not supported. Please use Chrome or Edge.'
      );
      return;
    }

    this.stop();
    this.sessionFinal = '';
    this.callbacks = callbacks;
    this.recognition = new Ctor();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.active = true;
      this.callbacks?.onStart?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const piece = result[0]?.transcript ?? '';
        if (!piece) continue;

        if (result.isFinal) {
          this.sessionFinal = appendPiece(this.sessionFinal, piece);
        } else {
          interim = appendPiece(interim, piece);
        }
      }

      const transcript = appendPiece(this.sessionFinal, interim).trim();
      if (!transcript) return;

      const lastResult = event.results[event.results.length - 1];
      const isFinal = lastResult?.isFinal ?? false;

      this.callbacks?.onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      this.callbacks?.onError(event.error);
    };

    this.recognition.onend = () => {
      this.active = false;
      this.callbacks?.onEnd?.();
      if (this.callbacks && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          /* already started or stopped */
        }
      }
    };

    try {
      this.recognition.start();
    } catch (err) {
      callbacks.onError(
        err instanceof Error ? err.message : 'Failed to start microphone'
      );
    }
  }

  stop(): void {
    this.callbacks = null;
    this.sessionFinal = '';
    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    this.active = false;
  }

  get isActive(): boolean {
    return this.active;
  }
}
