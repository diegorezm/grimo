import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize, sep } from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import type { Storage } from "@grimo/api";

/** Local-disk storage (the R2 equivalent for self-hosting). Files live under DATA_DIR/media. */
export function createFsStorage(root: string): Storage {
  const pathFor = (key: string) => {
    const path = normalize(join(root, key));
    if (!path.startsWith(normalize(root) + sep)) throw new Error(`Chave inválida: ${key}`);
    return path;
  };
  const metaFor = (key: string) => `${pathFor(key)}.meta.json`;

  return {
    async put(key, body, contentType) {
      const path = pathFor(key);
      await mkdir(dirname(path), { recursive: true });
      const data =
        body instanceof ArrayBuffer
          ? Buffer.from(body)
          : Readable.fromWeb(body as unknown as NodeReadableStream);
      await writeFile(path, data);
      await writeFile(metaFor(key), JSON.stringify({ contentType }));
    },
    async get(key) {
      try {
        const meta = JSON.parse(await readFile(metaFor(key), "utf8")) as { contentType: string };
        const body = Readable.toWeb(createReadStream(pathFor(key))) as unknown as ReadableStream;
        return { body, contentType: meta.contentType };
      } catch {
        return null;
      }
    },
    async delete(key) {
      await rm(pathFor(key), { force: true });
      await rm(metaFor(key), { force: true });
    },
  };
}
