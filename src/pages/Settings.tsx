import { Header } from "@/components/Header";
import { UploadSection } from "@/components/UploadSection";
import { Footer } from "@/components/Footer";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings2,
  Shield,
} from "lucide-react";
import { getStorageInfo, cleanupOldFilesByAge } from "@/utils/storage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

// Storage Management Component
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

// User Management Component
const UserManagement = () => {
  const { isAdmin } = useAuth();
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
      // In Supabase, we typically use a 'profiles' table to list users on the client side
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      console.error("Error loading users:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === "gloliverlobo@gmail.com") {
      toast.error("Não é possível excluir o administrador principal.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o usuário "${email}"?`))
      return;
    try {
      // Deleting from profiles table. 
      // Note: Real deletion from auth.users requires admin API or service role.
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      setUsers(users.filter((u) => u.id !== userId));
      toast.success("Usuário removido da lista.");
    } catch (e) {
      toast.error("Erro ao excluir usuário.");
    }
  };

  if (!isAdmin) {
    return (
      <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
        <CardContent className="py-8 text-center text-muted-foreground">
          Acesso restrito a administradores.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-golden flex items-center gap-2">
          <Users className="w-6 h-6" />
          Gerenciamento de Usuários
        </CardTitle>
        <CardDescription>
          Visualize e gerencie os perfis registrados (Fãs e Admins).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-golden/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-golden/20">
                <TableHead className="text-golden">Email</TableHead>
                <TableHead className="text-golden">Status</TableHead>
                <TableHead className="text-golden">Criado em</TableHead>
                <TableHead className="text-golden">Role</TableHead>
                <TableHead className="text-golden text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="border-golden/10">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{u.email}</span>
                        {u.full_name && <span className="text-xs text-muted-foreground">{u.full_name}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.is_blocked ? (
                        <span className="text-destructive text-xs font-bold uppercase">Bloqueado</span>
                      ) : (
                        <span className="text-green-500 text-xs font-bold uppercase">Ativo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {u.email === "gloliverlobo@gmail.com" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-golden/20 text-golden">
                          <Shield className="w-3 h-3 mr-1" /> Admin
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Fã</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.email !== "gloliverlobo@gmail.com" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`text-xs ${u.is_blocked ? "border-green-500 text-green-500" : "border-destructive text-destructive"}`}
                            onClick={async () => {
                              const { error } = await supabase.from('profiles').update({ is_blocked: !u.is_blocked }).eq('id', u.id);
                              if (error) toast.error("Erro ao alterar status.");
                              else {
                                toast.success(u.is_blocked ? "Usuário desbloqueado!" : "Usuário bloqueado!");
                                loadUsers();
                              }
                            }}
                          >
                            {u.is_blocked ? "Desbloquear" : "Bloquear"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-muted-foreground">
            * A exclusão remove apenas o perfil. O bloqueio impede ações no site.
          </p>
          <Button
            variant="outline"
            onClick={loadUsers}
            disabled={loading}
            className="border-golden/20 hover:bg-golden/10"
          >
            Atualizar Lista
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Media Management Component
const MediaManagement = () => {
  const { isAdmin } = useAuth();
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("media_files").select("*, profiles(email)").order("created_at", { ascending: false });
      if (error) throw error;
      setMedia(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) loadMedia(); }, [isAdmin]);

  const handleDeleteMedia = async (id: string, path: string) => {
    if (!confirm("Excluir esta mídia permanentemente?")) return;
    try {
      await supabase.storage.from("media").remove([path]);
      await supabase.from("media_files").delete().eq("id", id);
      setMedia(media.filter(m => m.id !== id));
      toast.success("Mídia removida.");
    } catch (e) {
      toast.error("Erro ao excluir.");
    }
  };

  if (!isAdmin) return null;

  return (
    <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-golden flex items-center gap-2">
          <Trash2 className="w-6 h-6" />
          Gerenciar Todas as Mídias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto rounded-md border border-golden/20">
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Autor</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {media.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">{m.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.profiles?.email || 'N/A'}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteMedia(m.id, m.file_path)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Activity Logs Component
const ActivityLogs = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);

  const loadLogs = async () => {
    const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(20);
    setLogs(data || []);
  };

  useEffect(() => { if (isAdmin) loadLogs(); }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
      <CardHeader><CardTitle className="text-lg text-golden">Registros de Atividade (Notificações)</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="text-xs p-2 border-b border-golden/10 flex justify-between">
              <span><strong>{log.action}</strong>: {log.details}</span>
              <span className="text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const { isAdmin } = useAuth();
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

  useEffect(() => {
    const storedPages = localStorage.getItem("featuredPages");
    if (storedPages) try { setAllPages(JSON.parse(storedPages)); } catch (e) { }

    const storedSocial = localStorage.getItem("socialLinks");
    if (storedSocial) try { setSocialLinks(JSON.parse(storedSocial)); } catch (e) { }

    const storedAudioSettings = localStorage.getItem("audioSettings");
    if (storedAudioSettings) try { setAudioSettings(JSON.parse(storedAudioSettings)); } catch (e) { }
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
    toast.success("Destaques salvos!");
  };

  const addNewPage = () => {
    const newPage = Array(8).fill(null).map((_, i) => ({
      id: allPages.length * 8 + i + 1,
      title: `Destaque ${allPages.length * 8 + i + 1}`,
      url: "",
      type: "video",
    }));
    setAllPages([...allPages, newPage]);
    setCurrentPage(allPages.length);
  };

  const removePage = (pageIndex: number) => {
    if (allPages.length === 1) return;
    const updated = allPages.filter((_, i) => i !== pageIndex);
    setAllPages(updated);
    setCurrentPage(0);
    localStorage.setItem("featuredPages", JSON.stringify(updated));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const saveSocial = () => {
    localStorage.setItem("socialLinks", JSON.stringify(socialLinks));
    toast.success("Redes sociais atualizadas!");
  };

  const saveAudioSettings = () => {
    localStorage.setItem("audioSettings", JSON.stringify(audioSettings));
    window.dispatchEvent(new Event("storage"));
    toast.success("Visualizador atualizado!");
  };

  const handleThumbnailUpload = (pageIndex: number, itemIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleFeaturedChange(pageIndex, itemIndex, "thumbnail", reader.result as string);
      toast.success("Thumbnail pronto!");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-golden mb-8">Administração</h1>

          {isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <UserManagement />
              <ActivityLogs />
              <MediaManagement />
              <StorageManagement />
            </div>
          )}

          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-2xl text-golden">Destaques e Redes Sociais</CardTitle></CardHeader>
            <CardContent className="space-y-8">
              {/* Redes Sociais Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(socialLinks).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <Label className="capitalize text-xs text-muted-foreground">{key}</Label>
                    <Input value={val} onChange={(e) => handleSocialChange(key, e.target.value)} className="bg-background/50 border-golden/20 h-8 text-xs" />
                  </div>
                ))}
              </div>
              <Button onClick={saveSocial} className="bg-golden text-deep-black h-8 text-xs">Salvar Links</Button>

              <hr className="border-golden/10" />

              {/* Destaques Editor */}
              <div className="flex gap-2 mb-4">
                <Button onClick={addNewPage} size="sm" className="bg-golden text-deep-black">Nova Página</Button>
                <Button onClick={() => removePage(currentPage)} size="sm" variant="destructive">Apagar Página</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1 mb-4">
                {allPages.map((_, i) => (
                  <Button key={i} onClick={() => setCurrentPage(i)} variant={currentPage === i ? "default" : "outline"} size="sm" className={currentPage === i ? "bg-golden text-deep-black" : ""}>{i + 1}</Button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allPages[currentPage]?.map((item, index) => (
                  <div key={item.id} className="p-3 border border-golden/10 rounded">
                    <Label className="text-[10px] text-golden uppercase">Destaque {index + 1}</Label>
                    <Input placeholder="Título" value={item.title} onChange={(e) => handleFeaturedChange(currentPage, index, "title", e.target.value)} className="h-8 text-xs mb-1" />
                    <Input placeholder="URL" value={item.url} onChange={(e) => handleFeaturedChange(currentPage, index, "url", e.target.value)} className="h-8 text-xs" />
                  </div>
                ))}
              </div>
              <Button onClick={saveFeatured} className="bg-golden text-deep-black h-8 text-xs">Salvar Destaques</Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-xl text-golden">Visualizador de Áudio</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(audioSettings).filter(([k, v]) => typeof v === 'number' || typeof v === 'string').map(([k, v]) => (
                    <div key={k} className="space-y-1">
                      <Label className="text-[10px] capitalize">{k}</Label>
                      <Input value={String(v)} onChange={(e) => setAudioSettings({ ...audioSettings, [k]: e.target.value })} className="h-8 text-xs" />
                    </div>
                  ))}
                </div>
                <Button onClick={saveAudioSettings} className="mt-4 bg-golden text-deep-black h-8 text-xs">Salvar Visualizador</Button>
              </CardContent>
            </Card>
          )}

          <UploadSection />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
