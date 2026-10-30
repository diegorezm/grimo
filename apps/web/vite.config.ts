import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

/** Public, indexable routes (see `staticData.seo` on each route). */
const PUBLIC_PATHS = ["/welcome", "/termos", "/privacidade", "/excluir-conta"];
/** Signed-in or one-off screens: crawlers have nothing to index there. */
const PRIVATE_PATHS = [
  "/login",
  "/onboarding",
  "/esqueci-senha",
  "/redefinir-senha",
  "/admin",
  "/settings",
  "/me",
  "/notifications",
  "/search",
  "/people",
  "/shelves",
  "/importar",
  "/juntos",
  "/j/",
];

/**
 * Everything that needs the public origin (`VITE_SITE_URL`): canonical, og:url/og:image, JSON-LD,
 * robots.txt and sitemap.xml. Without it the tags that need an absolute URL are left out.
 */
function seo(siteUrl: string): Plugin {
  const site = siteUrl.replace(/\/+$/, "");
  const description =
    "Guarde suas leituras, acompanhe o progresso, defina metas, escreva resenhas, leia em grupo e compartilhe o resumo do seu mês.";
  return {
    name: "grimo-seo",
    transformIndexHtml() {
      if (!site) return;
      const jsonLd = [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Grimo",
          url: `${site}/welcome`,
          inLanguage: "pt-BR",
          description,
        },
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Grimo",
          url: `${site}/welcome`,
          applicationCategory: "LifestyleApplication",
          operatingSystem: "Web",
          inLanguage: "pt-BR",
          description,
          image: `${site}/og.png`,
          offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
        },
      ];
      return [
        { tag: "link", attrs: { rel: "canonical", href: `${site}/welcome` }, injectTo: "head" },
        {
          tag: "meta",
          attrs: { property: "og:url", content: `${site}/welcome` },
          injectTo: "head",
        },
        {
          tag: "meta",
          attrs: { property: "og:image", content: `${site}/og.png` },
          injectTo: "head",
        },
        {
          tag: "meta",
          attrs: { name: "twitter:image", content: `${site}/og.png` },
          injectTo: "head",
        },
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: JSON.stringify(jsonLd),
          injectTo: "head",
        },
      ];
    },
    generateBundle() {
      const robots = [
        "User-agent: *",
        "Allow: /",
        ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
        ...(site ? ["", `Sitemap: ${site}/sitemap.xml`] : []),
        "",
      ].join("\n");
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });
      if (!site) return;
      const today = new Date().toISOString().slice(0, 10);
      const urls = PUBLIC_PATHS.map(
        (path) => `  <url><loc>${site}${path}</loc><lastmod>${today}</lastmod></url>`,
      );
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
    },
  };
}

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
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      seo(env.VITE_SITE_URL ?? ""),
    ],
  };
});
