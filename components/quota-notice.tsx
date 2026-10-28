"use client";

import { useEffect, useState } from "react";
import { Clock, Info, Lock } from "lucide-react";
import { formatResetWindow } from "@/lib/format";

/**
 * Quota-exhausted notice (Screen 2b). Two variants:
 *  - "compact": amber pill that replaces the helper text beside the CTA
 *  - "card": explanatory bento card shown under the input when the person
 *    is out of explanations
 *
 * Honest copy only: rolling 24-hour window, no upgrade CTA, no claims we
 * can't back (per DESIGN.md product constraints).
 */
export default function QuotaNotice({
  resetsAt,
  variant,
}: {
  resetsAt: string | null;
  variant: "compact" | "card";
}) {
  // Computed after mount only, so server and client HTML agree.
  const [resetLabel, setResetLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!resetsAt) {
      setResetLabel(null);
      return;
    }
    const update = () => setResetLabel(formatResetWindow(resetsAt));
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [resetsAt]);

  if (variant === "compact") {
    return (
      <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-[#2a2218] px-3 py-1.5 text-caption font-medium text-amber-200">
        <Clock className="h-4 w-4 text-attention" aria-hidden />
        Daily limit reached.
        {resetLabel ? ` Next explanation in ${resetLabel}.` : ""}
      </p>
    );
  }

  return (
    <div className="rise-in mt-6 flex flex-col items-start justify-between gap-5 rounded-2xl border border-zinc-700/50 bg-[#222428] p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] md:flex-row md:items-center md:p-6">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-zinc-700/40 bg-[#18181b] text-teal-400">
          <Info className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-[18px] font-semibold leading-[26px] tracking-tight text-white">
            That&apos;s your 3 explanations for now
          </h2>
          <p className="mt-0.5 text-caption text-[#c4c7c5]">
            Free accounts include 3 explanations in any 24-hour window, so
            clinical compute stays fair for everyone.
            {resetLabel ? ` Your next one unlocks in ${resetLabel}.` : ""}
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-[#18181b] px-3 py-1.5 text-[11px] font-semibold text-zinc-400">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        Limit reached
      </span>
    </div>
  );
}
