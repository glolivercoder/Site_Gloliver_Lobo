import { Music, Instagram, Youtube, Facebook } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const Footer = () => {
  const [socialLinks, setSocialLinks] = useState<any>({});

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const { data } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'social_links')
        .single();

      if (data?.value) {
        setSocialLinks(data.value);
      }
    } catch (error) {
      console.error("Error fetching social links:", error);
    }
  };

  const whatsappLink = socialLinks.whatsapp || import.meta.env.VITE_WHATSAPP_URL || "https://wa.me/";
  return (
    <footer className="bg-muted/20 border-t border-border/50 py-12 px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-primary">
                Gloliver Lobo
              </span>
            </div>
            <p className="text-muted-foreground">
              Compositor e artista multifacetado, explorando as fronteiras da
              música contemporânea.
            </p>
            <div className="mt-4">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <img
                  src="/favicon-whatsapp.svg"
                  alt="WhatsApp"
                  className="w-[50px] h-[50px]"
                />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Links Rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#home"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Início
                </a>
              </li>
              <li>
                <a
                  href="#genres"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Gêneros
                </a>
              </li>
              <li>
                <a
                  href="#biography"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Biografia
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Redes Sociais
            </h3>
            <div className="flex gap-4">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-card/50 hover:bg-primary/10 border border-border/50 hover:border-primary/50 transition-all"
                >
                  <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-card/50 hover:bg-primary/10 border border-border/50 hover:border-primary/50 transition-all"
                >
                  <Youtube className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-card/50 hover:bg-primary/10 border border-border/50 hover:border-primary/50 transition-all"
                >
                  <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 text-center text-muted-foreground">
          <p>&copy; 2025 Gloliver Lobo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
