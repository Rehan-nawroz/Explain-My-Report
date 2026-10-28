import { FileScan } from "lucide-react";
import DisclaimerBanner from "@/components/disclaimer-banner";
import DoctorQuestions from "@/components/doctor-questions";
import FindingCard from "@/components/finding-card";
import type { ReportExplanation } from "@/types/report";

/**
 * Results screen (Screen 4 of the design package):
 * disclaimer → plain summary → key findings → questions → disclaimer →
 * "Explain another report" (which returns to input and refetches quota).
 *
 * No report-type chip: the API doesn't return a report type, and we never
 * invent data the model didn't produce.
 */
export default function ResultsView({
  result,
  onReset,
}: {
  result: ReportExplanation;
  onReset: () => void;
}) {
  return (
    <main className="rise-in mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-8 sm:px-6 md:py-12">
      <DisclaimerBanner />

      <section className="space-y-4">
        <h2 className="text-[22px] font-semibold leading-[30px] tracking-tight text-white">
          Plain summary
        </h2>
        <div className="rounded-2xl border border-line-soft bg-surface p-6 leading-7 text-[#d1d5db] shadow-sm sm:p-8">
          <p className="text-body leading-7 text-[#e5e7eb]">{result.summary}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[22px] font-semibold leading-[30px] tracking-tight text-white">
          Key findings
        </h2>
        <div className="space-y-3.5">
          {result.findings.map((finding, index) => (
            <FindingCard
              key={`${finding.term}-${index}`}
              finding={finding}
            />
          ))}
        </div>
      </section>

      <DoctorQuestions questions={result.questions} />

      <DisclaimerBanner />

      <section className="flex justify-center pb-6">
        <button
          type="button"
          onClick={onReset}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-[#f9fafb] px-7 py-3 text-sm font-semibold text-[#131314] shadow-md transition-all duration-150 hover:bg-white hover:shadow-lg active:scale-[0.99]"
        >
          <FileScan className="h-5 w-5 text-[#131314]" aria-hidden />
          <span>Explain another report</span>
        </button>
      </section>
    </main>
  );
}
