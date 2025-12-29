import { Music, Instagram, Youtube, Facebook } from "lucide-react";

export const Footer = () => {
  const social =
    typeof window !== "undefined" ? localStorage.getItem("socialLinks") : null;
  const envWhatsapp = import.meta.env.VITE_WHATSAPP_URL || "";
  let whatsappLink = envWhatsapp || "https://wa.me/";
  try {
    const parsed = social ? JSON.parse(social) : {};
    if (parsed && parsed.whatsapp) whatsappLink = parsed.whatsapp;
  } catch { }
  return (
    <footer
      className="bg-muted/20 border-t border-border/50 py-12 px-6"
      data-oid="ktk5ozb"
    >
      <div className="container mx-auto" data-oid="1j7o7cb">
        <div className="grid md:grid-cols-3 gap-8 mb-8" data-oid="zxth524">
          <div data-oid="xhcofgt">
            <div className="flex items-center gap-2 mb-4" data-oid="9201:4o">
              <Music className="w-6 h-6 text-primary" data-oid="jgwhs6o" />
              <span
                className="text-xl font-bold text-primary"
                data-oid="dz71j3p"
              >
                Gloliver Lobo
              </span>
            </div>
            <p className="text-muted-foreground" data-oid=".0b3c_w">
              Compositor e artista multifacetado, explorando as fronteiras da
              música contemporânea.
            </p>
            <div className="mt-4" data-oid="whatsapp-footer">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
                data-oid=".8s.0xw"
              >
                <img
                  src="/favicon-whatsapp.svg"
                  alt="WhatsApp"
                  className="w-[50px] h-[50px]"
                  data-oid="sgtmgxw"
                />
              </a>
            </div>
          </div>

          <div data-oid="jg2o2zk">
            <h3
              className="text-lg font-semibold mb-4 text-foreground"
              data-oid="eklkjn0"
            >
              Links Rápidos
            </h3>
            <ul className="space-y-2" data-oid="w7y6uum">
              <li data-oid="7ddu5-6">
                <a
                  href="#home"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-oid="c51nlbe"
                >
                  Início
                </a>
              </li>
              <li data-oid="0l92pyr">
                <a
                  href="#genres"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-oid=":udq.0w"
                >
                  Gêneros
                </a>
              </li>
              <li data-oid="zx23ddl">
                <a
                  href="#biography"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-oid="f.drfqz"
                >
                  Biografia
                </a>
              </li>
            </ul>
          </div>

          <div data-oid="dxweucv">
            <h3
              className="text-lg font-semibold mb-4 text-foreground"
              data-oid="2gxt.zc"
            >
              Redes Sociais
            </h3>
            <div className="flex gap-4" data-oid="7s-x-fo">
              <a
                href="#"
                className="p-2 rounded-lg bg-card/50 hover:bg-primary/10 border border-border/50 hover:border-primary/50 transition-all"
                data-oid="3-a.60l"
              >
                <Instagram
                  className="w-5 h-5 text-muted-foreground hover:text-primary"
                  data-oid="_5fc3:y"
                />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-card/50 hover:bg-primary/10 border border-border/50 hover:border-primary/50 transition-all"
                data-oid="i6s9m.1"
              >
                <Youtube
                  className="w-5 h-5 text-muted-foreground hover:text-primary"
                  data-oid="y.iv10n"
                />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-card/50 hover:bg-primary/10 border border-border/50 hover:border-primary/50 transition-all"
                data-oid="sakpksu"
              >
                <Facebook
                  className="w-5 h-5 text-muted-foreground hover:text-primary"
                  data-oid="g-63j-_"
                />
              </a>
            </div>
          </div>
        </div>

        <div
          className="pt-8 border-t border-border/50 text-center text-muted-foreground"
          data-oid="rzytlf4"
        >
          <p data-oid="6ngmms_">
            &copy; 2025 Gloliver Lobo. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
