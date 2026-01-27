import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music2 } from "lucide-react";
import { toast } from "sonner";
import { getMediaUrl } from "@/utils/storage";
import { getSupabaseUrl, supabase } from "@/lib/supabase";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { useSiteConfig } from "@/hooks/useSiteConfig";

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
      source: "local" | "externo" | "database";
      fileId?: string;
      url?: string;
      genre?: string;
    }>
  >([]);
  const [selected, setSelected] = useState<{
    id: string;
    title: string;
    url: string;
  } | null>(null);

  const { data: featuredPages } = useSiteConfig<any[][]>("featured_pages", []);

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
      const result: Array<{
        id: string;
        title: string;
        source: "local" | "externo" | "database";
        fileId?: string;
        url?: string;
        genre?: string;
      }> = [];

      // 1. Fetch from database media_files (Primary source)
      if (genreKey) {
        console.log(`[GenreLibraryDialog] Loading genre: "${genreKey}"`);
        const { data: dbMedia, error: dbError } = await supabase
          .from("media_files")
          .select("*")
          .ilike("genre", genreKey) // Use ilike for case-insensitive matching
          .eq("type", "audio");

        if (dbError) console.error("[GenreLibraryDialog] Error fetching media:", dbError);
        else console.log(`[GenreLibraryDialog] Found ${dbMedia?.length} items for "${genreKey}"`);

        if (!dbError && dbMedia) {
          dbMedia.forEach((m) => {
            const url = getSupabaseUrl("media", m.file_path);
            if (url) {
              result.push({
                id: m.id,
                title: m.title,
                source: "database",
                url,
                genre: m.genre,
              });
            }
          });
        }
      }

      // 2. Fetch from featuredPages (Compatibility/External)
      if (featuredPages && Array.isArray(featuredPages)) {
        const knownUrls = new Set(result.map(r => r.url));

        featuredPages.forEach((page) => {
          (page || []).forEach((item) => {
            if (!item) return;
            if (item.type === "audio" && item.genre && item.url) {
              const g = String(item.genre).toLowerCase();
              if (!genreKey || g === genreKey) {
                if (knownUrls.has(item.url)) return;

                const isLocal = typeof item.url === "string" && item.url.startsWith("file_");
                result.push({
                  id: String(item.id || item.url),
                  title: String(item.title || "Sem título"),
                  source: isLocal ? "local" : "externo",
                  fileId: isLocal ? item.url : undefined,
                  url: item.url,
                  genre: item.genre,
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

  const handlePlay = async (item: {
    id: string;
    title: string;
    source: "local" | "externo" | "database";
    fileId?: string;
    url?: string;
  }) => {
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
                        : item.source === "database"
                          ? "Banco de Dados"
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
              <div className="text-sm text-center py-8 text-muted-foreground bg-deep-black/30 rounded-lg border border-dashed border-golden/10">
                <Music2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>Nenhuma música encontrada para "{genreKey}".</p>
                <p className="text-xs mt-2">Dica: Verifique se você definiu o gênero ao fazer o upload no painel de administração.</p>
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
