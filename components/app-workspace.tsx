"use client";

import { useState } from "react";
import { AlertTriangle, Clock, RefreshCw, Sparkles } from "lucide-react";
import AppFooter from "@/components/app-footer";
import AppHeader from "@/components/app-header";
import ReportInput from "@/components/report-input";
import { formatResetWindow } from "@/lib/format";
import type {
  ExplainPayload,
  InputMode,
  ReportExplanation,
  UploadedImage,
} from "@/types/report";

type Screen = "input" | "loading" | "results" | "error";
type PageError = { status: number; message: string; resetsAt?: string };

const STATUS_STYLES: Record<string, string> = {
  routine:
    "border-emerald-500/30 bg-emerald-950/60 text-emerald-300",
  needs_attention: "border-amber-500/30 bg-amber-950/60 text-amber-300",
  unclear: "border-sky-500/30 bg-slate-900 text-sky-300",
};

const STATUS_LABEL: Record<string, string> = {
  routine: "Routine",
  needs_attention: "Needs attention",
  unclear: "Unclear",
};

function DisclaimerBanner() {
  return (
    <section
      aria-label="Clinical disclaimer"
      className="flex items-start gap-4 rounded-2xl border border-sky-500/20 bg-disclaimer p-5 sm:items-center"
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-sky-500/30 bg-sky-950/60 font-semibold text-sky-400">
        i
      </span>
      <p className="text-caption leading-relaxed text-sky-200">
        This is an educational explanation of your report, not medical advice or
        a diagnosis. Discuss anything concerning with your care team.
      </p>
    </section>
  );
}

/**
 * Signed-in workspace. The server component (app/page.tsx) owns the auth
 * gate and the initial quota; this component owns the four screens and
 * keeps the payload alive across every failure.
 */
export default function AppWorkspace({
  email,
  initialLeft,
  initialResetsAt,
}: {
  email: string;
  initialLeft: number;
  initialResetsAt: string | null;
}) {
  const [screen, setScreen] = useState<Screen>("input");
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [result, setResult] = useState<ReportExplanation | null>(null);
  const [error, setError] = useState<PageError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [quotaLeft, setQuotaLeft] = useState(initialLeft);
  const [resetsAt, setResetsAt] = useState<string | null>(initialResetsAt);
  const [submitting, setSubmitting] = useState(false);

  async function refreshQuota() {
    try {
      const response = await fetch("/api/quota", { cache: "no-store" });
      if (!response.ok) return;
      const quota = (await response.json()) as {
        left: number;
        resetsAt: string | null;
      };
      setQuotaLeft(quota.left);
      setResetsAt(quota.resetsAt);
    } catch {
      // Non-fatal: the counter simply keeps its last known value.
    }
  }

  async function explain() {
    let payload: ExplainPayload | null = null;
    if (mode === "text" && text.trim().length > 0) {
      payload = { kind: "text", text };
    } else if (mode === "image" && image) {
      payload = {
        kind: "image",
        imageBase64: image.base64,
        mimeType: image.mimeType,
      };
    }
    if (!payload) return;

    setNotice(null);
    setSubmitting(true);
    setScreen("loading");

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as
        | ReportExplanation
        | { error?: string; resetsAt?: string };

      if (!response.ok) {
        setError({
          status: response.status,
          message:
            ("error" in body && body.error) ||
            "We couldn't explain that report right now. Please try again.",
          resetsAt: "resetsAt" in body ? body.resetsAt : undefined,
        });
        setScreen("error");
        void refreshQuota();
        return;
      }

      setResult(body as ReportExplanation);
      setScreen("results");
      void refreshQuota();
    } catch {
      setError({
        status: 0,
        message:
          "We couldn't reach the server. Check your connection and try again.",
      });
      setScreen("error");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setScreen("input");
    setResult(null);
    setError(null);
    void refreshQuota();
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <AppHeader email={email} quotaLeft={quotaLeft} />

      {screen === "input" && (
        <>
          {notice && (
            <div className="mx-auto mt-4 w-full max-w-3xl px-4">
              <p
                role="alert"
                className="rounded-xl border border-red-500/30 bg-[#2a1618] px-4 py-2 text-caption text-danger"
              >
                {notice}
              </p>
            </div>
          )}
          <ReportInput
            mode={mode}
            onModeChange={setMode}
            text={text}
            onTextChange={setText}
            image={image}
            onImageChange={setImage}
            onError={setNotice}
            onSubmit={explain}
            submitting={submitting}
            quotaLeft={quotaLeft}
            resetsAt={resetsAt}
          />
        </>
      )}

      {screen === "loading" && (
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-32 w-32 items-center justify-center">
              <span className="absolute h-32 w-32 rounded-full border border-teal-500/15" />
              <span className="halo-pulse absolute h-24 w-24 rounded-full border border-teal-500/25" />
              <span className="halo-pulse absolute h-16 w-16 rounded-full bg-teal-500/10" />
              <Sparkles className="relative h-7 w-7 text-primary" aria-hidden />
            </div>
            <h2 className="mt-10 text-[22px] font-semibold tracking-tight text-white">
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
      )}

      {screen === "results" && result && (
        <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 sm:px-6 md:py-12">
          <DisclaimerBanner />

          <section className="space-y-4">
            <h2 className="text-[22px] font-semibold leading-8 tracking-tight text-white">
              Plain summary
            </h2>
            <div className="rounded-2xl border border-line-soft bg-surface p-6 text-body leading-7 text-ink">
              {result.summary}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-semibold leading-8 tracking-tight text-white">
              Key findings
            </h2>
            <div className="space-y-3.5">
              {result.findings.map((finding, index) => (
                <article
                  key={`${finding.term}-${index}`}
                  className="rounded-2xl border border-line-soft bg-surface p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                    <h3 className="text-[18px] font-semibold leading-6 tracking-tight text-white">
                      {finding.term}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                        STATUS_STYLES[finding.status] ?? STATUS_STYLES.unclear
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {STATUS_LABEL[finding.status] ?? finding.status}
                    </span>
                  </div>
                  <p className="text-body text-ink">{finding.plainMeaning}</p>
                  <p className="mt-3 rounded-xl border border-line-soft bg-inset p-3 font-mono text-[12px] leading-5 text-ink-soft">
                    “{finding.reportQuote}”
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[22px] font-semibold leading-8 tracking-tight text-white">
              Questions for your doctor
            </h2>
            <div className="rounded-2xl border border-line-soft bg-surface p-6">
              <ol className="space-y-4">
                {result.questions.map((question, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3.5 text-body text-ink"
                  >
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-elevated font-mono text-[11px] font-semibold text-ink-soft">
                      {index + 1}
                    </span>
                    <span>{question}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <DisclaimerBanner />

          <div className="flex justify-center pb-4">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-[#f9fafb] px-7 py-3 text-sm font-semibold text-[#131314] shadow-md transition-colors hover:bg-white"
            >
              Explain another report
            </button>
          </div>
        </main>
      )}

      {screen === "error" && error && (
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="rise-in w-full max-w-xl rounded-2xl border border-line-soft bg-surface p-8 text-center sm:p-10">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${
                error.status === 429
                  ? "border-zinc-700/60 bg-[#27272a] text-zinc-300"
                  : "border-amber-500/20 bg-[#2a2216] text-amber-300"
              }`}
            >
              {error.status === 429 ? (
                <Clock className="h-7 w-7" aria-hidden />
              ) : (
                <AlertTriangle className="h-7 w-7" aria-hidden />
              )}
            </div>

            <h2 className="mt-6 text-[22px] font-semibold tracking-tight text-white">
              {error.status === 429
                ? "You've used all 3 explanations from the last 24 hours."
                : error.status === 401
                  ? "Your session ended."
                  : "We couldn't explain that report right now."}
            </h2>
            <p className="mt-3 text-body leading-6 text-ink-soft">
              {error.status === 401
                ? "Sign in again to continue."
                : error.message}
            </p>

            {error.status === 429 && error.resetsAt && (
              <p className="mt-3 text-caption text-ink-muted">
                Your next explanation unlocks in{" "}
                {formatResetWindow(error.resetsAt)}.
              </p>
            )}

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {error.status === 401 ? (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/";
                  }}
                  className="rounded-full bg-[#f4f4f5] px-8 py-3 text-sm font-semibold text-[#131314] transition-colors hover:bg-white"
                >
                  Sign in again
                </button>
              ) : (
                error.status !== 429 && (
                  <button
                    type="button"
                    onClick={explain}
                    className="inline-flex items-center gap-2 rounded-full bg-[#f4f4f5] px-8 py-3 text-sm font-semibold text-[#131314] transition-colors hover:bg-white"
                  >
                    <RefreshCw className="h-[18px] w-[18px]" aria-hidden />
                    Try again
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setScreen("input")}
                className="rounded-full border border-line-strong bg-surface-elevated px-8 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-high"
              >
                Back to my report
              </button>
            </div>

            {error.status !== 429 && error.status !== 401 && (
              <p className="mt-6 text-caption text-ink-muted">
                Your daily limit was not charged.
              </p>
            )}
          </div>
        </main>
      )}

      <AppFooter />
    </div>
  );
}
