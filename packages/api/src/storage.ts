/**
 * File storage port (avatars, uploads). Implemented per runtime:
 * R2 in apps/api, local filesystem in apps/server. Keys look like `avatars/<userId>.webp`.
 */
export interface StoredObject {
  body: ReadableStream;
  contentType: string;
}

export interface Storage {
  put(key: string, body: ArrayBuffer | ReadableStream, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}
