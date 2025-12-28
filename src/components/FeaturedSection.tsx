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
        data-oid="89-d7gl"
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
        data-oid="mv8ezdv"
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
        data-oid="5nmbnhq"
      />
    );
  }

  // Direct video or audio files
  if (type === "video" || url.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <video
        src={url}
        controls
        autoPlay
        className="w-full h-full"
        data-oid="ec1jfzu"
      />
    );
  }

  if (type === "audio" || url.match(/\.(mp3|wav|ogg)$/i)) {
    return (
      <div className="p-4" data-oid="ishvlqr">
        <AudioVisualizer
          url={url}
          autoPlay={true}
          waveformStyle={waveformStyle}
          data-oid="8ljauya"
        />
      </div>
    );
  }

  // Fallback
  return (
    <div
      className="flex items-center justify-center h-full text-muted-foreground"
      data-oid="2iy.qui"
    >
      <p data-oid="ao43hhp">
        Formato não suportado. Tente YouTube, Spotify ou SoundCloud.
      </p>
    </div>
  );
};

export const FeaturedSection = () => {
  const [allPages, setAllPages] = useState<any[][]>([defaultFeatured]);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [waveformStyle, setWaveformStyle] = useState<
    "bars" | "wave" | "mirror" | "animatedBars"
  >("bars");

  useEffect(() => {
    const loadFeatured = () => {
      const stored = localStorage.getItem("featuredPages");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAllPages(
            parsed.map((page: any[]) =>
              page.map((item: any, index: number) => ({
                ...item,
                image:
                  item.type === "image" && item.url
                    ? item.url
                    : defaultFeatured[index % 8]?.image ||
                    defaultFeatured[0].image,
              })),
            ),
          );
        } catch (e) {
          console.error("Error loading featured:", e);
        }
      }
    };

    loadFeatured();
    const loadAudioSettings = () => {
      try {
        const stored = localStorage.getItem("audioSettings");
        if (stored) {
          const s = JSON.parse(stored);
          if (s && s.waveformStyle) setWaveformStyle(s.waveformStyle);
        }
      } catch { }
    };
    loadAudioSettings();
    window.addEventListener("storage", loadFeatured);
    window.addEventListener("storage", loadAudioSettings);
    return () => {
      window.removeEventListener("storage", loadFeatured);
      window.removeEventListener("storage", loadAudioSettings);
    };
  }, []);

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
      <section className="py-16 px-4 md:px-8" data-oid="9p.4kyn">
        <div className="max-w-7xl mx-auto" data-oid="t52.z8t">
          <h2
            className="text-3xl md:text-4xl font-bold mb-8 text-golden"
            data-oid="t5xm-j5"
          >
            Destaques
          </h2>

          <Tabs defaultValue="page-0" className="w-full" data-oid="bb:.41r">
            <TabsList
              className="mb-8 bg-deep-black/50 border border-golden/20"
              data-oid="n1-x679"
            >
              {allPages.map((_, index) => (
                <TabsTrigger
                  key={index}
                  value={`page-${index}`}
                  className="data-[state=active]:bg-golden data-[state=active]:text-black"
                  data-oid="dj-b541"
                >
                  Página {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>

            {allPages.map((page, pageIndex) => (
              <TabsContent
                key={pageIndex}
                value={`page-${pageIndex}`}
                data-oid="48zq92h"
              >
                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                  data-oid="qxao_ja"
                >
                  {page.map((item) => (
                    <Card
                      key={item.id}
                      onClick={() => handleMediaClick(item)}
                      className="group relative overflow-hidden bg-deep-black/50 border-golden/20 backdrop-blur-sm hover:border-golden/60 transition-all duration-300 hover:scale-105 cursor-pointer"
                      data-oid="slh-pf2"
                    >
                      <div
                        className="aspect-square relative"
                        data-oid="4lk8_mn"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          data-oid="_jel-e-"
                        />

                        <div
                          className="absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"
                          data-oid="poz5a3a"
                        />

                        <div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          data-oid="kcrwh5x"
                        >
                          <div
                            className="w-12 h-12 rounded-full bg-golden/90 flex items-center justify-center backdrop-blur-sm"
                            data-oid="7heyov3"
                          >
                            <Play
                              className="w-6 h-6 text-deep-black fill-deep-black"
                              data-oid="7b0a0:d"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-4" data-oid="ms-e5yt">
                        <h3
                          className="text-sm md:text-base font-semibold text-foreground truncate"
                          data-oid="ilk4hot"
                        >
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
        data-oid="1whtuop"
      >
        <DialogContent
          className="max-w-4xl bg-deep-black/95 border-golden/20"
          data-oid="b0b4slv"
        >
          <DialogHeader data-oid="zt33i5i">
            <DialogTitle className="text-golden text-2xl" data-oid="9zxlqqr">
              {selectedMedia?.title}
            </DialogTitle>
            <DialogDescription
              className="text-muted-foreground"
              data-oid="krd_jw0"
            >
              Reproduzindo mídia
            </DialogDescription>
          </DialogHeader>
          <div
            className={`w-full bg-black rounded-lg overflow-hidden ${selectedMedia?.type === "audio"
              ? "max-h-[80vh] overflow-y-auto"
              : "aspect-video"
              }`}
            data-oid="3hq6mi-"
          >
            {selectedMedia?.url && (
              <MediaPlayer
                url={selectedMedia.url}
                type={selectedMedia.type}
                waveformStyle={waveformStyle}
                data-oid="dut7z.-"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
