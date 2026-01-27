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
// Removed legacy storage utils
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AudioVisualizer } from "./AudioVisualizer";
import { useAuth } from "@/contexts/AuthContext";
// Removed useSiteConfig
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
  const { user, isAdmin, isBlocked } = useAuth(); // Using correct AuthContext
  const [dragActive, setDragActive] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "audio" | "video">(
    "video",
  );
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [currentFileId, setCurrentFileId] = useState<string | null>(null); // Track uploaded file ID

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

  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<any>(null);

  useEffect(() => {
    loadLibrary();
  }, [user]);

  // Ao selecionar um gênero, abrir a biblioteca diretamente para facilitar
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
      toast.error("Você precisa estar logado.");
      return;
    }
    if (isBlocked) {
      toast.error("Conta bloqueada.");
      return;
    }

    // Check size limit for non-admin
    if (!isAdmin && file.size > 10 * 1024 * 1024) {
      toast.error("Limite de 10MB para uploads de fãs.");
      return;
    }

    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("audio/")
        ? "audio"
        : "video";

    setIsUploading(true);
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Insert into media_files
      const { data: record, error: dbError } = await supabase
        .from("media_files")
        .insert({
          file_path: filePath,
          title: file.name.replace(/\.[^/.]+$/, ""),
          uploaded_by: user.id,
          type,
          genre: selectedGenre?.value || null
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Set state
      const publicUrl = getSupabaseUrl('media', filePath);
      setMediaUrl(publicUrl);
      setMediaType(type);
      setMediaTitle(record.title);
      setCurrentFileId(record.id);

      toast.success(`${file.name} carregado!`);
    } catch (error: any) {
      console.error("Erro upload:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `thumb_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage.from('media').upload(filePath, file);
      if (error) throw error;

      const url = getSupabaseUrl('media', filePath);
      setThumbnailUrl(url);
      toast.success("Capa carregada!");
    } catch (e) {
      toast.error("Erro na capa.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddToFeatured = async () => {
    if (!isAdmin) {
      toast.error("Administrador requerido.");
      return;
    }
    if (!mediaUrl || !mediaTitle) {
      toast.error("Adicione URL e Título.");
      return;
    }
    if (!selectedGenre || !selectedFeatured || !selectedPage) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setIsUploading(true);

    try {
      const pageIndex = Number((selectedPage?.value || "pagina1").replace("pagina", "")) - 1;
      const slotIndex = Number((selectedFeatured?.value || "destaque1").replace("destaque", "")) - 1;

      // Insert into featured_slots
      const payload = {
        page_index: pageIndex,
        slot_index: slotIndex,
        custom_title: mediaTitle.trim(),
        external_url: mediaUrl.trim(),
        type: mediaType,
        thumbnail_url: thumbnailUrl || null,
        media_file_id: currentFileId || null // Try to link if we just uploaded it
        // If User pastes YouTube URL, currentFileId is null, works as external_url
      };

      const { error } = await supabase.from('featured_slots').upsert(payload, {
        onConflict: 'page_index, slot_index'
      });

      if (error) throw error;

      toast.success("Destaque atualizado com sucesso!");
      loadLibrary(); // Refresh library
    } catch (error: any) {
      console.error("Featured Error:", error);
      toast.error(`Erro ao salvar destaque: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const loadLibrary = async () => {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const items = data.map(m => ({
          id: m.id,
          title: m.title,
          type: m.type,
          genre: m.genre,
          externalUrl: getSupabaseUrl('media', m.file_path),
          isMissing: false // Assumed false for DB items
        }));
        setLibraryItems(items);
      }
    } catch (error) {
      console.error("Erro library:", error);
    }
  };

  const handleOpenLibraryFromGenre = () => {
    setLibraryOpen(true);
  };

  const handlePlayLibraryItem = async (item: any) => {
    setSelectedLibraryItem({ ...item, url: item.externalUrl });
  };

  // REMOVING EARLY RETURN to show Debug Panel
  // if (!user) return null;

  return (
    <section className="py-24 px-6 relative">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
          {isAdmin ? "Área de Gerenciamento" : "Galeria dos Fãs"}
        </h2>

        {!user ? (
          <div className="text-center p-12 border border-destructive/50 rounded-lg bg-destructive/10 mb-8">
            <h3 className="text-2xl font-bold text-destructive mb-4">Acesso Restrito</h3>
            <p className="text-muted-foreground">Você precisa estar logado para fazer uploads.</p>
            <div className="mt-4 text-sm opacity-70">
              Verifique o painel de debug abaixo para detalhes.
            </div>
          </div>
        ) : (
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
        )}

        {user && (
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 mt-8">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">
              Adicionar URL de Mídia
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
                    placeholder="https://youtube.com/watch?v=... ou https://soundcloud.com/..."
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="media-title" className="text-foreground">
                  Título da Música/Vídeo
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
                  <Label className="text-foreground block mb-2">
                    Gênero Musical
                  </Label>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {selectedGenre
                            ? selectedGenre.label
                            : "Selecione um gênero"}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[200px]">
                        {genreOptions.map((genre) => (
                          <DropdownMenuItem
                            key={genre.value}
                            onClick={() => setSelectedGenre(genre)}
                            className="cursor-pointer"
                          >
                            {genre.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      className="text-primary"
                      onClick={handleOpenLibraryFromGenre}
                    >
                      Ver músicas salvas
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground block mb-2">Destaque</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {selectedFeatured
                          ? selectedFeatured.label
                          : "Selecione o destaque"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[200px]">
                      {featuredOptions.map((featured) => (
                        <DropdownMenuItem
                          key={featured.value}
                          onClick={() => setSelectedFeatured(featured)}
                          className="cursor-pointer"
                        >
                          {featured.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <Label className="text-foreground block mb-2">Página</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {selectedPage ? selectedPage.label : "Selecione a página"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[200px]">
                      {pageOptions.map((page) => (
                        <DropdownMenuItem
                          key={page.value}
                          onClick={() => setSelectedPage(page)}
                          className="cursor-pointer"
                        >
                          {page.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div>
                <Label className="text-foreground block mb-2">Capa Personalizada (Thumbnail)</Label>
                <Input type="file" accept="image/*" onChange={handleThumbnailUpload} />
                {thumbnailUrl && <span className="text-xs text-green-500">Capa Carregada</span>}
              </div>

              <div>
                <Label htmlFor="media-type" className="text-foreground">
                  Tipo de Mídia
                </Label>
                <select
                  id="media-type"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2 text-foreground"
                >
                  <option value="video">Vídeo</option>
                  <option value="audio">Áudio</option>
                  <option value="image">Imagem</option>
                </select>
              </div>
              <Button
                onClick={handleAddToFeatured}
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-white"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Adicionar aos Destaques / Enviar"
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Biblioteca de Músicas Salvas */}
        <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
          <DialogContent className="max-w-3xl bg-card/90 border-border/50">
            <DialogHeader>
              <DialogTitle>Biblioteca de Músicas Salvas</DialogTitle>
              <DialogDescription>
                Selecione uma música para reproduzir ou filtre por gênero.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {selectedGenre
                  ? `Filtrando por gênero: ${selectedGenre.label}`
                  : "Todos os gêneros"}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {libraryItems
                  .filter(
                    (i) => !selectedGenre || i.genre === selectedGenre.value,
                  )
                  .map((item) => (
                    <Card
                      key={item.id}
                      className={`p-3 border-border/50 cursor-pointer ${"bg-card/70 hover:border-primary/50"
                        }`}
                      onClick={() => handlePlayLibraryItem(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div
                            className={`font-medium truncate flex items-center gap-2 text-foreground`}
                          >
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.genre
                              ? `Gênero: ${item.genre}`
                              : "Sem gênero"}
                          </div>
                          <div
                            className={`text-xs ${item.isMissing ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {item.isMissing
                              ? "⚠️ Arquivo não encontrado - faça upload novamente"
                              : item.fileId
                                ? "Local (IndexedDB)"
                                : "Externo"}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className={
                            item.isMissing
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary text-white"
                          }
                        >
                          {item.isMissing ? "Indisponível" : "Reproduzir"}
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
              {libraryItems.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Nenhuma música salva encontrada.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Player para item da biblioteca */}
        <Dialog
          open={!!selectedLibraryItem}
          onOpenChange={() => setSelectedLibraryItem(null)}
        >
          <DialogContent className="max-w-3xl bg-card/90 border-border/50">
            <DialogHeader>
              <DialogTitle>{selectedLibraryItem?.title}</DialogTitle>
              <DialogDescription>
                Clique na forma de onda para reproduzir ou pausar.
              </DialogDescription>
            </DialogHeader>
            <div className="p-2">
              {selectedLibraryItem?.url && (
                <div className="aspect-video">
                  <div className="p-2">
                    <AudioVisualizer
                      url={selectedLibraryItem.url}
                      autoPlay
                      waveformStyle="animatedBars"
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        {/* --- MONITORING SYSTEM (DEBUG PANEL) --- */}
        <Card className="mt-16 p-6 border-destructive/50 bg-destructive/10">
          <h3 className="text-xl font-bold text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Sistema de Monitoramento (Debug)
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Status da Sessão:</strong> {user ? "🟢 Logado via Supabase Auth" : "🔴 Desconectado"}</p>
            <p><strong>Email Detectado:</strong> {user?.email || "N/A"}</p>
            <p><strong>Admin Status:</strong> {isAdmin ? "🟢 Admin Confirmado" : `🔴 Não Admin (Esperado: gloliverlobo@gmail.com)`}</p>

            <div className="mt-4 pt-4 border-t border-destructive/20">
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  try {
                    const { error } = await supabase.from('featured_slots').upsert({
                      page_index: 99,
                      slot_index: 0,
                      custom_title: "DEBUG_WRITE_TEST",
                      type: "video"
                    });
                    if (error) throw error;
                    toast.success("✅ TESTE BEM SUCEDIDO! Permissão de Gravação OK.");
                    await supabase.from('featured_slots').delete().match({ page_index: 99 });
                  } catch (e: any) {
                    toast.error(`❌ FALHA: ${e.message}`);
                    console.error(e);
                  }
                }}
              >
                Testar Permissão de Gravação (Banco de Dados)
              </Button>
              <p className="mt-2 text-xs opacity-70">
                Clique para tentar criar um registro de teste. Se falhar, é erro de RLS (SQL).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
