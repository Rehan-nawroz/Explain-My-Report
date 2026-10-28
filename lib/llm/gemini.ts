import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/prompts";
import { LLMError, type ExplainArgs, type LLMProvider } from "./provider";

/**
 * Gemini implementation of LLMProvider over the REST API (no SDK
 * dependency). Uses systemInstruction for the safety prompt and
 * responseMimeType: application/json for structured output.
 *
 * The API key travels in the x-goog-api-key header — never in the URL,
 * never logged.
 */

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 30000;

export type GeminiConfig = { apiKey: string; model: string };

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
}

function buildParts(args: ExplainArgs): GeminiPart[] {
  const parts: GeminiPart[] = [{ text: buildUserMessage(args.payload) }];
  if (args.payload.kind === "image") {
    parts.push({
      inline_data: {
        mime_type: args.payload.mimeType,
        data: args.payload.imageBase64,
      },
    });
  }
  return parts;
}

export function createGeminiProvider(config: GeminiConfig): LLMProvider {
  return {
    async explain(args: ExplainArgs): Promise<unknown> {
      const url = `${GEMINI_BASE_URL}/${config.model}:generateContent`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: buildParts(args) }],
            generationConfig: {
              responseMimeType: "application/json",
              // Bounds cost/latency and prevents a prompt-injected response
              // from streaming an arbitrarily long object.
              maxOutputTokens: 2048,
            },
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
          throw new LLMError("The explanation service timed out.");
        }
        throw new LLMError("Could not reach the explanation service.");
      }

      if (!response.ok) {
        // Status only — response bodies can echo request details; never log them.
        throw new LLMError(`Gemini request failed (HTTP ${response.status}).`, response.status);
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("");

      if (!text) {
        throw new LLMError("Gemini returned an empty response.");
      }
      try {
        return JSON.parse(text);
      } catch {
        throw new LLMError("Gemini returned a non-JSON response.");
      }
    },
  };
}
