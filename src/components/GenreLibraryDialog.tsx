import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getMediaUrl } from "@/utils/storage";
import { AudioVisualizer } from "@/components/AudioVisualizer";

type GenreKey = "rock" | "sertanejo" | "gospel" | "reggae" | "polemicas" | "rap" | "trap" | "instrumental";

interface GenreLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genreKey: GenreKey | null;
}

export const GenreLibraryDialog = ({ open, onOpenChange, genreKey }: GenreLibraryDialogProps) => {
  const [items, setItems] = useState<Array<{ id: string; title: string; source: "local" | "externo"; fileId?: string; url?: string }>>([]);
  const [selected, setSelected] = useState<{ id: string; title: string; url: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }
    loadGenreItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, genreKey]);

  const loadGenreItems = () => {
    try {
      const stored = localStorage.getItem("featuredPages");
      const result: Array<{ id: string; title: string; source: "local" | "externo"; fileId?: string; url?: string }> = [];
      if (stored) {
        const pages = JSON.parse(stored) as any[][];
        pages.forEach((page) => {
          (page || []).forEach((item) => {
            if (!item) return;
            if (item.type === "audio" && item.genre && item.url) {
              const g = String(item.genre).toLowerCase();
              if (!genreKey || g === genreKey) {
                const isLocal = typeof item.url === "string" && item.url.startsWith("file_");
                result.push({
                  id: String(item.id || item.url),
                  title: String(item.title || "Sem título"),
                  source: isLocal ? "local" : "externo",
                  fileId: isLocal ? item.url : undefined,
                  url: !isLocal ? item.url : undefined,
                });
              }
            }
          });
        });
      }
      setItems(result);
    } catch (e) {
      console.error("Erro ao carregar itens do gênero:", e);
      setItems([]);
    }
  };

  const handlePlay = async (item: { id: string; title: string; source: "local" | "externo"; fileId?: string; url?: string }) => {
    try {
      let urlToUse = item.url || "";
      if (item.source === "local" && item.fileId) {
        const blobUrl = await getMediaUrl(item.fileId);
        if (!blobUrl) {
          toast.error("Arquivo local não encontrado");
          return;
        }
        urlToUse = blobUrl;
      }
      setSelected({ id: item.id, title: item.title, url: urlToUse });
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
            {genreKey ? `Coleção: ${genreKey.charAt(0).toUpperCase() + genreKey.slice(1)}` : "Coleção por Gênero"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4 bg-deep-black/50 border-golden/20 hover:border-golden/60 cursor-pointer" onClick={() => handlePlay(item)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-foreground font-medium truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.source === "local" ? "Local (IndexedDB)" : "Externo"}</div>
                  </div>
                  <Button size="sm" className="bg-golden text-deep-black hover:bg-golden/90">Reproduzir</Button>
                </div>
              </Card>
            ))}

            {items.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhuma música salva para este gênero.</div>
            )}
          </div>

          <div className="rounded-lg border border-golden/20 bg-deep-black/50 p-4">
            {selected ? (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Reproduzindo: {selected.title}</div>
                <AudioVisualizer url={selected.url} autoPlay waveformStyle="bars" />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Selecione uma faixa para reproduzir</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

