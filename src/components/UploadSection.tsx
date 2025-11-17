import { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, Music, Video, Link as LinkIcon, ChevronDown, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { saveMediaFile, cleanupOldFilesByAge, listMediaFilesMeta, getMediaUrl } from "@/utils/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define the genre options
const genreOptions = [
  { value: "rock", label: "Rock" },
  { value: "sertanejo", label: "Sertanejo" },
  { value: "gospel", label: "Gospel" },
  { value: "reggae", label: "Reggae" },
  { value: "polemicas", label: "Polêmicas" },
  { value: "rap", label: "Rap" },
  { value: "trap", label: "Trap" },
  { value: "instrumental", label: "Músicas Instrumentais" }
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
  { value: "destaque8", label: "Destaque 8" }
];

// Page options
const pageOptions = [
  { value: "pagina1", label: "Página 1" },
  { value: "pagina2", label: "Página 2" },
  { value: "pagina3", label: "Página 3" }
];

export const UploadSection = () => {
  const [dragActive, setDragActive] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "audio" | "video">("video");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<{value: string, label: string} | null>(null);
  const [selectedFeatured, setSelectedFeatured] = useState<{value: string, label: string} | null>(null);
  const [selectedPage, setSelectedPage] = useState<{value: string, label: string} | null>(null);
  const [libraryItems, setLibraryItems] = useState<Array<{ id: string; title: string; type: string; genre?: string; fileId?: string; externalUrl?: string }>>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<any>(null);
  
  // Clean up old files on component mount
  useEffect(() => {
    cleanupOldFilesByAge(7); // Clean up files older than 7 days
    loadLibraryFromStorage();
    const onStorage = () => loadLibraryFromStorage();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Ao selecionar um gênero, abrir a biblioteca diretamente para facilitar
  useEffect(() => {
    if (selectedGenre) {
      // Abre a biblioteca se houver itens para o gênero selecionado
      const hasItems = libraryItems.some((i) => i.genre === selectedGenre.value);
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
    const type = file.type.startsWith('image/') ? 'image' : 
                 file.type.startsWith('audio/') ? 'audio' : 'video';
    
    setIsUploading(true);
    try {
      const fileId = await saveMediaFile(file);
      setMediaUrl(fileId);
      setMediaType(type);
      setMediaTitle(file.name.replace(/\.[^/.]+$/, ""));
      toast.success(`${file.name} carregado! Adicione aos destaques abaixo.`);
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      if (typeof error === 'string') {
        toast.error(error);
      } else {
        toast.error("Erro ao carregar arquivo. Tente novamente mais tarde.");
      }
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
      // Carregar páginas existentes ou inicializar estrutura
      const stored = localStorage.getItem("featuredPages");
      let pages: any[][] = [];

      if (stored) {
        try {
          pages = JSON.parse(stored);
        } catch (e) {
          console.error("Erro ao ler featuredPages:", e);
          pages = [];
        }
      }

      const pageIndex = Number((selectedPage?.value || "pagina1").replace("pagina", "")) - 1;
      const slotIndex = Number((selectedFeatured?.value || "destaque1").replace("destaque", "")) - 1;

      // Garantir que a página exista com 8 slots
      if (!pages[pageIndex]) {
        pages[pageIndex] = Array(8).fill(null).map((_, i) => ({
          id: pageIndex * 8 + i + 1,
          title: `Destaque ${pageIndex * 8 + i + 1}`,
          url: "",
          type: "video",
        }));
      }

      const newItem = {
        id: pages[pageIndex][slotIndex]?.id ?? Date.now(),
        title: mediaTitle.trim(),
        url: mediaUrl.trim(), // pode ser link externo ou fileId (IndexedDB)
        type: mediaType,
        genre: selectedGenre?.value,
        featuredKey: selectedFeatured?.value,
        pageKey: selectedPage?.value,
      };

      pages[pageIndex][slotIndex] = newItem;

      localStorage.setItem("featuredPages", JSON.stringify(pages));
      // Notificar ouvintes (Homepage/FeaturedSection) para recarregar
      window.dispatchEvent(new Event("storage"));

      toast.success("Adicionado aos destaques com sucesso!");

      // Opcional: limpar campos de formulário
      // Mantemos mediaUrl/title para facilitar edições subsequentes
    } catch (error) {
      console.error("Erro ao adicionar aos destaques:", error);
      toast.error("Não foi possível adicionar aos destaques.");
    } finally {
      setIsUploading(false);
    }
  };

  const loadLibraryFromStorage = async () => {
    try {
      const stored = localStorage.getItem("featuredPages");
      const items: Array<{ id: string; title: string; type: string; genre?: string; fileId?: string; externalUrl?: string }> = [];
      if (stored) {
        try {
          const pages = JSON.parse(stored) as any[][];
          pages.forEach((page) => {
            (page || []).forEach((item) => {
              if (item && item.type === 'audio' && item.url) {
                const isLocal = typeof item.url === 'string' && item.url.startsWith('file_');
                items.push({
                  id: String(item.id || item.url),
                  title: String(item.title || item.name || 'Sem título'),
                  type: 'audio',
                  genre: item.genre,
                  fileId: isLocal ? item.url : undefined,
                  externalUrl: !isLocal ? item.url : undefined,
                });
              }
            });
          });
        } catch (e) {
          console.error('Erro ao processar featuredPages para biblioteca:', e);
        }
      }

      // Incluir arquivos de áudio do IndexedDB que não estão nos destaques
      const meta = await listMediaFilesMeta();
      const audioMeta = meta.filter((m) => (m.type || '').startsWith('audio/'));
      const knownIds = new Set(items.map((i) => i.fileId).filter(Boolean) as string[]);
      audioMeta.forEach((m) => {
        if (!knownIds.has(m.id)) {
          items.push({
            id: m.id,
            title: (m.name || '').replace(/\.[^/.]+$/, '') || 'Sem título',
            type: 'audio',
            genre: undefined,
            fileId: m.id,
          });
        }
      });

      // Ordenar por gênero e data aproximada
      items.sort((a, b) => (a.genre || '').localeCompare(b.genre || ''));
      setLibraryItems(items);
    } catch (error) {
      console.error('Erro ao carregar biblioteca:', error);
    }
  };

  const handleOpenLibraryFromGenre = () => {
    setLibraryOpen(true);
  };

  const handlePlayLibraryItem = async (item: any) => {
    try {
      let url = item.externalUrl || '';
      if (item.fileId) {
        const blobUrl = await getMediaUrl(item.fileId);
        if (!blobUrl) {
          toast.error('Arquivo local não encontrado');
          return;
        }
        url = blobUrl;
      }
      setSelectedLibraryItem({ ...item, url, type: 'audio' });
    } catch (e) {
      console.error('Erro ao preparar reprodução da biblioteca:', e);
      toast.error('Falha ao abrir música da biblioteca');
    }
  };

  return (
    <section className="py-24 px-6 relative">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
          Área de Upload
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 text-center hover:border-primary/50 transition-all">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Imagens</h3>
            <p className="text-sm text-muted-foreground">Thumbnails para vídeos e músicas</p>
          </Card>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 text-center hover:border-primary/50 transition-all">
            <Music className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Áudio</h3>
            <p className="text-sm text-muted-foreground">Formatos MP3 e WAV</p>
          </Card>
          
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 text-center hover:border-primary/50 transition-all">
            <Video className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Vídeos</h3>
            <p className="text-sm text-muted-foreground">Clipes e performances</p>
          </Card>
        </div>
        
        <Card
          className={`p-12 bg-card/50 backdrop-blur-sm border-2 border-dashed transition-all ${
            dragActive ? "border-primary bg-primary/5" : "border-border/50"
          }`}
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
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <span>Selecionar Arquivos</span>
              </Button>
            </label>
            <p className="text-sm text-muted-foreground mt-4">
              Suporta: JPG, PNG, MP3, WAV, MP4
            </p>
          </div>
        </Card>

        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 mt-8">
          <h3 className="text-2xl font-semibold mb-6 text-foreground">Adicionar URL de Mídia</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="media-url" className="text-foreground">URL (YouTube, Spotify, SoundCloud, etc.)</Label>
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
              <Label htmlFor="media-title" className="text-foreground">Título da Música/Vídeo</Label>
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
              <Label className="text-foreground block mb-2">Gênero Musical</Label>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedGenre ? selectedGenre.label : "Selecione um gênero"}
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
                <Button variant="ghost" className="text-primary" onClick={handleOpenLibraryFromGenre}>
                  Ver músicas salvas
                </Button>
              </div>
              </div>
              
              <div>
                <Label className="text-foreground block mb-2">Destaque</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedFeatured ? selectedFeatured.label : "Selecione o destaque"}
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
                    <Button variant="outline" className="w-full justify-between">
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
              <Label htmlFor="media-type" className="text-foreground">Tipo de Mídia</Label>
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
                'Adicionar aos Destaques'
              )}
            </Button>
          </div>
        </Card>

        {/* Biblioteca de Músicas Salvas */}
        <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
          <DialogContent className="max-w-3xl bg-card/90 border-border/50">
            <DialogHeader>
              <DialogTitle>Biblioteca de Músicas Salvas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {selectedGenre ? `Filtrando por gênero: ${selectedGenre.label}` : 'Todos os gêneros'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {libraryItems
                  .filter((i) => !selectedGenre || i.genre === selectedGenre.value)
                  .map((item) => (
                    <Card key={item.id} className="p-3 bg-card/70 border-border/50 hover:border-primary/50 cursor-pointer" onClick={() => handlePlayLibraryItem(item)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-foreground font-medium truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.genre ? `Gênero: ${item.genre}` : 'Sem gênero'}</div>
                          <div className="text-xs text-muted-foreground">{item.fileId ? 'Local (IndexedDB)' : 'Externo'}</div>
                        </div>
                        <Button size="sm" className="bg-primary text-white">Reproduzir</Button>
                      </div>
                    </Card>
                  ))}
              </div>
              {libraryItems.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhuma música salva encontrada.</div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Player para item da biblioteca */}
        <Dialog open={!!selectedLibraryItem} onOpenChange={() => setSelectedLibraryItem(null)}>
          <DialogContent className="max-w-3xl bg-card/90 border-border/50">
            <DialogHeader>
              <DialogTitle>{selectedLibraryItem?.title}</DialogTitle>
            </DialogHeader>
            <div className="p-2">
              {selectedLibraryItem?.url && (
                <div className="aspect-video">
                  {/* Reutiliza o AudioVisualizer via FeaturedSection player simples */}
                  <div className="p-2">
                    <audio src={selectedLibraryItem.url} controls autoPlay className="w-full" />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
