import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Otimizações de performance
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "wavesurfer.js",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tabs",
    ],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Aumenta o limite do aviso para 1000kB (1MB)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["lucide-react", "sonner", "class-variance-authority", "clsx", "tailwind-merge"],
          radix: ["@radix-ui/react-dialog", "@radix-ui/react-slot", "@radix-ui/react-label", "@radix-ui/react-select"],
          audio: ["wavesurfer.js"], // Isola a lib de áudio pesada
          database: ["@supabase/supabase-js"], // Isola o cliente do banco
        },
      },
    },
  },
}));

