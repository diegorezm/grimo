// Renders the brand mark (brand/*.svg) into every app icon, splash and favicon.
// Run: pnpm --filter @grimo/tokens icons
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";

const brand = (name: string) => readFileSync(new URL(`../brand/${name}`, import.meta.url));
const out = (path: string) =>
  new URL(`../../../${path}`, import.meta.url).pathname.replace(/^\/(\w:)/, "$1");

const page = "#FFFBF5";
const mark = brand("mark.svg");
const markDark = brand("mark-dark.svg");
const mono = brand("mark-mono.svg");

/** The mark centred on a square canvas, taking `scale` of its width. */
async function icon(svg: Buffer, size: number, scale: number, file: string, background?: string) {
  const width = Math.round(size * scale);
  const art = await sharp(svg, { density: 600 }).resize({ width }).png().toBuffer();
  const meta = await sharp(art).metadata();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: art,
        left: Math.round((size - width) / 2),
        top: Math.round((size - (meta.height ?? width)) / 2),
      },
    ])
    .png()
    .toFile(out(file));
}

const images = "apps/mobile/assets/images";
await icon(mark, 1024, 0.7, `${images}/icon.png`, page);
await icon(mark, 512, 0.5, `${images}/splash-icon.png`);
await icon(markDark, 512, 0.5, `${images}/splash-icon-dark.png`);
await icon(mark, 512, 0.5, `${images}/android-icon-foreground.png`);
await sharp({ create: { width: 512, height: 512, channels: 4, background: page } })
  .png()
  .toFile(out(`${images}/android-icon-background.png`));
await icon(mono, 432, 0.55, `${images}/android-icon-monochrome.png`);
await icon(mark, 48, 0.9, `${images}/favicon.png`);
await icon(mark, 256, 1, `${images}/logo.png`);
await icon(markDark, 256, 1, `${images}/logo-dark.png`);

// Web: SVG favicon lives in apps/web/public; PNG fallbacks for iOS home screen and old browsers.
mkdirSync(out("apps/web/public"), { recursive: true });
await icon(mark, 180, 0.72, "apps/web/public/apple-touch-icon.png", page);
await icon(mark, 32, 0.95, "apps/web/public/favicon-32.png");

// iOS 26 Icon Composer (liquid glass): cover, pages and sparkle are separate layers.
const layers = "apps/mobile/assets/expo.icon/Assets";
for (const layer of ["cover", "pages", "sparkle"]) {
  copyFileSync(
    new URL(`../brand/layers/${layer}.svg`, import.meta.url),
    out(`${layers}/${layer}.svg`),
  );
}

console.log("icons generated");
