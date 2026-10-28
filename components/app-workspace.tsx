"use client";

import { useState } from "react";
import AppFooter from "@/components/app-footer";
import AppHeader from "@/components/app-header";
import ErrorMessage from "@/components/error-message";
import LoadingState from "@/components/loading-state";
import QuotaNotice from "@/components/quota-notice";
import ReportInput from "@/components/report-input";
import ResultsView from "@/components/results-view";
import type {
  ExplainPayload,
  InputMode,
  PageError,
  ReportExplanation,
  UploadedImage,
} from "@/types/report";

type Screen = "input" | "loading" | "results" | "error";


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
          {quotaLeft <= 0 && (
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
              <QuotaNotice variant="card" resetsAt={resetsAt} />
            </div>
          )}
        </>
      )}

      {screen === "loading" && <LoadingState />}

      {screen === "results" && result && (
        <ResultsView result={result} onReset={reset} />
      )}

      {screen === "error" && error && (
        <ErrorMessage
          error={error}
          onRetry={explain}
          onSignInAgain={() => {
            window.location.href = "/";
          }}
          onBack={() => setScreen("input")}
        />
      )}

      <AppFooter />
    </div>
  );
}
