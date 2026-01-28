import { useState, useEffect } from "react";
import {
  Upload,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Link as LinkIcon,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudioVisualizer } from "./AudioVisualizer";
import { useAuth } from "@/contexts/AuthContext";
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
  const [mediaType, setMediaType] = useState<"image" | "audio" | "video">("video");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<{ value: string; label: string } | null>(null);
  const [selectedFeatured, setSelectedFeatured] = useState<{ value: string; label: string } | null>(null);
  const [selectedPage, setSelectedPage] = useState<{ value: string; label: string } | null>(null);

  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<any>(null);

  useEffect(() => {
    if (user) loadLibrary();
  }, [user]);

  const handleFiles = async (files: FileList | File[]) => {
    if (!user) return toast.error("Você precisa estar logado.");
    if (isBlocked) return toast.error("Conta bloqueada.");

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (!isAdmin && file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} excede 10MB.`);
        failCount++;
        continue;
      }

      try {
        const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "video";
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Storage
        const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
        if (uploadError) throw uploadError;

        // Insert to DB
        const { data: record, error: dbError } = await supabase.from("media_files").insert({
          file_path: filePath,
          title: file.name.replace(/\.[^/.]+$/, ""), // Default title from filename
          uploaded_by: user.id,
          type,
          genre: selectedGenre?.value || null // Apply selected genre to all if chosen
        }).select().single();

        if (dbError) throw dbError;

        // Update local state for the *last* uploaded file (for immediate editing)
        const publicUrl = getSupabaseUrl('media', filePath);
        setMediaUrl(publicUrl);
        setMediaType(type);
        setMediaTitle(record.title);
        setCurrentFileId(record.id);
        successCount++;

      } catch (error: any) {
        console.error(error);
        toast.error(`Erro em ${file.name}: ${error.message}`);
        failCount++;
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) carregado(s)!`);
      loadLibrary();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
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
      setThumbnailUrl(getSupabaseUrl('media', filePath));
      toast.success("Capa carregada!");
    } catch (e) {
      toast.error("Erro na capa.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddToFeatured = async () => {
    if (!isAdmin) return toast.error("Administrador requerido.");
    if (!mediaUrl || !mediaTitle) return toast.error("Adicione URL e Título.");
    if (!selectedFeatured || !selectedPage) return toast.error("Selecione Destaque e Página.");

    setIsUploading(true);
    try {
      const pageIndex = Number((selectedPage?.value || "pagina1").replace("pagina", "")) - 1;
      const slotIndex = Number((selectedFeatured?.value || "destaque1").replace("destaque", "")) - 1;
      const { error } = await supabase.from('featured_slots').upsert({
        page_index: pageIndex,
        slot_index: slotIndex,
        custom_title: mediaTitle.trim(),
        external_url: mediaUrl.trim(),
        type: mediaType,
        thumbnail_url: thumbnailUrl || null,
        media_file_id: currentFileId || null
      }, { onConflict: 'page_index, slot_index' });
      if (error) throw error;
      toast.success("Destaque atualizado!");
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const loadLibrary = async () => {
    try {
      const { data, error } = await supabase.from('media_files').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setLibraryItems(data.map(m => ({
          id: m.id, title: m.title, type: m.type, genre: m.genre,
          externalUrl: getSupabaseUrl('media', m.file_path)
        })));
      }
    } catch (error) {
      console.error("Erro library:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-5xl font-black bg-gradient-to-b from-golden via-amber-200 to-golden bg-clip-text text-transparent uppercase tracking-tighter">
          Área de Gerenciamento
        </h2>
        <div className="w-24 h-1 bg-golden mx-auto rounded-full opacity-50"></div>
        <p className="text-muted-foreground/60 text-lg font-medium">
          Central de Upload e Configuração de Lançamentos
        </p>
      </div>

      {!user ? (
        <Card className="p-12 bg-destructive/5 border-destructive/20 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-destructive mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">Faça login para gerenciar conteúdos.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Drag & Drop Section */}
          <Card
            className={`p-12 bg-card/50 backdrop-blur-sm border-2 border-dashed transition-all cursor-pointer ${dragActive ? "border-golden bg-golden/5" : "border-golden/20 hover:border-golden/40"}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-6 text-golden" />
              <h3 className="text-2xl font-black text-golden uppercase tracking-tighter mb-2">Subir Nova Mídia (Arrastar múltiplos)</h3>
              <p className="text-muted-foreground text-sm">Arraste ou clique para selecionar (MP3, MP4, JPG, PNG)</p>
              <Input type="file" id="file-upload" className="hidden" multiple onChange={handleFileInput} />
            </div>
          </Card>

          {/* Form Section */}
          <Card className="p-10 bg-deep-black/60 backdrop-blur-xl border-golden/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-golden/50 to-transparent"></div>
            <h3 className="text-3xl font-black mb-8 text-golden uppercase tracking-tighter flex items-center gap-3">
              <Upload className="w-6 h-6" /> Detalhes do Lançamento
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-golden font-bold uppercase text-[10px]">Título</Label>
                  <Input value={mediaTitle} onChange={(e) => setMediaTitle(e.target.value)} placeholder="Nome da faixa/vídeo" className="bg-black/50 border-golden/10 h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-golden font-bold uppercase text-[10px]">Gênero (Opcional)</Label>
                  <Select value={selectedGenre?.value} onValueChange={(v) => setSelectedGenre(genreOptions.find(g => g.value === v) || null)}>
                    <SelectTrigger className="bg-black/50 border-golden/10 h-12"><SelectValue placeholder="Selecione o Gênero" /></SelectTrigger>
                    <SelectContent className="bg-deep-black border-golden/20">
                      {genreOptions.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-golden font-bold uppercase text-[10px]">URL de Mídia (Externo ou Upload)</Label>
                <div className="flex gap-2">
                  <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Link do YouTube/Spotify ou URL de Upload" className="bg-black/50 border-golden/10 h-12" />
                  <Button variant="outline" className="h-12 border-golden/20 text-golden" onClick={() => setLibraryOpen(true)}>Biblioteca</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-golden font-bold uppercase text-[10px]">Slot de Destaque</Label>
                  <Select value={selectedFeatured?.value} onValueChange={(v) => setSelectedFeatured(featuredOptions.find(f => f.value === v) || null)}>
                    <SelectTrigger className="bg-black/50 border-golden/10 h-12"><SelectValue placeholder="Slot" /></SelectTrigger>
                    <SelectContent className="bg-deep-black border-golden/20">
                      {featuredOptions.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-golden font-bold uppercase text-[10px]">Página</Label>
                  <Select value={selectedPage?.value} onValueChange={(v) => setSelectedPage(pageOptions.find(p => p.value === v) || null)}>
                    <SelectTrigger className="bg-black/50 border-golden/10 h-12"><SelectValue placeholder="Página" /></SelectTrigger>
                    <SelectContent className="bg-deep-black border-golden/20">
                      {pageOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-golden font-bold uppercase text-[10px]">Tipo</Label>
                  <Select value={mediaType} onValueChange={(v: any) => setMediaType(v)}>
                    <SelectTrigger className="bg-black/50 border-golden/10 h-12"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-deep-black border-golden/20">
                      <SelectItem value="video">VÍDEO</SelectItem>
                      <SelectItem value="audio">ÁUDIO</SelectItem>
                      <SelectItem value="image">IMAGEM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleAddToFeatured} disabled={isUploading} className="w-full bg-golden text-black hover:bg-amber-400 font-black h-14 rounded-xl shadow-lg shadow-golden/10 transition-all hover:scale-[1.01]">
                {isUploading ? <Loader2 className="animate-spin mr-2" /> : "PUBLICAR NOS DESTAQUES"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Library Dialog */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-4xl bg-deep-black border-golden/20 text-white">
          <DialogHeader><DialogTitle className="text-golden font-black uppercase tracking-tighter text-2xl">Minha Biblioteca Supabase</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
            {libraryItems.map(item => (
              <Card key={item.id} className="bg-black/40 border-golden/10 p-4 hover:border-golden/40 transition-colors group cursor-pointer" onClick={() => { setMediaUrl(item.externalUrl); setMediaTitle(item.title); setMediaType(item.type); setCurrentFileId(item.id); setLibraryOpen(false); }}>
                <div className="flex items-center gap-3">
                  <div className="bg-golden/10 p-2 rounded-lg group-hover:bg-golden/20 transition-colors"><Upload className="w-4 h-4 text-golden" /></div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-sm truncate">{item.title}</p>
                    <p className="text-[10px] text-golden/60 uppercase">{item.type} | {item.genre || "Sem Gênero"}</p>
                  </div>
                </div>
              </Card>
            ))}
            {libraryItems.length === 0 && <p className="col-span-full text-center py-10 text-muted-foreground">Nenhuma mídia encontrada no Storage.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
