import { Music, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Header = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const social =
    typeof window !== "undefined" ? localStorage.getItem("socialLinks") : null;
  const envWhatsapp = import.meta.env.VITE_WHATSAPP_URL || "";
  let whatsappLink = envWhatsapp || "https://wa.me/";
  try {
    const parsed = social ? JSON.parse(social) : {};
    if (parsed && parsed.whatsapp) whatsappLink = parsed.whatsapp;
  } catch { }

  const navLinks = [
    { href: "/#home", label: "Início" },
    { href: "/#genres", label: "Gêneros" },
    { href: "/#biography", label: "Biografia" },
    { href: "/fanclub", label: "Fã Clube" },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith("/#")) {
      const anchorId = href.replace("/", ""); // "#home"

      // Se estamos em outra página (não na principal), navegar primeiro
      if (window.location.pathname !== "/") {
        navigate("/");
        // Aguardar a navegação e então fazer scroll
        setTimeout(() => {
          const element = document.querySelector(anchorId);
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        // Já estamos na página principal, apenas fazer scroll
        const element = document.querySelector(anchorId);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
      data-oid="r9jl1bo"
    >
      <div
        className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between"
        data-oid=":7rlzci"
      >
        <div className="flex items-center gap-4 md:gap-8" data-oid="3832f75">
          <Music className="w-6 h-6 md:w-8 md:h-8 text-primary" data-oid="e9d6t.4" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6" data-oid=".rp-0-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="text-foreground/80 hover:text-primary transition-colors cursor-pointer"
                data-oid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4" data-oid="hvezz6j">
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground/80 hover:text-primary w-8 h-8 md:w-10 md:h-10"
            onClick={() => navigate("/settings")}
            title="Configurações"
            data-oid="2ikpvk."
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" data-oid="19eh0mj" />
          </Button>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-foreground/80 hover:text-primary w-8 h-8"
                data-oid="mobile-menu-btn"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background/95 backdrop-blur-lg border-golden/20">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-primary">
                  <Music className="w-5 h-5" />
                  <span>Menu</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className="text-left text-lg text-foreground/80 hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-golden/10"
                  >
                    {link.label}
                  </button>
                ))}
                <hr className="border-golden/20 my-2" />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/settings");
                  }}
                  className="text-left text-lg text-foreground/80 hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-golden/10 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
