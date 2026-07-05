import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA, type ManifestOptions } from "vite-plugin-pwa";

import manifest from "./public/manifest.json";

const config = {
  plugins: [
    react(),
    // Add additional plugins here
    VitePWA({
      registerType: "autoUpdate",
      manifest: manifest as Partial<ManifestOptions>, // Cast to Partial to avoid type issues
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"],
        // Otimização para o cache não estourar com arquivos grandes
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Aumenta limite do SW para 5MB
      },
    }),
  ],

  // Adicionada a configuração de BUILD para resolver o aviso de Chunk Size
  build: {
    // 1. Aumenta o limite de aviso para 500kb se preferir silenciar o erro
    chunkSizeWarningLimit: 500, // 500kb

    // 2. Configuração do Rollup para dividir os arquivos
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Se o arquivo vier do node_modules (bibliotecas), joga para um arquivo 'vendor'
          if (id.includes("node_modules")) {
            return "vendor";

            // DICA AVANÇADA: Se ainda ficar grande, você pode separar bibliotecas específicas.
            // Exemplo: separar o lodash ou bibliotecas de gráficos
            // if (id.includes('chart.js')) return 'charts';
          }
        },
      },
    },
  },

  preview: {
    allowedHosts: true as const,
  },
  // TypeScript now accepts this thanks to the hybrid type above
  test: {
    globals: true,
    environment: "jsdom", // Simulates browser environment for React testing
    // Shield the runner from a shell that leaks NODE_ENV=production — that
    // makes Vitest load the production React build and every render fails
    // with "act(...) is not supported" (TASK-CHORE-003).
    env: { NODE_ENV: "test" },
    setupFiles: "./src/setupTests.ts", // Setup file for tests
    css: {
      modules: {
        classNameStrategy: "stable", // Consistent class names in tests
      },
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@components": path.resolve(__dirname, "src/components"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
  },
};

export default defineConfig(config);
