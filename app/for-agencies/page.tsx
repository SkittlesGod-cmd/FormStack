import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, ShieldCheck, Users, Waypoints, FileText, Bot } from "lucide-react";

export const metadata: Metadata = {
  title: "FormLayer for Agencies",
  description:
    "FormLayer helps supplement and nutraceutical agencies deliver faster, more defensible work — AI formulation, FDA compliance scoring, and manufacturer handoff in one workspace.",
};

const AGENCY_BENEFITS = [
  {
    icon: Clock3,
    title: "Deliver a polished brief in hours, not days.",
    body: "AI formulation pulls the clinical evidence, sets RCT-backed dose ranges, and flags compliance issues before you've written a single line of copy. First drafts that used to take a week of PubMed work come together in a single session.",
  },
  {
    icon: Users,
    title: "Run multiple brands without the chaos.",
    body: "Every client gets their own formulation workspace. Status tracking, version history, and live share links keep client context from bleeding across accounts — and give you a clean handoff artifact instead of an emailed spreadsheet.",
  },
  {
    icon: ShieldCheck,
    title: "Catch compliance issues before the client does.",
    body: "Every formulation is scored against FDA structure/function claim rules before anything leaves your workspace. Issue flags by ingredient, one-click auto-fix suggestions, and claim-level review — all without a $400/hour legal review.",
  },
  {
    icon: FileText,
    title: "Hand off work that doesn't need translation.",
    body: "Export a print-ready manufacturer dossier — Supplement Facts panel, clinical rationale, certifications, fill weight calculations. Share a live link so manufacturers always see the current spec, not a PDF from three revisions ago.",
  },
  {
    icon: Bot,
    title: "Build agents for your most common briefs.",
    body: "Create AI agents with a custom persona, target population, and preferred format. Run them against any client goal and they return a complete saved formulation — including PubMed evidence enrichment — with no manual input.",
  },
  {
    icon: Waypoints,
    title: "Version history across every engagement.",
    body: "Every save is a snapshot. Compare ingredient changes across versions, restore any prior state, and never send a client 'formula_v4_FINAL_actually_final.xlsx' again.",
  },
];

const WORKFLOW = [
  {
    step: "1",
    title: "Capture the brief",
    body: "Enter the client's health goal, target format, and any constraints. FormLayer builds the initial ingredient stack with evidence grades and RCT-backed doses.",
  },
  {
    step: "2",
    title: "Review and refine",
    body: "Adjust doses, swap ingredients, check compliance scores. Every change is versioned — you can compare any two states side by side.",
  },
  {
    step: "3",
    title: "Run the compliance check",
    body: "The FDA scorer flags structure/function claim issues by ingredient and suggests rewrites. Resolve them before the brief leaves your workspace.",
  },
  {
    step: "4",
    title: "Export and hand off",
    body: "Generate the manufacturer dossier, share a live link with the client, or export a PDF. The client gets a real deliverable — not a Google Doc.",
  },
];

export default function ForAgenciesPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative bg-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="subtle-grid absolute inset-0 opacity-[0.35]" />
          <div
            className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(ellipse at center, #5b6ee1 0%, transparent 70%)" }}
          />
        </div>
        <div className="page-shell relative pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">For agencies</p>
            <h1 className="mt-4 text-[38px] font-semibold tracking-[-0.03em] text-gray-950 md:text-[50px] leading-[1.08]">
              Formulation infrastructure<br className="hidden sm:block" /> for supplement agencies.
            </h1>
            <p className="mt-6 text-[16px] leading-relaxed text-gray-500 max-w-2xl">
              FormLayer gives agencies a single workspace for clinical evidence, AI formulation, FDA compliance scoring, and manufacturer handoff — across every client brand you run.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className="rounded-full bg-gray-950 px-6 py-3 text-[13px] font-semibold text-white transition hover:bg-gray-800"
              >
                Start free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-6 py-3 text-[13px] font-semibold text-gray-900 transition hover:border-black/20 hover:bg-black/[0.02]"
              >
                See pricing <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="bg-gray-50/60 border-t border-black/[0.05] py-16 md:py-24">
        <div className="page-shell">
          <div className="mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">What it solves</p>
            <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.025em] text-gray-950">
              Built for the work agencies actually do.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENCY_BENEFITS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-black/[0.06] bg-white p-7 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              >
                <div className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/[0.08] text-brand">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-[15px] font-semibold tracking-[-0.02em] text-gray-950 leading-snug">
                  {title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-gray-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-white py-16 md:py-24">
        <div className="page-shell">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Workflow</p>
              <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.025em] text-gray-950 leading-snug">
                From client brief to manufacturer-ready dossier — in one session.
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-gray-500">
                FormLayer covers the full formulation workflow so you're not context-switching between PubMed, a compliance consultant, a designer, and a PDF editor.
              </p>
              <div className="mt-8">
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:text-brand/80 transition-colors"
                >
                  See all features <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              {WORKFLOW.map(({ step, title, body }) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-2xl border border-black/[0.06] bg-gray-50/60 p-5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-950 text-[13px] font-semibold text-white">
                    {step}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-950">{title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-950 py-20">
        <div className="page-shell text-center">
          <h2 className="text-[28px] font-semibold tracking-[-0.025em] text-white md:text-[34px]">
            Start with 3 free formulations.
          </h2>
          <p className="mt-4 text-[15px] text-gray-400 max-w-md mx-auto">
            No credit card, no setup fee, no time limit. Upgrade when you need more.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-full bg-white px-7 py-3.5 text-[14px] font-semibold text-gray-950 transition hover:bg-gray-100"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-7 py-3.5 text-[14px] font-medium text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Compare plans <ArrowRight className="size-4" />
            </Link>
          </div>
          <p className="mt-6 text-[13px] text-gray-500">
            Questions? Email{" "}
            <a href="mailto:support@formlayer.co" className="text-gray-300 hover:text-white transition-colors">
              support@formlayer.co
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
