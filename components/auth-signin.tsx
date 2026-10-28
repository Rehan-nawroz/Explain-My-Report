"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Info, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Signed-out screen — Screen 1 of the design package.
 * One hero card: headline, boundary pill, Google, "or", magic link.
 * Authentication mechanics are unchanged from Task 6.
 */
export default function AuthSignIn({
  initialError = null,
}: {
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function signInWithGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    if (error) setError(error.message);
  }

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="mx-auto w-full max-w-7xl px-6 pb-4 pt-8">
        <div className="flex select-none items-center justify-center gap-2">
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <span className="text-[18px] font-semibold tracking-tight text-ink-strong">
            Explain My Report
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[48rem] flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 md:py-10">
        <section className="rise-in w-full rounded-2xl border border-[#2f3336] bg-surface p-6 shadow-[0_8px_30px_rgb(0,0,0,0.35)] sm:p-10 md:p-12">
          <div className="space-y-3 text-center">
            <h1 className="text-[28px] font-semibold leading-9 tracking-tight text-ink-strong">
              Understand your medical report in plain language
            </h1>
            <p className="mx-auto max-w-xl text-body text-ink-soft">
              Translates cancer-related pathology and laboratory reports into
              clear, compassionate, everyday words.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#2f3336] bg-[#1f2328] px-4 py-1.5 text-[11px] font-semibold text-ink-soft">
              <Info className="h-3.5 w-3.5 text-primary-bright" aria-hidden />
              Educational explanation only — not medical advice, not a
              diagnosis.
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-md space-y-6">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-line-strong bg-[#212121] px-5 py-3 text-sm font-medium text-ink-strong transition-colors hover:bg-surface-elevated"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5 flex-shrink-0"
                viewBox="0 0 24 24"
              >
                <path
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  fill="#4285F4"
                />
                <path
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"
                  fill="#34A853"
                />
                <path
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#2e3134]" />
              <span className="text-[12px] font-medium uppercase tracking-wider text-ink-muted">
                or
              </span>
              <span className="h-px flex-1 bg-[#2e3134]" />
            </div>

            {sent ? (
              <div className="rounded-2xl border border-teal-500/25 bg-[#16211f] p-5 text-center">
                <Mail className="mx-auto h-5 w-5 text-primary" aria-hidden />
                <p className="mt-2 text-body text-ink">
                  Check your email — we sent a sign-in link to{" "}
                  <strong className="font-medium text-ink-strong">
                    {email}
                  </strong>
                  .
                </p>
                <p className="mt-1 text-caption text-ink-muted">
                  The link signs you in; no password is used.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-3 text-caption text-primary underline underline-offset-4 transition-colors hover:text-primary-bright"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={sendMagicLink} className="space-y-3">
                <div>
                  <label className="sr-only" htmlFor="user-email">
                    Email address
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-full border border-line-strong bg-surface-ambient px-5 py-3 text-body text-ink transition-colors placeholder:text-ink-muted focus:border-primary-bright focus:bg-[#141517] focus:outline-none focus:ring-2 focus:ring-primary-bright/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || email.trim().length === 0}
                  className="w-full rounded-full bg-[#f4f4f4] px-5 py-3 text-sm font-semibold text-[#131314] shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send sign-in link"}
                </button>
                <p className="pt-1 text-center text-caption text-ink-muted">
                  A sign-in link will be emailed to you; no password is used.
                </p>
              </form>
            )}

            <p className="text-center text-caption leading-relaxed text-ink-muted">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>

            {error && (
              <p className="text-center text-caption text-danger" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[#2f3336]/60 bg-canvas px-6 py-6 text-center">
        <p className="mx-auto max-w-xl text-caption leading-relaxed text-ink-muted">
          Educational explanation only — not medical advice, not a diagnosis.
          We never store report content.
        </p>
        <nav
          aria-label="Legal"
          className="mt-3 flex items-center justify-center gap-4 text-caption"
        >
          <Link
            href="/privacy"
            className="text-ink-soft transition-colors hover:text-primary"
          >
            Privacy Policy
          </Link>
          <span className="text-line-strong" aria-hidden>
            ·
          </span>
          <Link
            href="/terms"
            className="text-ink-soft transition-colors hover:text-primary"
          >
            Terms of Service
          </Link>
        </nav>
      </footer>
    </div>
  );
}
