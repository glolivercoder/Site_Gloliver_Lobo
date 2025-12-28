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
    // Chunk splitting para melhor cache
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["lucide-react", "@radix-ui/react-dialog"],
        },
      },
    },
  },
}));

