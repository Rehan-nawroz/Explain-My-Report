import type { ExplainPayload, ReportExplanation } from "@/types/report";

/**
 * Grounding check for text reports: every `reportQuote` must occur in the
 * report the user submitted. Without this the UI's "what the report actually
 * says" claim rests only on the model's instruction-following.
 *
 * Matching is deliberately tolerant of typography (curly quotes, dashes,
 * Unicode forms, whitespace) but not of paraphrase: if the words are not in
 * the report, the finding is dropped rather than shown as a quote.
 */
function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function filterGroundedFindings(
  data: ReportExplanation,
  payload: ExplainPayload,
): ReportExplanation | null {
  // Images have no source text on the server to compare against.
  if (payload.kind !== "text") return data;

  const source = normalize(payload.text);
  const findings = data.findings.filter((finding) => {
    const quote = normalize(finding.reportQuote);
    return quote.length > 0 && source.includes(quote);
  });

  if (findings.length === 0) return null;
  return findings.length === data.findings.length
    ? data
    : { ...data, findings };
}
