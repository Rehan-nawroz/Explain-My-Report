"use client";

import Image from "next/image";
import { CircleUserRound, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Persistent header for every signed-in screen (Screens 2–5):
 * logo + wordmark, quota pill, account email, sign out.
 * The quota pill turns amber at zero so the limit is legible at a glance.
 */
export default function AppHeader({
  email,
  quotaLeft,
}: {
  email: string;
  quotaLeft: number;
}) {
  const exhausted = quotaLeft <= 0;

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-line-soft bg-[#18181b]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="flex select-none items-center gap-2.5">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="rounded-lg"
              priority
            />
            <span className="text-[18px] font-semibold tracking-tight text-ink-strong">
              Explain My Report
            </span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${
              exhausted
                ? "border-amber-600/30 bg-[#2a2218] text-amber-200"
                : "border-teal-500/30 bg-[#202624] text-teal-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                exhausted ? "bg-attention" : "bg-primary"
              }`}
            />
            {quotaLeft} of 3 explanations left today
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden items-center gap-2 text-xs font-medium text-ink-soft md:flex">
            <CircleUserRound className="h-4 w-4 text-ink-muted" aria-hidden />
            {email}
          </span>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            Sign out
            <LogOut className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
