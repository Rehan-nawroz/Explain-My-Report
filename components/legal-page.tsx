import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Info, ShieldCheck } from "lucide-react";
import AppFooter from "./app-footer";

/**
 * Shared shell for the two public legal pages (/privacy, /terms).
 *
 * These pages sit outside the auth gate, so they use their own light header
 * (back link + brand) rather than the signed-in app header, whose quota pill
 * and sign-out control mean nothing to a signed-out visitor. Content mirrors
 * the design system: one 768px reading column, numbered section cards, and a
 * sticky index on desktop.
 */

export type LegalDoc = "privacy" | "terms";

export type LegalSection = {
  id: string;
  number: string;
  label: string;
  title: string;
  body: ReactNode;
};

const segmentClass = (active: boolean) =>
  [
    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
    active
      ? "bg-primary font-semibold text-[#131314]"
      : "font-medium text-ink-soft hover:bg-surface-elevated hover:text-ink",
  ].join(" ");

export default function LegalPage({
  doc,
  badge,
  title,
  lede,
  updated,
  notice,
  sections,
}: {
  doc: LegalDoc;
  badge: string;
  title: string;
  lede: string;
  updated: string;
  notice?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 w-full border-b border-line-soft bg-[#18181b]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-line-soft bg-surface-elevated px-3 py-1.5 text-[13px] text-ink-soft transition-colors hover:bg-surface-high hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to application
          </Link>
          <span className="h-4 w-px bg-line-strong/60" aria-hidden />
          <Link href="/" className="flex select-none items-center gap-2.5">
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
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 md:py-14">
        <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {badge}
          </p>
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-ink-strong md:text-[40px]">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-body text-ink-soft">{lede}</p>
          <p className="mt-2 text-caption text-ink-muted">
            Last updated: {updated}
          </p>
        </div>

        {notice ? (
          <div className="mx-auto mb-10 max-w-4xl md:mb-12">{notice}</div>
        ) : null}

        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 lg:flex-row">
          <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-24 lg:w-72">
            <nav
              aria-label="Legal documents"
              className="flex gap-1 rounded-xl border border-line-soft bg-surface p-1.5"
            >
              <Link
                href="/privacy"
                aria-current={doc === "privacy" ? "page" : undefined}
                className={segmentClass(doc === "privacy")}
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                aria-current={doc === "terms" ? "page" : undefined}
                className={segmentClass(doc === "terms")}
              >
                Terms
              </Link>
            </nav>

            <nav
              aria-label="On this page"
              className="hidden rounded-2xl border border-line-soft bg-surface p-4 lg:block"
            >
              <p className="mb-3 px-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                On this page
              </p>
              <div className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-lg px-2.5 py-1.5 text-caption text-ink-soft transition-colors hover:bg-surface-elevated hover:text-ink"
                  >
                    <span className="mr-1 text-ink-muted">{section.number}</span>
                    {section.label}
                  </a>
                ))}
              </div>
            </nav>

            <div className="rounded-2xl border border-line-soft bg-surface p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <ShieldCheck
                  className="h-4 w-4 text-primary"
                  aria-hidden
                />
                Educational tool
              </p>
              <p className="mt-1 text-caption leading-relaxed text-ink-muted">
                Explain My Report is not a clinical records system and does
                not claim HIPAA compliance or healthcare certification.
              </p>
            </div>
          </aside>

          <div className="w-full max-w-3xl space-y-10">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded border border-line-soft bg-surface-elevated px-2 py-0.5 font-mono text-[11px] text-primary">
                    {section.number}
                  </span>
                  <h2 className="text-[17px] font-semibold tracking-tight text-ink-strong">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-3 rounded-2xl border border-line-soft bg-surface p-5 text-body leading-relaxed text-ink-soft md:p-6">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

/** Bulleted list with the design system's teal markers. */
export function LegalList({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-primary/60">
      {children}
    </ul>
  );
}

/** Quiet inline note inside a section card. */
export function LegalCallout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-surface-ambient p-3.5">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <p className="text-caption leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}
