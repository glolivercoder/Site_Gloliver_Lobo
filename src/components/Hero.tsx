import wolfMoonBg from "@/assets/wolf-moon-bg.png";
export const Hero = () => {
  return <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 opacity-70" style={{
      backgroundImage: `url(${wolfMoonBg})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    }} />
      
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 z-20" />
      
      {/* Content */}
      <div className="relative z-30 container mx-auto px-6 text-center pt-32">
        <div className="max-w-4xl mx-[100px] px-px my-0 py-[6px] mt-[20px]">
          {/* Neon Logo with Roman Numerals Style - Moved Down */}
          <h1 className="text-7xl md:text-9xl font-bold mb-8 tracking-wider mt-32">
            <span className="bonheur-royale-regular text-5xl">Gloliver Lobo</span>
          </h1>
          
          <p className="text-xl text-foreground/80 mb-12 font-light md:text-xl">
            Compositor • Artista • Visionário
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#genres" className="glass-button px-8 py-4 rounded-lg font-medium hover:scale-105 transition-transform">
              Explorar Música
            </a>
            <a href="#biography" className="glass-button-outline px-8 py-4 rounded-lg font-medium hover:scale-105 transition-transform">
              Sobre o Artista
            </a>
          </div>
        </div>
      </div>
      
      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />
      
      <style dangerouslySetInnerHTML={{
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
      `
    }} />
    </section>;
};
