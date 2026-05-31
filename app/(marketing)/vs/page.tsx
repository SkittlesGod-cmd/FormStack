import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "FormLayer vs. Spreadsheets & Manual Research",
  description: "See how FormLayer compares to managing supplement formulation in Google Sheets, Notion, and scattered PubMed tabs.",
};

const COMPARISONS = [
  {
    feature: "AI-drafted ingredient stack from a health goal",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Clinical dose ranges from published human RCTs",
    formLayer: true,
    sheets: false,
    manual: "hours per ingredient",
  },
  {
    feature: "Evidence grade per ingredient (A / B / C)",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Ingredient interaction and antagonism flags",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "FDA compliance score with issue flags by ingredient",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "One-click auto-fix for compliance issues",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Auto-generated Supplement Facts panel",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Print-ready PDF dossier export",
    formLayer: true,
    sheets: "manual design",
    manual: false,
  },
  {
    feature: "Live share link for manufacturers",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Version history with one-click restore",
    formLayer: true,
    sheets: "manual file copies",
    manual: false,
  },
  {
    feature: "AI manufacturer brief generator",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Multi-product workspace with status tracking",
    formLayer: true,
    sheets: "messy tabs",
    manual: false,
  },
  {
    feature: "Time to first complete formulation draft",
    formLayer: "< 5 minutes",
    sheets: "1–2 days",
    manual: "1–3 weeks",
  },
];

const SPREADSHEET_PROBLEMS = [
  "No clinical evidence context — you're eyeballing doses based on whatever you last read",
  "Copying PubMed abstracts into Notion loses the citation trail and the dose context",
  "No compliance check until legal review — which is expensive and always late",
  "Sharing a spec means emailing a file that's outdated the moment anyone makes a change",
  "Version history is manual copies called 'formula_v4_FINAL_actually_final.xlsx'",
  "No flagging of known interactions — you find out from a supplier or a customer complaint",
];

const FORMLAYER_DIFFERENCES = [
  "AI builds a clinically-dosed stack with citations in minutes, not days",
  "Every ingredient shows its evidence grade, effective dose range, and primary mechanism",
  "Compliance runs before anything leaves your workspace — not after the deck goes out",
  "Live share links give manufacturers a real-time, always-current view of your spec",
  "Every save is a versioned snapshot — restore any prior state in one click",
  "Interaction flags surface known antagonisms before they become a product problem",
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto size-4 text-emerald-600" />;
  if (value === false) return <X className="mx-auto size-4 text-gray-200" />;
  return <span className="text-[11px] text-amber-600 font-medium">{value}</span>;
}

export default function VsPage() {
  return (
    <div className="mx-auto max-w-[900px] px-5 py-16 md:py-24">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Comparison</p>
        <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.03em] text-gray-950 md:text-[42px]">
          FormLayer vs. doing it the old way
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-500">
          Google Sheets, PubMed tabs, and emailed PDFs get the job done — eventually. Here&apos;s what that approach actually costs you in time, risk, and compounding rework.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] border-b border-black/[0.06] bg-gray-50/80 px-5 py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Feature</span>
          <span className="w-28 text-center text-[11px] font-semibold uppercase tracking-widest text-brand">FormLayer</span>
          <span className="w-24 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">Sheets</span>
          <span className="w-24 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">Manual</span>
        </div>

        {/* Rows */}
        {COMPARISONS.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center border-b border-black/[0.04] px-5 py-3.5 last:border-0 odd:bg-gray-50/30"
          >
            <span className="text-[13px] text-gray-700 pr-4">{row.feature}</span>
            <span className="w-28 text-center">
              {row.formLayer === true ? (
                <Check className="mx-auto size-4 text-emerald-600" />
              ) : (
                <span className="text-[12px] font-semibold text-emerald-600">{row.formLayer}</span>
              )}
            </span>
            <span className="w-24 text-center"><Cell value={row.sheets} /></span>
            <span className="w-24 text-center"><Cell value={row.manual} /></span>
          </div>
        ))}
      </div>

      {/* Pain points */}
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-7 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <h2 className="text-[15px] font-semibold text-gray-950">The spreadsheet reality</h2>
          <p className="mt-1.5 text-[12px] text-gray-400">What &quot;managing formulations in Google Sheets&quot; actually looks like at month 3.</p>
          <ul className="mt-5 space-y-3">
            {SPREADSHEET_PROBLEMS.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                <X className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.03] p-7">
          <h2 className="text-[15px] font-semibold text-gray-950">The FormLayer difference</h2>
          <p className="mt-1.5 text-[12px] text-gray-400">One workflow that covers research, compliance, and handoff — start to finish.</p>
          <ul className="mt-5 space-y-3">
            {FORMLAYER_DIFFERENCES.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-gray-950 p-8 text-center">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
          Ready to move faster than a spreadsheet?
        </h2>
        <p className="mt-3 text-[14px] text-gray-400">
          Free plan includes 3 formulations. No credit card required.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-semibold text-gray-950 transition hover:bg-gray-100"
          >
            Get started free <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-white/20 px-6 py-3 text-[13px] font-medium text-white transition hover:border-white/40"
          >
            See pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
