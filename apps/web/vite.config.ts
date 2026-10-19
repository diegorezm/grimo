import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// A plain SPA: data and auth come from Convex, so `dist/` deploys to any static host
// (`pnpm --filter @grimo/web deploy` publishes it as Cloudflare static assets).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  // In dev, fall back to the deployment `convex dev` wrote to packages/backend/.env.local.
  const backend = loadEnv(
    mode,
    fileURLToPath(new URL("../../packages/backend", import.meta.url)),
    "CONVEX_",
  );
  const convexUrl = env.VITE_CONVEX_URL || backend.CONVEX_URL || "";
  return {
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    define: { "import.meta.env.VITE_CONVEX_URL": JSON.stringify(convexUrl) },
    server: { port: 5173, host: true },
    plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  };
});
