"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

/**
 * Loads the de-identified sample report into the textarea so the demo
 * works without anyone pasting their own medical data.
 */
export default function SampleReportButton({
  onSample,
  onError,
  disabled = false,
}: {
  onSample: (text: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const response = await fetch("/sample-report.txt", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      onSample(await response.text());
    } catch {
      onError("Couldn't load the sample report. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={load}
      disabled={disabled || busy}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-caption font-medium text-teal-300 transition-colors hover:bg-surface-elevated hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <BookOpen className="h-4 w-4" aria-hidden />
      {busy ? "Loading…" : "Use sample report"}
    </button>
  );
}
