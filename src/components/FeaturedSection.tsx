import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { AudioVisualizer } from "./AudioVisualizer";
import { getMediaUrl } from "@/utils/storage";
import { toast } from "sonner";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { supabase, getSupabaseUrl } from "@/lib/supabase";

import featured1 from "@/assets/featured-1.jpg";
import featured2 from "@/assets/featured-2.jpg";
import featured3 from "@/assets/featured-3.jpg";
import featured4 from "@/assets/featured-4.jpg";
import featured5 from "@/assets/featured-5.jpg";
import featured6 from "@/assets/featured-6.jpg";
import featured7 from "@/assets/featured-7.jpg";
import featured8 from "@/assets/featured-8.jpg";

const defaultFeatured = [
  { id: 1, title: "Noite Eterna", image: featured1 },
  { id: 2, title: "Ruas da Cidade", image: featured2 },
  { id: 3, title: "Coração Sertanejo", image: featured3 },
  { id: 4, title: "Vibe Tropical", image: featured4 },
  { id: 5, title: "Fogo e Trovão", image: featured5 },
  { id: 6, title: "Luz Divina", image: featured6 },
  { id: 7, title: "Cidade Neon", image: featured7 },
  { id: 8, title: "Provocação", image: featured8 },
];

// Helper to render embedded player
const MediaPlayer = ({
  url,
  type,
  waveformStyle = "bars",
}: {
  url: string;
  type: string;
  waveformStyle?: "bars" | "wave" | "mirror" | "animatedBars";
}) => {
  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = url.includes("youtu.be")
      ? url.split("youtu.be/")[1]?.split("?")[0]
      : new URLSearchParams(url.split("?")[1] || "").get("v");
    return (
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    );
  }

  // Spotify
  if (url.includes("spotify.com")) {
    const spotifyId = url.split("/").pop()?.split("?")[0];
    const type = url.includes("/track/")
      ? "track"
      : url.includes("/album/")
        ? "album"
        : "playlist";
    return (
      <iframe
        src={`https://open.spotify.com/embed/${type}/${spotifyId}`}
        width="100%"
        height="100%"
        allow="encrypted-media"
        className="w-full h-full"
      />
    );
  }

  // SoundCloud
  if (url.includes("soundcloud.com")) {
    return (
      <iframe
        width="100%"
        height="100%"
        scrolling="no"
        allow="autoplay"
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true`}
        className="w-full h-full"
      />
    );
  }

  // Direct video or audio files
  if (type === "video" || url.match(/\.(mp4|webm|ogg)$/i)) {
    return <video src={url} controls autoPlay className="w-full h-full" />;
  }

  if (type === "audio" || url.match(/\.(mp3|wav|ogg)$/i)) {
    return (
      <div className="p-4">
        <AudioVisualizer
          url={url}
          autoPlay={true}
          waveformStyle={waveformStyle}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p>Formato não suportado. Tente YouTube, Spotify ou SoundCloud.</p>
    </div>
  );
};

export const FeaturedSection = () => {
  // NEW: Fetch from featured_slots relational table
  const [dbSlots, setDbSlots] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const { data: audioSettings } = useSiteConfig<any>("audio_settings", { waveformStyle: "bars" });
  const waveformStyle = audioSettings?.waveformStyle || "bars";
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedSlots();
  }, []);

  async function fetchFeaturedSlots() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("featured_slots")
        .select(`
          *,
          media:media_files (
            id,
            title,
            file_path,
            type,
            genre
          )
        `);

      if (error) throw error;
      setDbSlots(data || []);
      console.log("[FeaturedSection] Loaded slots:", data);
    } catch (error) {
      console.error("[FeaturedSection] Error loading slots:", error);
      toast.error("Erro ao carregar destaques.");
    } finally {
      setLoading(false);
    }
  }

  // Debug log
  // console.log("[FeaturedSection] loading:", loading, "slots:", dbSlots);

  // Construct Display Pages from Relational Data
  // We need to map dbSlots (sparse) to the 8xN grid
  let displayPages: any[][] = [];

  // Find max page index to know how many pages to render
  const maxPage = dbSlots.length > 0
    ? Math.max(...dbSlots.map(s => s.page_index))
    : 0;

  // Ensure at least 1 page
  const totalPages = maxPage + 1;

  for (let p = 0; p < totalPages; p++) {
    const pageItems = [];
    for (let s = 0; s < 8; s++) {
      // Find slot in DB
      const slot = dbSlots.find(d => d.page_index === p && d.slot_index === s);

      // Determine content
      let finalItem = null;
      const defaultItem = defaultFeatured[s] || defaultFeatured[0];

      if (slot) {
        // Resolve URL
        let url = slot.external_url;
        if (!url && slot.media?.file_path) {
          // use getSupabaseUrl helper from imports (Need to make sure it is imported or available)
          // If not available in scope, we need to import or replicate. 
          // Assuming getMediaUrl is for IndexedDB?
        }

        // Better URL resolution logic will be handled below or using a helper
        // Ideally we use the public URL if it is a media file
      }

      // Simplified mapping logic for now, using defaults if slot missing
      // We will enhance this to properly merge DB data + defaults

      const mediaUrl = slot?.external_url || (slot?.media?.file_path ? getSupabaseUrl("media", slot.media.file_path) : "");

      pageItems.push({
        id: slot?.id || `default-${p}-${s}`,
        title: slot?.custom_title || slot?.media?.title || defaultItem.title,
        image: slot?.custom_thumbnail || slot?.thumbnail_url || defaultItem.image,
        url: mediaUrl,
        type: slot?.type || slot?.media?.type || "video",
        // Keep raw slot data for debug
        _slot: slot
      });
    }
    displayPages.push(pageItems);
  }

  const handleMediaClick = async (item: any) => {
    if (!item?.url) return;

    // Resolver arquivos locais salvos via IndexedDB
    let urlToUse = item.url as string;
    if (typeof urlToUse === "string" && urlToUse.startsWith("file_")) {
      try {
        const blobUrl = await getMediaUrl(urlToUse);
        if (!blobUrl) {
          toast.error("Arquivo local não encontrado.");
          return;
        }
        urlToUse = blobUrl;
      } catch (e) {
        console.error("Erro ao obter URL do arquivo local:", e);
        toast.error("Falha ao carregar arquivo local.");
        return;
      }
    }

    if (item.type === "audio" || item.type === "video") {
      setSelectedMedia({ ...item, url: urlToUse });
    }
  };

  return (
    <>
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-golden">
            Destaques
          </h2>

          <Tabs defaultValue="page-0" className="w-full">
            <TabsList className="mb-8 bg-deep-black/50 border border-golden/20">
              {displayPages.map((_, index) => (
                <TabsTrigger
                  key={index}
                  value={`page-${index}`}
                  className="data-[state=active]:bg-golden data-[state=active]:text-black"
                >
                  Página {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {displayPages.map((page, pageIndex) => (
              <TabsContent key={pageIndex} value={`page-${pageIndex}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {page.map((item) => (
                    <Card
                      key={item.id}
                      onClick={() => handleMediaClick(item)}
                      className="group relative overflow-hidden bg-deep-black/50 border-golden/20 backdrop-blur-sm hover:border-golden/60 transition-all duration-300 hover:scale-105 cursor-pointer"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-golden/90 flex items-center justify-center backdrop-blur-sm">
                            <Play className="w-6 h-6 text-deep-black fill-deep-black" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm md:text-base font-semibold text-foreground truncate">
                          {item.title}
                        </h3>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* DEBUG VISUAL - REMOVE IN PRODUCTION */}
        <div className="mt-8 p-4 bg-gray-900 border border-red-500 text-white text-xs overflow-auto max-h-[300px] z-50 relative mx-auto max-w-7xl rounded-lg">
          <strong className="text-red-400 block mb-2 text-lg">🔧 PAINEL DE DEBUG (Técnico)</strong>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Status:</strong> {loading ? 'Carregando...' : 'Carregado'}</p>
              <p><strong>Config Source:</strong> Table 'featured_slots'</p>
              <p><strong>Slots Encontrados:</strong> {dbSlots?.length || 0}</p>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-golden hover:text-white mb-2">Clique para ver o JSON Completo (Dados Brutos)</summary>
            <pre className="bg-black p-4 rounded">{JSON.stringify(dbSlots, null, 2)}</pre>
          </details>
        </div>
      </section>

      <Dialog
        open={!!selectedMedia}
        onOpenChange={() => setSelectedMedia(null)}
      >
        <DialogContent className="max-w-4xl bg-deep-black/95 border-golden/20">
          <DialogHeader>
            <DialogTitle className="text-golden text-2xl">
              {selectedMedia?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Reproduzindo mídia
            </DialogDescription>
          </DialogHeader>
          <div
            className={`w-full bg-black rounded-lg overflow-hidden ${selectedMedia?.type === "audio"
              ? "max-h-[80vh] overflow-y-auto"
              : "aspect-video"
              }`}
          >
            {selectedMedia?.url && (
              <MediaPlayer
                url={selectedMedia.url}
                type={selectedMedia.type}
                waveformStyle={waveformStyle}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
