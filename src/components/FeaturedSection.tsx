import { Play, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
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

const MediaPlayer = ({
  url,
  type,
  waveformStyle = "bars",
}: {
  url: string;
  type: string;
  waveformStyle?: "bars" | "wave" | "mirror" | "animatedBars";
}) => {
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

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p>Formato não suportado: {type}</p>
    </div>
  );
};

export const FeaturedSection = () => {
  const [allPages, setAllPages] = useState<any[][]>([defaultFeatured]);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waveformStyle, setWaveformStyle] = useState<
    "bars" | "wave" | "mirror" | "animatedBars"
  >("bars");

  useEffect(() => {
    fetchFeatured();
  }, []);

  async function fetchFeatured() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('featured_slots')
        .select(`
            *,
            media:media_files (
                id,
                title,
                file_path,
                type,
                genre
            )
        `)
        .order('id'); // Or order by page_index/slot_index locally

      if (error) throw error;

      // Map to pages structure
      const slots = data || [];
      const maxPage = slots.length > 0 ? Math.max(...slots.map(s => s.page_index)) : 0;
      const totalPages = maxPage + 1; // At least page 0

      const newPages = [];
      for (let p = 0; p < totalPages; p++) {
        const pageItems = [];
        for (let s = 0; s < 8; s++) {
          const slot = slots.find(item => item.page_index === p && item.slot_index === s);
          const defaultItem = defaultFeatured[s] || defaultFeatured[0];

          if (slot) {
            // Determine URL
            let finalUrl = slot.external_url;
            if (!finalUrl && slot.media?.file_path) {
              finalUrl = getSupabaseUrl('media', slot.media.file_path);
            }

            // Determine Title
            let finalTitle = slot.custom_title || slot.media?.title || defaultItem.title;

            // Determine Image
            let finalImage = slot.custom_thumbnail || slot.thumbnail_url || defaultItem.image;

            pageItems.push({
              id: slot.id,
              title: finalTitle,
              image: finalImage,
              url: finalUrl,
              type: slot.type || slot.media?.type || "video"
            });
          } else {
            // Use Default
            pageItems.push(defaultItem);
          }
        }
        newPages.push(pageItems);
      }
      setAllPages(newPages);

    } catch (err) {
      console.error("Erro loading featured:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleMediaClick = async (item: any) => {
    if (!item?.url) {
      toast.info("Nenhuma mídia configurada para este item.");
      return;
    }
    setSelectedMedia(item);
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-golden" />
      </div>
    );
  }

  return (
    <>
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-golden">
            Destaques
          </h2>

          <Tabs defaultValue="page-0" className="w-full">
            <TabsList className="mb-8 bg-deep-black/50 border border-golden/20">
              {allPages.map((_, index) => (
                <TabsTrigger
                  key={index}
                  value={`page-${index}`}
                  className="data-[state=active]:bg-golden data-[state=active]:text-black"
                >
                  Página {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {allPages.map((page, pageIndex) => (
              <TabsContent key={pageIndex} value={`page-${pageIndex}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {page.map((item, idx) => (
                    <Card
                      key={item.id || idx}
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
