import { useEffect, useRef, useState } from "react";
import { isMobile } from "@/utils/device";

interface LiveAudioVisualizerProps {
  url: string;
  autoPlay?: boolean;
  settings?: any;
}

export const LiveAudioVisualizer = ({
  url,
  autoPlay = false,
  settings: propSettings,
}: LiveAudioVisualizerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsVersion, setSettingsVersion] = useState(0);

  useEffect(() => {
    const audioEl = audioRef.current;
    const canvas = canvasRef.current;
    if (!audioEl || !canvas) return;

    let audioCtx: AudioContext | null = null;
    let sourceNode: MediaElementAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let ctx: CanvasRenderingContext2D | null = null;

    const setup = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();

        const s: any = propSettings || {};

        const mobile = isMobile();
        analyser.fftSize = mobile ? 256 : Number(s.liveAnalyzerFftSize || 256);
        analyser.smoothingTimeConstant = Number(s.liveAnalyzerSmoothing || 0.8);
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        sourceNode = audioCtx.createMediaElementSource(audioEl);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);

        ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = () => {
          if (!analyser || !dataArray || !ctx || !canvas) return;
          if (audioEl.paused) return;

          analyser.getByteFrequencyData(dataArray as any);

          const width = canvas.width;
          const height = Number(s.liveHeight || 128);
          // Set canvas height if it changed
          if (canvas.height !== height) canvas.height = height;

          ctx.clearRect(0, 0, width, height);

          const barCount = dataArray.length;
          const barWidth = Math.max(
            Number(s.liveBarWidth || 2),
            Math.floor(width / barCount)
          );

          for (let i = 0; i < barCount; i++) {
            const value = dataArray[i];
            const barHeight = (value / 255) * height;
            ctx.fillStyle = s.liveBarColor || `hsl(var(--golden))`;
            ctx.fillRect(
              i * barWidth,
              height - barHeight,
              barWidth - 1,
              barHeight,
            );
          }
          animationRef.current = requestAnimationFrame(render);
        };

        const startRender = () => {
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
          animationRef.current = requestAnimationFrame(render);
        };

        const stopRender = () => {
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };

        audioEl.addEventListener("play", startRender);
        audioEl.addEventListener("pause", stopRender);

        if (!audioEl.paused) {
          startRender();
        }

        if (autoPlay) {
          try {
            await audioEl.play();
          } catch (e) {
            console.warn("Autoplay blocked:", e);
          }
        }
      } catch (e) {
        console.error("LiveAudioVisualizer error:", e);
        setError("Falha ao inicializar visualização ao vivo.");
      }
    };

    setup();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      try {
        sourceNode?.disconnect();
        analyser?.disconnect();
        if (audioCtx?.state !== 'closed') audioCtx?.close();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
    };
  }, [url, autoPlay, settingsVersion]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "audioSettings") setSettingsVersion((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (error) {
    return (
      <div className="space-y-4">
        <audio src={url} controls autoPlay={autoPlay} className="w-full h-12" />
        <div className="text-center text-muted-foreground text-sm">{error}</div>
      </div>
    );
  }

  const handleToggle = async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    // In many mobile browsers, we need to resume AudioContext on user interaction
    // The current setup creates a context per effect, which isn't ideal but works here.

    if (audioEl.paused) {
      try {
        await audioEl.play();
      } catch (e) {
        console.error("Playback failed:", e);
      }
    } else {
      audioEl.pause();
    }
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

      <audio ref={audioRef} src={url} className="hidden" crossOrigin="anonymous" />
      <div className="text-center text-muted-foreground text-sm">
        Clique nas barras para reproduzir/pausar
      </div>
    </div>
  );
};
