import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { GenreSection } from "@/components/GenreSection";
import { Footer } from "@/components/Footer";
// UploadSection removido da Home; permanece apenas nas Configurações

const Index = () => {
  // Removido estado de upload local da Home

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
