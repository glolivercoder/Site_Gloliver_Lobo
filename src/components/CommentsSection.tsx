import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comment {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    user_email?: string;
    user_name?: string;
}

interface CommentsSectionProps {
    postId: string;
    className?: string;
}

export const CommentsSection = ({ postId, className }: CommentsSectionProps) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Load comments
    useEffect(() => {
        if (isExpanded) {
            loadComments();
        }
    }, [postId, isExpanded]);

    const loadComments = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("fan_club_comments")
                .select("*")
                .eq("post_id", postId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            // Fetch user info for each comment
            if (data) {
                const commentsWithUsers = await Promise.all(
                    data.map(async (comment) => {
                        const { data: userData } = await supabase.auth.admin.getUserById
                            ? { data: null }
                            : await supabase
                                .from("profiles")
                                .select("name")
                                .eq("id", comment.user_id)
                                .single();

                        return {
                            ...comment,
                            user_name: userData?.name || "Usuário",
                        };
                    })
                );
                setComments(commentsWithUsers);
            }
        } catch (error) {
            console.error("Error loading comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.info("Faça login para comentar");
            return;
        }

        if (!newComment.trim()) return;
        if (newComment.length > 500) {
            toast.error("Comentário muito longo (máx 500 caracteres)");
            return;
        }

        setIsSending(true);
        try {
            const { error } = await supabase.from("fan_club_comments").insert({
                post_id: postId,
                user_id: user.id,
                content: newComment.trim(),
            });

            if (error) throw error;

            setNewComment("");
            loadComments();
            toast.success("Comentário adicionado!");
        } catch (error: any) {
            console.error("Error adding comment:", error);
            toast.error("Erro ao adicionar comentário");
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            const { error } = await supabase
                .from("fan_club_comments")
                .delete()
                .eq("id", commentId)
                .eq("user_id", user?.id);

            if (error) throw error;

            setComments((prev) => prev.filter((c) => c.id !== commentId));
            toast.success("Comentário removido");
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error("Erro ao remover comentário");
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className={cn("border-t border-golden/10", className)}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 text-sm text-muted-foreground hover:text-golden transition-colors"
            >
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Comentários ({comments.length})</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>

            {/* Comments Panel */}
            {isExpanded && (
                <div className="px-3 pb-3 space-y-3 animate-fade-in">
                    {/* Comment Form */}
                    {user && (
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Escreva um comentário..."
                                maxLength={500}
                                className="flex-1 bg-deep-black/50 border-golden/20 text-sm placeholder:text-muted-foreground/50"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isSending || !newComment.trim()}
                                className="bg-golden text-deep-black hover:bg-golden/90 shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    )}

                    {/* Comments List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-golden/20">
                        {isLoading ? (
                            <p className="text-xs text-muted-foreground text-center py-2">
                                Carregando...
                            </p>
                        ) : comments.length > 0 ? (
                            comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="group bg-white/5 rounded-lg p-2 text-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-golden text-xs">
                                                    {comment.user_name || "Usuário"}
                                                </span>
                                                <span className="text-xs text-muted-foreground/50">
                                                    {formatDate(comment.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-foreground/90 break-words">
                                                {comment.content}
                                            </p>
                                        </div>
                                        {user?.id === comment.user_id && (
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-2 italic">
                                Nenhum comentário ainda. Seja o primeiro!
                            </p>
                        )}
                    </div>

                    {!user && (
                        <p className="text-xs text-muted-foreground text-center">
                            Faça login para comentar
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
