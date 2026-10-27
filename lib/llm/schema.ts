import { z } from "zod";

/**
 * The response contract for /api/explain. The LLM must produce JSON
 * matching this shape; anything that fails parsing is rejected (502)
 * and never rendered to the user.
 */

export const findingSchema = z.object({
  /** Medical term exactly as it appears in the report. */
  term: z.string().min(1),
  /** Plain-language meaning of the term in this report's context. */
  plainMeaning: z.string().min(1),
  /** Exactly three allowed categories — nothing more alarming is expressible. */
  status: z.enum(["routine", "needs_attention", "unclear"]),
  /** Verbatim excerpt from the source report backing this finding. */
  reportQuote: z.string().min(1),
});

export const reportExplanationSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(findingSchema).min(1),
  questions: z.array(z.string().min(1)).min(1),
  disclaimer: z.string().min(1),
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
