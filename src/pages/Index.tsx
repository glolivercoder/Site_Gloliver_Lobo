import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { GenreSection } from "@/components/GenreSection";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
// UploadSection removido da Home; permanece apenas nas Configurações

const Index = () => {
  // Removido estado de upload local da Home
  const lastBackTime = useRef(0);

  useEffect(() => {
    // Push initial state to create a history entry we can trap
    // Verify if we are already in trappable state to avoid infinite stacking on re-renders, 
    // but useEffect [] runs once on mount.
    window.history.pushState({ indexTrap: true }, "", window.location.pathname);

    const handlePopState = (event: PopStateEvent) => {
      // @ts-ignore
      if (event.state?.indexTrap) { return; }

      // Logic for Double Back to Exit
      // Note: If other components (like Modals) pushed their own state, they handle their own popstate events 
      // and stop propagation or just handle it before we get here IF they are active.
      // But purely based on history stack, if we are here, it means we popped to a state that Index controls (or the one before it).

      const now = Date.now();

      // If the event state is null or matches our trap, it means we popped.
      // Actually because we pushed, pop takes us to PREVIOUS state.

      if (now - lastBackTime.current < 2000) {
        // Double press detected
        if (window.confirm("Deseja realmente sair da aplicação?")) {
          // Allow exit: Go back again (which presumably takes us out of the app)
          window.history.back();
        } else {
          // User stayed. Restore trap.
          window.history.pushState({ indexTrap: true }, "", window.location.pathname);
        }
      } else {
        // First press
        lastBackTime.current = now;
        toast("Pressione voltar novamente para sair", {
          action: {
            label: "Sair",
            onClick: () => window.history.back()
          }
        });
        // Restore trap immediately so we don't actually leave yet
        window.history.pushState({ indexTrap: true }, "", window.location.pathname);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FeaturedSection />
      <GenreSection />

      {/* Upload removido da Home. Use a aba Configurações para enviar mídia. */}

      <Footer />
    </div>
  );
};

export default Index;
