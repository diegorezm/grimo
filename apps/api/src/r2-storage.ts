import type { Storage } from "@grimo/api";

export function createR2Storage(bucket: R2Bucket): Storage {
  return {
    async put(key, body, contentType) {
      await bucket.put(key, body, { httpMetadata: { contentType } });
    },
    async get(key) {
      const object = await bucket.get(key);
      if (!object) return null;
      return {
        body: object.body as ReadableStream,
        contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
      };
    },
    async delete(key) {
      await bucket.delete(key);
    },
  };
}
