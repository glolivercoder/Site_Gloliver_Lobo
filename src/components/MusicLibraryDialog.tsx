
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, FileAudio, Search, Loader2, Play, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase, getSupabaseUrl } from "@/lib/supabase";

interface MusicLibraryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (url: string, filename: string, mediaId?: string) => void;
}

export const MusicLibraryDialog = ({ open, onOpenChange, onSelect }: MusicLibraryDialogProps) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (open) {
            loadFiles();
        } else {
            stopPreview();
        }
    }, [open]);

    const loadFiles = async () => {
        setLoading(true);
        try {
            // Fetch from 'media_files' table to get pretty titles and correct paths
            const { data, error } = await supabase
                .from('media_files')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFiles(data || []);
        } catch (e) {
            console.error("Error loading library from DB:", e);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = (file: any) => {
        // file_path is stored in DB relative to bucket root (e.g. "user_id/123.mp3")
        const url = getSupabaseUrl('media', file.file_path);

        if (previewUrl === url) {
            stopPreview();
        } else {
            if (audioElement) audioElement.pause();
            const audio = new Audio(url);
            audio.play();
            setAudioElement(audio);
            setPreviewUrl(url);
            audio.onended = () => setPreviewUrl(null);
        }
    };

    const stopPreview = () => {
        if (audioElement) {
            audioElement.pause();
            setAudioElement(null);
        }
        setPreviewUrl(null);
    };

    const handleSelect = (file: any) => {
        const url = getSupabaseUrl('media', file.file_path);
        // Use the pretty title from DB, or fallback to filename if title is missing
        const displayTitle = file.title || file.file_path.split('/').pop();
        onSelect(url, displayTitle, file.id);
        onOpenChange(false);
    };

    const filteredFiles = files.filter(f => {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = (f.title || "").toLowerCase().includes(searchLower);
        const nameMatch = (f.file_path || "").toLowerCase().includes(searchLower);
        // Filter by audio types or generic search
        const isAudio = f.type === 'audio' || (f.file_path && f.file_path.match(/\.(mp3|wav|ogg|m4a)$/i));
        return (titleMatch || nameMatch) && isAudio;
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-deep-black border-golden/20 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-golden flex items-center gap-2">
                        <Music className="w-6 h-6" /> Biblioteca de Músicas (Supabase)
                    </DialogTitle>
                    <div className="hidden">
                        <p id="music-library-desc">Selecione uma música da sua biblioteca para adicionar ao destaque.</p>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Buscar por título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-black/40 border-golden/20 focus:border-golden"
                        />
                    </div>

                    <ScrollArea className="h-[300px] border border-golden/10 rounded-md bg-black/20 p-2">
                        {loading ? (
                            <div className="flex justify-center items-center h-full text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando do Banco de Dados...
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                Nenhuma música encontrada no banco.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredFiles.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-2 hover:bg-golden/10 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-full bg-golden/20 flex items-center justify-center shrink-0 text-golden">
                                                <FileAudio className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate text-white group-hover:text-golden transition-colors">
                                                    {file.title || "Sem Título"}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {new Date(file.created_at).toLocaleDateString()} • {file.genre || "Geral"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handlePreview(file)}
                                                className="h-8 w-8 text-muted-foreground hover:text-golden"
                                                title="Ouvir Preview"
                                            >
                                                {previewUrl?.includes(file.file_path) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleSelect(file)}
                                                className="bg-golden/10 hover:bg-golden text-golden hover:text-black border border-golden/20 h-8 text-xs font-bold"
                                            >
                                                Selecionar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};
