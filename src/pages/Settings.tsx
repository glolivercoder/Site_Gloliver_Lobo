import { Header } from "@/components/Header";
import { UploadSection } from "@/components/UploadSection";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Instagram, Music, Youtube, Radio, Upload, Image as ImageIcon } from "lucide-react";

const Settings = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [allPages, setAllPages] = useState<any[][]>([
    Array(8).fill(null).map((_, i) => ({ 
      id: i + 1, 
      title: `Destaque ${i + 1}`, 
      url: "", 
      type: "video" 
    }))
  ]);

  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    tiktok: "",
    youtube: "",
    spotify: "",
    youtubeMusic: "",
    amazonMusic: "",
  });

  const [audioSettings, setAudioSettings] = useState({
    waveformStyle: "bars",
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
    if (storedSocial) {
      try {
        setSocialLinks(JSON.parse(storedSocial));
      } catch (e) {
        console.error("Error loading social links:", e);
      }
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

  const handleFeaturedChange = (pageIndex: number, itemIndex: number, field: string, value: string) => {
    const updated = [...allPages];
    updated[pageIndex] = [...updated[pageIndex]];
    updated[pageIndex][itemIndex] = { ...updated[pageIndex][itemIndex], [field]: value };
    setAllPages(updated);
  };

  const saveFeatured = () => {
    localStorage.setItem("featuredPages", JSON.stringify(allPages));
    window.dispatchEvent(new Event("storage"));
    toast.success("Destaques salvos com sucesso!");
  };

  const addNewPage = () => {
    const newPage = Array(8).fill(null).map((_, i) => ({ 
      id: allPages.length * 8 + i + 1, 
      title: `Destaque ${allPages.length * 8 + i + 1}`, 
      url: "", 
      type: "video" 
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

  const handleThumbnailUpload = (pageIndex: number, itemIndex: number, file: File) => {
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-golden mb-8">Configurações</h1>

          {/* Featured Section Editor */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-golden">Editar Destaques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button onClick={addNewPage} className="bg-golden text-deep-black hover:bg-golden/90">
                  Adicionar Página
                </Button>
                {allPages.length > 1 && (
                  <Button 
                    onClick={() => removePage(currentPage)} 
                    variant="destructive"
                  >
                    Remover Página Atual
                  </Button>
                )}
              </div>

              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {allPages.map((_, index) => (
                  <Button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    variant={currentPage === index ? "default" : "outline"}
                    className={currentPage === index ? "bg-golden text-deep-black hover:bg-golden/90" : ""}
                  >
                    Página {index + 1}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                {allPages[currentPage]?.map((item, index) => (
                  <div key={item.id} className="space-y-2 p-4 border border-golden/20 rounded-lg">
                    <Label className="text-sm font-medium text-golden">Destaque {index + 1}</Label>
                    <Input
                      placeholder="Título"
                      value={item.title}
                      onChange={(e) => handleFeaturedChange(currentPage, index, "title", e.target.value)}
                      className="mb-2 bg-background/50 border-golden/20 focus:border-golden"
                    />
                    <Input
                      placeholder="URL da mídia (YouTube, Spotify, etc.)"
                      value={item.url}
                      onChange={(e) => handleFeaturedChange(currentPage, index, "url", e.target.value)}
                      className="mb-2 bg-background/50 border-golden/20 focus:border-golden"
                    />
                    <select
                      value={item.type}
                      onChange={(e) => handleFeaturedChange(currentPage, index, "type", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-golden/20 bg-background/50 px-3 py-2 text-sm text-foreground focus:border-golden"
                    >
                      <option value="video">Vídeo</option>
                      <option value="audio">Áudio</option>
                      <option value="image">Imagem</option>
                    </select>
                    
                    <div className="mt-2 space-y-2">
                      <Label className="text-xs text-muted-foreground">Imagem Thumbnail</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="URL da imagem thumbnail"
                          value={item.thumbnail || ""}
                          onChange={(e) => handleFeaturedChange(currentPage, index, "thumbnail", e.target.value)}
                          className="flex-1 bg-background/50 border-golden/20 focus:border-golden"
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
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleThumbnailUpload(currentPage, index, file);
                            };
                            input.click();
                          }}
                          className="border-golden/20 hover:bg-golden/10"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                      {item.thumbnail && (
                        <div className="relative w-20 h-20 rounded border border-golden/20 overflow-hidden">
                          <img src={item.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={saveFeatured}
                className="w-full md:w-auto bg-golden text-deep-black hover:bg-golden/90"
              >
                Salvar Destaques
              </Button>
            </CardContent>
          </Card>

          {/* Audio Visualizer Settings */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-golden">Configurações do Visualizador de Áudio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waveformStyle" className="text-foreground">Estilo do Waveform</Label>
                <Select
                  value={audioSettings.waveformStyle}
                  onValueChange={(value) => setAudioSettings({ ...audioSettings, waveformStyle: value })}
                >
                  <SelectTrigger className="bg-background/50 border-golden/20 focus:border-golden">
                    <SelectValue placeholder="Selecione o estilo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-golden/20">
                    <SelectItem value="bars">Barras (Padrão)</SelectItem>
                    <SelectItem value="wave">Onda Contínua</SelectItem>
                    <SelectItem value="mirror">Espelho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={saveAudioSettings}
                className="w-full md:w-auto bg-golden text-deep-black hover:bg-golden/90"
              >
                Salvar Configurações de Áudio
              </Button>
            </CardContent>
          </Card>

          {/* Social Links Editor */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-golden">Redes Sociais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-foreground flex items-center gap-2">
                    <Instagram className="w-4 h-4" /> Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={socialLinks.instagram}
                    onChange={(e) => handleSocialChange("instagram", e.target.value)}
                    placeholder="https://instagram.com/seu_perfil"
                    className="bg-background/50 border-golden/20 focus:border-golden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok" className="text-foreground flex items-center gap-2">
                    <Music className="w-4 h-4" /> TikTok
                  </Label>
                  <Input
                    id="tiktok"
                    value={socialLinks.tiktok}
                    onChange={(e) => handleSocialChange("tiktok", e.target.value)}
                    placeholder="https://tiktok.com/@seu_perfil"
                    className="bg-background/50 border-golden/20 focus:border-golden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube" className="text-foreground flex items-center gap-2">
                    <Youtube className="w-4 h-4" /> YouTube
                  </Label>
                  <Input
                    id="youtube"
                    value={socialLinks.youtube}
                    onChange={(e) => handleSocialChange("youtube", e.target.value)}
                    placeholder="https://youtube.com/@seu_canal"
                    className="bg-background/50 border-golden/20 focus:border-golden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spotify" className="text-foreground flex items-center gap-2">
                    <Radio className="w-4 h-4" /> Spotify
                  </Label>
                  <Input
                    id="spotify"
                    value={socialLinks.spotify}
                    onChange={(e) => handleSocialChange("spotify", e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                    className="bg-background/50 border-golden/20 focus:border-golden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeMusic" className="text-foreground flex items-center gap-2">
                    <Music className="w-4 h-4" /> YouTube Music
                  </Label>
                  <Input
                    id="youtubeMusic"
                    value={socialLinks.youtubeMusic}
                    onChange={(e) => handleSocialChange("youtubeMusic", e.target.value)}
                    placeholder="https://music.youtube.com/channel/..."
                    className="bg-background/50 border-golden/20 focus:border-golden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amazonMusic" className="text-foreground flex items-center gap-2">
                    <Radio className="w-4 h-4" /> Amazon Music
                  </Label>
                  <Input
                    id="amazonMusic"
                    value={socialLinks.amazonMusic}
                    onChange={(e) => handleSocialChange("amazonMusic", e.target.value)}
                    placeholder="https://music.amazon.com/..."
                    className="bg-background/50 border-golden/20 focus:border-golden"
                  />
                </div>
              </div>
              <Button
                onClick={saveSocial}
                className="w-full md:w-auto bg-golden text-deep-black hover:bg-golden/90"
              >
                Salvar Redes Sociais
              </Button>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <UploadSection />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
