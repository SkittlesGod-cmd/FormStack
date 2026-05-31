import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog – FormLayer",
  description: "Product updates, improvements, and fixes — shipped continuously.",
};

const BADGE_STYLES: Record<string, string> = {
  New:      "bg-brand-50 text-brand-600 border-brand-100",
  Improved: "bg-amber-50 text-amber-700 border-amber-100",
  Launch:   "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const ENTRIES = [
  {
    version: "v0.5",
    date: "May 31, 2026",
    title: "Blog, features page, and marketing improvements",
    badge: "New",
    items: [
      "MDX-based blog system — file-based posts with reading time, category tags, and individual post pages",
      "Features page rewrite — 6 detailed sections with plan tags, bullet details, and evidence-backed copy",
      "Pricing page rewrite — richer per-plan descriptions, comparison table, and trust signals",
      "Landing page copy overhaul — removed placeholder language, added 'Who it's for' profiles and social proof",
      "Cookie consent now includes a 'Decline non-essential' option with ARIA accessibility attributes",
      "Sign-in: OAuth retry reset after 10s timeout; magic link resend with 30s cooldown",
      "Dashboard: disabled state for compliance quick action when no formulations exist",
    ],
  },
  {
    version: "v0.4",
    date: "May 30, 2026",
    title: "Evidence grades & clinical citations",
    badge: "New",
    items: [
      "AI formulations now include evidence grade (A/B/C) and clinical dose range per ingredient",
      "Citation rationale stored with each ingredient and shown in PDF export and share pages",
      "Dose assessment warnings (below/above clinical dose) displayed in ingredient cards",
    ],
  },
  {
    version: "v0.3",
    date: "May 28, 2026",
    title: "PDF export & public share links",
    badge: "New",
    items: [
      "Print-ready formulation dossier with supplement facts panel and manufacturing specs",
      "Public share links (/f/[token]) — standalone page with no app chrome, CTA to sign up",
      "Dashboard stats now count all formulations, not just the 8 most recently displayed",
    ],
  },
  {
    version: "v0.2",
    date: "May 25, 2026",
    title: "Billing & compliance",
    badge: "Improved",
    items: [
      "Paddle Billing integration — Starter and Pro plans with sandbox checkout",
      "FDA compliance checker scores formulations 0–100 with issue breakdown",
      "Compliance auto-fix: if score < 75, AI rewrites to score 85+",
    ],
  },
  {
    version: "v0.1",
    date: "May 20, 2026",
    title: "Initial launch",
    badge: "Launch",
    items: [
      "AI formulation builder: research → formulate → refine in one workflow",
      "Ingredient research with clinical evidence sourcing",
      "Version history: every save creates a restorable snapshot",
      "Public share links and manufacturer handoff brief generator",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-[720px] px-5 py-16 md:py-24">
      <div className="mb-14">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          What&apos;s new
        </p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-gray-950 md:text-[40px]">
          Changelog
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-500">
          Product updates, improvements, and fixes — shipped continuously.
        </p>
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-black/[0.06]" />

        <div className="space-y-12">
          {ENTRIES.map((entry) => (
            <div key={entry.version} className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute left-0 top-[6px] size-[15px] rounded-full border-2 border-white bg-gray-200 ring-1 ring-black/[0.08]" />

              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-[12px] font-semibold text-gray-400">
                  {entry.version}
                </span>
                <span className="text-[12px] text-gray-400">{entry.date}</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                    BADGE_STYLES[entry.badge] ?? "bg-gray-50 text-gray-600 border-gray-100"
                  }`}
                >
                  {entry.badge}
                </span>
              </div>

              <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-gray-950">
                {entry.title}
              </h2>

              <ul className="mt-4 space-y-2.5">
                {entry.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-gray-600">
                    <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-gray-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 border-t border-black/[0.06] pt-8">
        <p className="text-[13px] text-gray-400">
          © 2026 FormLayer, Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
