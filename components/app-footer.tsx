import Link from "next/link";

/**
 * Footer shared by all screens. Privacy Policy and Terms of Service link to
 * the real pages (/privacy, /terms); the trust line stays plain text because
 * it is a statement, not a destination.
 */
export default function AppFooter() {
  return (
    <footer className="mt-auto w-full border-t border-line-soft bg-[#18181b]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-[11px] text-ink-muted sm:px-6 md:flex-row">
        <p>
          © {new Date().getFullYear()} Explain My Report. Educational guidance
          only, not a clinical diagnosis.
        </p>
        <nav aria-label="Legal" className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="transition-colors hover:text-primary"
          >
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-primary">
            Terms of Service
          </Link>
        </nav>
        <p className="text-ink-muted">
          Not medical advice · Nothing stored · Encrypted in transit
        </p>
      </div>
    </footer>
  );
}
