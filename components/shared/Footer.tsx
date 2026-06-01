"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "For agencies", href: "/for-agencies" },
      { label: "Changelog", href: "/changelog" },
      { label: "vs. Spreadsheets", href: "/vs" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Journal", href: "/blog" },
      { label: "Security", href: "/security" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <footer className="relative isolate overflow-hidden border-t border-black/[0.05] bg-white/60 backdrop-blur">
      {/* Soft aurora at the bottom */}
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -z-10 h-[420px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#dcd1ff]/30 via-[#b9c8ff]/30 to-transparent blur-3xl" />

      <div className="page-shell pt-16 pb-12 md:pt-20">
        {/* Big editorial wordmark + tagline */}
        <div className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="relative flex size-5 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#a48bff] via-[#7c8dff] to-[#5b6ee1] opacity-90" />
                <span className="absolute inset-[3px] rounded-full bg-white/85" />
                <span className="relative size-1.5 rounded-full bg-gray-950" />
              </span>
              <span className="text-[15px] font-medium tracking-[-0.022em] text-gray-950">FormLayer</span>
            </Link>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-gray-500">
              Evidence-led product development for supplement brands. Research, compliance,
              and the manufacturer brief — in one workspace.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="group inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-950 px-5 py-2.5 text-[13px] font-medium text-white shadow-[0_4px_14px_rgba(17,17,17,0.18)] transition hover:shadow-[0_8px_24px_rgba(91,110,225,0.32)]"
          >
            Request access <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Link columns */}
        <div className="grid gap-12 border-t border-black/[0.06] pt-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="hidden md:block" />
          {FOOTER_COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gray-400">{heading}</p>
              <nav className="mt-4 flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="w-fit text-[13.5px] text-gray-600 transition-colors hover:text-gray-950"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Massive faint wordmark — Apple-style brand whisper */}
        <div className="mt-20 select-none overflow-hidden">
          <p
            className="text-center text-[clamp(4rem,16vw,16rem)] font-semibold leading-[0.85] tracking-[-0.05em]"
            style={{ background: "linear-gradient(180deg, rgba(17,17,17,0.06) 0%, rgba(17,17,17,0) 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            FormLayer
          </p>
        </div>

        {/* Bottom bar */}
        <div className="-mt-8 flex flex-col gap-3 border-t border-black/[0.05] pt-6 text-[12px] text-gray-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 FormLayer, Inc.</p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="transition-colors hover:text-gray-600">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-gray-600">Privacy</Link>
            <Link href="/security" className="transition-colors hover:text-gray-600">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
