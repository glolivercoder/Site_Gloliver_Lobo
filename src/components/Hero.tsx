import wolfMoonBg from "@/assets/wolf-moon-bg.webp";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { useNavigate } from "react-router-dom";
export const Hero = () => {
  const navigate = useNavigate();
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const exportNode = async (node: HTMLElement | null, filename: string) => {
    if (!node) return;
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "transparent",
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch { }
  };
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 opacity-70"
        style={{
          backgroundImage: `url(${wolfMoonBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 z-20" />

      <div className="relative z-30 container mx-auto px-6 text-center pt-32">

        <div
          className="max-w-4xl mx-4 md:mx-auto px-2 md:px-4 my-0 py-2 mt-24 sm:mt-32 md:mt-64 lg:mt-80"
          ref={containerRef}
        >
          <h1 className="font-bold mb-4 md:mb-8 tracking-wider mt-8 md:mt-16">
            <span className="bonheur-royale-regular" ref={spanRef}>
              Gloliver Lobo
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-foreground/80 mb-6 md:mb-12 font-light">
            Compositor • Artista • Produtor
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="#genres"
              className="glass-button px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg text-sm sm:text-base font-medium hover:scale-105 transition-transform"
            >
              Explorar Música
            </a>
            <button
              onClick={() => navigate("/biography")}
              className="glass-button-outline px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg text-sm sm:text-base font-medium hover:scale-105 transition-transform"
            >
              Sobre o Artista
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .neon-text {
          color: hsl(var(--neon-cyan));
          text-shadow: 
            0 0 10px hsl(var(--neon-cyan)),
            0 0 20px hsl(var(--neon-cyan)),
            0 0 40px hsl(var(--neon-cyan)),
            0 0 80px hsl(var(--neon-blue)),
            0 0 120px hsl(var(--neon-blue));
          font-family: 'Times New Roman', serif;
          letter-spacing: 0.2em;
        }
        
        .glass-button {
          background: hsl(var(--glass-bg) / 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid hsl(var(--primary) / 0.3);
          color: hsl(var(--primary));
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        
        .glass-button-outline {
          background: transparent;
          backdrop-filter: blur(10px);
          border: 2px solid hsl(var(--primary));
          color: hsl(var(--primary));
        }
      `,
        }}
      />
    </section>
  );
};
