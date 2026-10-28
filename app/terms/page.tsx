import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import LegalPage, {
  LegalList,
  type LegalSection,
} from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service — Explain My Report",
  description:
    "Educational-use terms for Explain My Report: not medical advice, fair-use limits, and your responsibilities.",
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    number: "1.0",
    label: "Acceptance and eligibility",
    title: "Acceptance and eligibility",
    body: (
      <LegalList>
        <li>
          By using Explain My Report you agree to these terms. If you do not
          agree, please do not use the app.
        </li>
        <li>You must be at least 18 years old to use the service.</li>
        <li>
          If you submit a report that belongs to someone else, you must have
          their permission to share it.
        </li>
      </LegalList>
    ),
  },
  {
    id: "what-this-is",
    number: "2.0",
    label: "What the service is — and its limits",
    title: "What the service is — and its limits",
    body: (
      <>
        <p>
          The app uses Google&apos;s Gemini API to turn medical-report language
          into a plain-language summary, explanations of individual findings,
          and questions you can ask your clinician.
        </p>
        <LegalList>
          <li>
            AI output can be wrong, incomplete or out of date, and it does not
            know your history, other test results or the rest of your care.
            Treat every explanation as a starting point for a conversation,
            not an answer.
          </li>
          <li>
            Explain My Report is not a medical device, does not provide a
            diagnosis or treatment, and does not create a doctor–patient
            relationship.
          </li>
          <li>
            Never delay, skip or change care because of something you read
            here.
          </li>
        </LegalList>
        <p>
          Google&apos;s Gemini API terms also apply to the underlying AI
          processing, including its age requirements and acceptable-use rules.
          See the <Link
            href="/privacy#how-its-processed"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:text-primary-bright"
          >
            Privacy Policy
          </Link>{" "}
          for how report content is handled.
        </p>
      </>
    ),
  },
  {
    id: "your-responsibilities",
    number: "3.0",
    label: "Your responsibilities",
    title: "Your responsibilities",
    body: (
      <>
        <p>You agree to:</p>
        <LegalList>
          <li>
            Submit only reports you are allowed to share — your own, or
            someone else&apos;s with their permission.
          </li>
          <li>
            Remove names or other identifiers yourself if you do not want to
            submit them. The app does not de-identify your report.
          </li>
          <li>Not use the app for medical emergencies.</li>
          <li>
            Not attempt to break, overload, scrape or reverse-engineer the
            service, or submit malicious content or attempts to manipulate the
            AI model.
          </li>
          <li>
            Not resell the explanations or present them as professional
            medical advice.
          </li>
        </LegalList>
      </>
    ),
  },
  {
    id: "usage-limits",
    number: "4.0",
    label: "Usage limits",
    title: "Usage limits",
    body: (
      <>
        <LegalList>
          <li>
            Each account gets 3 explanations per rolling 24-hour window. A new
            one unlocks 24 hours after your oldest one in the window — the
            limit resets gradually, not at midnight.
          </li>
          <li>
            Text is limited to 20,000 characters; photos to PNG, JPEG or WebP
            up to 4&nbsp;MB.
          </li>
          <li>The service is free, and there is no paid upgrade.</li>
          <li>
            We may adjust these limits if needed to keep the service available.
          </li>
        </LegalList>
      </>
    ),
  },
  {
    id: "availability",
    number: "5.0",
    label: "Availability and changes",
    title: "Availability and changes",
    body: (
      <LegalList>
        <li>
          The app is provided as is and as available. We may change, suspend or
          discontinue it at any time, and we do not guarantee it will always be
          available or error-free.
        </li>
        <li>
          We may update these terms; the current version always lives on this
          page with its date. Continuing to use the app after an update means
          you accept it.
        </li>
      </LegalList>
    ),
  },
  {
    id: "liability",
    number: "6.0",
    label: "Limitation of liability",
    title: "Limitation of liability",
    body: (
      <>
        <p>
          To the extent permitted by law, Explain My Report and its operator
          are not liable for any loss or damage arising from your use of the
          app or from decisions made based on an explanation, including any
          inaccuracy in AI-generated content.
        </p>
        <p>
          Nothing in these terms limits liability that cannot be limited by
          law. You use the app at your own risk.
        </p>
        <p>
          Questions about these terms can be raised through the contact
          channel listed in the <Link
            href="/privacy#contact"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:text-primary-bright"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      doc="terms"
      badge="The rules for using this app"
      title="Terms of Service"
      lede="Plain-language terms for an educational tool — what it does, what it does not do, and what we expect from each other."
      updated="October 28, 2026"
      sections={sections}
      notice={
        <div className="rounded-2xl border border-attention/30 bg-attention/[0.06] p-5 md:p-6">
          <div className="flex items-start gap-4">
            <span className="shrink-0 rounded-lg border border-attention/30 bg-attention/10 p-2 text-attention">
              <TriangleAlert className="h-5 w-5" aria-hidden />
            </span>
            <div className="space-y-1.5">
              <p className="text-[15px] font-semibold tracking-tight text-attention">
                Not medical advice
              </p>
              <p className="text-body leading-relaxed text-ink-soft">
                Explain My Report turns medical-report language into plain
                words for education. It is not a doctor, not a diagnosis, and
                not a treatment recommendation. Always confirm findings with
                the clinician who ordered your report. If you think you are
                having a medical emergency, contact your local emergency
                services.
              </p>
            </div>
          </div>
        </div>
      }
    />
  );
}
