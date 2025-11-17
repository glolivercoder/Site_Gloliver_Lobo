import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { toast } from "sonner";

interface AudioVisualizerProps {
  url: string;
  autoPlay?: boolean;
  waveformStyle?: "bars" | "wave" | "mirror";
}

export const AudioVisualizer = ({ url, autoPlay = false, waveformStyle = "bars" }: AudioVisualizerProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!waveformRef.current || loadError) return;

    // Configure waveform based on style
    const waveConfig: any = {
      container: waveformRef.current,
      waveColor: "hsl(var(--golden))",
      progressColor: "hsl(var(--golden) / 0.5)",
      cursorColor: "hsl(var(--golden))",
      height: 128,
      normalize: true,
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
      toast.error("Não foi possível carregar o visualizador. Usando player padrão.");
    });

    // Load audio
    const loadAudio = async () => {
      try {
        if (typeof url === 'string' && url.startsWith('blob:')) {
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

  // Fallback to native HTML5 audio player if WaveSurfer fails
  if (loadError) {
    return (
      <div className="space-y-4">
        <audio
          src={url}
          controls
          autoPlay={autoPlay}
          className="w-full"
          style={{
            filter: "hue-rotate(45deg) saturate(1.5)",
          }}
        />
        <div className="text-center text-muted-foreground text-sm">
          Player de áudio padrão
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div 
        ref={waveformRef} 
        className="w-full bg-deep-black/30 rounded-lg border border-golden/20 p-4 cursor-pointer"
        onClick={handlePlayPause}
      />
      <div className="text-center text-muted-foreground text-sm">
        Clique na forma de onda para reproduzir/pausar
      </div>
    </div>
  );
};
