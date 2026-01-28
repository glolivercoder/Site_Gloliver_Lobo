
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
    onSelect: (url: string, filename: string) => void;
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
            // List all files in the 'media' bucket (root and subfolders if needed, but 'destaques' folder preferred)
            // For now, let's list root or broad search
            const { data, error } = await supabase.storage.from('media').list('destaques', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

            if (error) throw error;
            setFiles(data || []);
        } catch (e) {
            console.error("Error loading library:", e);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = (fileName: string) => {
        const url = getSupabaseUrl('media', `destaques/${fileName}`);

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

    const handleSelect = (fileName: string) => {
        const url = getSupabaseUrl('media', `destaques/${fileName}`);
        onSelect(url, fileName);
        onOpenChange(false);
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (f.metadata?.mimetype?.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|m4a)$/i))
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-deep-black border-golden/20 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-golden flex items-center gap-2">
                        <Music className="w-6 h-6" /> Biblioteca de Músicas (Supabase)
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Buscar música..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-black/40 border-golden/20 focus:border-golden"
                        />
                    </div>

                    <ScrollArea className="h-[300px] border border-golden/10 rounded-md bg-black/20 p-2">
                        {loading ? (
                            <div className="flex justify-center items-center h-full text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                Nenhuma música encontrada em 'destaques/'.
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
                                                    {file.name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handlePreview(file.name)}
                                                className="h-8 w-8 text-muted-foreground hover:text-golden"
                                                title="Ouvir Preview"
                                            >
                                                {previewUrl?.includes(file.name) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleSelect(file.name)}
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
