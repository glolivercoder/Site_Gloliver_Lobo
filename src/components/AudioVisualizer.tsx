import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import { toast } from "sonner";
import { LiveAudioVisualizer } from "./LiveAudioVisualizer";
import { ReactiveAudioVisualizer } from "./ReactiveAudioVisualizer";

export interface AudioVisualizerHandle {
  playPause: () => void;
  isPlaying: boolean;
}

interface AudioVisualizerProps {
  url: string;
  autoPlay?: boolean;
  waveformStyle?: "bars" | "wave" | "mirror" | "animatedBars";
  onFinish?: () => void;
  onIsPlayingChange?: (isPlaying: boolean) => void;
}

export const AudioVisualizer = forwardRef<AudioVisualizerHandle, AudioVisualizerProps>(({
  url,
  autoPlay = false,
  waveformStyle = "bars",
  onFinish,
  onIsPlayingChange
}, ref) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const spectrogramRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useImperativeHandle(ref, () => ({
    playPause: () => {
      wavesurferRef.current?.playPause();
    },
    isPlaying
  }));

  // Check if reactive mode is enabled
  const stored = localStorage.getItem("audioSettings");
  let audioSettings: any = {};
  try {
    audioSettings = stored ? JSON.parse(stored) : {};
  } catch { }

  const useReactiveVisualizer =
    waveformStyle === "animatedBars" || audioSettings.enableSpectrogram;

  // Use ReactiveAudioVisualizer for animated/spectrogram modes
  if (useReactiveVisualizer) {
    return (
      <ReactiveAudioVisualizer
        url={url}
        autoPlay={autoPlay}
        showSpectrogram={audioSettings.enableSpectrogram}
      />
    );
  }

  useEffect(() => {
    setLoadError(false);
    if (!waveformRef.current) return;

    // Configure waveform based on style
    const stored = localStorage.getItem("audioSettings");
    let s: any = {};
    try {
      s = stored ? JSON.parse(stored) : {};
    } catch { }

    const waveConfig: any = {
      container: waveformRef.current,
      waveColor: s.waveColor || "hsl(40 20% 30%)",
      progressColor: s.progressColor || "hsl(40 90% 55%)",
      cursorColor: s.cursorColor || "hsl(0 0% 98%)",
      height: Number(s.height) || 128,
      normalize: true,
      responsive: true,
    };

    // Apply style-specific configurations
    switch (waveformStyle) {
      case "bars":
        waveConfig.barWidth = Number(s.barWidth ?? 3);
        waveConfig.barRadius = Number(s.barRadius ?? 3);
        waveConfig.barGap = Number(s.barGap ?? 2);
        break;
      case "wave":
        waveConfig.barWidth = 0;
        waveConfig.cursorWidth = Number(s.cursorWidth ?? 2);
        break;
      case "mirror":
        waveConfig.barWidth = Number(s.barWidth ?? 3);
        waveConfig.barRadius = Number(s.barRadius ?? 3);
        waveConfig.barGap = Number(s.barGap ?? 2);
        waveConfig.splitChannels = true;
        break;
    }

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create(waveConfig);

    wavesurferRef.current = wavesurfer;

    // Handle events
    wavesurfer.on("error", (error) => {
      console.error("WaveSurfer error:", error);
      setLoadError(true);
      toast.error("Não foi possível carregar o visualizador. Usando player padrão.");
    });

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
      onIsPlayingChange?.(false);
      onFinish?.();
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
      onIsPlayingChange?.(true);
    });

    wavesurfer.on("pause", () => {
      setIsPlaying(false);
      onIsPlayingChange?.(false);
    });

    // Spectrogram plugin
    const enableSpectrogram = !!s.enableSpectrogram;
    if (enableSpectrogram) {
      import("wavesurfer.js/dist/plugins/spectrogram.esm.js")
        .then((mod: any) => {
          const SpectrogramPlugin = mod.default || mod.SpectrogramPlugin || mod;
          if (!spectrogramRef.current) {
            const el = document.createElement("div");
            el.className = "w-full mt-2";
            waveformRef.current?.after(el);
            spectrogramRef.current = el;
          }
          try {
            // @ts-ignore
            const plugin = SpectrogramPlugin.create({
              container: spectrogramRef.current,
              fftSamples: Number(s.spectrogramFftSamples || 256),
            });
            // @ts-ignore
            wavesurfer.registerPlugin(plugin);
          } catch { }
        })
        .catch(() => { });
    }

    const loadAudio = async () => {
      try {
        if (typeof url === "string" && url.startsWith("blob:")) {
          const response = await fetch(url);
          const blob = await response.blob();
          // @ts-ignore
          await wavesurfer.loadBlob(blob);
        } else {
          await wavesurfer.load(url);
        }
      } catch (error: any) {
        console.error("Failed to load audio:", error);
        setLoadError(true);
        toast.error(`Erro ao carregar áudio: ${error.message || "Erro desconhecido"}`);
      }
    };

    loadAudio();

    if (autoPlay) {
      wavesurfer.on("ready", () => {
        wavesurfer.play().catch((error) => {
          console.error("Failed to play:", error);
        });
      });
    }

    return () => {
      try {
        wavesurfer.pause();
      } catch { }
      wavesurfer.destroy();
    };
  }, [url, autoPlay, waveformStyle, onFinish, onIsPlayingChange]);

  const handlePlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  if (loadError) {
    return <LiveAudioVisualizer url={url} autoPlay={autoPlay} />;
  }

  return (
    <div className="space-y-4">
      <div
        ref={waveformRef}
        className="w-full bg-deep-black/30 rounded-lg border border-golden/20 p-2 cursor-pointer hover:border-golden/40 transition-colors"
        onClick={handlePlayPause}
      />
    </div>
  );
});

AudioVisualizer.displayName = "AudioVisualizer";
