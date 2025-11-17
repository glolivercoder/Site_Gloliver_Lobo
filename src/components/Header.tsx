import { Music, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const social = typeof window !== "undefined" ? localStorage.getItem("socialLinks") : null;
  const envWhatsapp = import.meta.env.VITE_WHATSAPP_URL || "";
  let whatsappLink = envWhatsapp || "https://wa.me/";
  try {
    const parsed = social ? JSON.parse(social) : {};
    if (parsed && parsed.whatsapp) whatsappLink = parsed.whatsapp;
  } catch {}
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Music className="w-8 h-8 text-primary" />
          <nav className="hidden md:flex gap-6">
            <a href="/#home" className="text-foreground/80 hover:text-primary transition-colors">
              Início
            </a>
            <a href="/#genres" className="text-foreground/80 hover:text-primary transition-colors">
              Gêneros
            </a>
            <a href="/#biography" className="text-foreground/80 hover:text-primary transition-colors">
              Biografia
            </a>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-foreground/80 hover:text-primary"
            onClick={() => window.open(whatsappLink, '_blank')}
            title="Contato WhatsApp"
          >
            <img src="/favicon-whatsapp.svg" alt="WhatsApp" className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-foreground/80 hover:text-primary"
            onClick={() => navigate('/settings')}
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
