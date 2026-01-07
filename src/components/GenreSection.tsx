import {
  Music2,
  Guitar,
  Disc3,
  Radio,
  Flame,
  Church,
  MessageSquare,
  Piano,
  Headphones,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { GenreLibraryDialog } from "@/components/GenreLibraryDialog";
const genres = [
  {
    name: "Rock",
    value: "rock",
    icon: Guitar,
    color: "from-red-500 to-orange-500",
  },
  {
    name: "Sertanejo",
    value: "sertanejo",
    icon: Music2,
    color: "from-amber-500 to-yellow-500",
  },
  {
    name: "Rap",
    value: "rap",
    icon: Radio,
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Trap",
    value: "trap",
    icon: Disc3,
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Reggae",
    value: "reggae",
    icon: Flame,
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "Gospel",
    value: "gospel",
    icon: Church,
    color: "from-indigo-500 to-violet-500",
  },
  {
    name: "Polêmicas",
    value: "polemicas",
    icon: MessageSquare,
    color: "from-rose-500 to-red-500",
  },
  {
    name: "Instrumental",
    value: "instrumental",
    icon: Piano,
    color: "from-slate-500 to-zinc-500",
  },
  {
    name: "Eletro Hits",
    value: "eletrohits",
    icon: Headphones,
    color: "from-fuchsia-500 to-cyan-500",
  },
];

export const GenreSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<
    | "rock"
    | "sertanejo"
    | "gospel"
    | "reggae"
    | "polemicas"
    | "rap"
    | "trap"
    | "instrumental"
    | "eletrohits"
    | null
  >(null);

  const openCollection = (value: string) => {
    setSelectedGenre(value as any);
    setDialogOpen(true);
  };

  return (
    <section id="genres" className="py-24 px-6 relative" data-oid="j085:n3">
      <div className="container mx-auto rounded-sm" data-oid="z0y155z">
        <h2
          className="text-4xl font-bold text-center mb-16 text-primary md:text-4xl"
          data-oid="ivpkxh:"
        >
          Gêneros Musicais
        </h2>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          data-oid="u3i5w7e"
        >
          {genres.map((genre, index) => (
            <Card
              key={genre.name}
              className="group relative overflow-hidden bg-deep-black/50 border-golden/20 backdrop-blur-sm hover:border-golden/60 transition-all duration-300 hover:scale-105 cursor-pointer aspect-square flex flex-col items-center justify-center text-center animate-fade-in"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
              onClick={() => openCollection(genre.value)}
              data-oid="nfjc8r1"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                data-oid="0sflu8l"
              />

              <div className="p-4 relative z-10 flex flex-col items-center justify-center w-full h-full" data-oid=":.bal78">
                <genre.icon
                  className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-4 text-golden group-hover:text-white transition-colors"
                  data-oid="m3kmbrn"
                />

                <h3
                  className="text-sm md:text-xl font-bold text-foreground group-hover:text-white transition-colors uppercase tracking-wider"
                  data-oid="-e:gr7b"
                >
                  {genre.name}
                </h3>
              </div>

              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-golden to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                data-oid=".36y6q2"
              />
            </Card>
          ))}
        </div>
      </div>
      <GenreLibraryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        genreKey={selectedGenre}
        data-oid="oezt8y0"
      />
    </section>
  );
};
