import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Plain Vite + React SPA. `vite build` emits a fully static bundle to dist/;
// there is no server entry, no SSR and no Cloudflare/nitro target.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    host: true,
    port: 8080,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
