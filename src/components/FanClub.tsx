import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, X, Loader2, Upload } from "lucide-react"; // Added Upload icon import
import { useAuth } from "@/contexts/AuthContext";
import { supabase, getSupabaseUrl } from "@/lib/supabase";

type GalleryItem = {
  id: string;
  title: string;
  type: "image" | "video";
  media_path?: string; // Supabase Path
  external_url?: string;
  created_at: string;
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
  const [dragPhoto, setDragPhoto] = useState(false); // Define state
  const [dragVideo, setDragVideo] = useState(false); // Define state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"image" | "video" | null>(
    null,
  );
  const [editingText, setEditingText] = useState("");

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("fan_club_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setPhotos(data.filter((i) => i.type === "image"));
        setVideos(data.filter((i) => i.type === "video"));
      }
    } catch (error) {
      console.error("Error loading fan club posts:", error);
    }
  };

  useEffect(() => {
    loadPosts();
    // Realtime subscription
    const channel = supabase
      .channel('fan_club_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fan_club_posts' }, () => {
        loadPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      const { error } = await supabase
        .from("fan_club_posts")
        .update({ title: editingText })
        .eq('id', editingId);

      if (error) throw error;

      toast.success("Legenda atualizada");
      setEditingId(null);
      setEditingText("");
      loadPosts(); // Refresh manually just in case
    } catch (error) {
      toast.error("Erro ao atualizar legenda");
    }
  };

  const deleteItem = async (item: GalleryItem) => {
    if (!confirm("Deseja excluir este item?")) return;
    try {
      // Delete from DB
      const { error } = await supabase.from("fan_club_posts").delete().eq('id', item.id);
      if (error) throw error;

      // Delete from Storage if it exists
      if (item.media_path) {
        await supabase.storage.from('fan_club').remove([item.media_path]);
      }

      toast.success("Item excluído");
      loadPosts();
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`; // Organize in folders

      const { error: uploadError } = await supabase.storage
        .from('fan_club')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('fan_club_posts').insert({
        title: title || file.name,
        type: type,
        author_id: user?.id,
        media_path: filePath
      });

      if (dbError) throw dbError;

      toast.success(
        `${type === "image" ? "Imagem" : "Vídeo"} adicionado ao Fã Clube`,
      );
      if (type === "image") setPhotoTitle("");
      else setVideoTitle("");
      loadPosts();
    } catch (e: any) {
      console.error(e);
      toast.error(`Falha ao enviar: ${e.message}`);
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
      const { error } = await supabase.from('fan_club_posts').insert({
        type,
        title: title || (type === "image" ? "Imagem" : "Vídeo"),
        external_url: url,
        author_id: user?.id,
      });

      if (error) throw error;

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
      loadPosts();
    } catch (e: any) {
      toast.error("Erro ao salvar URL: " + e.message);
    }
  };

  // --- RENDER HELPERS ---

  const ImageCard = ({ item }: { item: GalleryItem }) => {
    const src = item.external_url || (item.media_path ? getSupabaseUrl('fan_club', item.media_path) : "");

    return (
      <Card className="group relative overflow-hidden bg-deep-black/50 border-golden/20 backdrop-blur-sm hover:border-golden/60 transition-all">
        <div className="aspect-square relative">
          {src ? (
            <img
              src={src}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
              Sem imagem
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />

          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                className="p-2 rounded-lg bg-card/70 border border-golden/40 hover:border-golden text-foreground hover:text-golden"
                onClick={() => startEdit(item)}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-lg bg-card/70 border border-golden/40 hover:border-golden text-foreground hover:text-golden"
                onClick={() => deleteItem(item)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0 p-3 text-foreground text-[29px] font-bold"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {editingId === item.id && editingType === "image" ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  autoFocus
                  className="flex-1 bg-background/50 border-golden/20 focus:border-golden"
                />

                <Button
                  onClick={saveEdit}
                  className="bg-golden text-deep-black hover:bg-golden/90"
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
    const src = item.external_url || (item.media_path ? getSupabaseUrl('fan_club', item.media_path) : "");

    return (
      <Card className="group relative overflow-hidden bg-deep-black/50 border-golden/20 backdrop-blur-sm hover:border-golden/60 transition-all">
        <div className="aspect-square relative">
          {src ? (
            item.external_url ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-golden underline"
                >
                  Ver Vídeo
                </a>
              </div>
            ) : (
              <video
                src={src}
                controls
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full bg-muted" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />

          {isAdmin && (
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                className="p-2 rounded-lg bg-card/70 border border-golden/40 hover:border-golden text-foreground hover:text-golden"
                onClick={() => startEdit(item)}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded-lg bg-card/70 border border-golden/40 hover:border-golden text-foreground hover:text-golden"
                onClick={() => deleteItem(item)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div
            className="absolute bottom-0 left-0 right-0 p-3 text-foreground text-[29px] font-bold"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {editingId === item.id && editingType === "video" ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  autoFocus
                  className="flex-1 bg-background/50 border-golden/20 focus:border-golden"
                />

                <Button
                  onClick={saveEdit}
                  className="bg-golden text-deep-black hover:bg-golden/90"
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
      <section id="fanclub" className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-golden">
            Fã Clube
          </h2>
          <p className="text-muted-foreground text-lg">
            Faça login para ver o conteúdo exclusivo do fã clube.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="fanclub" className="py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-golden">
          Fã Clube
        </h2>

        <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-2xl text-golden mb-6">Minhas Lobinhas</h3>

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
              >
                <div className="text-sm text-muted-foreground">
                  Arraste fotos (JPG/PNG) aqui ou use URL
                </div>
                <div className="flex gap-2 mt-3 justify-center">
                  <Input
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="Título"
                    className="max-w-xs bg-background/50 border-golden/20 focus:border-golden"
                  />

                  <Input
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://imagem..."
                    className="max-w-md bg-background/50 border-golden/20 focus:border-golden"
                  />

                  <Button
                    onClick={() =>
                      handleExternalUrl(photoUrl, "image", photoTitle)
                    }
                    className="bg-golden text-deep-black hover:bg-golden/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((p) => (
                <ImageCard key={p.id} item={p} />
              ))}
              {photos.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Nenhuma foto ainda
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-2xl text-golden mb-6">Vídeos</h3>

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
              >
                <div className="text-sm text-muted-foreground">
                  Arraste vídeos (MP4/WebM) aqui ou use URL
                </div>
                <div className="flex gap-2 mt-3 justify-center">
                  <Input
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Título"
                    className="max-w-xs bg-background/50 border-golden/20 focus:border-golden"
                  />

                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://vídeo..."
                    className="max-w-md bg-background/50 border-golden/20 focus:border-golden"
                  />

                  <Button
                    onClick={() =>
                      handleExternalUrl(videoUrl, "video", videoTitle)
                    }
                    className="bg-golden text-deep-black hover:bg-golden/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {videos.map((v) => (
                <VideoCard key={v.id} item={v} />
              ))}
              {videos.length === 0 && (
                <div className="text-sm text-muted-foreground">
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
