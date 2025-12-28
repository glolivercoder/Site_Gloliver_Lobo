import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface ReactiveAudioVisualizerProps {
  url: string;
  autoPlay?: boolean;
  showSpectrogram?: boolean;
}

export const ReactiveAudioVisualizer = ({
  url,
  autoPlay = false,
  showSpectrogram = true,
}: ReactiveAudioVisualizerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const spectrogramDataRef = useRef<ImageData | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Get audio settings from localStorage
  const getSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem("audioSettings");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  // Initialize audio context and analyser
  const initAudioContext = useCallback(async () => {
    const audioEl = audioRef.current;
    if (!audioEl || audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      
      const settings = getSettings();
      analyser.fftSize = Math.max(256, Number(settings.liveAnalyzerFftSize || 512));
      analyser.smoothingTimeConstant = Number(settings.liveAnalyzerSmoothing || 0.7);

      // Only create source node once
      if (!sourceNodeRef.current) {
        const sourceNode = audioCtx.createMediaElementSource(audioEl);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        sourceNodeRef.current = sourceNode;
      }

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
    } catch (e) {
      console.error("Failed to initialize audio context:", e);
    }
  }, [getSettings]);

  // Waveform visualization with reactive bars
  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const settings = getSettings();
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width;
    const height = Number(settings.liveHeight || 150);
    canvas.height = height;

    // Clear canvas with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "rgba(0, 0, 0, 0.3)");
    bgGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw frequency bars with glow effect
    const barWidth = Math.max(Number(settings.liveBarWidth || 4), Math.floor(width / bufferLength) - 1);
    const gap = 2;
    const barCount = Math.floor(width / (barWidth + gap));
    const step = Math.floor(bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      const value = dataArray[dataIndex] || 0;
      const barHeight = (value / 255) * height * 0.9;
      
      const x = i * (barWidth + gap);
      const y = height - barHeight;
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(x, height, x, y);
      const hue = 35 + (value / 255) * 15; // Golden hue range
      const saturation = 70 + (value / 255) * 30;
      const lightness = 45 + (value / 255) * 25;
      
      gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness * 0.6}%)`);
      gradient.addColorStop(0.5, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
      gradient.addColorStop(1, `hsl(${hue + 10}, ${saturation}%, ${lightness + 10}%)`);
      
      // Glow effect
      ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.shadowBlur = value > 128 ? 15 : 5;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();
      
      // Mirror effect (reflection)
      const mirrorHeight = barHeight * 0.3;
      const mirrorGradient = ctx.createLinearGradient(x, 0, x, mirrorHeight);
      mirrorGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`);
      mirrorGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = mirrorGradient;
      ctx.beginPath();
      ctx.roundRect(x, 0, barWidth, mirrorHeight, [0, 0, 4, 4]);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }, [getSettings]);

  // Spectrogram visualization (waterfall effect)
  const drawSpectrogram = useCallback(() => {
    const canvas = spectrogramCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser || !showSpectrogram) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Shift existing image left by 1 pixel (waterfall effect)
    if (spectrogramDataRef.current) {
      ctx.putImageData(spectrogramDataRef.current, -1, 0);
    }

    // Draw new column on the right
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i];
      const y = height - (i / bufferLength) * height;
      
      // Color mapping: dark purple -> magenta -> yellow -> white
      let r, g, b;
      if (value < 64) {
        // Dark purple to magenta
        r = value * 2;
        g = 0;
        b = value * 3;
      } else if (value < 128) {
        // Magenta to orange
        r = 128 + value;
        g = (value - 64) * 2;
        b = 192 - value;
      } else if (value < 192) {
        // Orange to yellow
        r = 255;
        g = (value - 128) * 3;
        b = 0;
      } else {
        // Yellow to white
        r = 255;
        g = 255;
        b = (value - 192) * 4;
      }
      
      ctx.fillStyle = `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)})`;
      ctx.fillRect(width - 1, y, 1, height / bufferLength);
    }

    // Save current image for next frame
    spectrogramDataRef.current = ctx.getImageData(0, 0, width, height);
  }, [showSpectrogram]);

  // Main render loop
  const render = useCallback(() => {
    if (!isPlaying) return;

    drawWaveform();
    drawSpectrogram();

    animationRef.current = requestAnimationFrame(render);
  }, [isPlaying, drawWaveform, drawSpectrogram]);

  // Start/stop rendering based on play state
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(render);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, render]);

  // Handle audio events
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleCanPlay = () => setIsReady(true);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audioEl.currentTime);
    const handleDurationChange = () => setDuration(audioEl.duration || 0);

    audioEl.addEventListener("canplay", handleCanPlay);
    audioEl.addEventListener("play", handlePlay);
    audioEl.addEventListener("pause", handlePause);
    audioEl.addEventListener("ended", handleEnded);
    audioEl.addEventListener("timeupdate", handleTimeUpdate);
    audioEl.addEventListener("durationchange", handleDurationChange);

    return () => {
      audioEl.removeEventListener("canplay", handleCanPlay);
      audioEl.removeEventListener("play", handlePlay);
      audioEl.removeEventListener("pause", handlePause);
      audioEl.removeEventListener("ended", handleEnded);
      audioEl.removeEventListener("timeupdate", handleTimeUpdate);
      audioEl.removeEventListener("durationchange", handleDurationChange);
    };
  }, []);

  // Auto play
  useEffect(() => {
    const audioEl = audioRef.current;
    if (autoPlay && isReady && audioEl) {
      initAudioContext().then(() => {
        audioEl.play().catch(() => {});
      });
    }
  }, [autoPlay, isReady, initAudioContext]);

  // Toggle play/pause
  const handlePlayPause = async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    await initAudioContext();

    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    if (audioEl.paused) {
      await audioEl.play();
    } else {
      audioEl.pause();
    }
  };

  // Seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audioEl = audioRef.current;
    if (!audioEl || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioEl.currentTime = percentage * duration;
  };

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Don't close audioContext as it causes issues with re-renders
    };
  }, []);

  const settings = getSettings();
  const waveformHeight = Number(settings.liveHeight || 150);

  return (
    <div className="space-y-4" data-oid="reactive-visualizer">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={url}
        crossOrigin="anonymous"
        preload="auto"
        className="hidden"
        data-oid="audio-element"
      />

      {/* Waveform Canvas */}
      <div
        className="relative w-full bg-deep-black/30 rounded-lg border border-golden/20 overflow-hidden cursor-pointer"
        onClick={handlePlayPause}
        data-oid="waveform-container"
      >
        <canvas
          ref={waveformCanvasRef}
          width={800}
          height={waveformHeight}
          className="w-full"
          style={{ height: `${waveformHeight}px` }}
          data-oid="waveform-canvas"
        />
        
        {/* Play/Pause overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20">
          <div className="w-16 h-16 rounded-full bg-golden/90 flex items-center justify-center backdrop-blur-sm">
            {isPlaying ? (
              <Pause className="w-8 h-8 text-deep-black" data-oid="pause-icon" />
            ) : (
              <Play className="w-8 h-8 text-deep-black ml-1" data-oid="play-icon" />
            )}
          </div>
        </div>
      </div>

      {/* Spectrogram Canvas */}
      {showSpectrogram && (
        <div className="w-full rounded-lg border border-golden/20 overflow-hidden" data-oid="spectrogram-container">
          <canvas
            ref={spectrogramCanvasRef}
            width={800}
            height={180}
            className="w-full"
            style={{ height: "180px", background: "linear-gradient(to bottom, #1a0a2e, #0d0015)" }}
            data-oid="spectrogram-canvas"
          />
        </div>
      )}

      {/* Progress bar and time */}
      <div className="space-y-2" data-oid="controls">
        <div
          className="h-2 bg-deep-black/50 rounded-full cursor-pointer overflow-hidden border border-golden/20"
          onClick={handleSeek}
          data-oid="progress-bar"
        >
          <div
            className="h-full bg-gradient-to-r from-golden/80 to-golden rounded-full transition-all duration-100"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            data-oid="progress-fill"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span data-oid="current-time">{formatTime(currentTime)}</span>
          <span data-oid="duration">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="text-center text-muted-foreground text-sm" data-oid="instructions">
        Clique para reproduzir/pausar
      </div>
    </div>
  );
};
