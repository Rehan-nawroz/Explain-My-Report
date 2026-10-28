import { Sparkles } from "lucide-react";

/**
 * Loading screen while /api/explain runs. Presentational only — the
 * workspace sets `submitting` before showing this, which is what prevents
 * a double POST (the submit button is gone from the DOM entirely).
 */
export default function LoadingState() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <span className="absolute h-32 w-32 rounded-full border border-teal-500/15" />
          <span className="halo-pulse absolute h-24 w-24 rounded-full border border-teal-500/25" />
          <span className="halo-pulse absolute h-16 w-16 rounded-full bg-teal-500/10" />
          <Sparkles className="relative h-7 w-7 text-primary" aria-hidden />
        </div>
        <h2 className="mt-10 text-[22px] font-semibold leading-[30px] tracking-tight text-white">
          Reading your report…
        </h2>
        <p className="mt-2 text-body text-ink-soft">
          Translating into plain language.
        </p>
        <p className="mt-6 text-caption text-ink-muted">
          This usually takes a few seconds. Your report is never stored.
        </p>
      </div>
    </main>
  );
}
