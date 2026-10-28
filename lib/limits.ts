/**
 * Client-safe limits. Kept free of Node APIs so the browser bundle can
 * import them; `lib/validation.ts` re-exports these as its public surface.
 */

export const MAX_TEXT_CHARS = 20_000;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * Vercel Functions reject request bodies over 4.5 MB, and base64 inflates an
 * image by about a third. Photos above this size are re-encoded in the
 * browser so a 4 MB original still fits through the API.
 */
export const SAFE_IMAGE_UPLOAD_BYTES = 3 * 1024 * 1024; // 3 MB
export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
