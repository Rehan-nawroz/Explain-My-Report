import { z } from "zod";

/**
 * The response contract for /api/explain. The LLM must produce JSON
 * matching this shape; anything that fails parsing is rejected (502)
 * and never rendered to the user.
 */

export const findingSchema = z.object({
  /** Medical term exactly as it appears in the report. */
  term: z.string().min(1).max(160),
  /** Plain-language meaning of the term in this report's context. */
  plainMeaning: z.string().min(1).max(800),
  /** Exactly three allowed categories — nothing more alarming is expressible. */
  status: z.enum(["routine", "needs_attention", "unclear"]),
  /** Verbatim excerpt from the source report backing this finding. */
  reportQuote: z.string().min(1).max(1200),
});

export const reportExplanationSchema = z.object({
  summary: z.string().min(1).max(2000),
  // Upper bounds stop a prompt-injected or runaway response from producing
  // an unbounded page; normal output is far below all of these.
  findings: z.array(findingSchema).min(1).max(12),
  questions: z.array(z.string().min(1).max(400)).min(1).max(10),
  disclaimer: z.string().min(1).max(1000),
});

export type Finding = z.infer<typeof findingSchema>;
export type ReportExplanation = z.infer<typeof reportExplanationSchema>;

export type ParseExplanationResult =
  | { ok: true; data: ReportExplanation }
  | { ok: false; issues: string };

export function parseExplanation(raw: unknown): ParseExplanationResult {
  const result = reportExplanationSchema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const issues = result.error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
  return { ok: false, issues };
}
