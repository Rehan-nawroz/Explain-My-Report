"use client";

import { ChevronDown } from "lucide-react";
import type { Finding } from "@/types/report";

/** Status badge styles from the design package (Screen 4 mock). */
const STATUS_STYLES: Record<Finding["status"], string> = {
  routine:
    "border-emerald-500/30 bg-emerald-950/60 text-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.7)]",
  needs_attention:
    "border-amber-500/30 bg-amber-950/60 text-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.7)]",
  unclear:
    "border-sky-500/30 bg-slate-900 text-sky-300 shadow-[0_0_6px_rgba(56,189,248,0.7)]",
};

const STATUS_LABEL: Record<Finding["status"], string> = {
  routine: "Routine",
  needs_attention: "Needs attention",
  unclear: "Unclear",
};

/**
 * One finding: plain-language meaning with the verbatim source quote
 * behind a collapsible "What the report actually says" disclosure —
 * the grounding requirement made visible, not hidden.
 */
export default function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className="rounded-2xl border border-line-soft bg-surface p-5 shadow-sm transition-colors hover:border-zinc-700 sm:p-6">
      <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[18px] font-semibold leading-[26px] tracking-tight text-white">
          {finding.term}
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-[11px] font-semibold leading-[14px] sm:self-auto ${
            STATUS_STYLES[finding.status] ?? STATUS_STYLES.unclear
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {STATUS_LABEL[finding.status] ?? finding.status}
        </span>
      </div>

      <p className="mb-4 text-body leading-6 text-[#d1d5db]">
        {finding.plainMeaning}
      </p>

      <details className="group border-t border-line-soft/80 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-ink-muted transition-colors hover:text-ink">
          <span className="text-[12px] font-medium leading-4">
            What the report actually says
          </span>
          <ChevronDown
            className="h-5 w-5 transition-transform duration-200 group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="mt-2.5 rounded-xl border border-line-soft bg-inset p-3.5 font-mono text-[12px] leading-[18px] text-zinc-300">
          “{finding.reportQuote}”
        </div>
      </details>
    </article>
  );
}
