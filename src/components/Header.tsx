

import { Music, Settings, Menu, LogIn, LogOut, User } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "./LoginDialog";

export const Header = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
      if (window.location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const element = document.querySelector(anchorId);
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const element = document.querySelector(anchorId);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
        data-oid="r9jl1bo"
      >
        <div
          className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between"
          data-oid=":7rlzci"
        >
          <div className="flex items-center gap-4 md:gap-8" data-oid="3832f75">
            <Music
              className="w-6 h-6 md:w-8 md:h-8 text-primary"
              data-oid="e9d6t.4"
            />

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
            {/* User Menu / Login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8 border border-golden/20">
                      <AvatarImage
                        src={
                          user.avatar
                            ? `http://127.0.0.1:8090/api/files/users/${user.id}/${user.avatar}`
                            : undefined
                        }
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-golden/10 text-golden">
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-deep-black/95 border-golden/20"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-golden">
                        {user.name || "Usuário"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-golden/20" />
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="cursor-pointer hover:bg-golden/10 hover:text-golden"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground/80 hover:text-primary"
                onClick={() => setShowLogin(true)}
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Entrar</span>
              </Button>
            )}

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
              <SheetContent
                side="right"
                className="w-[280px] bg-background/95 backdrop-blur-lg border-golden/20"
              >
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
                  {!user ? (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setShowLogin(true);
                      }}
                      className="text-left text-lg text-foreground/80 hover:text-primary transition-colors py-2 px-4 rounded-lg hover:bg-golden/10 flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Entrar
                    </button>
                  ) : (
                    <>
                      {isAdmin && (
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
                      )}
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          handleLogout();
                        }}
                        className="text-left text-lg text-destructive hover:text-destructive/90 transition-colors py-2 px-4 rounded-lg hover:bg-destructive/10 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
    </>
  );
};
