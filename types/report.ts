/**
 * Shared types for the app. The LLM response contract is defined once in
 * lib/llm/schema.ts (zod) and re-exported here; payload types below are
 * shared by the client, validation, and the API route.
 */

export type { Finding, ReportExplanation } from "@/lib/llm/schema";

/** Payload the client POSTs to /api/explain. */
export type ImageMime = "image/png" | "image/jpeg" | "image/webp";

export type ExplainPayload =
  | { kind: "text"; text: string }
  | { kind: "image"; imageBase64: string; mimeType: ImageMime };
