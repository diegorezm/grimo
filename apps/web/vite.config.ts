import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `vite build --mode self-host` (pnpm build:static) builds a plain static SPA in dist/static,
// served by apps/server. Any other mode targets Cloudflare Workers.
export default defineConfig(({ mode }) => {
  const selfHost = mode === "self-host";
  return {
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    server: { port: 5173, host: true },
    build: selfHost ? { outDir: "dist/static" } : undefined,
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      !selfHost &&
        cloudflare({
          // In dev the API worker runs inside this Vite server, so `pnpm dev` is one process.
          // State is shared with `apps/api` so `pnpm db:migrate` applies to the same local D1.
          auxiliaryWorkers: [{ configPath: "../api/wrangler.jsonc", devOnly: true }],
          persistState: { path: "../api/.wrangler/state" },
        }),
    ],
  };
});
