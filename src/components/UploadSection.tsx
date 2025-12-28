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

  // Clean up old files on component mount
  useEffect(() => {
    // NOTA: Limpeza automática desativada para evitar perda de dados
    // O usuário pode limpar manualmente nas Configurações
    // cleanupOldFilesByAge(7);
    loadLibraryFromStorage();
    const onStorage = () => loadLibraryFromStorage();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Ao selecionar um gênero, abrir a biblioteca diretamente para facilitar
  useEffect(() => {
    if (selectedGenre) {
      // Abre a biblioteca se houver itens para o gênero selecionado
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
    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("audio/")
        ? "audio"
        : "video";

    setIsUploading(true);
    try {
      const fileId = await saveMediaFile(file);
      setMediaUrl(fileId);
      setMediaType(type);
      setMediaTitle(file.name.replace(/\.[^/.]+$/, ""));
      toast.success(`${file.name} carregado! Adicione aos destaques abaixo.`);
    } catch (error) {
      console.error("Erro ao carregar arquivo:", error);
      if (typeof error === "string") {
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

      const pageIndex =
        Number((selectedPage?.value || "pagina1").replace("pagina", "")) - 1;
      const slotIndex =
        Number(
          (selectedFeatured?.value || "destaque1").replace("destaque", ""),
        ) - 1;

      // Garantir que a página exista com 8 slots
      if (!pages[pageIndex]) {
        pages[pageIndex] = Array(8)
          .fill(null)
          .map((_, i) => ({
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
      const items: Array<{
        id: string;
        title: string;
        type: string;
        genre?: string;
        fileId?: string;
        externalUrl?: string;
        isMissing?: boolean;
      }> = [];

      // Obter lista de arquivos que realmente existem no IndexedDB
      const meta = await listMediaFilesMeta();
      const existingFileIds = new Set(meta.map((m) => m.id));

      if (stored) {
        try {
          const pages = JSON.parse(stored) as any[][];
          pages.forEach((page) => {
            (page || []).forEach((item) => {
              if (item && item.type === "audio" && item.url) {
                const isLocal =
                  typeof item.url === "string" && item.url.startsWith("file_");
                const isMissing = isLocal && !existingFileIds.has(item.url);
                items.push({
                  id: String(item.id || item.url),
                  title: String(item.title || item.name || "Sem título"),
                  type: "audio",
                  genre: item.genre,
                  fileId: isLocal ? item.url : undefined,
                  externalUrl: !isLocal ? item.url : undefined,
                  isMissing,
                });
              }
            });
          });
        } catch (e) {
          console.error("Erro ao processar featuredPages para biblioteca:", e);
        }
      }

      // Incluir arquivos de áudio do IndexedDB que não estão nos destaques
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

      // Ordenar por gênero e data aproximada
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
    // Se já sabemos que está faltando, mostrar mensagem útil
    if (item.isMissing) {
      toast.error(
        "Este arquivo foi removido. Faça upload novamente na Área de Upload.",
        { duration: 5000 }
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
            { duration: 5000 }
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

  return (
    <section className="py-24 px-6 relative" data-oid="qgl35o-">
      <div className="container mx-auto max-w-6xl" data-oid="7_gzt6k">
        <h2
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary"
          data-oid="z44-rv6"
        >
          Área de Upload
        </h2>

        <Card
          className={`p-12 bg-card/50 backdrop-blur-sm border-2 border-dashed transition-all ${dragActive ? "border-primary bg-primary/5" : "border-border/50"
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          data-oid="xeh2ddw"
        >
          <div className="text-center" data-oid="x-nn9bt">
            <Upload
              className="w-16 h-16 mx-auto mb-6 text-primary"
              data-oid="::k-9m_"
            />

            <h3
              className="text-2xl font-semibold mb-4 text-foreground"
              data-oid="5u1q23s"
            >
              Arraste arquivos aqui
            </h3>
            <p className="text-muted-foreground mb-6" data-oid="rh3db6o">
              ou clique para selecionar do seu computador
            </p>
            <Input
              type="file"
              accept="image/*,audio/*,video/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              data-oid="kqv8fax"
            />

            <label htmlFor="file-upload" data-oid="ue095kn">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
                data-oid="dl9u_ri"
              >
                <span data-oid="p5u-324">Selecionar Arquivos</span>
              </Button>
            </label>
            <p
              className="text-sm text-muted-foreground mt-4"
              data-oid="n97wo8l"
            >
              Suporta: JPG, PNG, MP3, WAV, MP4
            </p>
          </div>
        </Card>

        <Card
          className="p-8 bg-card/50 backdrop-blur-sm border-border/50 mt-8"
          data-oid="wbdiaxk"
        >
          <h3
            className="text-2xl font-semibold mb-6 text-foreground"
            data-oid="tactzpx"
          >
            Adicionar URL de Mídia
          </h3>
          <div className="space-y-4" data-oid="hj1vf4h">
            <div data-oid="_k2-fxy">
              <Label
                htmlFor="media-url"
                className="text-foreground"
                data-oid="56885nz"
              >
                URL (YouTube, Spotify, SoundCloud, etc.)
              </Label>
              <div className="flex gap-2 mt-2" data-oid="..k8_a_">
                <LinkIcon
                  className="w-5 h-5 text-muted-foreground mt-2.5"
                  data-oid="id6otv1"
                />

                <Input
                  id="media-url"
                  placeholder="https://youtube.com/watch?v=... ou https://soundcloud.com/..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="flex-1"
                  data-oid="-g-lr-k"
                />
              </div>
            </div>
            <div data-oid="vhg434_">
              <Label
                htmlFor="media-title"
                className="text-foreground"
                data-oid="chs6hbs"
              >
                Título da Música/Vídeo
              </Label>
              <Input
                id="media-title"
                placeholder="Nome da faixa"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                className="mt-2"
                data-oid="-96g9ha"
              />
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              data-oid="v.0q2p."
            >
              <div data-oid="h.jd:z:">
                <Label
                  className="text-foreground block mb-2"
                  data-oid="yg96745"
                >
                  Gênero Musical
                </Label>
                <div className="flex gap-2" data-oid="tharh8.">
                  <DropdownMenu data-oid="5hwnrse">
                    <DropdownMenuTrigger asChild data-oid="qxs1qbv">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        data-oid="914pzl_"
                      >
                        {selectedGenre
                          ? selectedGenre.label
                          : "Selecione um gênero"}
                        <ChevronDown
                          className="ml-2 h-4 w-4"
                          data-oid="5a_v38-"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-[200px]"
                      data-oid="canozwk"
                    >
                      {genreOptions.map((genre) => (
                        <DropdownMenuItem
                          key={genre.value}
                          onClick={() => setSelectedGenre(genre)}
                          className="cursor-pointer"
                          data-oid="bhuojna"
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
                    data-oid=":h9_co2"
                  >
                    Ver músicas salvas
                  </Button>
                </div>
              </div>

              <div data-oid="66ooqwv">
                <Label
                  className="text-foreground block mb-2"
                  data-oid="b5ayn:i"
                >
                  Destaque
                </Label>
                <DropdownMenu data-oid=".fblu.8">
                  <DropdownMenuTrigger asChild data-oid="fq9xh:g">
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      data-oid="fuv9dma"
                    >
                      {selectedFeatured
                        ? selectedFeatured.label
                        : "Selecione o destaque"}
                      <ChevronDown
                        className="ml-2 h-4 w-4"
                        data-oid="v:51bmm"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px]" data-oid="uf:zbtb">
                    {featuredOptions.map((featured) => (
                      <DropdownMenuItem
                        key={featured.value}
                        onClick={() => setSelectedFeatured(featured)}
                        className="cursor-pointer"
                        data-oid="wj82h8k"
                      >
                        {featured.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div data-oid="jzovf-f">
                <Label
                  className="text-foreground block mb-2"
                  data-oid=".7d.p.j"
                >
                  Página
                </Label>
                <DropdownMenu data-oid="z6yaayp">
                  <DropdownMenuTrigger asChild data-oid="2hteiox">
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      data-oid=":-3gwlk"
                    >
                      {selectedPage ? selectedPage.label : "Selecione a página"}
                      <ChevronDown
                        className="ml-2 h-4 w-4"
                        data-oid="q9-qs_7"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px]" data-oid="6g3:jh4">
                    {pageOptions.map((page) => (
                      <DropdownMenuItem
                        key={page.value}
                        onClick={() => setSelectedPage(page)}
                        className="cursor-pointer"
                        data-oid="rvup2w0"
                      >
                        {page.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div data-oid="3z7dw2m">
              <Label
                htmlFor="media-type"
                className="text-foreground"
                data-oid="l95qy4r"
              >
                Tipo de Mídia
              </Label>
              <select
                id="media-type"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2 text-foreground"
                data-oid="1wrst_c"
              >
                <option value="video" data-oid="01_dcus">
                  Vídeo
                </option>
                <option value="audio" data-oid="4.8dp3:">
                  Áudio
                </option>
                <option value="image" data-oid="hujwbf:">
                  Imagem
                </option>
              </select>
            </div>
            <Button
              onClick={handleAddToFeatured}
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-white"
              disabled={isUploading}
              data-oid="vn0bh:h"
            >
              {isUploading ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-oid="3md0iw3"
                  />
                  Processando...
                </>
              ) : (
                "Adicionar aos Destaques"
              )}
            </Button>
          </div>
        </Card>

        {/* Biblioteca de Músicas Salvas */}
        <Dialog
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          data-oid="gkplhco"
        >
          <DialogContent
            className="max-w-3xl bg-card/90 border-border/50"
            data-oid="wbsaqt:"
          >
            <DialogHeader data-oid="w71nmze">
              <DialogTitle data-oid="q9ph:hv">
                Biblioteca de Músicas Salvas
              </DialogTitle>
              <DialogDescription data-oid="bo6rhor">
                Selecione uma música para reproduzir ou filtre por gênero.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4" data-oid="_wid5jl">
              <div className="text-sm text-muted-foreground" data-oid="vr.x3qq">
                {selectedGenre
                  ? `Filtrando por gênero: ${selectedGenre.label}`
                  : "Todos os gêneros"}
              </div>
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
                data-oid="vs48ko4"
              >
                {libraryItems
                  .filter(
                    (i) => !selectedGenre || i.genre === selectedGenre.value,
                  )
                  .map((item) => (
                    <Card
                      key={item.id}
                      className={`p-3 border-border/50 cursor-pointer ${item.isMissing
                          ? "bg-destructive/10 border-destructive/30 hover:border-destructive/50"
                          : "bg-card/70 hover:border-primary/50"
                        }`}
                      onClick={() => handlePlayLibraryItem(item)}
                      data-oid="89a2e.2"
                    >
                      <div
                        className="flex items-center justify-between"
                        data-oid="lynp-v-"
                      >
                        <div data-oid="948qxdy">
                          <div
                            className={`font-medium truncate flex items-center gap-2 ${item.isMissing ? "text-destructive" : "text-foreground"
                              }`}
                            data-oid="4-qt5.t"
                          >
                            {item.isMissing && <AlertTriangle className="w-4 h-4" />}
                            {item.title}
                          </div>
                          <div
                            className="text-xs text-muted-foreground"
                            data-oid="j8t1.yr"
                          >
                            {item.genre
                              ? `Gênero: ${item.genre}`
                              : "Sem gênero"}
                          </div>
                          <div
                            className={`text-xs ${item.isMissing ? "text-destructive" : "text-muted-foreground"
                              }`}
                            data-oid="hgf6j9l"
                          >
                            {item.isMissing
                              ? "⚠️ Arquivo não encontrado - faça upload novamente"
                              : item.fileId ? "Local (IndexedDB)" : "Externo"}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className={item.isMissing
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary text-white"}
                          data-oid="7qyrcnx"
                        >
                          {item.isMissing ? "Indisponível" : "Reproduzir"}
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
              {libraryItems.length === 0 && (
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="fw2:k8w"
                >
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
          data-oid="-4c8ae4"
        >
          <DialogContent
            className="max-w-3xl bg-card/90 border-border/50"
            data-oid="xyyrz1:"
          >
            <DialogHeader data-oid="vg5ay.4">
              <DialogTitle data-oid="u1qidl9">
                {selectedLibraryItem?.title}
              </DialogTitle>
              <DialogDescription data-oid="x1ceqpe">
                Clique na forma de onda para reproduzir ou pausar.
              </DialogDescription>
            </DialogHeader>
            <div className="p-2" data-oid="4rv8oj6">
              {selectedLibraryItem?.url && (
                <div className="aspect-video" data-oid="-y--7nk">
                  <div className="p-2" data-oid="trevy3w">
                    <AudioVisualizer
                      url={selectedLibraryItem.url}
                      autoPlay
                      waveformStyle="animatedBars"
                      data-oid="nn3ucrr"
                    />
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
