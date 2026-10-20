/** Profile photo rules, shared by the upload UI (web and mobile) and the backend. */

/** Largest photo accepted, in bytes. Clients shrink photos before upload, so this is a guard. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const AVATAR_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

/** Side, in pixels, clients resize the photo to before uploading (square crop). */
export const AVATAR_SIZE = 512;

/** Why a photo can't be used, or `null` when it is fine. Messages are pt-BR UI copy. */
export function avatarProblem(file: { contentType: string | null; size: number }): string | null {
  const type = file.contentType?.toLowerCase() ?? "";
  if (!(AVATAR_CONTENT_TYPES as readonly string[]).includes(type)) {
    return "Use uma foto em JPG, PNG, WEBP ou HEIC.";
  }
  if (file.size > AVATAR_MAX_BYTES) return "A foto precisa ter até 5 MB.";
  return null;
}
