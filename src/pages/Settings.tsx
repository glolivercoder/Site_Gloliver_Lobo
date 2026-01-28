import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { UploadSection } from "@/components/UploadSection";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Users,
  Shield,
  Activity,
  Settings as SettingsIcon,
  Loader2,
} from "lucide-react";
import { getStorageInfo, cleanupOldFilesByAge } from "@/utils/storage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, getSupabaseUrl } from "@/lib/supabase";

// --- COMPONENTS FROM BACKUP (Storage) ---
const StorageManagement = () => {
  const [storageInfo, setStorageInfo] = useState({
    totalSize: 0,
    fileCount: 0,
  });
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
          Gerenciamento de Armazenamento Local
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
            Remove cache local (músicas e mídias do IndexedDB).
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- NEW ACTION COMPONENTS (User Mgmt, Logs) ---
const UserManagement = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (e: any) {
      console.error("Error loading users:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`Usuário ${!currentStatus ? 'bloqueado' : 'desbloqueado'}.`);
      loadUsers();
    } catch (e) {
      toast.error("Erro ao atualizar status.");
    }
  };

  return (
    <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-2xl text-golden flex items-center gap-2">
          <Users className="w-6 h-6" />
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription className="text-muted-foreground/60">
          Visualize e gerencie os perfis registrados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-golden/10 overflow-hidden bg-black/40">
          <Table>
            <TableHeader className="bg-golden/5">
              <TableRow className="border-golden/20 hover:bg-transparent">
                <TableHead className="text-golden font-bold py-4">Email</TableHead>
                <TableHead className="text-golden font-bold">Status</TableHead>
                <TableHead className="text-golden font-bold">Role</TableHead>
                <TableHead className="text-golden font-bold text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-golden" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum registro.</TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="border-golden/5 hover:bg-golden/5 transition-colors">
                    <TableCell className="font-medium text-foreground">{u.email || "Sem Email"}</TableCell>
                    <TableCell>
                      {u.is_blocked ? (
                        <span className="text-destructive font-bold text-xs">BLOQUEADO</span>
                      ) : (
                        <span className="text-green-500 font-bold text-xs">ATIVO</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-golden/20 text-golden border border-golden/30">ADMIN</span>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">Fã</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                          onClick={() => handleBlockUser(u.id, u.is_blocked)}
                        >
                          {u.is_blocked ? "Desbloquear" : "Bloquear"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityLog = () => {
  return (
    <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md h-full">
      <CardHeader>
        <CardTitle className="text-xl text-golden flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Log de Atividade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          {[
            { time: "Agora", msg: "Sistema iniciado", type: "system" },
          ].map((log, i) => (
            <div key={i} className="flex gap-3 text-xs border-l-2 border-golden/20 pl-3 py-1 hover:bg-golden/5">
              <span className="text-golden/60 font-mono shrink-0">{log.time}</span>
              <span className="text-muted-foreground/80">{log.msg}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN COMPONENT ---
const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingScreens, setLoadingScreens] = useState(false);

  // State: Featured Pages (Merged Logic)
  const [allPages, setAllPages] = useState<any[][]>([
    Array(8).fill(null).map((_, i) => ({ id: i + 1, title: `Destaque ${i + 1}`, url: "", type: "video" }))
  ]);

  // State: Social (Detailed)
  const [socialLinks, setSocialLinks] = useState({
    instagram: "", tiktok: "", youtube: "", spotify: "", youtubeMusic: "", amazonMusic: "", whatsapp: ""
  });

  // State: Audio (Detailed)
  const [audioSettings, setAudioSettings] = useState({
    waveformStyle: "bars", height: 128, barWidth: 3, barGap: 2, barRadius: 3, cursorWidth: 2,
    waveColor: "hsl(40 20% 30%)", progressColor: "hsl(40 90% 55%)", cursorColor: "hsl(0 0% 98%)",
    enableSpectrogram: false, spectrogramFftSamples: 256,
    liveAnalyzerFftSize: 256, liveAnalyzerSmoothing: 0.8,
    liveHeight: 128, liveBarWidth: 2, liveBarColor: "hsl(var(--golden))"
  });

  // Load Data
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoadingScreens(true);
    await Promise.all([loadFeatured(), loadConfig()]);
    setLoadingScreens(false);
  };

  const loadFeatured = async () => {
    // Try cloud first (DB), fallback to localStorage if needed
    const { data } = await supabase.from('featured_slots').select('*').order('id');
    if (data && data.length > 0) {
      const maxPage = data.length > 0 ? Math.max(...data.map(s => s.page_index)) : 0;
      const totalPages = maxPage + 1;
      const newPages = [];
      for (let p = 0; p < totalPages; p++) {
        const pageItems = [];
        for (let s = 0; s < 8; s++) {
          const slot = data.find(i => i.page_index === p && i.slot_index === s);
          pageItems.push(slot ? {
            id: slot.id, title: slot.custom_title || "", url: slot.external_url || "",
            type: slot.type || "video", thumbnail: slot.custom_thumbnail || slot.thumbnail_url || ""
          } : { id: `temp-${p}-${s}`, title: `Destaque ${s + 1}`, url: "", type: "video" });
        }
        newPages.push(pageItems);
      }
      setAllPages(newPages);
    } else {
      // Fallback or empty init
    }
  };

  const loadConfig = async () => {
    const { data } = await supabase.from('site_config').select('*');
    if (data) {
      const social = data.find(c => c.key === 'social_links');
      if (social?.value) setSocialLinks({ ...socialLinks, ...social.value });
      const audio = data.find(c => c.key === 'audio_settings');
      if (audio?.value) setAudioSettings({ ...audioSettings, ...audio.value });
    }
  };

  // Actions
  const addNewPage = () => {
    const newPage = Array(8).fill(null).map((_, i) => ({
      id: `new-${Date.now()}-${i}`, title: `Novo Destaque ${i + 1}`, url: "", type: "video"
    }));
    setAllPages([...allPages, newPage]);
    setCurrentPage(allPages.length);
  };

  const removePage = async (pageIndex: number) => {
    if (allPages.length === 1) return toast.error("Mínimo 1 página.");
    if (!confirm("Remover página?")) return;
    const { error } = await supabase.from('featured_slots').delete().eq('page_index', pageIndex);
    if (!error) {
      const updated = allPages.filter((_, i) => i !== pageIndex);
      setAllPages(updated);
      setCurrentPage(Math.max(0, currentPage - 1));
      toast.success("Página removida.");
    }
  };

  const handleFeaturedChange = (p: number, i: number, f: string, v: string) => {
    const updated = [...allPages];
    updated[p] = [...updated[p]];
    updated[p][i] = { ...updated[p][i], [f]: v };
    setAllPages(updated);
  };

  // DIRECT UPLOAD HANDLER (The Key Request)
  const handleSlotUpload = async (e: React.ChangeEvent<HTMLInputElement>, pageIdx: number, slotIdx: number) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      toast.info("Enviando...");
      const fileExt = file.name.split('.').pop();
      const fileName = `destaques/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
      if (uploadError) throw uploadError;

      const publicUrl = getSupabaseUrl('media', fileName);

      // Update State
      handleFeaturedChange(pageIdx, slotIdx, 'url', publicUrl);
      if (!allPages[pageIdx][slotIdx].title) {
        handleFeaturedChange(pageIdx, slotIdx, 'title', file.name.replace(/\.[^/.]+$/, ""));
      }

      // Check file type
      const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "video";
      handleFeaturedChange(pageIdx, slotIdx, 'type', type);

      toast.success("Upload concluído! Clique em SALVAR TODAS para persistir.");
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    }
  };

  const saveAll = async () => {
    setLoadingScreens(true);
    try {
      // Save Slots
      const upserts = [];
      allPages.forEach((page, pIndex) => {
        page.forEach((slot, sIndex) => {
          upserts.push({
            page_index: pIndex, slot_index: sIndex, custom_title: slot.title,
            external_url: slot.url, type: slot.type, custom_thumbnail: slot.thumbnail
          });
        });
      });
      await supabase.from('featured_slots').upsert(upserts, { onConflict: 'page_index, slot_index' });

      // Save Configs
      await supabase.from('site_config').upsert({ key: 'social_links', value: socialLinks }, { onConflict: 'key' });
      await supabase.from('site_config').upsert({ key: 'audio_settings', value: audioSettings }, { onConflict: 'key' });

      toast.success("Tudo salvo com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar.");
    } finally {
      setLoadingScreens(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md bg-deep-black/50 border-destructive/20">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-golden">Acesso Restrito</h2>
            <p className="text-muted-foreground mt-2">Área administrativa.</p>
            <Button onClick={() => window.location.href = "/"} className="mt-6 bg-golden text-black">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-golden/30">
      <Header />
      <div className="pt-24 px-4 md:px-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-golden/10 pb-6">
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-b from-golden via-amber-200 to-golden bg-clip-text text-transparent uppercase">
                Administração
              </h1>
              <p className="text-muted-foreground/60 font-medium mt-2">Painel Global</p>
            </div>
          </div>

          {/* ADMIN PANELS (New) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2"><UserManagement /></div>
            <div><ActivityLog /></div>
          </div>

          <div className="flex justify-end sticky top-24 z-50">
            <Button size="lg" onClick={saveAll} className="bg-golden text-black font-black shadow-lg shadow-golden/10 hover:scale-105 transition-transform">
              {loadingScreens ? <Loader2 className="animate-spin mr-2" /> : "SALVAR TUDO AGORA"}
            </Button>
          </div>

          {/* STORAGE (Old) */}
          <StorageManagement />

          {/* FEATURED EDITOR (Old + New Uploads) */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md">
            <CardHeader className="flex flex-row justify-between">
              <CardTitle className="text-2xl text-golden">Editar Destaques</CardTitle>
              <Button onClick={addNewPage} variant="outline" className="border-golden/20 text-golden">Add Página</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pagination */}
              <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                {allPages.map((_, i) => (
                  <Button key={i} onClick={() => setCurrentPage(i)} variant={currentPage === i ? "default" : "outline"} className={currentPage === i ? 'bg-golden text-black font-bold' : 'border-golden/20 text-golden'}>
                    Página {i + 1}
                  </Button>
                ))}
              </div>

              {/* Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {allPages[currentPage]?.map((slot, idx) => (
                  <div key={idx} className="bg-black/40 border border-golden/10 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-black bg-golden/20 text-golden px-2 py-0.5 rounded">SLOT {idx + 1}</span>
                    <Input placeholder="Título" value={slot.title} onChange={(e) => handleFeaturedChange(currentPage, idx, "title", e.target.value)} className="bg-black/20 border-golden/10 h-8 text-sm font-bold" />

                    {/* UPLOAD INTEGRATION */}
                    <div className="flex gap-2">
                      <Input placeholder="URL" value={slot.url} onChange={(e) => handleFeaturedChange(currentPage, idx, "url", e.target.value)} className="bg-black/20 border-golden/10 h-8 text-xs flex-1" />
                      <div className="relative w-8 h-8">
                        <Input type="file" onChange={(e) => handleSlotUpload(e, currentPage, idx)} className="absolute inset-0 opacity-0 cursor-pointer" title="Fazer Upload" />
                        <div className="w-8 h-8 flex items-center justify-center bg-golden/10 rounded border border-golden/20 text-golden hover:bg-golden/20 pointer-events-none">
                          <Upload className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <Select value={slot.type} onValueChange={(v) => handleFeaturedChange(currentPage, idx, "type", v)}>
                      <SelectTrigger className="h-8 bg-black/20 border-golden/10 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-deep-black border-golden/20"><SelectItem value="video">Vídeo</SelectItem><SelectItem value="audio">Áudio</SelectItem><SelectItem value="image">Imagem</SelectItem></SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {allPages.length > 1 && <Button onClick={() => removePage(currentPage)} variant="destructive" className="mt-4 w-full">Remover Esta Página</Button>}
            </CardContent>
          </Card>

          {/* AUDIO SETTINGS (Detailed) */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md">
            <CardHeader><CardTitle className="text-golden">Áudio Avançado</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Simplified view of advanced settings for brevity, but functional */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(audioSettings).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    {typeof val === 'boolean' ? (
                      <input type="checkbox" checked={val} onChange={(e) => setAudioSettings({ ...audioSettings, [key]: e.target.checked })} className="block" />
                    ) : (
                      <Input value={val} onChange={(e) => setAudioSettings({ ...audioSettings, [key]: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) })} className="h-8 bg-black/20 border-golden/10" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SOCIAL LINKS */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md">
            <CardHeader><CardTitle className="text-golden">Redes Sociais</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Instagram</Label><Input value={socialLinks.instagram} onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })} className="bg-black/20 border-golden/10" /></div>
                <div className="space-y-2"><Label>WhatsApp</Label><Input value={socialLinks.whatsapp} onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })} className="bg-black/20 border-golden/10" /></div>
                <div className="space-y-2"><Label>TikTok</Label><Input value={socialLinks.tiktok} onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })} className="bg-black/20 border-golden/10" /></div>
                <div className="space-y-2"><Label>YouTube</Label><Input value={socialLinks.youtube} onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })} className="bg-black/20 border-golden/10" /></div>
                <div className="space-y-2"><Label>Spotify</Label><Input value={socialLinks.spotify} onChange={(e) => setSocialLinks({ ...socialLinks, spotify: e.target.value })} className="bg-black/20 border-golden/10" /></div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
