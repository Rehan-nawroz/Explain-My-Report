import { describe, expect, it } from "vitest";
import { filterGroundedFindings } from "@/lib/grounding";
import type { ExplainPayload, ReportExplanation } from "@/types/report";

const explanation: ReportExplanation = {
  summary: "A pathology report describing a breast biopsy.",
  findings: [
    {
      term: "Invasive ductal carcinoma",
      plainMeaning: "A cancer that started in the breast ducts.",
      status: "needs_attention",
      reportQuote: "invasive ductal\ncarcinoma",
    },
    {
      term: "Margins",
      plainMeaning: "The edges of the removed tissue.",
      status: "routine",
      reportQuote: "the patient's tumor is 2.1 cm",
    },
  ],
  questions: ["What do these findings mean for my next appointment?"],
  disclaimer:
    "This is an educational explanation of your report — not medical advice.",
};

const textPayload: ExplainPayload = {
  kind: "text",
  text: "FINAL DIAGNOSIS: Invasive ductal carcinoma, 2.1 cm. Margins are negative. The patient’s tumor is 2.1 cm.",
};

describe("filterGroundedFindings", () => {
  it("keeps every finding whose quote occurs in the report", () => {
    const result = filterGroundedFindings(explanation, textPayload);
    expect(result?.findings).toHaveLength(2);
    expect(result?.findings[0].reportQuote).toBe("invasive ductal\ncarcinoma");
  });

  it("drops a fabricated quote but keeps the grounded findings", () => {
    const withFabrication: ReportExplanation = {
      ...explanation,
      findings: [
        ...explanation.findings,
        {
          term: "Lymph nodes",
          plainMeaning: "Nodes that drain fluid.",
          status: "needs_attention",
          reportQuote: "lymph nodes are positive for carcinoma",
        },
      ],
    };

    const result = filterGroundedFindings(withFabrication, textPayload);
    expect(result?.findings).toHaveLength(2);
    expect(
      result?.findings.some((finding) =>
        finding.reportQuote.includes("lymph nodes"),
      ),
    ).toBe(false);
  });

  it("returns null when no finding is grounded", () => {
    const fabricated: ReportExplanation = {
      ...explanation,
      findings: explanation.findings.map((finding) => ({
        ...finding,
        reportQuote: "a sentence that is not in the report",
      })),
    };

    expect(filterGroundedFindings(fabricated, textPayload)).toBeNull();
  });

  it("skips the check for image reports", () => {
    const fabricated: ReportExplanation = {
      ...explanation,
      findings: explanation.findings.map((finding) => ({
        ...finding,
        reportQuote: "a sentence that is not in the report",
      })),
    };
    const imagePayload: ExplainPayload = {
      kind: "image",
      imageBase64: "AAAA",
      mimeType: "image/png",
    };

    expect(filterGroundedFindings(fabricated, imagePayload)).toBe(fabricated);
  });

  it("does not treat a whitespace-only quote as grounded", () => {
    const blankQuote: ReportExplanation = {
      ...explanation,
      findings: [{ ...explanation.findings[0], reportQuote: "   " }],
    };

    expect(filterGroundedFindings(blankQuote, textPayload)).toBeNull();
  });
});
