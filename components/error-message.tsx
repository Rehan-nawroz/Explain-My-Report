"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import QuotaNotice from "@/components/quota-notice";
import type { PageError } from "@/types/report";

/**
 * Error screen, mapped by HTTP status:
 *  - 401  → "Sign in again" only (session is gone)
 *  - 429  → quota notice with resetsAt, no retry (retrying would 429 again)
 *  - 502/0/other → "Try again" (re-POSTs the payload already in the
 *    workspace state) + back; daily-limit-not-charged reassurance
 *  - 400/413 → message only + back, so the person can edit their input
 *
 * Every path returns via onBack to the input screen, where the payload is
 * still intact — the workspace never clears text/image on failure.
 */
export default function ErrorMessage({
  error,
  onRetry,
  onSignInAgain,
  onBack,
}: {
  error: PageError;
  onRetry: () => void;
  onSignInAgain: () => void;
  onBack: () => void;
}) {
  const isQuota = error.status === 429;
  const isSession = error.status === 401;
  const isBadInput = error.status === 400 || error.status === 413;
  const canRetry = !isQuota && !isSession && !isBadInput;

  if (isQuota) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="rise-in w-full max-w-2xl">
          <QuotaNotice variant="card" resetsAt={error.resetsAt ?? null} />
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer rounded-full border border-line-strong bg-surface-elevated px-8 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-high"
            >
              Back to my report
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="rise-in w-full max-w-xl rounded-2xl border border-line-soft bg-surface p-8 text-center shadow-sm sm:p-10">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${
            isSession
              ? "border-sky-500/30 bg-sky-950/60 text-sky-300"
              : "border-amber-500/20 bg-[#2a2216] text-amber-300"
          }`}
        >
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </div>

        <h2 className="mt-6 text-[22px] font-semibold leading-[30px] tracking-tight text-white">
          {isSession
            ? "Your session ended."
            : "We couldn't explain that report right now."}
        </h2>
        <p className="mt-3 text-body leading-6 text-ink-soft">
          {isSession ? "Sign in again to continue." : error.message}
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {isSession ? (
            <button
              type="button"
              onClick={onSignInAgain}
              className="cursor-pointer rounded-full bg-[#f4f4f5] px-8 py-3 text-sm font-semibold text-[#131314] transition-colors hover:bg-white"
            >
              Sign in again
            </button>
          ) : (
            canRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#f4f4f5] px-8 py-3 text-sm font-semibold text-[#131314] transition-colors hover:bg-white"
              >
                <RefreshCw className="h-[18px] w-[18px]" aria-hidden />
                Try again
              </button>
            )
          )}
          {!isSession && (
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer rounded-full border border-line-strong bg-surface-elevated px-8 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-high"
            >
              Back to my report
            </button>
          )}
        </div>

        {canRetry && (
          <p className="mt-6 text-caption text-ink-muted">
            Your remaining allowance is refreshed automatically.
          </p>
        )}
        {isBadInput && (
          <p className="mt-6 text-caption text-ink-muted">
            Your input is still here — adjust it and try again.
          </p>
        )}
      </div>
    </main>
  );
}
