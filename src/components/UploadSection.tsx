import { useState, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Music,
  Video,
  Link as LinkIcon,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  saveMediaFile,
  cleanupOldFilesByAge,
  listMediaFilesMeta,
  getMediaUrl,
} from "@/utils/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AudioVisualizer } from "./AudioVisualizer";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { supabase, getSupabaseUrl } from "@/lib/supabase";

// Define the genre options
const genreOptions = [
  { value: "rock", label: "Rock" },
  { value: "sertanejo", label: "Sertanejo" },
  { value: "gospel", label: "Gospel" },
  { value: "reggae", label: "Reggae" },
  { value: "polemicas", label: "Polêmicas" },
  { value: "rap", label: "Rap" },
  { value: "trap", label: "Trap" },
  { value: "instrumental", label: "Músicas Instrumentais" },
  { value: "eletrohits", label: "Eletro Hits" },
];

// Featured section options
const featuredOptions = [
  { value: "destaque1", label: "Destaque 1" },
  { value: "destaque2", label: "Destaque 2" },
  { value: "destaque3", label: "Destaque 3" },
  { value: "destaque4", label: "Destaque 4" },
  { value: "destaque5", label: "Destaque 5" },
  { value: "destaque6", label: "Destaque 6" },
  { value: "destaque7", label: "Destaque 7" },
  { value: "destaque8", label: "Destaque 8" },
];

// Page options
const pageOptions = [
  { value: "pagina1", label: "Página 1" },
  { value: "pagina2", label: "Página 2" },
  { value: "pagina3", label: "Página 3" },
];

export const UploadSection = () => {
  const { user, isAdmin, isBlocked } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "audio" | "video">(
    "video",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedFeatured, setSelectedFeatured] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedPage, setSelectedPage] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const { data: featuredPages, save: saveFeaturedPages } = useSiteConfig<
    any[][]
  >("featured_pages", []);

  const [libraryItems, setLibraryItems] = useState<
    Array<{
      id: string;
      title: string;
      type: string;
      genre?: string;
      fileId?: string;
      externalUrl?: string;
      isMissing?: boolean;
    }>
  >([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<any>(null);

  useEffect(() => {
    loadLibraryFromConfig();
  }, [featuredPages]);

  useEffect(() => {
    if (selectedGenre) {
      const hasItems = libraryItems.some(
        (i) => i.genre === selectedGenre.value,
      );
      if (hasItems) setLibraryOpen(true);
    }
  }, [selectedGenre, libraryItems]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!user) {
      toast.error("Você precisa estar logado para enviar arquivos.");
      return;
    }

    if (isBlocked) {
      toast.error("Sua conta está bloqueada. Você não pode enviar arquivos.");
      return;
    }

    // 10MB limit for fans
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (!isAdmin && file.size > MAX_SIZE) {
      toast.error("O limite para vídeos/fotos de fãs é de 10MB.");
      return;
    }

    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("audio/")
        ? "audio"
        : "video";

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: record, error: dbError } = await supabase
        .from("media_files")
        .insert({
          file_path: filePath,
          title: file.name.replace(/\.[^/.]+$/, ""),
          uploaded_by: user?.id,
          type
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const url = getSupabaseUrl("media", record.file_path);

      if (url) {
        setMediaUrl(url);
        setMediaType(type);
        setMediaTitle(file.name.replace(/\.[^/.]+$/, ""));
        toast.success(`${file.name} carregado! Adicione aos destaques abaixo.`);
      }
    } catch (error) {
      console.error("Erro ao carregar arquivo:", error);
      toast.error("Erro ao fazer upload para o servidor.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleAddToFeatured = async () => {
    if (!isAdmin) {
      toast.error("Apenas administradores podem gerenciar destaques.");
      return;
    }
    if (!mediaUrl || !mediaTitle) {
      toast.error("Adicione uma URL e título primeiro.");
      return;
    }

    if (!selectedGenre || !selectedFeatured || !selectedPage) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsUploading(true);

    try {
      let pages = [...(featuredPages || [])];

      const pageIndex =
        Number((selectedPage?.value || "pagina1").replace("pagina", "")) - 1;
      const slotIndex =
        Number(
          (selectedFeatured?.value || "destaque1").replace("destaque", ""),
        ) - 1;

      for (let i = 0; i <= pageIndex; i++) {
        if (!pages[i]) {
          pages[i] = Array(8)
            .fill(null)
            .map((_, idx) => ({
              id: i * 8 + idx + 1,
              title: `Destaque ${i * 8 + idx + 1}`,
              url: "",
              type: "video",
            }));
        }
      }

      const newItem = {
        id: pages[pageIndex][slotIndex]?.id ?? Date.now(),
        title: mediaTitle.trim(),
        url: mediaUrl.trim(),
        type: mediaType,
        genre: selectedGenre?.value,
        featuredKey: selectedFeatured?.value,
        pageKey: selectedPage?.value,
      };

      pages[pageIndex][slotIndex] = newItem;

      await saveFeaturedPages(pages);
      toast.success("Adicionado aos destaques com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar aos destaques:", error);
      toast.error("Não foi possível adicionar aos destaques.");
    } finally {
      setIsUploading(false);
    }
  };

  const loadLibraryFromConfig = async () => {
    try {
      const items: Array<{
        id: string;
        title: string;
        type: string;
        genre?: string;
        fileId?: string;
        externalUrl?: string;
        isMissing?: boolean;
      }> = [];

      const meta = await listMediaFilesMeta();
      const existingFileIds = new Set(meta.map((m) => m.id));

      if (featuredPages && Array.isArray(featuredPages)) {
        featuredPages.forEach((page) => {
          (page || []).forEach((item) => {
            if (item && item.type === "audio" && item.url) {
              const isLocal =
                typeof item.url === "string" && (item.url.startsWith("file_") || item.url.includes("supabase.co"));

              // Local indexeddb check
              const isMissing = typeof item.url === "string" && item.url.startsWith("file_") && !existingFileIds.has(item.url);

              items.push({
                id: String(item.id || item.url),
                title: String(item.title || item.name || "Sem título"),
                type: "audio",
                genre: item.genre,
                fileId: typeof item.url === "string" && item.url.startsWith("file_") ? item.url : undefined,
                externalUrl: !isLocal ? item.url : item.url,
                isMissing,
              });
            }
          });
        });
      }

      const audioMeta = meta.filter((m) => (m.type || "").startsWith("audio/"));
      const knownIds = new Set(
        items.map((i) => i.fileId).filter(Boolean) as string[],
      );
      audioMeta.forEach((m) => {
        if (!knownIds.has(m.id)) {
          items.push({
            id: m.id,
            title: (m.name || "").replace(/\.[^/.]+$/, "") || "Sem título",
            type: "audio",
            genre: undefined,
            fileId: m.id,
            isMissing: false,
          });
        }
      });

      items.sort((a, b) => (a.genre || "").localeCompare(b.genre || ""));
      setLibraryItems(items);
    } catch (error) {
      console.error("Erro ao carregar biblioteca:", error);
    }
  };

  const handleOpenLibraryFromGenre = () => {
    setLibraryOpen(true);
  };

  const handlePlayLibraryItem = async (item: any) => {
    if (item.isMissing) {
      toast.error(
        "Este arquivo foi removido. Faça upload novamente na Área de Upload.",
        { duration: 5000 },
      );
      return;
    }

    try {
      let url = item.externalUrl || "";
      if (item.fileId) {
        const blobUrl = await getMediaUrl(item.fileId);
        if (!blobUrl) {
          toast.error(
            "Arquivo não encontrado no navegador. Faça upload novamente.",
            { duration: 5000 },
          );
          return;
        }
        url = blobUrl;
      }
      setSelectedLibraryItem({ ...item, url, type: "audio" });
    } catch (e) {
      console.error("Erro ao preparar reprodução da biblioteca:", e);
      toast.error("Falha ao abrir música da biblioteca");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <section className="py-24 px-6 relative">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
          {isAdmin ? "Área de Gerenciamento" : "Galeria dos Fãs"}
        </h2>

        <Card
          className={`p-12 bg-card/50 backdrop-blur-sm border-2 border-dashed transition-all ${dragActive ? "border-primary bg-primary/5" : "border-border/50"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-6 text-primary" />

            <h3 className="text-2xl font-semibold mb-4 text-foreground">
              Arraste arquivos aqui
            </h3>
            <p className="text-muted-foreground mb-6">
              ou clique para selecionar do seu computador
            </p>
            {!isAdmin && (
              <p className="text-xs text-golden mb-4">Limite de 10MB por arquivo para fãs</p>
            )}
            <Input
              type="file"
              accept="image/*,audio/*,video/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />

            <label htmlFor="file-upload">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
              >
                <span>Selecionar Arquivos</span>
              </Button>
            </label>
            <p className="text-sm text-muted-foreground mt-4">
              Suporta: JPG, PNG, MP3, WAV, MP4
            </p>
          </div>
        </Card>

        {isAdmin && (
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 mt-8">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">
              Adicionar URL de Mídia (Destaques)
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="media-url" className="text-foreground">
                  URL (YouTube, Spotify, SoundCloud, etc.)
                </Label>
                <div className="flex gap-2 mt-2">
                  <LinkIcon className="w-5 h-5 text-muted-foreground mt-2.5" />
                  <Input
                    id="media-url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="media-title" className="text-foreground">
                  Título
                </Label>
                <Input
                  id="media-title"
                  placeholder="Nome da faixa"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-foreground block mb-2">Gênero</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedGenre ? selectedGenre.label : "Selecione"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[200px]">
                      {genreOptions.map((genre) => (
                        <DropdownMenuItem key={genre.value} onClick={() => setSelectedGenre(genre)}>
                          {genre.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <Label className="text-foreground block mb-2">Destaque</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedFeatured ? selectedFeatured.label : "Selecione"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[200px]">
                      {featuredOptions.map((f) => (
                        <DropdownMenuItem key={f.value} onClick={() => setSelectedFeatured(f)}>
                          {f.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <Label className="text-foreground block mb-2">Página</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedPage ? selectedPage.label : "Selecione"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[200px]">
                      {pageOptions.map((p) => (
                        <DropdownMenuItem key={p.value} onClick={() => setSelectedPage(p)}>
                          {p.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Button
                onClick={handleAddToFeatured}
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-white"
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Adicionar aos Destaques"}
              </Button>
            </div>
          </Card>
        )}

        <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
          <DialogContent className="max-w-3xl bg-card/90 border-border/50">
            <DialogHeader>
              <DialogTitle>Biblioteca de Músicas Salvas</DialogTitle>
              <DialogDescription>Selecione uma música para reproduzir.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {libraryItems
                  .filter((i) => !selectedGenre || i.genre === selectedGenre.value)
                  .map((item) => (
                    <Card key={item.id} className="p-3 bg-card/70 hover:border-primary/50 cursor-pointer" onClick={() => handlePlayLibraryItem(item)}>
                      <div className="flex items-center justify-between">
                        <div className="truncate pr-4">
                          <p className="font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.genre || "Sem Gênero"}</p>
                        </div>
                        <Button size="sm">Ouvir</Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedLibraryItem} onOpenChange={() => setSelectedLibraryItem(null)}>
          <DialogContent className="max-w-3xl bg-card/90 border-border/50">
            <DialogHeader>
              <DialogTitle>{selectedLibraryItem?.title}</DialogTitle>
            </DialogHeader>
            <div className="p-2">
              {selectedLibraryItem?.url && (
                <AudioVisualizer url={selectedLibraryItem.url} autoPlay waveformStyle="animatedBars" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
