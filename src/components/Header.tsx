import { Music, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const social =
    typeof window !== "undefined" ? localStorage.getItem("socialLinks") : null;
  const envWhatsapp = import.meta.env.VITE_WHATSAPP_URL || "";
  let whatsappLink = envWhatsapp || "https://wa.me/";
  try {
    const parsed = social ? JSON.parse(social) : {};
    if (parsed && parsed.whatsapp) whatsappLink = parsed.whatsapp;
  } catch {}

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
      data-oid="r9jl1bo"
    >
      <div
        className="container mx-auto px-6 h-20 flex items-center justify-between"
        data-oid=":7rlzci"
      >
        <div className="flex items-center gap-8" data-oid="3832f75">
          <Music className="w-8 h-8 text-primary" data-oid="e9d6t.4" />
          <nav className="hidden md:flex gap-6" data-oid=".rp-0-3">
            <a
              href="/#home"
              className="text-foreground/80 hover:text-primary transition-colors"
              data-oid="5t4t:vs"
            >
              Início
            </a>
            <a
              href="/#genres"
              className="text-foreground/80 hover:text-primary transition-colors"
              data-oid="q8jy-qs"
            >
              Gêneros
            </a>
            <a
              href="/#biography"
              className="text-foreground/80 hover:text-primary transition-colors"
              data-oid="wjv0dhg"
            >
              Biografia
            </a>
            <a
              href="/fanclub"
              className="text-foreground/80 hover:text-primary transition-colors"
              data-oid="fanclub-link"
            >
              Fã Clube
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4" data-oid="hvezz6j">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground/80 hover:text-primary"
            onClick={() => navigate("/settings")}
            title="Configurações"
            data-oid="2ikpvk."
          >
            <Settings className="w-5 h-5" data-oid="19eh0mj" />
          </Button>
        </div>
      </div>
    </header>
  );
};
