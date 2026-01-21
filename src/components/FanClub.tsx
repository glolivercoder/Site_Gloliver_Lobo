import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, X, Loader2 } from "lucide-react";
import { pb, getPbImageUrl } from "@/lib/pocketbase";
import { useAuth } from "@/contexts/AuthContext";
import { ClientResponseError } from "pocketbase";

type GalleryItem = {
  id: string;
  collectionId: string;
  collectionName: string;
  title: string;
  type: "image" | "video";
  media: string; // Filename in PB
  external_url?: string;
  created: string;
};

export const FanClub = () => {
  const { user, isAdmin } = useAuth();
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [videos, setVideos] = useState<GalleryItem[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [photoTitle, setPhotoTitle] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragPhoto, setDragPhoto] = useState(false);
  const [dragVideo, setDragVideo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"image" | "video" | null>(
    null,
  );
  const [editingText, setEditingText] = useState("");

  const loadPosts = async () => {
    try {
      // Ensure specific sorting
      const resultList = await pb
        .collection("fan_club_posts")
        .getList<GalleryItem>(1, 200, {
          sort: "-created",
        });

      const p = resultList.items.filter((item) => item.type === "image");
      const v = resultList.items.filter((item) => item.type === "video");

      setPhotos(p);
      setVideos(v);
    } catch (error) {
      // Silent fail if collection doesn't exist yet (first run) or net error
      console.error("Error loading fan club posts:", error);
    }
  };

  useEffect(() => {
    loadPosts();
    // Subscribe to realtime updates
    pb.collection("fan_club_posts").subscribe("*", (e) => {
      // Ideally optimistic update, but reloading is safer for now
      loadPosts();
    });

    return () => {
      pb.collection("fan_club_posts").unsubscribe();
    };
  }, []);

  const startEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setEditingType(item.type);
    setEditingText(item.title || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await pb.collection("fan_club_posts").update(editingId, {
        title: editingText,
      });
      toast.success("Legenda atualizada");
      setEditingId(null);
      setEditingText("");
    } catch (error) {
      toast.error("Erro ao atualizar legenda");
    }
  };

  const deleteItem = async (item: GalleryItem) => {
    if (!confirm("Deseja excluir este item?")) return;
    try {
      await pb.collection("fan_club_posts").delete(item.id);
      toast.success("Item excluído");
    } catch (error) {
      toast.error("Erro ao excluir item");
    }
  };

  const handleFileUpload = async (
    file: File,
    type: "image" | "video",
    title: string,
  ) => {
    if (!isAdmin) {
      toast.error("Apenas administradores podem postar.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("media", file);
      formData.append("type", type);
      formData.append("title", title || file.name.replace(/\.[^/.]+$/, ""));
      formData.append("author", user?.id || "");

      await pb.collection("fan_club_posts").create(formData);

      toast.success(
        `${type === "image" ? "Imagem" : "Vídeo"} adicionado ao Fã Clube`,
      );
      if (type === "image") setPhotoTitle("");
      else setVideoTitle("");
    } catch (e) {
      const err = e as ClientResponseError;
      console.error(err);
      toast.error(`Falha ao enviar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExternalUrl = async (
    url: string,
    type: "image" | "video",
    title: string,
  ) => {
    if (!isAdmin) {
      toast.error("Apenas administradores podem postar.");
      return;
    }
    if (!url) return;

    try {
      await pb.collection("fan_club_posts").create({
        type,
        title: title || (type === "image" ? "Imagem" : "Vídeo"),
        external_url: url,
        author: user?.id,
      });
      toast.success(
        `${type === "image" ? "Imagem" : "Vídeo"} externa adicionada`,
      );
      if (type === "image") {
        setPhotoUrl("");
        setPhotoTitle("");
      } else {
        setVideoUrl("");
        setVideoTitle("");
      }
    } catch (e) {
      toast.error("Erro ao salvar URL: " + (e as Error).message);
    }
  };

  // --- RENDER HELPERS ---

  const ImageCard = ({ item }: { item: GalleryItem }) => {
    // If external URL, use it. Else use PB URL.
    const src =
      item.external_url ||
      (item.media
        ? getPbImageUrl(item.collectionId, item.id, item.media, "500x500")
        : null);

    return (
      <Card
        className="group relative overflow-hidden bg-deep-black/50 border-golden/20 backdrop-blur-sm hover:border-golden/60 transition-all"
        data-oid="p__ykon"
      >
        <div className="aspect-square relative" data-oid="245iooi">
          {src ? (
            <img
              src={src || ""}
              alt={item.title}
              className="w-full h-full object-cover"
              data-oid="z-bh_fx"
            />
          ) : (
            <div
              className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground"
              data-oid="4tpxj7u"
            >
              Sem imagem
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity"
            data-oid="ecwe7k2"
          />

          {isAdmin && (
            <div
              className="absolute top-2 right-2 flex gap-2"
              data-oid="6v5o:.p"
            >
              <button
                className="p-2 rounded-lg bg-card/70 border border-golden/40 hover:border-golden text-foreground hover:text-golden"
                onClick={() => startEdit(item)}
                data-oid="1voymru"
              >
                <Pencil className="w-4 h-4" data-oid="bn0iz:g" />
              </button>
              <button
                className="p-2 rounded-lg bg-card/70 border border-golden/40 hover:border-golden text-foreground hover:text-golden"
                onClick={() => deleteItem(item)}
                data-oid="otd..u_"
              >
                <X className="w-4 h-4" data-oid="chbjcop" />
              </button>
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0 p-3 text-foreground text-[29px] font-bold"
            onMouseDown={(e) => e.stopPropagation()}
            data-oid="tjqsl-7"
          >
            {editingId === item.id && editingType === "image" ? (
              <div className="flex items-center gap-2" data-oid="r-r2ixw">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  autoFocus
                  className="flex-1 bg-background/50 border-golden/20 focus:border-golden"
                  data-oid="4zbyqcd"
                />

                <Button
                  onClick={saveEdit}
                  className="bg-golden text-deep-black hover:bg-golden/90"
                  data-oid="xu4ezh9"
                >
                  Salvar
                </Button>
              </div>
            ) : (
              item.title
            )}
          </div>
        </div>
      </Card>
    );
  };

  const VideoCard = ({ item }: { item: GalleryItem }) => {
    const src =
      item.external_url ||
      (item.media
        ? getPbImageUrl(item.collectionId, item.id, item.media)
        : null);

    return (
      <Card
        className="group relative overflow-hidden bg-deep-black/50 border-golden/20 backdrop-blur-sm hover:border-golden/60 transition-all"
        data-oid="yl4d4.6"
      >
        <div className="aspect-square relative" data-oid="3_m8bxq">
          {src ? (
            // Simple video tag for file uploads, iframe logic for external providers would be more complex but sticking to simple video/url for now
            item.external_url ? (
              <div
                className="w-full h-full flex items-center justify-center bg-black"
                data-oid="pj_0vbn"
              >
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-golden underline"
                  data-oid="ue3_f81"
                >
                  Ver Vídeo
                </a>
              </div>
            ) : (
              <video
                src={src || ""}
                controls
                className="w-full h-full object-cover"
                data-oid="o:inuzq"
              />
            )
          ) : (
            <div className="w-full h-full bg-muted" data-oid="smg9vku" />
          )}

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity"
            data-oid="kmgteom"
          />

          {isAdmin && (
            <div
              className="absolute top-2 right-2 flex gap-2"
              data-oid=":dzts3-"
            >
              <button
                className="p-2 rounded-lg bg-card/70 border border-golden/40 hover:border-golden text-foreground hover:text-golden"
                onClick={() => startEdit(item)}
                data-oid="30ig.4s"
              >
                <Pencil className="w-4 h-4" data-oid="nijnj-6" />
              </button>
              <button
                className="p-2 rounded-lg bg-card/70 border border-golden/40 hover:border-golden text-foreground hover:text-golden"
                onClick={() => deleteItem(item)}
                data-oid="2c8nda7"
              >
                <X className="w-4 h-4" data-oid="sf2zsfu" />
              </button>
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0 p-3 text-foreground text-[29px] font-bold"
            onMouseDown={(e) => e.stopPropagation()}
            data-oid="9lb5ees"
          >
            {editingId === item.id && editingType === "video" ? (
              <div className="flex items-center gap-2" data-oid="7n2oplh">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  autoFocus
                  className="flex-1 bg-background/50 border-golden/20 focus:border-golden"
                  data-oid="cpbpv0e"
                />

                <Button
                  onClick={saveEdit}
                  className="bg-golden text-deep-black hover:bg-golden/90"
                  data-oid="b02y_j7"
                >
                  Salvar
                </Button>
              </div>
            ) : (
              item.title
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (!user) {
    return (
      <section id="fanclub" className="py-16 px-4 md:px-8" data-oid="vknl7fo">
        <div
          className="max-w-7xl mx-auto text-center space-y-6"
          data-oid="yancz:7"
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-2 text-golden"
            data-oid="z7cqb_5"
          >
            Fã Clube
          </h2>
          <p className="text-muted-foreground text-lg" data-oid="7hu.r7r">
            Faça login para ver o conteúdo exclusivo do fã clube.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="fanclub" className="py-16 px-4 md:px-8" data-oid="mxyb2xz">
      <div className="max-w-7xl mx-auto space-y-12" data-oid="rcs4he2">
        <h2
          className="text-3xl md:text-4xl font-bold mb-2 text-golden"
          data-oid="5wqc-ri"
        >
          Fã Clube
        </h2>

        <Card
          className="bg-deep-black/50 border-golden/20 backdrop-blur-sm"
          data-oid=":1_ecev"
        >
          <div className="p-6" data-oid="x7_:0nh">
            <h3 className="text-2xl text-golden mb-6" data-oid="vw2g.kg">
              Minhas Lobinhas
            </h3>

            {isAdmin && (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${dragPhoto ? "border-golden bg-golden/5" : "border-golden/20"}`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragPhoto(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragPhoto(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragPhoto(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragPhoto(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith("image/"))
                    handleFileUpload(f, "image", photoTitle);
                }}
                data-oid="_1crk:p"
              >
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="df:wpas"
                >
                  Arraste fotos (JPG/PNG) aqui ou use URL
                </div>
                <div
                  className="flex gap-2 mt-3 justify-center"
                  data-oid=":3-7euv"
                >
                  <Input
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="Título"
                    className="max-w-xs bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="2-4ql:t"
                  />

                  <Input
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://imagem..."
                    className="max-w-md bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="fe:ems_"
                  />

                  <Button
                    onClick={() =>
                      handleExternalUrl(photoUrl, "image", photoTitle)
                    }
                    className="bg-golden text-deep-black hover:bg-golden/90"
                    disabled={loading}
                    data-oid="6w5u4xo"
                  >
                    {loading ? (
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        data-oid="qzj2xz-"
                      />
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              data-oid="lwiw5ki"
            >
              {photos.map((p) => (
                <ImageCard key={p.id} item={p} data-oid="9-yw.zz" />
              ))}
              {photos.length === 0 && (
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="fd_ydwy"
                >
                  Nenhuma foto ainda
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card
          className="bg-deep-black/50 border-golden/20 backdrop-blur-sm"
          data-oid="pzbdy:2"
        >
          <div className="p-6" data-oid="xrvh8pb">
            <h3 className="text-2xl text-golden mb-6" data-oid="e97jwa8">
              Vídeos
            </h3>

            {isAdmin && (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${dragVideo ? "border-golden bg-golden/5" : "border-golden/20"}`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragVideo(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragVideo(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragVideo(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragVideo(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith("video/"))
                    handleFileUpload(f, "video", videoTitle);
                }}
                data-oid="-ve6x-i"
              >
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="973fjj9"
                >
                  Arraste vídeos (MP4/WebM) aqui ou use URL
                </div>
                <div
                  className="flex gap-2 mt-3 justify-center"
                  data-oid="4bkubtt"
                >
                  <Input
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Título"
                    className="max-w-xs bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="myu-mc6"
                  />

                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://vídeo..."
                    className="max-w-md bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="g3-mu8:"
                  />

                  <Button
                    onClick={() =>
                      handleExternalUrl(videoUrl, "video", videoTitle)
                    }
                    className="bg-golden text-deep-black hover:bg-golden/90"
                    disabled={loading}
                    data-oid="iqym9j1"
                  >
                    {loading ? (
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        data-oid="1e:rk1v"
                      />
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              data-oid="c6-6nc_"
            >
              {videos.map((v) => (
                <VideoCard key={v.id} item={v} data-oid="r76d-3-" />
              ))}
              {videos.length === 0 && (
                <div
                  className="text-sm text-muted-foreground"
                  data-oid=".r.p-f1"
                >
                  Nenhum vídeo ainda
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
