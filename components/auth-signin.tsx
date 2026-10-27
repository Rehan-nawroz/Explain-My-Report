"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Signed-out screen (mechanics per approved frontend spec, Screen 1):
 * pitch block → "Continue with Google" → divider "or" → email field +
 * "Send sign-in link" → confirmation state. Boundary line in footer.
 */
export default function AuthSignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold">Explain My Report</h1>
      <p className="mt-4 text-neutral-700">
        Paste or photograph a medical report and get a calm, plain-language
        explanation: a plain summary, each key finding in normal words, and the
        right questions to bring to your next appointment.
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        Educational explanation only — not medical advice, not a diagnosis.
        Your report is never stored.
      </p>

      <button
        type="button"
        onClick={signInWithGoogle}
        className="mt-8 w-full rounded border border-neutral-300 bg-white px-4 py-3 font-medium text-neutral-800 hover:bg-neutral-50"
      >
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-sm text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        or
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      {sent ? (
        <p className="rounded border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          Check your email — we sent a sign-in link to{" "}
          <strong>{email}</strong>.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => setSent(false)}
          >
            Use a different email
          </button>
        </p>
      ) : (
        <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded border border-neutral-300 px-4 py-3"
            aria-label="Email address"
          />
          <button
            type="submit"
            disabled={busy || email.trim().length === 0}
            className="w-full rounded bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <p className="mt-8 text-xs text-neutral-400">
        This tool explains what your report says. It does not diagnose,
        predict, or recommend treatment — anything concerning must be discussed
        with your care team.
      </p>
    </main>
  );
}
