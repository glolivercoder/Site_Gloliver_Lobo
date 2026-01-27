import { Header } from "@/components/Header";
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
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Upload,
  HardDrive,
  Trash2,
  Users,
  Shield,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, getSupabaseUrl } from "@/lib/supabase";

// Storage Management Component (Stubbed for Supabase)
const StorageManagement = () => {
  const { user } = useAuth();

  return (
    <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-golden flex items-center gap-2">
          <HardDrive className="w-6 h-6" />
          Armazenamento Cloud
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Seus arquivos são armazenados com segurança no Supabase Storage.
          Gerencie-os através da "Galeria dos Fãs" ou na Área de Upload.
        </p>
        <div className="flex items-center gap-4 p-4 bg-background/30 rounded-lg border border-golden/10">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-2xl font-bold text-green-500">Conectado</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Conta</p>
            <p className="text-sm font-bold text-foreground truncate">{user?.email}</p>
          </div>
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
      // Fetch from profiles table (requires RLS policy for admins)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (e: any) {
      console.error("Error loading users:", e);
      // toast.error("Erro ao carregar lista de usuários (Verifique RLS).");
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

  if (!isAdmin) {
    return (
      <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
        <CardContent className="py-8 text-center text-muted-foreground">
          <h2 className="text-xl text-destructive mb-2">Acesso Restrito</h2>
          <p>Esta área é exclusiva para administradores.</p>
          <div className="mt-4 p-4 bg-black/20 rounded inline-block text-left text-sm">
            <p><strong>Logado como:</strong> {user?.email || "Desconectado"}</p>
            <p><strong>Necessário:</strong> glolivercoder@gmail.com</p>
          </div>
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
          Visualize e gerencie os perfis registrados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-golden/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-golden/20">
                <TableHead className="text-golden">Email / Nome</TableHead>
                <TableHead className="text-golden">Role</TableHead>
                <TableHead className="text-golden">Status</TableHead>
                <TableHead className="text-golden text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum usuário encontrado na tabela Profiles.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="border-golden/10">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{u.username || u.email || "Sem Email"}</span>
                        <span className="text-xs text-muted-foreground">
                          ID: {u.id.substring(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-golden/20 text-golden">
                          <Shield className="w-3 h-3 mr-1" /> Admin
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Usuário</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.is_blocked ? (
                        <span className="text-red-500 text-xs">Bloqueado</span>
                      ) : (
                        <span className="text-green-500 text-xs">Ativo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.is_blocked ? "text-green-500" : "text-destructive"}
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
        <div className="flex justify-end mt-4">
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

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingScreens, setLoadingScreens] = useState(false);

  // Initialize with 1 page of 8 empty slots
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
    // Similar logic to FeaturedSection but for Editing
    const { data } = await supabase.from('featured_slots').select('*').order('id');
    if (data) {
      const slots = data;
      const maxPage = slots.length > 0 ? Math.max(...slots.map(s => s.page_index)) : 0;
      const totalPages = maxPage + 1;

      const newPages = [];
      for (let p = 0; p < totalPages; p++) {
        const pageItems = [];
        for (let s = 0; s < 8; s++) {
          const slot = slots.find(i => i.page_index === p && i.slot_index === s);
          if (slot) {
            pageItems.push({
              id: slot.id, // DB ID
              title: slot.custom_title || "",
              url: slot.external_url || "",
              type: slot.type || "video",
              thumbnail: slot.custom_thumbnail || slot.thumbnail_url || "",
              db_slot_index: slot.slot_index,
              db_page_index: slot.page_index
            });
          } else {
            pageItems.push({
              id: `temp-${p}-${s}`,
              title: `Destaque ${s + 1}`,
              url: "",
              type: "video"
            });
          }
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

  const saveFeatured = async () => {
    if (!isAdmin) return toast.error("Sem permissão.");

    setLoadingScreens(true);
    try {
      // Upsert all slots for current page (or all pages?)
      // Let's save ALL pages to be safe, or just modified ones?
      // Saving all is safer for consistency.

      const upserts = [];
      allPages.forEach((page, pIndex) => {
        page.forEach((slot, sIndex) => {
          // If it has content, save it.
          // Note: We are overwriting 'custom_title', 'external_url'.
          // If it was linked to media_file, we preserve that if we don't zero it out?
          // The Editor currently only shows Title/URL. 
          // If the user Edits the Title here, it updates 'custom_title'.

          upserts.push({
            page_index: pIndex,
            slot_index: sIndex,
            custom_title: slot.title,
            external_url: slot.url,
            type: slot.type,
            custom_thumbnail: slot.thumbnail
            // media_file_id: ??? We don't touch it here unless we add a selector.
            // This Manual Edit overrides customizations. 
          });
        });
      });

      const { error } = await supabase.from('featured_slots').upsert(upserts, {
        onConflict: 'page_index, slot_index'
      });

      if (error) throw error;
      toast.success("Destaques salvos!");
      loadFeatured(); // Reload to get fresh IDs if needed
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao salvar.");
    } finally {
      setLoadingScreens(false);
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
      // Retrieve slots for this page index from DB and delete them?
      // Or just don't save them?
      // Better: Delete from DB.
      const { error } = await supabase.from('featured_slots').delete().eq('page_index', pageIndex);
      if (error) throw error;

      // Also need to shift other pages? Or just leave hole?
      // Implementation: Just remove from local state and Reload?
      // If we remove page 1, page 2 becomes page 1?
      // That requires re-indexing in DB! Complex.
      // For now, simpler approach: Just delete the rows. 
      // Re-indexing is a heavy op. Let's Warn user.

      // Actually, if we just delete page_index=X, and reload, it's gone.
      // But if we have page 0, 1, 2. Delete 1. We have 0, 2.
      // The display logic handles 0..Max. It will show a gap?
      // My display logic loops 0 to MaxPage. So Page 1 would be empty slots.

      const updated = allPages.filter((_, i) => i !== pageIndex);
      setAllPages(updated);
      setCurrentPage(Math.max(0, currentPage - 1));
      toast.success("Página removida (Não esqueça de Salvar para reordenar se necessário!)");

      // Use Save to re-index everything?
      // If the user clicks Save after this, it will overwrite DB with new indices 0..N.
      // Yes, that's the best way.
    } catch (e) {
      toast.error("Erro ao remover.");
    }
  };

  const handleSocialChange = (platform: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const saveSocial = async () => {
    if (!isAdmin) return;
    const { error } = await supabase.from('site_config').upsert({
      key: 'social_links',
      value: socialLinks
    });
    if (error) toast.error("Erro ao salvar links.");
    else toast.success("Links salvos!");
  };

  const handleThumbnailUpload = async (
    pageIndex: number,
    itemIndex: number,
    file: File,
  ) => {
    if (!user) return;
    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const filePath = `thumbnails/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('media').upload(filePath, file);

    if (!error) {
      const url = getSupabaseUrl('media', filePath);
      handleFeaturedChange(pageIndex, itemIndex, "thumbnail", url);
      toast.success("Thumbnail enviada!");
    } else {
      toast.error("Erro upload thumbnail.");
    }
  };

  const saveAudioSettings = async () => {
    if (!isAdmin) return;
    const { error } = await supabase.from('site_config').upsert({
      key: 'audio_settings',
      value: audioSettings
    });
    if (error) toast.error("Erro ao salvar áudio.");
    else toast.success("Configurações de áudio salvas!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-golden mb-8">Configurações</h1>

          <UserManagement />

          {/* Featured Section Editor */}
          <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-golden">
                Editar Destaques {loadingScreens && <Loader2 className="inline ml-2 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={addNewPage}
                  className="bg-golden text-deep-black hover:bg-golden/90"
                >
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
                    className={
                      currentPage === index
                        ? "bg-golden text-deep-black hover:bg-golden/90"
                        : ""
                    }
                  >
                    Página {index + 1}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                {allPages[currentPage]?.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="space-y-2 p-4 border border-golden/20 rounded-lg"
                  >
                    <Label className="text-sm font-medium text-golden">
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
                    >
                      <option value="video">Vídeo</option>
                      <option value="audio">Áudio</option>
                      <option value="image">Imagem</option>
                    </select>

                    <div className="mt-2 space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Imagem Thumbnail (Upload)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="URL da imagem (ou upload)"
                          value={item.thumbnail || ""}
                          disabled
                          className="flex-1 bg-background/50 border-golden/20 focus:border-golden opacity-70"
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
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                      {item.thumbnail && (
                        <div className="relative w-20 h-20 rounded border border-golden/20 overflow-hidden">
                          <img
                            src={item.thumbnail}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={saveFeatured}
                disabled={loadingScreens}
                className="w-full md:w-auto bg-golden text-deep-black hover:bg-golden/90"
              >
                {loadingScreens ? <Loader2 className="animate-spin mr-2" /> : "Salvar Destaques"}
              </Button>
            </CardContent>
          </Card>

          {/* Social Links Config - Only if Admin */}
          {isAdmin && (
            <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-golden">Redes Sociais</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(socialLinks).map(([key, value]) => (
                  <div key={key}>
                    <Label className="capitalize">{key}</Label>
                    <Input
                      value={value}
                      onChange={(e) => handleSocialChange(key, e.target.value)}
                      className="bg-background/50 border-golden/20"
                    />
                  </div>
                ))}
                <Button onClick={saveSocial} className="w-full bg-golden text-deep-black">Salvar Redes Sociais</Button>
              </CardContent>
            </Card>
          )}

          {/* Audio Settings - Only if Admin */}
          {isAdmin && (
            <Card className="bg-deep-black/50 border-golden/20 backdrop-blur-sm">
              <CardHeader><CardTitle className="text-golden">Visualizador de Áudio</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Label>Estilo</Label>
                <Select
                  value={audioSettings.waveformStyle}
                  onValueChange={(v) => setAudioSettings({ ...audioSettings, waveformStyle: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bars">Barras</SelectItem>
                    <SelectItem value="wave">Onda</SelectItem>
                    <SelectItem value="mirror">Espelho</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={saveAudioSettings} className="w-full bg-golden text-deep-black">Salvar Configurações</Button>
              </CardContent>
            </Card>
          )}

          <StorageManagement />

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
