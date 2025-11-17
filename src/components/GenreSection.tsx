import { Music2, Guitar, Disc3, Radio, Flame, Church, MessageSquare, Piano } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { GenreLibraryDialog } from "@/components/GenreLibraryDialog";
const genres = [
  { name: "Rock", value: "rock", icon: Guitar, color: "from-red-500 to-orange-500" },
  { name: "Sertanejo", value: "sertanejo", icon: Music2, color: "from-amber-500 to-yellow-500" },
  { name: "Rap", value: "rap", icon: Radio, color: "from-purple-500 to-pink-500" },
  { name: "Trap", value: "trap", icon: Disc3, color: "from-blue-500 to-cyan-500" },
  { name: "Reggae", value: "reggae", icon: Flame, color: "from-green-500 to-emerald-500" },
  { name: "Gospel", value: "gospel", icon: Church, color: "from-indigo-500 to-violet-500" },
  { name: "Polêmicas", value: "polemicas", icon: MessageSquare, color: "from-rose-500 to-red-500" },
  { name: "Instrumental", value: "instrumental", icon: Piano, color: "from-slate-500 to-zinc-500" },
];
export const GenreSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<"rock" | "sertanejo" | "gospel" | "reggae" | "polemicas" | "rap" | "trap" | "instrumental" | null>(null);

  const openCollection = (value: string) => {
    setSelectedGenre(value as any);
    setDialogOpen(true);
  };

  return <section id="genres" className="py-24 px-6 relative">
      <div className="container mx-auto rounded-sm">
        <h2 className="text-4xl font-bold text-center mb-16 text-primary md:text-4xl">
          Gêneros Musicais
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {genres.map((genre, index) => <Card key={genre.name} className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 cursor-pointer hover:scale-105 animate-fade-in" style={{
          animationDelay: `${index * 0.1}s`
        }} onClick={() => openCollection(genre.value)}>
              <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="p-6 relative z-10">
                <genre.icon className="w-12 h-12 mb-4 text-primary group-hover:text-golden transition-colors" />
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {genre.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Explorar coleção
                </p>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Card>)}
        </div>
      </div>
      <GenreLibraryDialog open={dialogOpen} onOpenChange={setDialogOpen} genreKey={selectedGenre} />
    </section>;
};
