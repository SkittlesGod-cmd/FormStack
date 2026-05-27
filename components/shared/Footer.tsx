import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "For agencies", href: "/for-agencies" },
  { label: "Waitlist", href: "/get-access" },
];

export function Footer() {
  return (
    <footer className="border-t border-black/6 bg-[rgba(255,255,255,0.7)]">
      <div className="page-shell py-10 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-gray-950">
              EnhanceLabs
            </p>
            <p className="mt-3 fine-print">
              Evidence-backed product development for supplement brands and
              agencies. Research, compliance, and manufacturing in one workflow.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500"
          >
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className="transition-colors hover:text-gray-950">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-black/6 pt-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 EnhanceLabs, Inc.</p>
          <p>Built for teams moving from formulation to launch with more confidence.</p>
        </div>
      </div>
    </footer>
  );
}
