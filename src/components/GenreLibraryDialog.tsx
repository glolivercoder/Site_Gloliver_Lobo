import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AudioVisualizer, AudioVisualizerHandle } from "@/components/AudioVisualizer";
import { supabase, getSupabaseUrl } from "@/lib/supabase";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { LikeButton } from "./LikeButton";

type GenreKey =
  | "rock"
  | "sertanejo"
  | "gospel"
  | "reggae"
  | "polemicas"
  | "rap"
  | "trap"
  | "instrumental"
  | "eletrohits";

interface GenreLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genreKey: GenreKey | null;
}

export const GenreLibraryDialog = ({
  open,
  onOpenChange,
  genreKey,
}: GenreLibraryDialogProps) => {
  const [items, setItems] = useState<
    Array<{
      id: string;
      title: string;
      source: "local" | "externo";
      fileId?: string;
      url?: string;
    }>
  >([]);

  // Track index instead of object to easily find next/prev
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const visualizerRef = useRef<AudioVisualizerHandle>(null);

  // Derived selected item
  const selected = currentIndex >= 0 && currentIndex < items.length ? items[currentIndex] : null;

  useEffect(() => {
    if (!open) {
      setCurrentIndex(-1);
      setIsPlaying(false);
      return;
    }

    // Push state for back button handling
    window.history.pushState({ modalOpen: true }, "");

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      onOpenChange(false);
    };

    window.addEventListener("popstate", handlePopState);

    loadGenreItems();

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // @ts-ignore
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, genreKey]);

  const loadGenreItems = async () => {
    try {
      if (!genreKey) return;

      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("genre", genreKey)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const result = (data || []).map((file: any) => ({
        id: file.id,
        title: file.title || "Sem Título",
        source: "externo" as const,
        url: getSupabaseUrl("media", file.file_path),
        fileId: file.id
      }));

      setItems(result);
    } catch (e) {
      console.error("Erro ao carregar itens do gênero:", e);
      toast.error("Erro ao carregar lista do gênero");
      setItems([]);
    }
  };

  const handlePlayIndex = (index: number) => {
    if (index >= 0 && index < items.length) {
      if (items[index].url) {
        setCurrentIndex(index);
        setIsPlaying(true); // Assume autoPlay will start it
      } else {
        toast.error("URL da mídia não encontrada");
      }
    }
  };

  const handleNext = () => {
    if (items.length === 0) return;
    const nextIndex = (currentIndex + 1) % items.length;
    handlePlayIndex(nextIndex);
  };

  const handlePrev = () => {
    if (items.length === 0) return;
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    handlePlayIndex(prevIndex);
  };

  const togglePlayPause = () => {
    if (visualizerRef.current) {
      visualizerRef.current.playPause();
      // isPlaying state will be updated via onIsPlayingChange callback
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-deep-black/95 border-golden/20 h-[80vh] md:h-auto overflow-hidden flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-golden text-xl sm:text-2xl">
            {genreKey
              ? `Coleção: ${genreKey.charAt(0).toUpperCase() + genreKey.slice(1)}`
              : "Coleção por Gênero"}
          </DialogTitle>
          {/* Duplicate Close Button Removed (DialogContent has default one) */}
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
          {/* List of Songs */}
          <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-golden/20 scrollbar-track-transparent max-h-[50vh] md:max-h-[60vh]">
            {items.map((item, idx) => {
              const isCurrent = currentIndex === idx;
              return (
                <Card
                  key={item.id}
                  className={`p-3 border-golden/20 hover:border-golden/60 cursor-pointer transition-colors ${isCurrent ? "bg-golden/10 border-golden" : "bg-deep-black/50"
                    }`}
                  onClick={() => handlePlayIndex(idx)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium truncate text-sm sm:text-base ${isCurrent ? "text-golden" : "text-foreground"}`}>
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.source === "local" ? "Local" : "Externo"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.fileId && <LikeButton mediaId={item.fileId} size="sm" />}
                      <Button
                        size="icon"
                        className={`shrink-0 h-8 w-8 rounded-full ${isCurrent && isPlaying ? "bg-golden/80" : "bg-golden text-deep-black hover:bg-golden/90"}`}
                        title={isCurrent && isPlaying ? "Pausar" : "Reproduzir"}
                      >
                        {isCurrent && isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {items.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma música salva para este gênero.
              </div>
            )}
          </div>

          {/* Player Section */}
          <div className="rounded-lg border border-golden/20 bg-deep-black/50 p-4 flex flex-col justify-center min-h-[150px]">
            {selected ? (
              <div className="w-full flex flex-col gap-4">
                <div className="text-sm text-muted-foreground truncate text-center">
                  Reproduzindo: <span className="text-golden font-bold">{selected.title}</span>
                </div>

                {/* Visualizer - Reduced Height */}
                <div className="h-24">
                  <AudioVisualizer
                    ref={visualizerRef}
                    url={selected.url!}
                    autoPlay
                    waveformStyle="bars"
                    onFinish={handleNext} // Auto-play next
                    onIsPlayingChange={setIsPlaying}
                  />
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  <Button variant="ghost" size="icon" onClick={handlePrev} className="text-golden hover:bg-golden/10 w-12 h-12 rounded-full">
                    <SkipBack className="w-6 h-6" />
                  </Button>

                  <Button
                    onClick={togglePlayPause}
                    className="bg-golden text-black hover:bg-golden/90 w-14 h-14 rounded-full shadow-lg shadow-golden/10"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                  </Button>

                  <Button variant="ghost" size="icon" onClick={handleNext} className="text-golden hover:bg-golden/10 w-12 h-12 rounded-full">
                    <SkipForward className="w-6 h-6" />
                  </Button>
                </div>

              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center">
                Selecione uma faixa para reproduzir
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
