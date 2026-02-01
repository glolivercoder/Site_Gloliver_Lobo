import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, getSupabaseUrl } from "@/lib/supabase";
import { CommentsSection } from "./CommentsSection";
import { useNavigate } from "react-router-dom";

type GalleryItem = {
  id: string;
  title: string;
  type: "image" | "video";
  media_path?: string;
  external_url?: string;
  author_id?: string;
  created_at: string;
};

export const FanClub = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [videos, setVideos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"image" | "video" | null>(null);
  const [editingText, setEditingText] = useState("");

  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("fan_club_posts")
        .select("*, author_id")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setPhotos(data.filter((i) => i.type === "image"));
        setVideos(data.filter((i) => i.type === "video"));
      }
    } catch (error) {
      console.error("Error loading fan club posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
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
      loadPosts();
    } catch (error) {
      toast.error("Erro ao atualizar legenda");
    }
  };

  const deleteItem = async (item: GalleryItem) => {
    if (!confirm("Deseja excluir este item?")) return;
    try {
      const { error } = await supabase.from("fan_club_posts").delete().eq('id', item.id);
      if (error) throw error;

      if (item.media_path) {
        await supabase.storage.from('fan_club').remove([item.media_path]);
      }

      toast.success("Item excluído");
      loadPosts();
    } catch (error) {
      toast.error("Erro ao excluir item");
    }
  };

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

          {(isAdmin || user?.id === item.author_id) && (
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
                <Button onClick={saveEdit} className="bg-golden text-deep-black hover:bg-golden/90">Salvar</Button>
              </div>
            ) : (
              item.title
            )}
          </div>
        </div>
        <CommentsSection postId={item.id} />
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
                <a href={item.external_url} target="_blank" rel="noreferrer" className="text-golden underline">Ver Vídeo</a>
              </div>
            ) : (
              <video src={src} controls className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full bg-muted" />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-black via-deep-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />

          {(isAdmin || user?.id === item.author_id) && (
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
                <Button onClick={saveEdit} className="bg-golden text-deep-black hover:bg-golden/90">Salvar</Button>
              </div>
            ) : (
              item.title
            )}
          </div>
        </div>
        <CommentsSection postId={item.id} />
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-golden via-amber-200 to-golden bg-clip-text text-transparent uppercase tracking-tighter">
            Fã Clube Oficial
          </h1>
          <p className="text-muted-foreground mt-2">
            Confira as últimas postagens e interaja com a comunidade.
          </p>
        </div>
        {user && (
          <Button onClick={() => navigate("/posts")} className="bg-golden text-deep-black hover:bg-golden/90 font-bold">
            <Pencil className="w-4 h-4 mr-2" />
            Criar Postagem
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-golden border-l-4 border-golden pl-4 uppercase tracking-wider">
              Galeria de Fotos
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((item) => (
              <ImageCard key={item.id} item={item} />
            ))}
            {photos.length === 0 && (
              <div className="col-span-full border border-dashed border-golden/20 rounded-xl p-8 text-center bg-deep-black/30">
                <p className="text-muted-foreground">Nenhuma foto encontrada.</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-golden border-l-4 border-golden pl-4 uppercase tracking-wider">
              Vídeos Exclusivos
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((item) => (
              <VideoCard key={item.id} item={item} />
            ))}
            {videos.length === 0 && (
              <div className="col-span-full border border-dashed border-golden/20 rounded-xl p-8 text-center bg-deep-black/30">
                <p className="text-muted-foreground">Nenhum vídeo encontrado.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
