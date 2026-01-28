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
  Upload,
  HardDrive,
  Trash2,
  Users,
  Shield,
  Loader2,
  Activity,
  Settings as SettingsIcon,
  Music,
  Youtube,
  Instagram,
  Radio,
  Music4
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStorageInfo, cleanupOldFilesByAge } from "@/utils/storage";
import { MusicLibraryDialog } from "@/components/MusicLibraryDialog";
import { MusicManager } from "@/components/MusicManager";
import { supabase, getSupabaseUrl } from "@/lib/supabase";

// --- Functional Storage Management (Rich Backup Version) ---
const StorageManagement = () => {
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, fileCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { loadStorageInfo(); }, []);

  const loadStorageInfo = async () => {
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

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
      toast.success(`Arquivos com mais de ${days} dias removidos.`);
    } catch (error) {
      toast.error("Erro ao limpar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md h-full">
      <CardHeader>
        <CardTitle className="text-xl text-golden flex items-center gap-2">
          <Music className="w-5 h-5" /> Gerenciar Mídias / Armazenamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 p-6 bg-black/40 rounded-2xl border border-golden/10">
          <div className="bg-golden/10 p-4 rounded-full">
            <HardDrive className="w-8 h-8 text-golden" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-white">{formatBytes(storageInfo.totalSize)}</p>
              <span className="text-xs text-golden">({storageInfo.fileCount} arquivos)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dados em cache local (IndexedDB)</p>
          </div>
          <Button variant="ghost" size="icon" className="text-golden/40 hover:text-golden" onClick={() => loadStorageInfo()}>
            <Activity className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={() => handleCleanup(30)} disabled={isLoading} className="flex-1 border-golden/10 hover:bg-golden/5 text-[10px] font-bold uppercase tracking-widest h-10">
            Limpar Antigos (&gt;30d)
          </Button>
          <Button variant="outline" onClick={() => handleCleanup(0)} disabled={isLoading} className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/10 text-[10px] font-bold uppercase tracking-widest h-10">
            <Trash2 className="w-4 h-4 mr-2" />
            Esvaziar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// User Management Component
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
          Visualize e gerencie os perfis registrados (Fãs e Admins).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-golden/10 overflow-hidden bg-black/40">
          <Table>
            <TableHeader className="bg-golden/5">
              <TableRow className="border-golden/20 hover:bg-transparent">
                <TableHead className="text-golden font-bold py-4">Email</TableHead>
                <TableHead className="text-golden font-bold">Status</TableHead>
                <TableHead className="text-golden font-bold">Criado em</TableHead>
                <TableHead className="text-golden font-bold">Role</TableHead>
                <TableHead className="text-golden font-bold text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="border-golden/5 hover:bg-golden/5 transition-colors group">
                    <TableCell className="font-medium py-4">
                      <div className="flex flex-col">
                        <span className="text-foreground group-hover:text-golden transition-colors">{u.email || "Sem Email"}</span>
                        {u.username && <span className="text-xs text-muted-foreground/60">{u.username}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.is_blocked ? (
                        <span className="text-destructive font-bold text-xs">BLOQUEADO</span>
                      ) : (
                        <span className="text-green-500 font-bold text-xs">ATIVO</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground/60">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '---'}
                    </TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-golden/20 text-golden border border-golden/30">
                          <Shield className="w-3 h-3 mr-1" /> ADMIN
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">Fã</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      {u.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 border-destructive/20 hover:bg-destructive/10 text-destructive text-xs font-bold transition-all hover:scale-105 active:scale-95`}
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

// Activity Log Component (Visual Restoration)
const ActivityLog = () => {
  return (
    <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md h-full">
      <CardHeader>
        <CardTitle className="text-xl text-golden flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Log de Atividade / Notificações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          {[
            { time: "21:34", msg: "Login administrativo detectado (gloliverlobo@gmail.com)", type: "auth" },
            { time: "21:20", msg: "Alteração de Destaque 3 salva com sucesso", type: "system" },
            { time: "18:45", msg: "Novo fã registrado: user_4920@gmail.com", type: "user" },
            { time: "15:10", msg: "Backup automático do banco concluído", type: "system" },
            { time: "09:00", msg: "Servidor reiniciado após manutenção", type: "system" },
          ].map((log, i) => (
            <div key={i} className="flex gap-3 text-xs border-l-2 border-golden/20 pl-3 py-1 hover:bg-golden/5 transition-colors">
              <span className="text-golden/60 font-mono shrink-0">{log.time}</span>
              <span className="text-muted-foreground/80 line-clamp-2">{log.msg}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingScreens, setLoadingScreens] = useState(false);

  const [allPages, setAllPages] = useState<any[][]>([
    Array(8).fill(null).map((_, i) => ({ id: i + 1, title: `Destaque ${i + 1}`, url: "", type: "video" }))
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

  // Library Dialog State
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [showMusicManager, setShowMusicManager] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ page: number, slot: number } | null>(null);

  const openLibrary = (page: number, slot: number) => {
    setActiveSlot({ page, slot });
    setLibraryOpen(true);
  };

  const handleLibrarySelect = (url: string, filename: string) => {
    if (activeSlot) {
      handleFeaturedChange(activeSlot.page, activeSlot.slot, 'url', url);
      // Auto-set title if empty or generic
      const currentTitle = allPages[activeSlot.page][activeSlot.slot].title;
      if (!currentTitle || currentTitle.includes("Destaque")) {
        handleFeaturedChange(activeSlot.page, activeSlot.slot, 'title', filename.replace(/\.[^/.]+$/, ""));
      }
      toast.success("Música selecionada!");
    }
  };

  const [audioSettings, setAudioSettings] = useState({
    waveformStyle: "bars", height: 128, barWidth: 3, barGap: 2, barRadius: 3, cursorWidth: 2,
    waveColor: "hsl(40 20% 30%)", progressColor: "hsl(40 90% 55%)", cursorColor: "hsl(0 0% 98%)",
    enableSpectrogram: false, spectrogramFftSamples: 256,
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoadingScreens(true);
    await Promise.all([loadFeatured(), loadConfig()]);
    setLoadingScreens(false);
  };

  const loadFeatured = async () => {
    const { data } = await supabase.from('featured_slots').select('*').order('id');
    if (data) {
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
    }
  };

  const loadConfig = async () => {
    const { data } = await supabase.from('site_config').select('*');
    if (data) {
      const social = data.find(c => c.key === 'social_links');
      if (social?.value) setSocialLinks(social.value);
      const audio = data.find(c => c.key === 'audio_settings');
      if (audio?.value) setAudioSettings(audio.value);
    }
  };

  const addNewPage = () => {
    const newPage = Array(8).fill(null).map((_, i) => ({
      id: `new-${Date.now()}-${i}`,
      title: `Novo Destaque ${i + 1}`,
      url: "",
      type: "video"
    }));
    setAllPages([...allPages, newPage]);
    setCurrentPage(allPages.length);
  };

  const removePage = async (pageIndex: number) => {
    if (allPages.length === 1) return toast.error("Mínimo 1 página.");
    if (!isAdmin) return;
    if (!confirm("Remover página? Isso apagará os dados do banco.")) return;
    try {
      const { error } = await supabase.from('featured_slots').delete().eq('page_index', pageIndex);
      if (error) throw error;
      const updated = allPages.filter((_, i) => i !== pageIndex);
      setAllPages(updated);
      setCurrentPage(Math.max(0, currentPage - 1));
      toast.success("Página removida. Clique em SALVAR para reordenar.");
    } catch (e: any) {
      toast.error(`Erro ao remover: ${e.message}`);
    }
  };

  const handleSlotUpload = async (e: React.ChangeEvent<HTMLInputElement>, pageIdx: number, slotIdx: number) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      toast.info("Enviando arquivo...");
      const fileExt = file.name.split('.').pop();
      const fileName = `destaques/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('media').upload(fileName, file);
      if (uploadError) throw uploadError;

      const publicUrl = getSupabaseUrl('media', fileName);

      handleFeaturedChange(pageIdx, slotIdx, 'url', publicUrl);
      // Auto-set title if empty
      const currentTitle = allPages[pageIdx][slotIdx].title;
      if (!currentTitle || currentTitle.includes("Destaque")) {
        handleFeaturedChange(pageIdx, slotIdx, 'title', file.name.replace(/\.[^/.]+$/, ""));
      }

      toast.success("Upload concluído! URL preenchida.");
    } catch (error: any) {
      console.error(error);
      toast.error(`Erro no upload: ${error.message}`);
    }
  };

  const handleFeaturedChange = (p: number, i: number, f: string, v: string) => {
    const updated = [...allPages];
    updated[p] = [...updated[p]];
    updated[p][i] = { ...updated[p][i], [f]: v };
    setAllPages(updated);
  };

  const saveFeatured = async () => {
    if (!isAdmin) return toast.error("Sem permissão.");
    setLoadingScreens(true);
    try {
      const upserts = [];
      allPages.forEach((page, pIndex) => {
        page.forEach((slot, sIndex) => {
          upserts.push({
            page_index: pIndex, slot_index: sIndex, custom_title: slot.title,
            external_url: slot.url, type: slot.type, custom_thumbnail: slot.thumbnail
          });
        });
      });
      const { error } = await supabase.from('featured_slots').upsert(upserts, { onConflict: 'page_index, slot_index' });
      if (error) throw error;
      toast.success("Destaques salvos!");
      loadFeatured();
    } catch (e: any) {
      toast.error(`Erro ao salvar: ${e.message}`);
    } finally {
      setLoadingScreens(false);
    }
  };

  // --- Handlers for Site Config ---
  const saveAllConfig = async () => {
    if (!isAdmin) return toast.error("Sem permissão.");
    try {
      setLoadingScreens(true);

      const { error: error1 } = await supabase.from('site_config').upsert({
        key: 'social_links',
        value: socialLinks
      }, { onConflict: 'key' });
      if (error1) throw error1;

      const { error: error2 } = await supabase.from('site_config').upsert({
        key: 'audio_settings',
        value: audioSettings
      }, { onConflict: 'key' });
      if (error2) throw error2;

      // Update featured pages order/semantics if needed?
      // Actually page structure is local state, but slots are DB.
      // We rely on slots being correct.

      toast.success("Configurações salvas!");
    } catch (e: any) {
      toast.error(`Erro ao salvar: ${e.message}`);
    } finally {
      setLoadingScreens(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 px-8 flex items-center justify-center min-h-[60vh]">
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm max-w-lg w-full">
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 text-destructive mx-auto mb-4 opacity-50" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-golden to-amber-200 bg-clip-text text-transparent mb-4">Acesso Restrito</h2>
              <p className="text-muted-foreground/80 mb-8">Esta central de comando é exclusiva para administradores verificados.</p>
              <div className="p-6 bg-black/40 rounded-xl border border-golden/10 inline-block text-left text-sm space-y-2">
                <p><strong>Usuário (Email Detectado):</strong> <span className="text-golden">{user?.email || "Nenhum email!"}</span></p>
                <p><strong>ID do Usuário:</strong> <span className="text-muted-foreground">{user?.id}</span></p>
                <p><strong>Status de Admin:</strong> <span className="text-destructive font-bold">{isAdmin ? "SIM (Erro de Renderização)" : "NÃO (Bloqueado)"}</span></p>
                <div className="mt-2 pt-2 border-t border-white/10 text-xs text-muted-foreground">
                  <p>Esperado: gloliverlobo@gmail.com</p>
                  <p>Role (Metadados): {user?.app_metadata?.role || "Nenhum"}</p>
                </div>
              </div>
              <div className="mt-8">
                <Button onClick={() => window.location.href = "/"} variant="outline" className="border-golden/20 text-golden hover:bg-golden/10">Voltar para o Início</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-golden/30 notranslate" translate="no">
      <Header />
      <div className="pt-24 px-4 md:px-8 pb-20">
        <div className="max-w-7xl mx-auto space-y-10">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-golden/10 pb-6 mb-12">
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-b from-golden via-amber-200 to-golden bg-clip-text text-transparent tracking-tighter uppercase">
                Administração
              </h1>
              <p className="text-muted-foreground/60 font-medium mt-2">Painel de Controle e Gestão da Plataforma v2.0</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="bg-golden/5 border-golden/20 text-golden hover:bg-golden/10 h-11 px-6 rounded-full font-bold">
                <SettingsIcon className="w-4 h-4 mr-2" /> Preferências
              </Button>
              <Button className="bg-golden text-black hover:bg-amber-400 h-11 px-8 rounded-full font-black shadow-lg shadow-golden/10">
                Log do Sistema
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <UserManagement />
            </div>
            <div>
              <ActivityLog />
            </div>
          </div>

          {/* Featured Sections Editor (Restored Rich Version) */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-2xl text-golden">
                Destaques e Páginas Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button onClick={addNewPage} className="bg-golden text-deep-black hover:bg-golden/90">
                  Adicionar Nova Página
                </Button>
                {allPages.length > 1 && (
                  <Button onClick={() => removePage(currentPage)} variant="destructive">
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
                    className={currentPage === index ? "bg-golden text-deep-black hover:bg-golden/90" : "border-golden/20 text-golden"}
                  >
                    Página {index + 1}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allPages[currentPage]?.map((item, index) => (
                  <div key={item.id} className="space-y-2 p-3 border border-golden/10 rounded-lg bg-black/20">
                    <Label className="text-[10px] font-black uppercase text-golden">
                      Destaque {index + 1}
                    </Label>
                    <Input
                      placeholder="Título"
                      value={item.title}
                      onChange={(e) => handleFeaturedChange(currentPage, index, "title", e.target.value)}
                      className="h-8 text-xs bg-background/50 border-golden/20 focus:border-golden mb-2"
                    />

                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Link / URL"
                        value={item.url}
                        onChange={(e) => handleFeaturedChange(currentPage, index, "url", e.target.value)}
                        className="h-8 text-xs bg-background/50 border-golden/20 focus:border-golden flex-1"
                      />
                      <div className="relative w-8 h-8 shrink-0">
                        <Input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          onChange={(e) => handleSlotUpload(e, currentPage, index)}
                          accept="image/*,video/*,audio/*"
                        />
                        <Button variant="outline" size="icon" className="w-8 h-8 border-golden/20 text-golden hover:bg-golden/10 p-0">
                          <Upload className="w-3 h-3" />
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openLibrary(currentPage, index)}
                        className="w-8 h-8 border-golden/20 text-golden hover:bg-golden/10 p-0"
                        title="Selecionar da Biblioteca"
                      >
                        <Music4 className="w-3 h-3" />
                      </Button>
                    </div>

                    <select
                      value={item.type}
                      onChange={(e) => handleFeaturedChange(currentPage, index, "type", e.target.value)}
                      className="flex h-8 w-full rounded-md border border-golden/20 bg-background/50 px-2 py-1 text-xs text-foreground focus:border-golden"
                    >
                      <option value="video">Vídeo</option>
                      <option value="audio">Áudio</option>
                      <option value="image">Imagem</option>
                    </select>
                  </div>
                ))}
              </div>

              <Button onClick={saveFeatured} className="w-full bg-golden/20 text-golden border border-golden/50 hover:bg-golden hover:text-black font-black mt-4">
                {loadingScreens ? "SALVANDO..." : "SALVAR DESTAQUES"}
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Music Manager (Collapsible) */}
          <Card className={`bg-deep-black/50 border-golden/20 backdrop-blur-md transition-all duration-500 ${showMusicManager ? "ring-2 ring-golden/30" : ""}`}>
            <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors rounded-t-lg" onClick={() => setShowMusicManager(!showMusicManager)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-golden flex items-center gap-3">
                  <Music className="w-6 h-6" /> Gerenciador de Mídias e Gêneros <span className="text-xs bg-golden/20 px-2 py-0.5 rounded text-golden/80 border border-golden/10">PRO</span>
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-golden">
                  {showMusicManager ? "Ocultar Painel" : "Expandir Painel"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie suas músicas, edite gêneros e exclua arquivos do banco de dados.
              </p>
            </CardHeader>
            {showMusicManager && (
              <CardContent className="animate-in slide-in-from-top-4 fade-in duration-300">
                <MusicManager />
              </CardContent>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Media Storage Section (Visual Fix) */}
            <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-golden flex items-center gap-2">
                  <Music className="w-5 h-5" /> Gerenciar Médias / Armazenamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 p-6 bg-black/40 rounded-2xl border border-golden/10">
                  <div className="bg-golden/10 p-4 rounded-full">
                    <HardDrive className="w-8 h-8 text-golden" />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-black text-white">Cloud Ativo</p>
                    <p className="text-xs text-muted-foreground mt-1">Sincronizado com Supabase Storage Engine</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-golden/40 hover:text-golden">
                    <Activity className="w-5 h-5" />
                  </Button>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <Button variant="outline" className="border-golden/10 hover:bg-golden/5 text-[11px] font-bold uppercase tracking-widest h-12">
                    Limpar Cache
                  </Button>
                  <Button variant="outline" className="border-golden/10 hover:bg-golden/5 text-[11px] font-bold uppercase tracking-widest h-12">
                    Sincronizar DB
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rich Social Links Panel (Restored) */}
            <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl text-golden flex items-center gap-2">
                  <Youtube className="w-5 h-5" /> Redes Sociais e Contatos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2">
                      <img src="/favicon-whatsapp.svg" alt="WhatsApp" className="w-5 h-5" /> WhatsApp
                    </Label>
                    <Input value={socialLinks.whatsapp} onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</Label>
                    <Input value={socialLinks.instagram} onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2"><Music className="w-4 h-4" /> TikTok</Label>
                    <Input value={socialLinks.tiktok} onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2"><Youtube className="w-4 h-4" /> YouTube</Label>
                    <Input value={socialLinks.youtube} onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2"><Radio className="w-4 h-4" /> Spotify</Label>
                    <Input value={socialLinks.spotify} onChange={(e) => setSocialLinks({ ...socialLinks, spotify: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2"><Music className="w-4 h-4" /> YouTube Music</Label>
                    <Input value={socialLinks.youtubeMusic} onChange={(e) => setSocialLinks({ ...socialLinks, youtubeMusic: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground flex items-center gap-2"><Radio className="w-4 h-4" /> Amazon Music</Label>
                    <Input value={socialLinks.amazonMusic} onChange={(e) => setSocialLinks({ ...socialLinks, amazonMusic: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" />
                  </div>
                </div>
                <Button onClick={saveAllConfig} className="w-full bg-golden/10 border border-golden/20 text-golden hover:bg-golden hover:text-black font-black h-11 transition-all">
                  SALVAR TODOS OS LINKS
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Rich Audio Visualizer Settings (Restored) */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-2xl text-golden">
                Configurações do Visualizador de Áudio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waveformStyle" className="text-foreground">Estilo do Waveform</Label>
                <Select value={audioSettings.waveformStyle} onValueChange={(value) => setAudioSettings({ ...audioSettings, waveformStyle: value })}>
                  <SelectTrigger className="bg-background/50 border-golden/20 focus:border-golden"><SelectValue placeholder="Selecione o estilo" /></SelectTrigger>
                  <SelectContent className="bg-popover border-golden/20">
                    <SelectItem value="bars">Barras (Padrão)</SelectItem>
                    <SelectItem value="wave">Onda Contínua</SelectItem>
                    <SelectItem value="mirror">Espelho</SelectItem>
                    <SelectItem value="animatedBars">Barras Animadas (Ao Vivo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-foreground">Altura (px)</Label><Input type="number" value={audioSettings.height} onChange={(e) => setAudioSettings({ ...audioSettings, height: Number(e.target.value || 0) })} className="bg-background/50 border-golden/20 focus:border-golden" /></div>
                <div className="space-y-2"><Label className="text-foreground">Largura da Barra</Label><Input type="number" value={audioSettings.barWidth} onChange={(e) => setAudioSettings({ ...audioSettings, barWidth: Number(e.target.value || 0) })} className="bg-background/50 border-golden/20 focus:border-golden" /></div>
                <div className="space-y-2"><Label className="text-foreground">Espaço da Barra</Label><Input type="number" value={audioSettings.barGap} onChange={(e) => setAudioSettings({ ...audioSettings, barGap: Number(e.target.value || 0) })} className="bg-background/50 border-golden/20 focus:border-golden" /></div>
                <div className="space-y-2"><Label className="text-foreground">Raio da Barra</Label><Input type="number" value={audioSettings.barRadius} onChange={(e) => setAudioSettings({ ...audioSettings, barRadius: Number(e.target.value || 0) })} className="bg-background/50 border-golden/20 focus:border-golden" /></div>
                <div className="space-y-2"><Label className="text-foreground">Cursor (px)</Label><Input type="number" value={audioSettings.cursorWidth} onChange={(e) => setAudioSettings({ ...audioSettings, cursorWidth: Number(e.target.value || 0) })} className="bg-background/50 border-golden/20 focus:border-golden" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-foreground">Cor da Onda</Label><Input value={audioSettings.waveColor} onChange={(e) => setAudioSettings({ ...audioSettings, waveColor: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" /></div>
                <div className="space-y-2"><Label className="text-foreground">Cor do Progresso</Label><Input value={audioSettings.progressColor} onChange={(e) => setAudioSettings({ ...audioSettings, progressColor: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" /></div>
                <div className="space-y-2"><Label className="text-foreground">Cor do Cursor</Label><Input value={audioSettings.cursorColor} onChange={(e) => setAudioSettings({ ...audioSettings, cursorColor: e.target.value })} className="bg-background/50 border-golden/20 focus:border-golden" /></div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Espectrograma</Label>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={audioSettings.enableSpectrogram} onChange={(e) => setAudioSettings({ ...audioSettings, enableSpectrogram: e.target.checked })} />
                  <span className="text-sm text-muted-foreground">Ativar espectrograma (WaveSurfer)</span>
                </div>
              </div>

              <Button onClick={saveAllConfig} className="w-full md:w-auto bg-golden text-deep-black hover:bg-golden/90">
                Salvar Configurações de Áudio
              </Button>
            </CardContent>
          </Card>

          {/* Featured Sections (Restored to match Area de Gerenciamento) */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-black text-golden uppercase tracking-tighter">Destaques e Páginas Principal</CardTitle>
                <CardDescription>Configure os 8 slots de cada página de destaques do site.</CardDescription>
              </div>
              <Button onClick={addNewPage} className="bg-golden/10 border border-golden/30 text-golden hover:bg-golden hover:text-black">
                ADICIONAR NOVA PÁGINA
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                {allPages.map((_, i) => (
                  <Button key={i} onClick={() => setCurrentPage(i)} variant={currentPage === i ? "default" : "outline"} className={`rounded-full px-6 font-bold ${currentPage === i ? 'bg-golden text-black' : 'border-golden/20 text-golden/60'}`}>
                    PÁGINA {i + 1}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {allPages[currentPage]?.map((item, idx) => (
                  <div key={idx} className="bg-black/40 border border-golden/10 rounded-xl p-4 hover:border-golden/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black bg-golden/20 text-golden px-2 py-0.5 rounded">SLOT {idx + 1}</span>
                      <Music className="w-3 h-3 text-golden/30" />
                    </div>
                    <Input placeholder="Título" value={item.title} onChange={(e) => handleFeaturedChange(currentPage, idx, "title", e.target.value)} className="bg-transparent border-b border-t-0 border-l-0 border-r-0 border-golden/20 rounded-none h-8 p-0 text-sm font-bold focus-visible:ring-0 mb-3" />
                    <div className="flex gap-2">
                      <Input placeholder="URL Media" value={item.url} onChange={(e) => handleFeaturedChange(currentPage, idx, "url", e.target.value)} className="bg-transparent border-b border-t-0 border-l-0 border-r-0 border-golden/20 rounded-none h-8 p-0 text-[10px] focus-visible:ring-0 flex-1" />
                      <div className="relative">
                        <Input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onChange={(e) => handleSlotUpload(e, currentPage, idx)}
                          accept="audio/*,video/*,image/*"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-golden hover:bg-golden/10 hover:text-golden">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-golden/10 flex justify-between">
                {allPages.length > 1 && <Button variant="ghost" onClick={() => removePage(currentPage)} className="text-destructive hover:bg-destructive/10 font-bold uppercase text-[10px]">Excluir Página {currentPage + 1}</Button>}
                <Button onClick={saveFeatured} disabled={loadingScreens} className="bg-golden text-black font-black px-12 h-12 shadow-lg shadow-golden/10 hover:scale-105 transition-transform">
                  {loadingScreens ? "SALVANDO..." : "SALVAR ALTERAÇÕES DESTA PAGINA"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Management Area Portal */}
          <section id="management-portal" className="pt-12">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-black text-golden uppercase tracking-tighter">Área de Gerenciamento</h2>
              <div className="w-24 h-1 bg-golden mx-auto mt-2 rounded-full opacity-50"></div>
            </div>
            <UploadSection />
          </section>

        </div>
      </div>
      <Footer />
      <MusicLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleLibrarySelect}
      />
    </div>
  );
};

export default Settings;
