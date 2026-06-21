import { useEffect, useRef, useState } from 'react';
import { MicIcon } from './Icons';

interface MicVisualizerProps {
  active: boolean;
}

export function MicVisualizer({ active }: MicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [hasLevel, setHasLevel] = useState(false);

  useEffect(() => {
    if (!active) {
      setHasLevel(false);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;

    const setup = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (cancelled) return;

        audioCtx = new AudioContext();
        await audioCtx.resume();

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bins = analyser.frequencyBinCount;
        const data = new Uint8Array(bins);

        const draw = () => {
          if (cancelled) return;

          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx) {
            rafRef.current = requestAnimationFrame(draw);
            return;
          }

          analyser.getByteFrequencyData(data);

          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const themeRoot =
            canvas.closest('.line-prompter-root') ?? document.documentElement;
          const barColor =
            getComputedStyle(themeRoot)
              .getPropertyValue('--color-stage-user-border')
              .trim() ||
            getComputedStyle(document.documentElement)
              .getPropertyValue('--seat-available')
              .trim() ||
            getComputedStyle(document.documentElement)
              .getPropertyValue('--accent')
              .trim() ||
            '#22c55e';
          ctx.fillStyle = barColor;

          const barCount = 12;
          const gap = 2;
          const barWidth = (w - gap * (barCount - 1)) / barCount;
          let peak = 0;

          for (let i = 0; i < barCount; i++) {
            const bin = data[Math.floor((i / barCount) * bins)] ?? 0;
            peak = Math.max(peak, bin);
            const barHeight = Math.max(2, (bin / 255) * h);
            const x = i * (barWidth + gap);
            const y = h - barHeight;
            ctx.fillRect(x, y, barWidth, barHeight);
          }

          setHasLevel(peak > 18);
          rafRef.current = requestAnimationFrame(draw);
        };

        draw();
      } catch {
        setHasLevel(false);
      }
    };

    void setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((track) => track.stop());
      void audioCtx?.close();
      setHasLevel(false);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={`mic-visualizer${hasLevel ? ' mic-visualizer--active' : ''}`}
      aria-hidden
    >
      <MicIcon className="mic-visualizer-icon" width={20} height={20} />
      <canvas
        ref={canvasRef}
        className="mic-visualizer-canvas"
        width={120}
        height={28}
      />
    </div>
  );
}
