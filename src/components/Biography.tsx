import { Card } from "@/components/ui/card";
import { Award, Music, Heart, Mic } from "lucide-react";

export const Biography = () => {
  return (
    <section
      id="biography"
      className="py-24 px-6 relative bg-gradient-to-b from-background to-muted/20"
      data-oid="3derfuh"
    >
      <div className="container mx-auto max-w-6xl" data-oid="yietnhk">
        <h2
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-primary"
          data-oid="-yrhq37"
        >
          Biografia Artística
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12" data-oid="o8b9cox">
          <Card
            className="p-8 bg-card/50 backdrop-blur-sm border-border/50"
            data-oid="ez8.:0k"
          >
            <div className="space-y-6" data-oid=":js5eez">
              <div className="flex items-start gap-4" data-oid="i37946z">
                <div
                  className="p-3 rounded-lg bg-primary/10"
                  data-oid="j2bwg00"
                >
                  <Music className="w-6 h-6 text-primary" data-oid="hv:fno:" />
                </div>
                <div data-oid="b9onxma">
                  <h3
                    className="text-xl font-semibold mb-2 text-foreground"
                    data-oid="osfhs80"
                  >
                    A Jornada Musical
                  </h3>
                  <p className="text-muted-foreground" data-oid="m9ibb9p">
                    Gloliver Lobo é um compositor contemporâneo que transcende
                    fronteiras musicais, explorando diversos gêneros com
                    maestria e autenticidade. Sua música reflete a alma de um
                    artista que não teme experimentar e inovar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4" data-oid="c9-prn4">
                <div
                  className="p-3 rounded-lg bg-primary/10"
                  data-oid="emkcuy-"
                >
                  <Heart className="w-6 h-6 text-primary" data-oid="fpf2jem" />
                </div>
                <div data-oid="l5j.8zc">
                  <h3
                    className="text-xl font-semibold mb-2 text-foreground"
                    data-oid="_8.2ljm"
                  >
                    Estilo Único
                  </h3>
                  <p className="text-muted-foreground" data-oid="evpncqn">
                    Com influências que vão do rock ao gospel, do rap ao
                    sertanejo, Gloliver cria composições que tocam o coração e
                    provocam reflexão, sempre mantendo sua identidade artística
                    única.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="p-8 bg-card/50 backdrop-blur-sm border-border/50"
            data-oid="iulhiyh"
          >
            <div className="space-y-6" data-oid="p9bl:tm">
              <div className="flex items-start gap-4" data-oid="k0udcr2">
                <div
                  className="p-3 rounded-lg bg-primary/10"
                  data-oid="q8n5qbv"
                >
                  <Mic className="w-6 h-6 text-primary" data-oid="1wfyvk8" />
                </div>
                <div data-oid="-9_pcu3">
                  <h3
                    className="text-xl font-semibold mb-2 text-foreground"
                    data-oid="wh3i0_a"
                  >
                    Produção Musical
                  </h3>
                  <p className="text-muted-foreground" data-oid="0h.fbrz">
                    Cada composição é cuidadosamente produzida, combinando
                    técnicas modernas com sensibilidade artística. O resultado
                    são obras que capturam emoções e contam histórias através da
                    música.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4" data-oid="otx9y.k">
                <div
                  className="p-3 rounded-lg bg-primary/10"
                  data-oid="094m41r"
                >
                  <Award className="w-6 h-6 text-primary" data-oid="2oij6q7" />
                </div>
                <div data-oid="59a4g8.">
                  <h3
                    className="text-xl font-semibold mb-2 text-foreground"
                    data-oid="w0-dnua"
                  >
                    Reconhecimento
                  </h3>
                  <p className="text-muted-foreground" data-oid="n6h:ztz">
                    Com um catálogo crescente de obras originais, Gloliver Lobo
                    continua a conquistar ouvintes com sua versatilidade e
                    paixão pela música, estabelecendo-se como uma voz importante
                    na cena musical contemporânea.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center" data-oid="3-72x9l">
          <blockquote
            className="text-2xl md:text-3xl font-light italic text-foreground/80 max-w-3xl mx-auto"
            data-oid="q:uso20"
          >
            "A música é a linguagem universal que conecta almas e transcende
            barreiras. Através dela, compartilho minha visão de mundo e minhas
            emoções mais profundas."
          </blockquote>
          <p className="mt-4 text-primary font-semibold" data-oid="mv0jocw">
            — Gloliver Lobo
          </p>
        </div>
      </div>
    </section>
  );
};
