import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
    mediaId: string;
    size?: "sm" | "md" | "lg";
    showCount?: boolean;
    className?: string;
}

export const LikeButton = ({
    mediaId,
    size = "md",
    showCount = false,
    className
}: LikeButtonProps) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Size mappings
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };

    // Check if user has liked this media
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (!mediaId) return;

            // Get like count
            const { count, error: countError } = await supabase
                .from("music_likes")
                .select("*", { count: "exact", head: true })
                .eq("media_id", mediaId);

            if (!countError && count !== null) {
                setLikeCount(count);
            }

            // Check if current user has liked
            if (user) {
                const { data, error } = await supabase
                    .from("music_likes")
                    .select("id")
                    .eq("media_id", mediaId)
                    .eq("user_id", user.id)
                    .single();

                if (!error && data) {
                    setIsLiked(true);
                }
            }
        };

        checkLikeStatus();
    }, [mediaId, user]);

    const handleToggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering parent click handlers

        if (!user) {
            toast.info("Faça login para curtir músicas");
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            if (isLiked) {
                // Unlike
                const { error } = await supabase
                    .from("music_likes")
                    .delete()
                    .eq("media_id", mediaId)
                    .eq("user_id", user.id);

                if (error) throw error;

                setIsLiked(false);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                // Like
                const { error } = await supabase
                    .from("music_likes")
                    .insert({ media_id: mediaId, user_id: user.id });

                if (error) throw error;

                setIsLiked(true);
                setLikeCount(prev => prev + 1);

                // Trigger animation
                setIsAnimating(true);
                setTimeout(() => setIsAnimating(false), 300);
            }
        } catch (error: any) {
            console.error("Error toggling like:", error);
            toast.error("Erro ao atualizar curtida");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleLike}
            disabled={isLoading}
            className={cn(
                "flex items-center gap-1 transition-all duration-200 hover:scale-110 active:scale-95",
                isLoading && "opacity-50 cursor-not-allowed",
                className
            )}
            title={isLiked ? "Descurtir" : "Curtir"}
        >
            <Heart
                className={cn(
                    sizeClasses[size],
                    "transition-all duration-300",
                    isLiked
                        ? "fill-red-500 text-red-500"
                        : "text-white/70 hover:text-red-400",
                    isAnimating && "animate-ping"
                )}
            />
            {showCount && likeCount > 0 && (
                <span className="text-xs text-white/70">{likeCount}</span>
            )}
        </button>
    );
};
