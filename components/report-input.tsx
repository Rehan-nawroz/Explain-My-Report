"use client";

import {
  ArrowRight,
  BrainCircuit,
  Camera,
  Lock,
  MessagesSquare,
  NotebookPen,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import QuotaNotice from "@/components/quota-notice";
import SampleReportButton from "@/components/sample-report-button";
import UploadDropzone from "@/components/upload-dropzone";
import { MAX_TEXT_CHARS } from "@/lib/limits";
import type { InputMode, UploadedImage } from "@/types/report";

/**
 * Input screen — Screen 2 of the design package.
 * Owns presentation only: text, mode and image are controlled by the
 * workspace so a failed request never loses what the person typed.
 */
export default function ReportInput({
  mode,
  onModeChange,
  text,
  onTextChange,
  image,
  onImageChange,
  onError,
  onSubmit,
  submitting,
  quotaLeft,
  resetsAt,
}: {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  text: string;
  onTextChange: (value: string) => void;
  image: UploadedImage | null;
  onImageChange: (image: UploadedImage | null) => void;
  onError: (message: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  quotaLeft: number;
  resetsAt: string | null;
}) {
  const exhausted = quotaLeft <= 0;
  const nearLimit = text.length > MAX_TEXT_CHARS * 0.95;
  const hasPayload = mode === "text" ? text.trim().length > 0 : Boolean(image);
  const disabled = submitting || exhausted || !hasPayload;

  return (
    <main className="flex w-full flex-1 flex-col items-center px-4 py-8 md:py-12">
      <div className="flex w-full max-w-3xl flex-col items-center">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-[28px] font-semibold leading-9 tracking-tight text-white">
            Explain a report
          </h1>
          <p className="text-body text-ink-soft">
            Paste findings or upload a photo of your printed report.
          </p>
        </div>

        <div className="mb-6 inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => onModeChange("text")}
            aria-pressed={mode === "text"}
            className={`flex items-center gap-2 rounded-full px-5 py-1.5 text-[12px] font-medium transition-colors ${
              mode === "text"
                ? "bg-[#2d3033] text-white shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <NotebookPen className="h-4 w-4" aria-hidden />
            Paste text
          </button>
          <button
            type="button"
            onClick={() => onModeChange("image")}
            aria-pressed={mode === "image"}
            className={`flex items-center gap-2 rounded-full px-5 py-1.5 text-[12px] font-medium transition-colors ${
              mode === "image"
                ? "bg-[#2d3033] text-white shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Camera className="h-4 w-4" aria-hidden />
            Upload photo
          </button>
        </div>

        <div className="rise-in w-full rounded-2xl border border-line bg-surface p-5 md:p-6">
          {mode === "text" ? (
            <div className="flex flex-col gap-4">
              <textarea
                value={text}
                onChange={(event) => onTextChange(event.target.value)}
                maxLength={MAX_TEXT_CHARS}
                rows={9}
                placeholder="Paste the full text of your report here — findings, impression, histology, or lab values…"
                className="w-full resize-y rounded-xl border border-line bg-inset p-4 text-body leading-6 text-ink transition-colors placeholder:text-ink-muted/70 focus:border-teal-500/60 focus:bg-surface-ambient focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <SampleReportButton
                  onSample={onTextChange}
                  onError={onError}
                />
                <span
                  className={`font-mono text-[12px] tracking-tight ${
                    text.length >= MAX_TEXT_CHARS
                      ? "text-danger"
                      : nearLimit
                        ? "text-attention"
                        : "text-ink-muted"
                  }`}
                >
                  {text.length.toLocaleString("en-US")} / 20,000 characters
                </span>
              </div>
            </div>
          ) : (
            <UploadDropzone
              image={image}
              onChange={onImageChange}
              onError={onError}
            />
          )}

          <div className="mt-6 flex flex-col items-center gap-3 border-t border-line-soft pt-5 sm:flex-row sm:justify-between">
            {exhausted ? (
              <QuotaNotice variant="compact" resetsAt={resetsAt} />
            ) : (
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                We never store report content.
              </p>
            )}

            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled}
              className={`flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-semibold transition-all sm:w-auto sm:min-w-[240px] ${
                disabled
                  ? "cursor-not-allowed border border-line-strong/60 bg-[#2a2b2e] text-ink-muted shadow-none"
                  : "bg-[#f4f4f5] text-[#131314] shadow-md hover:bg-white hover:shadow-lg active:scale-[0.99]"
              }`}
            >
              {exhausted ? (
                <>
                  <span>Explain my report</span>
                  <Lock className="h-[18px] w-[18px]" aria-hidden />
                </>
              ) : (
                <>
                  <BrainCircuit className="h-5 w-5 text-teal-600" aria-hidden />
                  <span>{submitting ? "Reading your report…" : "Explain my report"}</span>
                  <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-semibold text-[#a1a1aa]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-[15px] w-[15px] text-ink-muted" aria-hidden />
            We never store report content
          </span>
          <span className="flex items-center gap-1.5">
            <Stethoscope className="h-[15px] w-[15px] text-ink-muted" aria-hidden />
            Plain-language synthesis
          </span>
          <span className="flex items-center gap-1.5">
            <MessagesSquare className="h-[15px] w-[15px] text-ink-muted" aria-hidden />
            Actionable questions for your clinician
          </span>
        </div>

        <p className="mt-4 max-w-xl text-center text-[11px] leading-relaxed text-ink-muted">
          Processed by Google Gemini. Remove names, dates of birth, and other
          identifiers before submitting.
        </p>
      </div>
    </main>
  );
}
