/**
 * Client-safe limits. Kept free of Node APIs so the browser bundle can
 * import them; `lib/validation.ts` re-exports these as its public surface.
 */

export const MAX_TEXT_CHARS = 20_000;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
