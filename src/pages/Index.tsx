import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { GenreSection } from "@/components/GenreSection";
import { Biography } from "@/components/Biography";
import { Footer } from "@/components/Footer";
// UploadSection removido da Home; permanece apenas nas Configurações

const Index = () => {
  // Removido estado de upload local da Home

  return (
    <div className="min-h-screen bg-background" data-oid="8moteop">
      <Header data-oid="jcqs8h9" />
      <Hero data-oid="fp4a9bq" />
      <FeaturedSection data-oid="vqyqnol" />
      <GenreSection data-oid="-kdp:xu" />
      <Biography data-oid="gqqme78" />

      {/* Upload removido da Home. Use a aba Configurações para enviar mídia. */}

      <Footer data-oid="zn9obh7" />
    </div>
  );
};

export default Index;
