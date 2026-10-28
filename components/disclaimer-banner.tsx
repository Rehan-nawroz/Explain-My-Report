/**
 * Clinical disclaimer — spec requires this at the top AND bottom of the
 * results screen. Presentational only (no hooks), safe anywhere.
 */
export default function DisclaimerBanner() {
  return (
    <section
      aria-label="Clinical disclaimer"
      role="note"
      className="flex items-start gap-4 rounded-2xl border border-sky-500/20 bg-disclaimer p-5 sm:items-center"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-sky-500/30 bg-sky-950/60 text-[22px] font-semibold text-sky-400">
        i
      </span>
      <p className="text-caption leading-relaxed text-sky-200">
        This is an educational explanation of your report, not medical advice or
        a diagnosis. Discuss anything concerning with your care team.
      </p>
    </section>
  );
}
