import { useMatches } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Per-route SEO, declared as `staticData: { seo: {...} }` on a route. The app is a SPA, so the
 * defaults (index.html) already carry the landing's tags for crawlers that don't run JS; this
 * keeps the head in sync on navigation. A route with no `seo` is private: `noindex`.
 */
export type Seo = {
  /** Page name; becomes "<title> · Grimo". Omit for the brand title. */
  title?: string;
  description?: string;
  /** Canonical path (e.g. "/termos"). Only used when VITE_SITE_URL is set. */
  path?: string;
  /** Keep the page out of search results (default for routes without `seo`). */
  noindex?: boolean;
};

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    seo?: Seo;
  }
}

const SITE = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/+$/, "");
const BRAND = "Grimo";
const DEFAULT_TITLE = "Grimo: o diário das suas leituras";
const DEFAULT_DESCRIPTION =
  "Guarde suas leituras, acompanhe o progresso, defina metas, escreva resenhas, leia em grupo e compartilhe o resumo do seu mês. O diário de leituras para quem ama livros.";

function setMeta(attr: "name" | "property", key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === undefined) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.append(el);
  }
  el.content = content;
}

function setCanonical(href: string | undefined) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.append(el);
  }
  el.href = href;
}

/** Applies the deepest matched route's `seo` to the document head. Mount once, in the root. */
export function useSeo() {
  const seo = useMatches({
    select: (matches) => [...matches].reverse().find((m) => m.staticData?.seo)?.staticData?.seo,
  });

  useEffect(() => {
    const title = seo?.title ? `${seo.title} · ${BRAND}` : DEFAULT_TITLE;
    const description = seo?.description ?? DEFAULT_DESCRIPTION;
    const url = SITE && seo?.path ? `${SITE}${seo.path}` : undefined;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "robots", seo && !seo.noindex ? undefined : "noindex, nofollow");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("property", "og:url", url);
    setCanonical(url);
  }, [seo]);
}
