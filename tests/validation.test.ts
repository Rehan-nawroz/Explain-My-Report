import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  MAX_TEXT_CHARS,
  validateExplainRequest,
} from "@/lib/validation";

/** Base64 string that decodes to exactly `bytes` bytes. */
const base64OfSize = (bytes: number) => Buffer.alloc(bytes).toString("base64");

describe("validateExplainRequest", () => {
  it("accepts valid text payload", () => {
    const result = validateExplainRequest({
      kind: "text",
      text: "Biopsy report: adenocarcinoma identified.",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toEqual({
        kind: "text",
        text: "Biopsy report: adenocarcinoma identified.",
      });
    }
  });

  it("accepts valid image payload at exactly 4 MB", () => {
    const result = validateExplainRequest({
      kind: "image",
      imageBase64: base64OfSize(MAX_IMAGE_BYTES),
      mimeType: "image/png",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects empty text", () => {
    const result = validateExplainRequest({ kind: "text", text: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("rejects whitespace-only text", () => {
    const result = validateExplainRequest({
      kind: "text",
      text: "   \n\t  ",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("rejects text over 20000 chars (20001)", () => {
    const result = validateExplainRequest({
      kind: "text",
      text: "a".repeat(MAX_TEXT_CHARS + 1),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("accepts text at exactly 20000 chars", () => {
    const result = validateExplainRequest({
      kind: "text",
      text: "a".repeat(MAX_TEXT_CHARS),
    });
    expect(result.ok).toBe(true);
  });

  it("strips control characters before length check", () => {
    const result = validateExplainRequest({
      kind: "text",
      text: "Line one\r\nLine two\t\x00\x01\x1f",
    });
    expect(result.ok).toBe(true);
    if (result.ok && result.payload.kind === "text") {
      // \r and other C0 control chars removed; \n and \t preserved.
      expect(result.payload.text).toBe("Line one\nLine two\t");
    }
  });

  it("oversize image rejected (4 MB + 1)", () => {
    const result = validateExplainRequest({
      kind: "image",
      imageBase64: base64OfSize(MAX_IMAGE_BYTES + 1),
      mimeType: "image/png",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
    }
  });

  it("unsupported mime rejected", () => {
    const result = validateExplainRequest({
      kind: "image",
      imageBase64: base64OfSize(16),
      mimeType: "image/gif",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("rejects body with both text and image", () => {
    const result = validateExplainRequest({
      kind: "text",
      text: "hello",
      imageBase64: "AAAA",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it("rejects non-object body", () => {
    for (const body of [null, "just a string", 42, undefined]) {
      const result = validateExplainRequest(body);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
      }
    }
  });
});
