
import { useState, useEffect } from "react";
import {
    Music,
    Trash2,
    Share2,
    Play,
    Pause,
    Search,
    Loader2,
    MoreVertical,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase, getSupabaseUrl } from "@/lib/supabase";
import { format } from "date-fns";

const genreOptions = [
    { value: "rock", label: "Rock" },
    { value: "sertanejo", label: "Sertanejo" },
    { value: "gospel", label: "Gospel" },
    { value: "reggae", label: "Reggae" },
    { value: "polemicas", label: "Polêmicas" },
    { value: "rap", label: "Rap" },
    { value: "trap", label: "Trap" },
    { value: "instrumental", label: "Instrumental" },
    { value: "eletrohits", label: "Eletro Hits" },
];

export const MusicManager = () => {
    const [mediaFiles, setMediaFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deletePath, setDeletePath] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadMedia();
        return () => stopPreview();
    }, []);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('media_files')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMediaFiles(data || []);
        } catch (e) {
            console.error("Erro ao carregar mídias:", e);
            toast.error("Erro ao carregar lista de mídias.");
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = (file: any) => {
        const url = getSupabaseUrl('media', file.file_path);
        if (previewId === file.id) {
            stopPreview();
        } else {
            stopPreview();
            const audio = new Audio(url);
            audio.play();
            setAudioElement(audio);
            setPreviewId(file.id);
            audio.onended = () => setPreviewId(null);
        }
    };

    const stopPreview = () => {
        if (audioElement) {
            audioElement.pause();
            setAudioElement(null);
        }
        setPreviewId(null);
    };

    const handleShare = (file: any) => {
        const url = getSupabaseUrl('media', file.file_path);
        navigator.clipboard.writeText(url);
        toast.success("Link copiado para a área de transferência!");
    };

    const confirmDelete = (id: string, path: string) => {
        setDeleteId(id);
        setDeletePath(path);
    };

    const executeDelete = async () => {
        if (!deleteId || !deletePath) return;
        setIsDeleting(true);
        try {
            // 1. Remove from Storage
            const { error: storageError } = await supabase.storage
                .from('media')
                .remove([deletePath]);

            if (storageError) throw storageError;

            // 2. Remove from DB
            const { error: dbError } = await supabase
                .from('media_files')
                .delete()
                .eq('id', deleteId);

            if (dbError) throw dbError;

            toast.success("Arquivo excluído com sucesso.");
            setMediaFiles(prev => prev.filter(f => f.id !== deleteId));
        } catch (e: any) {
            toast.error(`Erro ao excluir: ${e.message}`);
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
            setDeletePath(null);
        }
    };

    const handleGenreUpdate = async (id: string, newGenre: string) => {
        // Optimistic Update
        setMediaFiles(prev => prev.map(f => f.id === id ? { ...f, genre: newGenre } : f));

        try {
            const { error } = await supabase
                .from('media_files')
                .update({ genre: newGenre })
                .eq('id', id);

            if (error) throw error;
            toast.success("Gênero atualizado!");
        } catch (e) {
            toast.error("Falha ao salvar gênero.");
            loadMedia(); // Revert
        }
    };

    const filtered = mediaFiles.filter(f =>
        (f.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.genre || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Filtrar por nome ou gênero..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-black/40 border-golden/20 focus:border-golden text-white"
                />
            </div>

            {/* List */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Carregando biblioteca...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border border-dashed border-golden/20 rounded-lg">
                        Nenhuma mídia encontrada.
                    </div>
                ) : (
                    filtered.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-black/40 border border-golden/10 rounded-lg hover:border-golden/30 transition-all group"
                        >
                            {/* Info */}
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`w-10 h-10 rounded-full shrink-0 ${previewId === file.id ? "bg-golden text-black animate-pulse" : "bg-golden/10 text-golden"}`}
                                    onClick={() => handlePreview(file)}
                                >
                                    {previewId === file.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </Button>

                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md" title={file.title}>
                                        {file.title || "Sem Título"}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span>{format(new Date(file.created_at), "dd/MM/yyyy")}</span>
                                        <span>•</span>
                                        <span className="uppercase">{file.type}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions & Genre */}
                            <div className="flex items-center gap-2">
                                {/* Genre Selector */}
                                <select
                                    value={file.genre || ""}
                                    onChange={(e) => handleGenreUpdate(file.id, e.target.value)}
                                    className="h-8 max-w-[100px] bg-black/60 border border-golden/20 rounded text-xs text-golden focus:border-golden cursor-pointer hidden sm:block"
                                >
                                    <option value="">Sem Gênero</option>
                                    {genreOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-black/90 border-golden/20 text-white">
                                        <DropdownMenuItem onClick={() => handleShare(file)} className="hover:bg-golden/20 cursor-pointer">
                                            <Share2 className="w-4 h-4 mr-2" /> Copiar Link
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => confirmDelete(file.id, file.file_path)}
                                            className="text-destructive hover:bg-destructive/20 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="bg-deep-black border-destructive/50 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" /> Excluir Mídia?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Esta ação não pode ser desfeita. O arquivo será removido permanentemente do banco dados e do armazenamento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/10">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Excluindo..." : "Sim, Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
