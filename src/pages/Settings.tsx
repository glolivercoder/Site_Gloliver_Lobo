import { Header } from "@/components/Header";
import { UploadSection } from "@/components/UploadSection";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Instagram,
  Music,
  Youtube,
  Radio,
  Upload,
  Image as ImageIcon,
  HardDrive,
  Trash2,
} from "lucide-react";
import { getStorageInfo, cleanupOldFilesByAge } from "@/utils/storage";

// Storage Management Component
const StorageManagement = () => {
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, fileCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const loadStorageInfo = async () => {
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleCleanup = async (days: number) => {
    setIsLoading(true);
    try {
      await cleanupOldFilesByAge(days);
      await loadStorageInfo();
      toast.success(`Arquivos com mais de ${days} dias foram removidos.`);
    } catch (error) {
      toast.error("Erro ao limpar arquivos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-golden flex items-center gap-2">
          <HardDrive className="w-6 h-6" />
          Gerenciamento de Armazenamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-background/30 rounded-lg border border-golden/10">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Espaço utilizado</p>
            <p className="text-2xl font-bold text-golden">
              {formatBytes(storageInfo.totalSize)}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Arquivos salvos</p>
            <p className="text-2xl font-bold text-foreground">
              {storageInfo.fileCount}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Limpar arquivos antigos</Label>
          <p className="text-sm text-muted-foreground">
            Remove músicas e mídias que não são usadas há algum tempo.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => handleCleanup(30)}
              disabled={isLoading}
              className="border-golden/20 hover:bg-golden/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Mais de 30 dias
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCleanup(14)}
              disabled={isLoading}
              className="border-golden/20 hover:bg-golden/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Mais de 14 dias
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCleanup(7)}
              disabled={isLoading}
              className="border-golden/20 hover:bg-golden/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Mais de 7 dias
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          💡 Os arquivos de mídia são armazenados localmente no seu navegador
          (IndexedDB). As configurações e links de destaques permanecem salvos
          até você limpá-los manualmente.
        </p>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [allPages, setAllPages] = useState<any[][]>([
    Array(8)
      .fill(null)
      .map((_, i) => ({
        id: i + 1,
        title: `Destaque ${i + 1}`,
        url: "",
        type: "video",
      })),
  ]);

  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    tiktok: "",
    youtube: "",
    spotify: "",
    youtubeMusic: "",
    amazonMusic: "",
    whatsapp: "",
  });

  const [audioSettings, setAudioSettings] = useState({
    waveformStyle: "bars",
    height: 128,
    barWidth: 3,
    barGap: 2,
    barRadius: 3,
    cursorWidth: 2,
    waveColor: "hsl(40 20% 30%)",
    progressColor: "hsl(40 90% 55%)",
    cursorColor: "hsl(0 0% 98%)",
    enableSpectrogram: false,
    spectrogramFftSamples: 256,
    liveAnalyzerFftSize: 256,
    liveAnalyzerSmoothing: 0.8,
    liveBarColor: "hsl(var(--golden))",
    liveHeight: 128,
    liveBarWidth: 2,
  });

  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedPages = localStorage.getItem("featuredPages");
    if (storedPages) {
      try {
        setAllPages(JSON.parse(storedPages));
      } catch (e) {
        console.error("Error loading featured pages:", e);
      }
    }

    const storedSocial = localStorage.getItem("socialLinks");
    const envWhatsapp = import.meta.env.VITE_WHATSAPP_URL || "";
    if (storedSocial) {
      try {
        const parsed = JSON.parse(storedSocial);
        setSocialLinks({
          instagram: parsed.instagram || "",
          tiktok: parsed.tiktok || "",
          youtube: parsed.youtube || "",
          spotify: parsed.spotify || "",
          youtubeMusic: parsed.youtubeMusic || "",
          amazonMusic: parsed.amazonMusic || "",
          whatsapp: parsed.whatsapp ?? envWhatsapp,
        });
      } catch (e) {
        console.error("Error loading social links:", e);
        setSocialLinks((prev) => ({ ...prev, whatsapp: envWhatsapp }));
      }
    } else {
      // Sem dados salvos: inicializa WhatsApp com valor de ambiente
      setSocialLinks((prev) => ({ ...prev, whatsapp: envWhatsapp }));
    }

    const storedAudioSettings = localStorage.getItem("audioSettings");
    if (storedAudioSettings) {
      try {
        setAudioSettings(JSON.parse(storedAudioSettings));
      } catch (e) {
        console.error("Error loading audio settings:", e);
      }
    }
  }, []);

  const handleFeaturedChange = (
    pageIndex: number,
    itemIndex: number,
    field: string,
    value: string,
  ) => {
    const updated = [...allPages];
    updated[pageIndex] = [...updated[pageIndex]];
    updated[pageIndex][itemIndex] = {
      ...updated[pageIndex][itemIndex],
      [field]: value,
    };
    setAllPages(updated);
  };

  const saveFeatured = () => {
    localStorage.setItem("featuredPages", JSON.stringify(allPages));
    window.dispatchEvent(new Event("storage"));
    toast.success("Destaques salvos com sucesso!");
  };

  const addNewPage = () => {
    const newPage = Array(8)
      .fill(null)
      .map((_, i) => ({
        id: allPages.length * 8 + i + 1,
        title: `Destaque ${allPages.length * 8 + i + 1}`,
        url: "",
        type: "video",
      }));
    setAllPages([...allPages, newPage]);
    setCurrentPage(allPages.length);
    toast.success("Nova página adicionada!");
  };

  const removePage = (pageIndex: number) => {
    if (allPages.length === 1) {
      toast.error("Não é possível remover a última página!");
      return;
    }
    const updated = allPages.filter((_, i) => i !== pageIndex);
    setAllPages(updated);
    setCurrentPage(Math.max(0, currentPage - 1));
    localStorage.setItem("featuredPages", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    toast.success("Página removida!");
  };

  const handleSocialChange = (platform: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const saveSocial = () => {
    localStorage.setItem("socialLinks", JSON.stringify(socialLinks));
    toast.success("Links das redes sociais atualizados com sucesso!");
  };

  const handleThumbnailUpload = (
    pageIndex: number,
    itemIndex: number,
    file: File,
  ) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleFeaturedChange(pageIndex, itemIndex, "thumbnail", base64String);
      toast.success("Imagem do thumbnail carregada!");
    };
    reader.onerror = () => {
      toast.error("Erro ao carregar imagem.");
    };
    reader.readAsDataURL(file);
  };

  const saveAudioSettings = () => {
    localStorage.setItem("audioSettings", JSON.stringify(audioSettings));
    window.dispatchEvent(new Event("storage"));
    toast.success("Configurações de áudio salvas!");
  };

  return (
    <div className="min-h-screen bg-background" data-oid=".qxrbfp">
      <Header data-oid="w625vxi" />
      <div className="pt-20 px-4 md:px-8 pb-16" data-oid="k.0:glh">
        <div className="max-w-7xl mx-auto space-y-8" data-oid="r3mszi:">
          <h1
            className="text-4xl font-bold text-golden mb-8"
            data-oid="qjwbxwf"
          >
            Configurações
          </h1>

          {/* Featured Section Editor */}
          <Card
            className="bg-deep-black/50 border-golden/20 backdrop-blur-sm"
            data-oid="1j4-4xe"
          >
            <CardHeader data-oid="1274t8i">
              <CardTitle className="text-2xl text-golden" data-oid="76yaomv">
                Editar Destaques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="7bs.fxb">
              <div className="flex gap-2 mb-4" data-oid="gio881t">
                <Button
                  onClick={addNewPage}
                  className="bg-golden text-deep-black hover:bg-golden/90"
                  data-oid="3-q71c:"
                >
                  Adicionar Página
                </Button>
                {allPages.length > 1 && (
                  <Button
                    onClick={() => removePage(currentPage)}
                    variant="destructive"
                    data-oid="x_.brmr"
                  >
                    Remover Página Atual
                  </Button>
                )}
              </div>

              <div
                className="flex gap-2 mb-4 overflow-x-auto pb-2"
                data-oid="q-cr443"
              >
                {allPages.map((_, index) => (
                  <Button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    variant={currentPage === index ? "default" : "outline"}
                    className={
                      currentPage === index
                        ? "bg-golden text-deep-black hover:bg-golden/90"
                        : ""
                    }
                    data-oid="j8291g8"
                  >
                    Página {index + 1}
                  </Button>
                ))}
              </div>

              <div className="space-y-4" data-oid="onl:ep1">
                {allPages[currentPage]?.map((item, index) => (
                  <div
                    key={item.id}
                    className="space-y-2 p-4 border border-golden/20 rounded-lg"
                    data-oid="d:65if9"
                  >
                    <Label
                      className="text-sm font-medium text-golden"
                      data-oid="gftjm8u"
                    >
                      Destaque {index + 1}
                    </Label>
                    <Input
                      placeholder="Título"
                      value={item.title}
                      onChange={(e) =>
                        handleFeaturedChange(
                          currentPage,
                          index,
                          "title",
                          e.target.value,
                        )
                      }
                      className="mb-2 bg-background/50 border-golden/20 focus:border-golden"
                      data-oid="lvds0t7"
                    />

                    <Input
                      placeholder="URL da mídia (YouTube, Spotify, etc.)"
                      value={item.url}
                      onChange={(e) =>
                        handleFeaturedChange(
                          currentPage,
                          index,
                          "url",
                          e.target.value,
                        )
                      }
                      className="mb-2 bg-background/50 border-golden/20 focus:border-golden"
                      data-oid="zge6bpj"
                    />

                    <select
                      value={item.type}
                      onChange={(e) =>
                        handleFeaturedChange(
                          currentPage,
                          index,
                          "type",
                          e.target.value,
                        )
                      }
                      className="flex h-10 w-full rounded-md border border-golden/20 bg-background/50 px-3 py-2 text-sm text-foreground focus:border-golden"
                      data-oid="n2p8c.b"
                    >
                      <option value="video" data-oid="f1c3_-c">
                        Vídeo
                      </option>
                      <option value="audio" data-oid="1eok0f2">
                        Áudio
                      </option>
                      <option value="image" data-oid="x1j42q:">
                        Imagem
                      </option>
                    </select>

                    <div className="mt-2 space-y-2" data-oid="bqn914h">
                      <Label
                        className="text-xs text-muted-foreground"
                        data-oid="wby:.vv"
                      >
                        Imagem Thumbnail
                      </Label>
                      <div className="flex gap-2" data-oid="errfqgp">
                        <Input
                          placeholder="URL da imagem thumbnail"
                          value={item.thumbnail || ""}
                          onChange={(e) =>
                            handleFeaturedChange(
                              currentPage,
                              index,
                              "thumbnail",
                              e.target.value,
                            )
                          }
                          className="flex-1 bg-background/50 border-golden/20 focus:border-golden"
                          data-oid="p_kh0x_"
                        />

                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement)
                                .files?.[0];
                              if (file)
                                handleThumbnailUpload(currentPage, index, file);
                            };
                            input.click();
                          }}
                          className="border-golden/20 hover:bg-golden/10"
                          data-oid="ji242qj"
                        >
                          <Upload className="w-4 h-4" data-oid="pnd8atk" />
                        </Button>
                      </div>
                      {item.thumbnail && (
                        <div
                          className="relative w-20 h-20 rounded border border-golden/20 overflow-hidden"
                          data-oid="16o5s4f"
                        >
                          <img
                            src={item.thumbnail}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                            data-oid="l638dp4"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={saveFeatured}
                className="w-full md:w-auto bg-golden text-deep-black hover:bg-golden/90"
                data-oid="ni5czla"
              >
                Salvar Destaques
              </Button>
            </CardContent>
          </Card>

          {/* Audio Visualizer Settings */}
          <Card
            className="bg-deep-black/50 border-golden/20 backdrop-blur-sm"
            data-oid="wbffq7r"
          >
            <CardHeader data-oid="_f-g:5k">
              <CardTitle className="text-2xl text-golden" data-oid="46nvzkg">
                Configurações do Visualizador de Áudio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="_4qr7g6">
              <div className="space-y-2" data-oid="_ucfxx9">
                <Label
                  htmlFor="waveformStyle"
                  className="text-foreground"
                  data-oid="tbxn6dv"
                >
                  Estilo do Waveform
                </Label>
                <Select
                  value={audioSettings.waveformStyle}
                  onValueChange={(value) =>
                    setAudioSettings({ ...audioSettings, waveformStyle: value })
                  }
                  data-oid="elqpa_3"
                >
                  <SelectTrigger
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="vq1js7_"
                  >
                    <SelectValue
                      placeholder="Selecione o estilo"
                      data-oid=":tr15kf"
                    />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-popover border-golden/20"
                    data-oid="fh_nnoh"
                  >
                    <SelectItem value="bars" data-oid="b-gjd1n">
                      Barras (Padrão)
                    </SelectItem>
                    <SelectItem value="wave" data-oid="klcurk0">
                      Onda Contínua
                    </SelectItem>
                    <SelectItem value="mirror" data-oid="l0__yq9">
                      Espelho
                    </SelectItem>
                    <SelectItem value="animatedBars" data-oid="3hnnoyb">
                      Barras Animadas (Ao Vivo)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                data-oid="25t64:c"
              >
                <div className="space-y-2" data-oid="mti3opw">
                  <Label className="text-foreground" data-oid="4cmo49y">
                    Altura (px)
                  </Label>
                  <Input
                    type="number"
                    value={audioSettings.height}
                    onChange={(e) =>
                      setAudioSettings({
                        ...audioSettings,
                        height: Number(e.target.value || 0),
                      })
                    }
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="xy.f54y"
                  />
                </div>
                <div className="space-y-2" data-oid="qf.w.kq">
                  <Label className="text-foreground" data-oid="bz9ub7w">
                    Largura da Barra
                  </Label>
                  <Input
                    type="number"
                    value={audioSettings.barWidth}
                    onChange={(e) =>
                      setAudioSettings({
                        ...audioSettings,
                        barWidth: Number(e.target.value || 0),
                      })
                    }
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="aeihu8r"
                  />
                </div>
                <div className="space-y-2" data-oid="xs7xpqz">
                  <Label className="text-foreground" data-oid="fv.hger">
                    Espaço da Barra
                  </Label>
                  <Input
                    type="number"
                    value={audioSettings.barGap}
                    onChange={(e) =>
                      setAudioSettings({
                        ...audioSettings,
                        barGap: Number(e.target.value || 0),
                      })
                    }
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="v8vgxr3"
                  />
                </div>
                <div className="space-y-2" data-oid="ig6wv3_">
                  <Label className="text-foreground" data-oid="ibcf69f">
                    Raio da Barra
                  </Label>
                  <Input
                    type="number"
                    value={audioSettings.barRadius}
                    onChange={(e) =>
                      setAudioSettings({
                        ...audioSettings,
                        barRadius: Number(e.target.value || 0),
                      })
                    }
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="rku0syf"
                  />
                </div>
                <div className="space-y-2" data-oid="yx.fgnn">
                  <Label className="text-foreground" data-oid="n:9qy.7">
                    Cursor (px)
                  </Label>
                  <Input
                    type="number"
                    value={audioSettings.cursorWidth}
                    onChange={(e) =>
                      setAudioSettings({
                        ...audioSettings,
                        cursorWidth: Number(e.target.value || 0),
                      })
                    }
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="1rldqnp"
                  />
                </div>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                data-oid="ulg2yxn"
              >
                <div className="space-y-2" data-oid=".sdrqcy">
                  <Label className="text-foreground" data-oid="r9jr-xp">
                    Cor da Onda
                  </Label>
                  <Input
                    value={audioSettings.waveColor}
                    onChange={(e) =>
                      setAudioSettings({
                        ...audioSettings,
                        waveColor: e.target.value,
                      })
                    }
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="eu8y:2n"
                  />
                </div>
                <div className="space-y-2" data-oid="p8ks4wn">
                  <Label className="text-foreground" data-oid="b.a.v27">
                    Cor do Progresso
                  </Label>
                  <Input
                    value={audioSettings.progressColor}
                    onChange={(e) =>
                      setAudioSettings({
                        ...audioSettings,
                        progressColor: e.target.value,
                      })
                    }
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="-b4rje."
                  />
                </div>
                <div className="space-y-2" data-oid=".34c3n_">
                  <Label className="text-foreground" data-oid="71:pq6i">
                    Cor do Cursor
                  </Label>
                  <Input
                    value={audioSettings.cursorColor}
                    onChange={(e) =>
                      setAudioSettings({
                        ...audioSettings,
                        cursorColor: e.target.value,
                      })
                    }
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="-07r_3g"
                  />
                </div>
              </div>

              <div className="space-y-2" data-oid="1.px0qq">
                <Label className="text-foreground" data-oid="f3tw2af">
                  Espectrograma
                </Label>
                <div className="flex items-center gap-3" data-oid="atr-1i1">
                  <input
                    type="checkbox"
                    checked={audioSettings.enableSpectrogram}
                    onChange={(e) =>
                      setAudioSettings({
                        ...audioSettings,
                        enableSpectrogram: e.target.checked,
                      })
                    }
                    data-oid="ko..jg:"
                  />

                  <span
                    className="text-sm text-muted-foreground"
                    data-oid="h730_qv"
                  >
                    Ativar espectrograma (WaveSurfer)
                  </span>
                </div>
                <div className="mt-2" data-oid="4va.71g">
                  <Label className="text-foreground" data-oid="kjasmej">
                    FFT Samples
                  </Label>
                  <Select
                    value={String(audioSettings.spectrogramFftSamples)}
                    onValueChange={(value) =>
                      setAudioSettings({
                        ...audioSettings,
                        spectrogramFftSamples: Number(value),
                      })
                    }
                    data-oid="svz2a0j"
                  >
                    <SelectTrigger
                      className="bg-background/50 border-golden/20 focus:border-golden"
                      data-oid="57qamhs"
                    >
                      <SelectValue placeholder="FFT" data-oid=":zqr_9z" />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-popover border-golden/20"
                      data-oid="hypa8yh"
                    >
                      <SelectItem value="128" data-oid="g1xk.y.">
                        128
                      </SelectItem>
                      <SelectItem value="256" data-oid="b6ski6n">
                        256
                      </SelectItem>
                      <SelectItem value="512" data-oid="lo67:wh">
                        512
                      </SelectItem>
                      <SelectItem value="1024" data-oid="z5tvne3">
                        1024
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2" data-oid="-07mqmm">
                <Label className="text-foreground" data-oid="ws0t.5e">
                  Visualizador ao vivo
                </Label>
                <div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  data-oid=":p9hqix"
                >
                  <div className="space-y-2" data-oid="sqnyr:x">
                    <Label className="text-foreground" data-oid="tda1fbn">
                      FFT Size
                    </Label>
                    <Select
                      value={String(audioSettings.liveAnalyzerFftSize)}
                      onValueChange={(value) =>
                        setAudioSettings({
                          ...audioSettings,
                          liveAnalyzerFftSize: Number(value),
                        })
                      }
                      data-oid="h0xqxdp"
                    >
                      <SelectTrigger
                        className="bg-background/50 border-golden/20 focus:border-golden"
                        data-oid="a8kp9is"
                      >
                        <SelectValue placeholder="FFT" data-oid="rt_8bbs" />
                      </SelectTrigger>
                      <SelectContent
                        className="bg-popover border-golden/20"
                        data-oid="g5pqz2o"
                      >
                        <SelectItem value="64" data-oid="exm4-n-">
                          64
                        </SelectItem>
                        <SelectItem value="128" data-oid=":smf..d">
                          128
                        </SelectItem>
                        <SelectItem value="256" data-oid="yn_493m">
                          256
                        </SelectItem>
                        <SelectItem value="512" data-oid="agzs4kr">
                          512
                        </SelectItem>
                        <SelectItem value="1024" data-oid="natz26-">
                          1024
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2" data-oid="5kln442">
                    <Label className="text-foreground" data-oid="ehm5geh">
                      Suavização
                    </Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="0.99"
                      value={audioSettings.liveAnalyzerSmoothing}
                      onChange={(e) =>
                        setAudioSettings({
                          ...audioSettings,
                          liveAnalyzerSmoothing: Number(e.target.value || 0),
                        })
                      }
                      className="bg-background/50 border-golden/20 focus:border-golden"
                      data-oid="4pqrarn"
                    />
                  </div>
                  <div className="space-y-2" data-oid="c1w2gy7">
                    <Label className="text-foreground" data-oid="lk8ox-c">
                      Altura (px)
                    </Label>
                    <Input
                      type="number"
                      value={audioSettings.liveHeight}
                      onChange={(e) =>
                        setAudioSettings({
                          ...audioSettings,
                          liveHeight: Number(e.target.value || 0),
                        })
                      }
                      className="bg-background/50 border-golden/20 focus:border-golden"
                      data-oid="yzx_sra"
                    />
                  </div>
                  <div className="space-y-2" data-oid="1-2rzyx">
                    <Label className="text-foreground" data-oid="-6qr:b5">
                      Largura da Barra
                    </Label>
                    <Input
                      type="number"
                      value={audioSettings.liveBarWidth}
                      onChange={(e) =>
                        setAudioSettings({
                          ...audioSettings,
                          liveBarWidth: Number(e.target.value || 0),
                        })
                      }
                      className="bg-background/50 border-golden/20 focus:border-golden"
                      data-oid="07ynuse"
                    />
                  </div>
                  <div className="space-y-2" data-oid="9aq.2ly">
                    <Label className="text-foreground" data-oid="iqa5k-h">
                      Cor da Barra
                    </Label>
                    <Input
                      value={audioSettings.liveBarColor}
                      onChange={(e) =>
                        setAudioSettings({
                          ...audioSettings,
                          liveBarColor: e.target.value,
                        })
                      }
                      className="bg-background/50 border-golden/20 focus:border-golden"
                      data-oid="a491xcu"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={saveAudioSettings}
                className="w-full md:w-auto bg-golden text-deep-black hover:bg-golden/90"
                data-oid="c339ak4"
              >
                Salvar Configurações de Áudio
              </Button>
            </CardContent>
          </Card>

          {/* Social Links Editor */}
          <Card
            className="bg-deep-black/50 border-golden/20 backdrop-blur-sm"
            data-oid="m63ira3"
          >
            <CardHeader data-oid="5e-0wrl">
              <CardTitle className="text-2xl text-golden" data-oid="28.ycr9">
                Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="mtra815">
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                data-oid="0q99j0w"
              >
                <div className="space-y-2" data-oid="8lg1cz.">
                  <Label
                    htmlFor="whatsapp"
                    className="text-foreground flex items-center gap-2"
                    data-oid="cnqt7f6"
                  >
                    <img
                      src="/favicon-whatsapp.svg"
                      alt="WhatsApp"
                      className="w-5 h-5"
                      data-oid="0b_4ma8"
                    />{" "}
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={socialLinks.whatsapp}
                    onChange={(e) =>
                      handleSocialChange("whatsapp", e.target.value)
                    }
                    placeholder="https://wa.me/message/SEU_CODIGO"
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="11--t.z"
                  />
                </div>
                <div className="space-y-2" data-oid="d4p81dt">
                  <Label
                    htmlFor="instagram"
                    className="text-foreground flex items-center gap-2"
                    data-oid="6-ddibo"
                  >
                    <Instagram className="w-4 h-4" data-oid="h2xjv8-" />{" "}
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={socialLinks.instagram}
                    onChange={(e) =>
                      handleSocialChange("instagram", e.target.value)
                    }
                    placeholder="https://instagram.com/seu_perfil"
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="--1ov7u"
                  />
                </div>

                <div className="space-y-2" data-oid="ezl63va">
                  <Label
                    htmlFor="tiktok"
                    className="text-foreground flex items-center gap-2"
                    data-oid="d0akfbm"
                  >
                    <Music className="w-4 h-4" data-oid="5s3kicb" /> TikTok
                  </Label>
                  <Input
                    id="tiktok"
                    value={socialLinks.tiktok}
                    onChange={(e) =>
                      handleSocialChange("tiktok", e.target.value)
                    }
                    placeholder="https://tiktok.com/@seu_perfil"
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="8dmmj79"
                  />
                </div>

                <div className="space-y-2" data-oid="cmf8i-.">
                  <Label
                    htmlFor="youtube"
                    className="text-foreground flex items-center gap-2"
                    data-oid="06.7c.h"
                  >
                    <Youtube className="w-4 h-4" data-oid="x9zd8l-" /> YouTube
                  </Label>
                  <Input
                    id="youtube"
                    value={socialLinks.youtube}
                    onChange={(e) =>
                      handleSocialChange("youtube", e.target.value)
                    }
                    placeholder="https://youtube.com/@seu_canal"
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="5w6lwz1"
                  />
                </div>

                <div className="space-y-2" data-oid="szl5.yi">
                  <Label
                    htmlFor="spotify"
                    className="text-foreground flex items-center gap-2"
                    data-oid="x94x8v_"
                  >
                    <Radio className="w-4 h-4" data-oid="7lc4olc" /> Spotify
                  </Label>
                  <Input
                    id="spotify"
                    value={socialLinks.spotify}
                    onChange={(e) =>
                      handleSocialChange("spotify", e.target.value)
                    }
                    placeholder="https://open.spotify.com/artist/..."
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="9_vn55u"
                  />
                </div>

                <div className="space-y-2" data-oid="fba1k4x">
                  <Label
                    htmlFor="youtubeMusic"
                    className="text-foreground flex items-center gap-2"
                    data-oid="qjoedgw"
                  >
                    <Music className="w-4 h-4" data-oid="23-6jma" /> YouTube
                    Music
                  </Label>
                  <Input
                    id="youtubeMusic"
                    value={socialLinks.youtubeMusic}
                    onChange={(e) =>
                      handleSocialChange("youtubeMusic", e.target.value)
                    }
                    placeholder="https://music.youtube.com/channel/..."
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="by-og7o"
                  />
                </div>

                <div className="space-y-2" data-oid="gpkvvzd">
                  <Label
                    htmlFor="amazonMusic"
                    className="text-foreground flex items-center gap-2"
                    data-oid="nsshea:"
                  >
                    <Radio className="w-4 h-4" data-oid="wfaezfp" /> Amazon
                    Music
                  </Label>
                  <Input
                    id="amazonMusic"
                    value={socialLinks.amazonMusic}
                    onChange={(e) =>
                      handleSocialChange("amazonMusic", e.target.value)
                    }
                    placeholder="https://music.amazon.com/..."
                    className="bg-background/50 border-golden/20 focus:border-golden"
                    data-oid="nc3sju6"
                  />
                </div>
              </div>
              <Button
                onClick={saveSocial}
                className="w-full md:w-auto bg-golden text-deep-black hover:bg-golden/90"
                data-oid="mzmgvne"
              >
                Salvar Redes Sociais
              </Button>
            </CardContent>
          </Card>

          {/* Storage Management Section */}
          <StorageManagement />

          {/* Upload Section */}
          <UploadSection data-oid="u46l20i" />
        </div>
      </div>
      <Footer data-oid="qipum3o" />
    </div>
  );
};

export default Settings;
