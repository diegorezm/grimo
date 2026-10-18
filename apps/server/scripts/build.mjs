// Bundles the server into a self-contained dist/ (used by the Docker image):
//   dist/index.mjs      — server + all workspace code
//   dist/migrations/    — SQL migrations (same ones D1 uses)
//   dist/package.json   — only the native runtime deps that can't be bundled
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const external = ["@libsql/client"];
const dist = new URL("../dist/", import.meta.url);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await build({
  entryPoints: [fileURLToPath(new URL("../src/index.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("index.mjs", dist)),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  external,
  // Some deps are CJS and call require(); give the ESM output a real require.
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
  logLevel: "info",
});

await cp(
  new URL("../../../packages/db/migrations/", import.meta.url),
  new URL("migrations/", dist),
  {
    recursive: true,
  },
);

// Same version ranges as apps/server/package.json.
const own = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const dependencies = Object.fromEntries(external.map((name) => [name, own.dependencies[name]]));
await writeFile(
  new URL("package.json", dist),
  `${JSON.stringify({ name: "grimo-server", private: true, type: "module", dependencies }, null, 2)}\n`,
);
