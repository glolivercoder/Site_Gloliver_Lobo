import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { toast } from "sonner";
import { LiveAudioVisualizer } from "./LiveAudioVisualizer";

interface AudioVisualizerProps {
  url: string;
  autoPlay?: boolean;
  waveformStyle?: "bars" | "wave" | "mirror" | "animatedBars";
}

export const AudioVisualizer = ({
  url,
  autoPlay = false,
  waveformStyle = "bars",
}: AudioVisualizerProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // If animated bars are requested, render the LiveAudioVisualizer directly
    if (waveformStyle === "animatedBars") {
      setLoadError(true);
      return;
    }

    if (!waveformRef.current || loadError) return;

    // Configure waveform based on style
    const waveConfig: any = {
      container: waveformRef.current,
      // Use explicit HSL values for high contrast instead of CSS vars (var())
      waveColor: "hsl(40 20% 30%)", // darker amber base for background waveform
      progressColor: "hsl(40 90% 55%)", // bright amber for played portion (high contrast)
      cursorColor: "hsl(0 0% 98%)", // near-white cursor
      height: 128,
      normalize: true,
      responsive: true,
    };

    // Apply style-specific configurations
    switch (waveformStyle) {
      case "bars":
        waveConfig.barWidth = 3;
        waveConfig.barRadius = 3;
        waveConfig.barGap = 2;
        break;
      case "wave":
        waveConfig.barWidth = 0;
        waveConfig.cursorWidth = 2;
        break;
      case "mirror":
        waveConfig.barWidth = 3;
        waveConfig.barRadius = 3;
        waveConfig.barGap = 2;
        waveConfig.splitChannels = true;
        break;
    }

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create(waveConfig);

    wavesurferRef.current = wavesurfer;

    // Handle loading errors
    wavesurfer.on("error", (error) => {
      console.error("WaveSurfer error:", error);
      setLoadError(true);
      toast.error(
        "Não foi possível carregar o visualizador. Usando player padrão.",
      );
    });

    // Load audio
    const loadAudio = async () => {
      try {
        if (typeof url === "string" && url.startsWith("blob:")) {
          // For blob URLs, fetch the blob and use loadBlob for reliability
          const response = await fetch(url);
          const blob = await response.blob();
          // @ts-ignore - wavesurfer has loadBlob in v7
          await wavesurfer.loadBlob(blob);
        } else {
          await wavesurfer.load(url);
        }
      } catch (error) {
        console.error("Failed to load audio:", error);
        setLoadError(true);
      }
    };

    loadAudio();

    // Auto play if requested
    if (autoPlay) {
      wavesurfer.on("ready", () => {
        wavesurfer.play().catch((error) => {
          console.error("Failed to play:", error);
          toast.error("Clique para reproduzir o áudio");
        });
      });
    }

    return () => {
      wavesurfer.destroy();
    };
  }, [url, autoPlay, loadError, waveformStyle]);

  const handlePlayPause = () => {
    wavesurferRef.current?.playPause();
  };

  // Fallback to a live animated bars visualizer if WaveSurfer fails
  if (loadError) {
    return (
      <LiveAudioVisualizer url={url} autoPlay={autoPlay} data-oid="p-zjwhb" />
    );
  }

  return (
    <div className="space-y-4" data-oid="mlduhge">
      <div
        ref={waveformRef}
        className="w-full bg-deep-black/30 rounded-lg border border-golden/20 p-4 cursor-pointer"
        onClick={handlePlayPause}
        data-oid="qvc4vzq"
      />

      <div
        className="text-center text-muted-foreground text-sm"
        data-oid="jcng1c0"
      >
        Clique na forma de onda para reproduzir/pausar
      </div>
    </div>
  );
};
