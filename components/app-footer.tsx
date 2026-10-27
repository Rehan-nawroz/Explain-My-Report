/**
 * Footer shared by all screens. The mock's Privacy / Terms / Disclaimer
 * links have no destination pages yet, so they render as plain text rather
 * than dead links (see DESIGN.md "Product constraints").
 */
export default function AppFooter() {
  return (
    <footer className="mt-auto w-full border-t border-line-soft bg-[#18181b]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-[11px] text-ink-muted sm:px-6 md:flex-row">
        <p>
          © {new Date().getFullYear()} Explain My Report. Educational guidance
          only, not a clinical diagnosis.
        </p>
        <p className="text-ink-muted">
          Not medical advice · Nothing stored · Encrypted in transit
        </p>
      </div>
    </footer>
  );
}
