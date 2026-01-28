import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }
    loadGenreItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, genreKey]);

  const loadGenreItems = async () => {
    try {
      if (!genreKey) return;

      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('genre', genreKey) // Exact match on genre key (rock, gospel, etc)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const result = (data || []).map((file: any) => ({
        id: file.id,
        title: file.title || "Sem Título",
        source: "externo" as const,
        url: getSupabaseUrl('media', file.file_path),
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
      <DialogContent className="max-w-4xl bg-deep-black/95 border-golden/20">
        <DialogHeader>
          <DialogTitle className="text-golden">
            {genreKey
              ? `Coleção: ${genreKey.charAt(0).toUpperCase() + genreKey.slice(1)}`
              : "Coleção por Gênero"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="p-4 bg-deep-black/50 border-golden/20 hover:border-golden/60 cursor-pointer"
                onClick={() => handlePlay(item)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-foreground font-medium truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.source === "local"
                        ? "Local (IndexedDB)"
                        : "Externo"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-golden text-deep-black hover:bg-golden/90"
                  >
                    Reproduzir
                  </Button>
                </div>
              </Card>
            ))}

            {items.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Nenhuma música salva para este gênero.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-golden/20 bg-deep-black/50 p-4">
            {selected ? (
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Reproduzindo: {selected.title}
                </div>
                <AudioVisualizer
                  url={selected.url}
                  autoPlay
                  waveformStyle="bars"
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Selecione uma faixa para reproduzir
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
