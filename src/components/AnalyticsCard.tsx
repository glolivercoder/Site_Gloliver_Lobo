import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Heart, Music, TrendingUp, BarChart3 } from "lucide-react";

interface MusicLikeStat {
    id: string;
    title: string;
    likeCount: number;
}

export const AnalyticsCard = () => {
    const [topLikedMusic, setTopLikedMusic] = useState<MusicLikeStat[]>([]);
    const [totalLikes, setTotalLikes] = useState(0);
    const [totalMedia, setTotalMedia] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            // Get total media count
            const { count: mediaCount } = await supabase
                .from("media_files")
                .select("*", { count: "exact", head: true });
            setTotalMedia(mediaCount || 0);

            // Get total likes count
            const { count: likesCount } = await supabase
                .from("music_likes")
                .select("*", { count: "exact", head: true });
            setTotalLikes(likesCount || 0);

            // Get likes grouped by media with titles
            const { data: likesData, error } = await supabase
                .from("music_likes")
                .select(`
          media_id,
          media:media_files (
            id,
            title
          )
        `);

            if (!error && likesData) {
                // Count likes per media
                const likesMap = new Map<string, { title: string; count: number }>();

                likesData.forEach((like: any) => {
                    if (like.media) {
                        const existing = likesMap.get(like.media_id);
                        if (existing) {
                            existing.count++;
                        } else {
                            likesMap.set(like.media_id, {
                                title: like.media.title || "Sem título",
                                count: 1
                            });
                        }
                    }
                });

                // Convert to array and sort by count
                const sortedStats: MusicLikeStat[] = Array.from(likesMap.entries())
                    .map(([id, data]) => ({ id, title: data.title, likeCount: data.count }))
                    .sort((a, b) => b.likeCount - a.likeCount)
                    .slice(0, 10);

                setTopLikedMusic(sortedStats);
            }
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Hardcoded site sections for now (in future, could track with analytics)
    const siteAreas = [
        { name: "Início", views: "~", color: "bg-golden/20" },
        { name: "Destaques", views: "~", color: "bg-amber-500/20" },
        { name: "Gêneros", views: "~", color: "bg-purple-500/20" },
        { name: "Fã Clube", views: "~", color: "bg-pink-500/20" },
        { name: "Biografia", views: "~", color: "bg-blue-500/20" },
    ];

    return (
        <Card className="bg-deep-black/50 border-golden/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-golden">
                    <BarChart3 className="w-5 h-5" />
                    Analytics
                </CardTitle>
                <CardDescription>
                    Estatísticas de engajamento do site
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-golden/10 to-amber-500/5 p-4 rounded-lg border border-golden/20">
                        <div className="flex items-center gap-2 text-golden mb-1">
                            <Music className="w-4 h-4" />
                            <span className="text-sm font-medium">Total de Músicas</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{totalMedia}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/10 to-pink-500/5 p-4 rounded-lg border border-red-500/20">
                        <div className="flex items-center gap-2 text-red-400 mb-1">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm font-medium">Total de Curtidas</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{totalLikes}</p>
                    </div>
                </div>

                {/* Top Liked Music */}
                <div>
                    <h4 className="text-sm font-medium text-golden mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Músicas Mais Curtidas
                    </h4>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : topLikedMusic.length > 0 ? (
                        <div className="space-y-2">
                            {topLikedMusic.map((music, index) => (
                                <div
                                    key={music.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-golden font-bold w-5">
                                            #{index + 1}
                                        </span>
                                        <span className="text-sm text-foreground truncate max-w-[200px]">
                                            {music.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-red-400">
                                        <Heart className="w-3 h-3 fill-current" />
                                        <span className="text-xs font-medium">{music.likeCount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            Nenhuma curtida registrada ainda
                        </p>
                    )}
                </div>

                {/* Site Areas */}
                <div>
                    <h4 className="text-sm font-medium text-golden mb-3">
                        Áreas do Site
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {siteAreas.map((area) => (
                            <div
                                key={area.name}
                                className={`p-2 rounded-lg ${area.color} text-center`}
                            >
                                <span className="text-xs text-foreground">{area.name}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                        * Analytics de visitação em breve
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
