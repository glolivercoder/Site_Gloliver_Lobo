import { Card } from "@/components/ui/card";
import { Award, Music, Heart, Mic } from "lucide-react";

export const Biography = () => {
  return (
    <section id="biography" className="py-24 px-6 relative bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary">
          Biografia Artística
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">A Jornada Musical</h3>
                  <p className="text-muted-foreground">
                    Gloliver Lobo é um compositor contemporâneo que transcende fronteiras musicais, 
                    explorando diversos gêneros com maestria e autenticidade. Sua música reflete a 
                    alma de um artista que não teme experimentar e inovar.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Estilo Único</h3>
                  <p className="text-muted-foreground">
                    Com influências que vão do rock ao gospel, do rap ao sertanejo, Gloliver 
                    cria composições que tocam o coração e provocam reflexão, sempre mantendo 
                    sua identidade artística única.
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Produção Musical</h3>
                  <p className="text-muted-foreground">
                    Cada composição é cuidadosamente produzida, combinando técnicas modernas 
                    com sensibilidade artística. O resultado são obras que capturam emoções 
                    e contam histórias através da música.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Reconhecimento</h3>
                  <p className="text-muted-foreground">
                    Com um catálogo crescente de obras originais, Gloliver Lobo continua a 
                    conquistar ouvintes com sua versatilidade e paixão pela música, 
                    estabelecendo-se como uma voz importante na cena musical contemporânea.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="text-center">
          <blockquote className="text-2xl md:text-3xl font-light italic text-foreground/80 max-w-3xl mx-auto">
            "A música é a linguagem universal que conecta almas e transcende barreiras. 
            Através dela, compartilho minha visão de mundo e minhas emoções mais profundas."
          </blockquote>
          <p className="mt-4 text-primary font-semibold">— Gloliver Lobo</p>
        </div>
      </div>
    </section>
  );
};
