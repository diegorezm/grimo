import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 5173, host: true },
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    cloudflare({
      // In dev the API worker runs inside this Vite server, so `pnpm dev` is one process.
      // State is shared with `apps/api` so `pnpm db:migrate` applies to the same local D1.
      auxiliaryWorkers: [{ configPath: "../api/wrangler.jsonc", devOnly: true }],
      persistState: { path: "../api/.wrangler/state" },
    }),
  ],
});
