import { requireGeminiEnv } from "@/lib/env";
import type { ExplainPayload } from "@/types/report";
import { createGeminiProvider } from "./gemini";

/**
 * Provider abstraction: the API route depends only on this interface,
 * so swapping Gemini for Claude/GPT is a one-line change in
 * createProvider() (spec: Frontend → your backend → LLM API).
 */

export type ExplainArgs = { payload: ExplainPayload };

export interface LLMProvider {
  /** Returns the raw parsed JSON value from the model — the caller runs zod validation. */
  explain(args: ExplainArgs): Promise<unknown>;
}

/** Typed transport/model failure. Carries HTTP status when one exists; never carries the API key. */
export class LLMError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export function createProvider(): LLMProvider {
  // Single switch point between LLM vendors.
  return createGeminiProvider(requireGeminiEnv());
}
