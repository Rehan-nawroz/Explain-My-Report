"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

const COPY_RESET_MS = 2200;

/**
 * Questions for the care team, with a copy-to-clipboard action so the
 * person can bring them to the appointment. Falls back to selecting the
 * list when the clipboard API is unavailable (non-secure origins).
 */
export default function DoctorQuestions({ questions }: { questions: string[] }) {
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  async function copy() {
    const text = questions
      .map((question, index) => `${index + 1}. ${question}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      // Clipboard blocked — select the list instead so it can be copied by hand.
      const list = listRef.current;
      if (list) {
        const range = document.createRange();
        range.selectNodeContents(list);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setSelected(true);
      window.setTimeout(() => setSelected(false), COPY_RESET_MS);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[22px] font-semibold leading-[30px] tracking-tight text-white">
          Questions for your doctor
        </h2>
        <button
          type="button"
          onClick={copy}
          className={`inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-zinc-700 bg-[#27272a] px-3.5 py-1.5 text-[12px] font-medium text-zinc-200 shadow-sm transition-colors duration-150 hover:bg-zinc-800 active:scale-[0.98] ${
            copied ? "bg-zinc-700" : ""
          }`}
        >
          {copied ? (
            <Check className="h-[18px] w-[18px] text-teal-400" aria-hidden />
          ) : (
            <Copy className="h-[18px] w-[18px] text-teal-400" aria-hidden />
          )}
          <span>
            {copied
              ? "Copied to clipboard!"
              : selected
                ? "Selected — press Ctrl+C"
                : "Copy questions"}
          </span>
        </button>
      </div>

      <div className="rounded-2xl border border-line-soft bg-surface p-6 shadow-sm sm:p-8">
        <ol
          ref={listRef}
          className="space-y-4 text-body leading-6 text-[#e5e7eb]"
        >
          {questions.map((question, index) => (
            <li key={index} className="flex items-start gap-3.5">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-zinc-700/80 bg-[#27272a] text-[11px] font-semibold text-zinc-300">
                {index + 1}
              </span>
              <span>{question}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
