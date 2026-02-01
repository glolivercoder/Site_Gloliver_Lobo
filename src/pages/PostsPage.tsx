import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Loader2, Link as LinkIcon, Image as ImageIcon, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const PostsPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"upload" | "link">("upload");
    const [title, setTitle] = useState("");
    const [mediaType, setMediaType] = useState<"image" | "video">("image");

    // Link state
    const [externalUrl, setExternalUrl] = useState("");

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        if (!user) {
            toast.error("Faça login para postar.");
            return;
        }

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${mediaType}s/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('fan_club')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase.from('fan_club_posts').insert({
                title: title || file.name,
                type: mediaType,
                author_id: user.id,
                media_path: filePath
            });

            if (dbError) throw dbError;

            toast.success("Postagem realizada com sucesso!");
            setTitle("");
            // Reset file input handled by React key or form reset usually, simpler here:
            e.target.value = "";
        } catch (error: any) {
            console.error(error);
            toast.error(`Erro ao postar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLinkSubmit = async () => {
        if (!user) {
            toast.error("Faça login para postar.");
            return;
        }
        if (!externalUrl) {
            toast.error("Digite a URL.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('fan_club_posts').insert({
                title: title || (mediaType === "image" ? "Imagem Externa" : "Vídeo Externo"),
                type: mediaType,
                author_id: user.id,
                external_url: externalUrl
            });

            if (error) throw error;

            toast.success("Link postado com sucesso!");
            setTitle("");
            setExternalUrl("");
        } catch (error: any) {
            toast.error(`Erro ao postar link: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-deep-black text-foreground">
            <Header />
            <div className="pt-24 px-4 pb-20 max-w-4xl mx-auto">
                <h1 className="text-3xl font-black text-golden mb-2">Criar Postagem</h1>
                <p className="text-muted-foreground mb-8">Compartilhe fotos e vídeos com o Fã Clube.</p>

                <Card className="bg-deep-black/50 border-golden/20 p-6">
                    <div className="flex gap-4 mb-6">
                        <Button
                            variant={activeTab === "upload" ? "default" : "outline"}
                            onClick={() => setActiveTab("upload")}
                            className={activeTab === "upload" ? "bg-golden text-black" : "border-golden/20 text-golden"}
                        >
                            <Upload className="w-4 h-4 mr-2" /> Upload Arquivo
                        </Button>
                        <Button
                            variant={activeTab === "link" ? "default" : "outline"}
                            onClick={() => setActiveTab("link")}
                            className={activeTab === "link" ? "bg-golden text-black" : "border-golden/20 text-golden"}
                        >
                            <LinkIcon className="w-4 h-4 mr-2" /> Link Externo
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <Button
                                variant={mediaType === "image" ? "secondary" : "ghost"}
                                onClick={() => setMediaType("image")}
                                className={mediaType === "image" ? "bg-golden/20 text-golden" : "text-muted-foreground"}
                            >
                                <ImageIcon className="w-4 h-4 mr-2" /> Foto
                            </Button>
                            <Button
                                variant={mediaType === "video" ? "secondary" : "ghost"}
                                onClick={() => setMediaType("video")}
                                className={mediaType === "video" ? "bg-golden/20 text-golden" : "text-muted-foreground"}
                            >
                                <Video className="w-4 h-4 mr-2" /> Vídeo
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título / Legenda</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Escreva algo sobre sua postagem..."
                                className="bg-background/50 border-golden/20 focus:border-golden"
                            />
                        </div>

                        {activeTab === "upload" ? (
                            <div className="border-2 border-dashed border-golden/20 rounded-lg p-8 text-center hover:bg-golden/5 transition-colors relative">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    accept={mediaType === "image" ? "image/*" : "video/*"}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    disabled={loading}
                                />
                                {loading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-8 h-8 text-golden animate-spin mb-2" />
                                        <p className="text-golden">Enviando...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload className="w-8 h-8 text-golden/50 mb-2" />
                                        <p className="text-golden font-medium">Clique para selecionar</p>
                                        <p className="text-xs text-muted-foreground">
                                            Suporta {mediaType === "image" ? "JPG, PNG, WEBP" : "MP4, WEBM"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">URL do {mediaType === "image" ? "Imagem" : "Vídeo"}</label>
                                    <Input
                                        value={externalUrl}
                                        onChange={(e) => setExternalUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="bg-background/50 border-golden/20 focus:border-golden"
                                    />
                                </div>
                                <Button
                                    onClick={handleLinkSubmit}
                                    disabled={loading}
                                    className="w-full bg-golden text-black hover:bg-golden/90 font-bold"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Postar Link
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
            <Footer />
        </div>
    );
};

export default PostsPage;
