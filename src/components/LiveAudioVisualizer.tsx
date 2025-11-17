import { useEffect, useRef, useState } from "react";

interface LiveAudioVisualizerProps {
  url: string;
  autoPlay?: boolean;
}

export const LiveAudioVisualizer = ({ url, autoPlay = false }: LiveAudioVisualizerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    const canvas = canvasRef.current;
    if (!audioEl || !canvas) return;

    let audioCtx: AudioContext | null = null;
    let sourceNode: MediaElementAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;

    const setup = async () => {
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount; // 128
        dataArray = new Uint8Array(bufferLength);

        sourceNode = audioCtx.createMediaElementSource(audioEl);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const render = () => {
          if (!analyser || !dataArray) return;
          analyser.getByteFrequencyData(dataArray);
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          const barCount = dataArray.length;
          const barWidth = Math.max(2, Math.floor(width / barCount));
          for (let i = 0; i < barCount; i++) {
            const value = dataArray[i];
            const barHeight = (value / 255) * height;
            // Neon amber color
            ctx.fillStyle = `hsl(var(--golden))`;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
          }
          animationRef.current = requestAnimationFrame(render);
        };
        render();

        if (autoPlay) {
          try { await audioEl.play(); } catch {}
        }
      } catch (e) {
        console.error('LiveAudioVisualizer error:', e);
        setError('Falha ao inicializar visualização ao vivo.');
      }
    };

    setup();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      try { sourceNode?.disconnect(); } catch {}
      try { analyser?.disconnect(); } catch {}
      try { audioCtx?.close(); } catch {}
    };
  }, [url, autoPlay]);

  if (error) {
    return (
      <div className="space-y-4">
        <audio src={url} controls autoPlay={autoPlay} className="w-full" />
        <div className="text-center text-muted-foreground text-sm">{error}</div>
      </div>
    );
  }

  const handleToggle = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (audioEl.paused) audioEl.play().catch(() => {});
    else audioEl.pause();
  };

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={128}
        className="w-full bg-deep-black/30 rounded-lg border border-golden/20 cursor-pointer"
        onClick={handleToggle}
      />
      <audio ref={audioRef} src={url} className="hidden" />
      <div className="text-center text-muted-foreground text-sm">
        Clique nas barras para reproduzir/pausar
      </div>
    </div>
  );
};

