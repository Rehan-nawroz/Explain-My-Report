import { describe, expect, it } from "vitest";
import { parseExplanation, reportExplanationSchema } from "@/lib/llm/schema";

const validExplanation = {
  summary: "The report describes a biopsy result from a tissue sample.",
  findings: [
    {
      term: "Adenocarcinoma",
      plainMeaning: "A type of cancer that starts in gland-shaped cells.",
      status: "routine",
      reportQuote: "adenocarcinoma identified in specimen",
    },
    {
      term: "Margins negative",
      plainMeaning: "No abnormal cells were found at the edge of the sample.",
      status: "routine",
      reportQuote: "margins are negative for malignancy",
    },
  ],
  questions: ["What does the adenocarcinoma finding mean for my next steps?"],
  disclaimer:
    "This is an educational explanation of your report, not medical advice or a diagnosis.",
};

describe("reportExplanationSchema", () => {
  it("accepts fully valid explanation", () => {
    const result = reportExplanationSchema.safeParse(validExplanation);
    expect(result.success).toBe(true);
  });

  it("rejects missing disclaimer", () => {
    const { disclaimer: _omitted, ...withoutDisclaimer } = validExplanation;
    const result = reportExplanationSchema.safeParse(withoutDisclaimer);
    expect(result.success).toBe(false);
  });

  it('rejects invalid status value "severe"', () => {
    const invalid = {
      ...validExplanation,
      findings: [{ ...validExplanation.findings[0], status: "severe" }],
    };
    const result = reportExplanationSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty findings array", () => {
    const invalid = { ...validExplanation, findings: [] };
    const result = reportExplanationSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects finding without reportQuote", () => {
    const { reportQuote: _omitted, ...findingWithoutQuote } =
      validExplanation.findings[0];
    const invalid = {
      ...validExplanation,
      findings: [findingWithoutQuote],
    };
    const result = reportExplanationSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("parseExplanation returns issues string on failure", () => {
    const result = parseExplanation({ summary: "only a summary" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.issues).toBe("string");
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });
});
