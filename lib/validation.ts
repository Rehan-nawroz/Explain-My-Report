import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES, MAX_TEXT_CHARS } from "@/lib/limits";
import type { ExplainPayload, ImageMime } from "@/types/report";

// Re-exported so existing imports keep working; the source of truth is
// lib/limits.ts, which the browser bundle can import safely.
export { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES, MAX_TEXT_CHARS };

export type ValidationResult =
  | { ok: true; payload: ExplainPayload }
  | { ok: false; status: 400 | 413; error: string };

/** Remove C0 control characters except \n and \t (also drop DEL). */
function stripControlChars(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
}

function isPlainObject(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

function validateText(body: Record<string, unknown>): ValidationResult {
  const { text } = body;
  if (typeof text !== "string") {
    return { ok: false, status: 400, error: "Report text must be a string." };
  }
  if ("imageBase64" in body) {
    return { ok: false, status: 400, error: "Provide either text or an image, not both." };
  }
  const clean = stripControlChars(text);
  if (clean.trim().length === 0) {
    return { ok: false, status: 400, error: "Report text is empty." };
  }
  if (clean.length > MAX_TEXT_CHARS) {
    return {
      ok: false,
      status: 400,
      error: `Report text exceeds the ${MAX_TEXT_CHARS.toLocaleString()} character limit.`,
    };
  }
  return { ok: true, payload: { kind: "text", text: clean } };
}

function validateImage(body: Record<string, unknown>): ValidationResult {
  const { imageBase64, mimeType } = body;
  if ("text" in body) {
    return { ok: false, status: 400, error: "Provide either text or an image, not both." };
  }
  if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return { ok: false, status: 400, error: "Image payload must be a base64 string." };
  }
  if (
    typeof mimeType !== "string" ||
    !(IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)
  ) {
    return { ok: false, status: 400, error: "Unsupported image type. Use PNG, JPEG, or WebP." };
  }
  // Buffer.byteLength with 'base64' gives the decoded size without decoding.
  const decodedBytes = Buffer.byteLength(imageBase64, "base64");
  if (decodedBytes > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, error: "Image exceeds the 4 MB limit." };
  }
  return {
    ok: true,
    payload: { kind: "image", imageBase64, mimeType: mimeType as ImageMime },
  };
}

export function validateExplainRequest(body: unknown): ValidationResult {
  if (!isPlainObject(body)) {
    return { ok: false, status: 400, error: "Request body must be a JSON object." };
  }
  const { kind } = body;
  if (kind === "text") return validateText(body);
  if (kind === "image") return validateImage(body);
  return { ok: false, status: 400, error: 'Payload "kind" must be "text" or "image".' };
}
