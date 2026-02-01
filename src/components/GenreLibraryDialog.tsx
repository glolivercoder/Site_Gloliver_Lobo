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
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { supabase, getSupabaseUrl } from "@/lib/supabase";
import { Play, X, Heart } from "lucide-react";
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
  const [selected, setSelected] = useState<{
    id: string;
    title: string;
    url: string;
  } | null>(null);

  // Use refs to track back button presses for double-tap exit logic
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }

    // Push a state so the back button closes the modal instead of the page
    window.history.pushState({ modalOpen: true }, "");

    const handlePopState = (event: PopStateEvent) => {
      // If the modal is open and back is pressed, prevent default navigation and close modal
      event.preventDefault();
      onOpenChange(false);
    };

    window.addEventListener("popstate", handlePopState);

    loadGenreItems();

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Clean up history state if we are still in the modal state (e.g. closed via X button)
      // @ts-ignore
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, genreKey]);

  /**
   * Double back press logic for the entire app could be complex to scope just here,
   * but we can try to intercept global back actions if the user is playing music.
   * However, the request says: "se o usuario apetar o botão de return 2 vezes
   * seguidas peegunte se ele quer encerrar a aplicação".
   * This usually implies interception at the App/Root level.
   *
   * For THIS component, we ensure 'Back' closes the modal (returning to central page).
   */

  const loadGenreItems = async () => {
    try {
      if (!genreKey) return;

      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("genre", genreKey) // Exact match on genre key (rock, gospel, etc)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const result = (data || []).map((file: any) => ({
        id: file.id,
        title: file.title || "Sem Título",
        source: "externo" as const,
        url: getSupabaseUrl("media", file.file_path),
      }));

      setItems(result);
    } catch (e) {
      console.error("Erro ao carregar itens do gênero:", e);
      toast.error("Erro ao carregar lista do gênero");
      setItems([]);
    }
  };

  const handlePlay = async (item: {
    id: string;
    title: string;
    source: "local" | "externo";
    fileId?: string;
    url?: string;
  }) => {
    try {
      // Logic simplified: All items from DB have a valid public URL
      if (item.url) {
        setSelected({ id: item.id, title: item.title, url: item.url });
      } else {
        toast.error("URL da mídia não encontrada");
      }
    } catch (e) {
      console.error("Erro ao preparar reprodução:", e);
      toast.error("Falha ao abrir música");
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
          {/* Close Button X */}
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-golden h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
          {/* List of Songs - Scrollable */}
          <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-golden/20 scrollbar-track-transparent max-h-[50vh] md:max-h-[60vh]">
            {items.map((item) => (
              <Card
                key={item.id}
                className="p-3 bg-deep-black/50 border-golden/20 hover:border-golden/60 cursor-pointer transition-colors"
                onClick={() => handlePlay(item)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground font-medium truncate text-sm sm:text-base">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.source === "local"
                        ? "Local (IndexedDB)"
                        : "Externo"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.fileId && (
                      <LikeButton mediaId={item.fileId} size="sm" />
                    )}
                    <Button
                      size="icon"
                      className="bg-golden text-deep-black hover:bg-golden/90 shrink-0 h-8 w-8 rounded-full"
                      title="Reproduzir"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {items.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma música salva para este gênero.
              </div>
            )}
          </div>

          {/* Player Section - Fixed/Sticky on mobile, right side on Desktop */}
          <div className="rounded-lg border border-golden/20 bg-deep-black/50 p-4 flex flex-col justify-center min-h-[150px]">
            {selected ? (
              <div className="w-full">
                <div className="text-sm text-muted-foreground mb-2 truncate">
                  Reproduzindo: <span className="text-golden">{selected.title}</span>
                </div>
                <AudioVisualizer
                  url={selected.url}
                  autoPlay
                  waveformStyle="bars"
                />
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
