import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveMediaFile, getMediaUrl, listMediaFilesMeta } from "@/utils/storage";
import { Pencil, X } from "lucide-react";

type GalleryItem = {
  id: string;
  title: string;
  type: "image" | "video";
  fileId?: string;
  externalUrl?: string;
  createdAt: number;
};

export const FanClub = () => {
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
  const [editingType, setEditingType] = useState<"image" | "video" | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("fanClubGallery");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPhotos(parsed.photos || []);
        setVideos(parsed.videos || []);
      } catch {}
    }
  }, []);

  const persist = (p: GalleryItem[], v: GalleryItem[]) => {
    localStorage.setItem("fanClubGallery", JSON.stringify({ photos: p, videos: v }));
    setPhotos(p);
    setVideos(v);
  };

  const startEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setEditingType(item.type);
    setEditingText(item.title || "");
  };

  const saveEdit = () => {
    if (!editingId || !editingType) return;
    if (editingType === "image") {
      const updated = photos.map((p) => (p.id === editingId ? { ...p, title: editingText } : p));
      persist(updated, videos);
    } else {
      const updated = videos.map((v) => (v.id === editingId ? { ...v, title: editingText } : v));
      persist(photos, updated);
    }
    setEditingId(null);
    setEditingType(null);
    setEditingText("");
    toast.success("Legenda atualizada");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingType(null);
    setEditingText("");
  };

  const deleteItem = (item: GalleryItem) => {
    if (!confirm("Deseja excluir este item?")) return;
    if (item.type === "image") {
      const updated = photos.filter((p) => p.id !== item.id);
      persist(updated, videos);
    } else {
      const updated = videos.filter((v) => v.id !== item.id);
      persist(photos, updated);
    }
    toast.success("Item excluído");
  };

  const handlePhotoFile = async (file: File) => {
    setLoading(true);
    try {
      const fileId = await saveMediaFile(file);
      const item: GalleryItem = {
        id: fileId,
        title: photoTitle || file.name.replace(/\.[^/.]+$/, ""),
        type: "image",
        fileId,
        createdAt: Date.now(),
      };
      persist([item, ...photos], videos);
      toast.success("Imagem adicionada ao Fã Clube");
      setPhotoTitle("");
    } catch (e) {
      toast.error("Falha ao salvar imagem");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoFile = async (file: File) => {
    setLoading(true);
    try {
      const fileId = await saveMediaFile(file);
      const item: GalleryItem = {
        id: fileId,
        title: videoTitle || file.name.replace(/\.[^/.]+$/, ""),
        type: "video",
        fileId,
        createdAt: Date.now(),
      };
      persist(photos, [item, ...videos]);
      toast.success("Vídeo adicionado ao Fã Clube");
      setVideoTitle("");
    } catch (e) {
      toast.error("Falha ao salvar vídeo");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhotoUrl = () => {
    if (!photoUrl) return;
    const item: GalleryItem = {
      id: `ext_${Date.now()}`,
      title: photoTitle || "Imagem",
      type: "image",
      externalUrl: photoUrl,
      createdAt: Date.now(),
    };
    persist([item, ...photos], videos);
    setPhotoUrl("");
    setPhotoTitle("");
    toast.success("Imagem externa adicionada");
  };

  const handleAddVideoUrl = () => {
    if (!videoUrl) return;
    const item: GalleryItem = {
      id: `ext_${Date.now()}`,
      title: videoTitle || "Vídeo",
      type: "video",
      externalUrl: videoUrl,
      createdAt: Date.now(),
    };
    persist(photos, [item, ...videos]);
    setVideoUrl("");
    setVideoTitle("");
    toast.success("Vídeo externo adicionada");
  };

  const renderImageSrc = async (item: GalleryItem): Promise<string | null> => {
    if (item.externalUrl) return item.externalUrl;
    if (item.fileId) return await getMediaUrl(item.fileId);
    return null;
  };

  const ImageCard = ({ item }: { item: GalleryItem }) => {
    const [src, setSrc] = useState<string | null>(null);
    useEffect(() => {
      let mounted = true;
      (async () => {
        const url = await renderImageSrc(item);
        if (mounted) setSrc(url);
      })();
      return () => {
        mounted = false;
      };
    }, [item.id]);
    return (
      <Card className="group relative overflow-hidden bg-deep-black/50 border-golden/20 backdrop-blur-sm hover:border-golden/60 transition-all">
        <div className="aspect-square relative">
          {src ? (
            <img src={src} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />
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
          <div className="absolute bottom-0 left-0 right-0 p-3 text-foreground text-[29px] font-bold" onMouseDown={(e) => e.stopPropagation()}>
            {editingId === item.id && editingType === "image" ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  autoFocus
                  className="flex-1 bg-background/50 border-golden/20 focus:border-golden"
                />
                <Button onClick={saveEdit} className="bg-golden text-deep-black hover:bg-golden/90">Salvar</Button>
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
    const [src, setSrc] = useState<string | null>(null);
    useEffect(() => {
      let mounted = true;
      (async () => {
        const url = item.externalUrl || (item.fileId ? await getMediaUrl(item.fileId) : null);
        if (mounted) setSrc(url);
      })();
      return () => {
        mounted = false;
      };
    }, [item.id]);
    return (
      <Card className="group relative overflow-hidden bg-deep-black/50 border-golden/20 backdrop-blur-sm hover:border-golden/60 transition-all">
        <div className="aspect-square relative">
          {src ? (
            <video src={src} controls className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />
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
          <div className="absolute bottom-0 left-0 right-0 p-3 text-foreground text-[29px] font-bold" onMouseDown={(e) => e.stopPropagation()}>
            {editingId === item.id && editingType === "video" ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  autoFocus
                  className="flex-1 bg-background/50 border-golden/20 focus:border-golden"
                />
                <Button onClick={saveEdit} className="bg-golden text-deep-black hover:bg-golden/90">Salvar</Button>
              </div>
            ) : (
              item.title
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <section id="fanclub" className="py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-golden">Fã Clube</h2>

        <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-2xl text-golden mb-6">Minhas Lobinhas</h3>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${dragPhoto ? "border-golden bg-golden/5" : "border-golden/20"}`}
              onDragEnter={(e) => { e.preventDefault(); setDragPhoto(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragPhoto(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragPhoto(false); }}
              onDrop={(e) => { e.preventDefault(); setDragPhoto(false); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith("image/")) handlePhotoFile(f); }}
            >
              <div className="text-sm text-muted-foreground">Arraste fotos (JPG/PNG) aqui ou use URL</div>
              <div className="flex gap-2 mt-3 justify-center">
                <Input value={photoTitle} onChange={(e) => setPhotoTitle(e.target.value)} placeholder="Título" className="max-w-xs bg-background/50 border-golden/20 focus:border-golden" />
                <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://imagem..." className="max-w-md bg-background/50 border-golden/20 focus:border-golden" />
                <Button onClick={handleAddPhotoUrl} className="bg-golden text-deep-black hover:bg-golden/90">Adicionar</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((p) => (
                <ImageCard key={p.id} item={p} />
              ))}
              {photos.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhuma foto ainda</div>
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-2xl text-golden mb-6">Vídeos</h3>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${dragVideo ? "border-golden bg-golden/5" : "border-golden/20"}`}
              onDragEnter={(e) => { e.preventDefault(); setDragVideo(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragVideo(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragVideo(false); }}
              onDrop={(e) => { e.preventDefault(); setDragVideo(false); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith("video/")) handleVideoFile(f); }}
            >
              <div className="text-sm text-muted-foreground">Arraste vídeos (MP4/WebM) aqui ou use URL</div>
              <div className="flex gap-2 mt-3 justify-center">
                <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Título" className="max-w-xs bg-background/50 border-golden/20 focus:border-golden" />
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://vídeo..." className="max-w-md bg-background/50 border-golden/20 focus:border-golden" />
                <Button onClick={handleAddVideoUrl} className="bg-golden text-deep-black hover:bg-golden/90">Adicionar</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {videos.map((v) => (
                <VideoCard key={v.id} item={v} />
              ))}
              {videos.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhum vídeo ainda</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};