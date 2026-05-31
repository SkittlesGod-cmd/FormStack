import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  FileText,
  Users,
  BarChart3,
  Share2,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";

const STEPS = [
  {
    number: "01",
    label: "Research",
    title: "Clinical evidence, not guesswork",
    body: "Describe what you want to build. FormLayer pulls dose ranges, evidence grades, and rationale from published human RCTs — and flags every known ingredient interaction before you proceed.",
    points: ["Evidence grades from published RCTs", "Clinically-studied dose ranges per ingredient", "Interaction and antagonism flags"],
  },
  {
    number: "02",
    label: "Compliance",
    title: "Know your risk before legal does",
    body: "Every formulation gets a 100-point FDA compliance score with specific issue flags by ingredient. Issues below 75 get one-click auto-fix suggestions. Nothing leaves your workspace blind.",
    points: ["100-point FDA compliance score", "Issue flags by ingredient and claim", "One-click auto-fix for common violations"],
  },
  {
    number: "03",
    label: "Handoff",
    title: "From workspace to manufacturer in one click",
    body: "Export a complete manufacturer brief: Supplement Facts panel, clinical rationale per ingredient, certifications needed, and a live share link. No reformatting, no back-and-forth.",
    points: ["Print-ready PDF dossier", "Auto-generated Supplement Facts panel", "Live manufacturer share link"],
  },
];

const CAPABILITIES = [
  {
    icon: Zap,
    title: "AI formulation in minutes",
    body: "Go from health goal to a complete, clinically-dosed ingredient stack with rationale — before your next meeting.",
  },
  {
    icon: ShieldCheck,
    title: "FDA compliance scoring",
    body: "100-point compliance check with flagged issues and auto-fix suggestions. Catch label violations before legal does.",
  },
  {
    icon: FileText,
    title: "Supplement Facts panel",
    body: "Auto-generated label with correct serving sizes, daily values, and formatting. Print-ready from day one.",
  },
  {
    icon: Share2,
    title: "Live manufacturer links",
    body: "Share a live, read-only brief with any manufacturer. No stale PDFs, no re-sending specs after every update.",
  },
  {
    icon: Users,
    title: "Multi-product workspace",
    body: "Manage every formulation in one place with version history, status tracking, and one-click restore.",
  },
  {
    icon: BarChart3,
    title: "Evidence grades A / B / C",
    body: "Every ingredient rated by volume and quality of published human trials — so you know exactly what you're building on.",
  },
];

const TESTIMONIALS = [
  {
    quote: "We used to spend three days cross-referencing PubMed before we could even start a dose rationale. FormLayer collapsed that to an afternoon. The compliance score alone saved us from a legal review we didn't see coming.",
    name: "Priya M.",
    title: "Head of R&D",
    company: "Sports Nutrition Brand",
    initials: "PM",
    color: "bg-violet-100 text-violet-700",
  },
  {
    quote: "I caught three label claims that would have been flagged by our legal team — before the deck went to the client. That's real money saved, and it happened on the first formulation I ran through the platform.",
    name: "James R.",
    title: "Founder",
    company: "Nutraceutical Brand",
    initials: "JR",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    quote: "We manage 12 supplement clients. Every formulation lives in its own workspace with version history. When a client asks 'what changed between v3 and v5,' I have the answer in ten seconds.",
    name: "Sofia T.",
    title: "Strategy Director",
    company: "CPG Agency",
    initials: "ST",
    color: "bg-amber-100 text-amber-700",
  },
];

const STATS = [
  { value: "< 5 min", label: "from goal to formulation draft" },
  { value: "100-pt", label: "FDA compliance score" },
  { value: "RCT-backed", label: "clinical dose ranges" },
  { value: "1-click", label: "manufacturer handoff" },
];

const WHO_ITS_FOR = [
  { label: "Supplement founders", desc: "Launch your first product without hiring a full R&D team." },
  { label: "In-house R&D", desc: "Cut research time and stop managing compliance in spreadsheets." },
  { label: "Brand operators", desc: "Move faster from idea to spec without waiting on outside consultants." },
  { label: "CPG agencies", desc: "Manage every client formulation in one workspace with full version history." },
];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative bg-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="subtle-grid absolute inset-0 opacity-[0.35]" />
          <div
            className="absolute -top-32 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.12]"
            style={{ background: "radial-gradient(ellipse at center, #5b6ee1 0%, transparent 70%)" }}
          />
        </div>

        <div className="page-shell relative pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.05] px-4 py-1.5 text-[12px] font-semibold text-brand">
              <span className="size-1.5 rounded-full bg-brand animate-pulse inline-block" />
              AI formulation · FDA compliance · Manufacturer handoff
            </div>

            <h1 className="display-xl text-gray-950">
              Supplement formulation<br />
              that&apos;s built on<br />
              <span className="text-brand">clinical evidence.</span>
            </h1>

            <p className="body-lg mx-auto mt-6 max-w-xl text-gray-600">
              Go from health goal to a complete, FDA-reviewed ingredient stack — with dose ranges from published RCTs and a manufacturer-ready brief — in minutes, not weeks.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href="/sign-up"
                className="rounded-full bg-gray-950 px-7 py-3.5 text-[14px] font-semibold text-white transition hover:bg-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.18)]"
              >
                Start for free
              </ButtonLink>
              <ButtonLink
                href="/vs"
                variant="ghost"
                className="rounded-full border border-black/10 bg-white px-7 py-3.5 text-[14px] font-semibold text-gray-900 transition hover:border-black/20 hover:bg-black/[0.02] flex items-center gap-2"
              >
                See how it compares <ArrowRight className="size-4" />
              </ButtonLink>
            </div>

            <p className="mt-4 text-[12px] text-gray-400">
              No credit card required &middot; Free plan includes 3 formulations
            </p>
          </div>

          {/* Product mockup card */}
          <div className="mx-auto mt-14 max-w-2xl">
            <div className="surface-card overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-black/5 bg-gray-50/80 px-5 py-3">
                <span className="size-3 rounded-full bg-red-300" />
                <span className="size-3 rounded-full bg-yellow-300" />
                <span className="size-3 rounded-full bg-green-300" />
                <span className="ml-3 text-[12px] text-gray-400">FormLayer — formulation workspace</span>
              </div>

              <div className="p-6 md:p-8">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-950">Gut-Skin Support Stack</p>
                    <p className="mt-0.5 text-[12px] text-gray-400">Targeting acne-prone women 18–35 · Capsule · 6 ingredients</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shrink-0">
                    91 / 100 compliant
                  </span>
                </div>

                {/* Ingredient rows */}
                <div className="mt-5 space-y-2">
                  {[
                    { name: "Lactobacillus rhamnosus GG", dose: "10B CFU", grade: "A", assess: "✓ at dose" },
                    { name: "Zinc Bisglycinate", dose: "30 mg", grade: "A", assess: "✓ at dose" },
                    { name: "Vitamin D3 (Cholecalciferol)", dose: "2,000 IU", grade: "B", assess: "✓ at dose" },
                    { name: "Berberine HCl", dose: "500 mg", grade: "B", assess: "↑ consider 1,000mg" },
                  ].map((ing) => (
                    <div key={ing.name} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-2.5">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ing.grade === "A"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {ing.grade}
                      </span>
                      <span className="flex-1 text-[13px] text-gray-800">{ing.name}</span>
                      <span className="text-[12px] font-medium text-gray-500">{ing.dose}</span>
                      <span className={`text-[11px] font-medium ${ing.assess.startsWith("✓") ? "text-emerald-600" : "text-amber-600"}`}>
                        {ing.assess}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-black/[0.05] bg-white p-3 text-center">
                    <p className="text-[18px] font-semibold tracking-tight text-gray-950">91</p>
                    <p className="text-[10px] text-gray-400">compliance score</p>
                  </div>
                  <div className="rounded-xl border border-black/[0.05] bg-white p-3 text-center">
                    <p className="text-[18px] font-semibold tracking-tight text-gray-950">4 / 4</p>
                    <p className="text-[10px] text-gray-400">grade A or B</p>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                    <p className="text-[18px] font-semibold tracking-tight text-emerald-600">Ready</p>
                    <p className="text-[10px] text-emerald-600/70">for manufacturer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="border-y border-black/[0.05] bg-gray-50/60 py-10">
        <div className="page-shell">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHO_ITS_FOR.map(({ label, desc }) => (
              <div key={label}>
                <p className="text-[12px] font-semibold text-gray-900">{label}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white py-14">
        <div className="page-shell">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="rounded-2xl border border-black/[0.06] bg-white px-5 py-6 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <p className="text-[26px] font-semibold tracking-[-0.04em] text-gray-950">{value}</p>
                <p className="mt-1 text-[12px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — numbered steps ── */}
      <section className="bg-gray-950 py-20 md:py-28">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#a5b4fc" }}>
              How it works
            </p>
            <h2 className="display-lg mt-4 text-white">
              Research. Comply. Ship.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-gray-400">
              The full formulation workflow — from clinical evidence to manufacturer brief — without switching between five tools.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {STEPS.map(({ number, label, title, body, points }) => (
              <div key={number} className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[42px] font-semibold tracking-[-0.04em] text-white/10 leading-none">{number}</span>
                  <span className="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#a5b4fc", borderColor: "rgba(165,180,252,0.3)", background: "rgba(91,110,225,0.12)" }}>
                    {label}
                  </span>
                </div>
                <h3 className="text-[20px] font-semibold tracking-[-0.025em] text-white leading-snug">{title}</h3>
                <p className="mt-3 text-[14px] leading-relaxed text-gray-400">{body}</p>
                <ul className="mt-6 space-y-2.5">
                  {points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-[13px] text-gray-300">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: "#818cf8" }} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <ButtonLink
              href="/sign-up"
              className="rounded-full bg-white px-7 py-3.5 text-[14px] font-semibold text-gray-950 transition hover:bg-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
            >
              Try it free — no card required
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Capabilities grid ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="page-shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div className="max-w-md">
              <p className="eyebrow">Platform</p>
              <h2 className="display-md mt-4 text-gray-950">
                Everything a supplement team actually needs.
              </h2>
              <p className="body-md mt-5 text-gray-500">
                FormLayer replaces the fragmented stack — PubMed, Notion, spreadsheets, and email threads — with one workflow your whole team can use.
              </p>
              <Link
                href="/pricing"
                className="mt-7 inline-flex items-center gap-2 text-[14px] font-semibold text-gray-950 hover:text-brand transition-colors"
              >
                See plans and pricing <ArrowRight className="size-4" />
              </Link>
              <div className="mt-6 hidden lg:block">
                <Link
                  href="/vs"
                  className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
                >
                  FormLayer vs. spreadsheets →
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {CAPABILITIES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="group rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:border-brand/20 hover:shadow-[0_4px_16px_rgba(91,110,225,0.08)] transition-all">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-brand/[0.08] text-brand">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.015em] text-gray-950">{title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-gray-50 py-20 md:py-28">
        <div className="page-shell">
          <div className="mx-auto max-w-xl text-center mb-12">
            <p className="eyebrow">What users say</p>
            <h2 className="display-md mt-4 text-gray-950">
              Built for teams who ship real products.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, title, company, initials, color }) => (
              <div key={name} className="surface-card flex flex-col p-7">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="size-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="flex-1 text-[14px] leading-relaxed text-gray-700">&ldquo;{quote}&rdquo;</p>
                <div className="mt-6 border-t border-black/[0.05] pt-5 flex items-center gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${color}`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-950">{name}</p>
                    <p className="text-[11px] text-gray-400">{title} · {company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison callout band ── */}
      <section className="bg-white border-y border-black/[0.05] py-14">
        <div className="page-shell">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">vs. spreadsheets</p>
              <h3 className="text-[22px] font-semibold tracking-[-0.025em] text-gray-950">
                Still managing formulations in Google Sheets?
              </h3>
              <p className="mt-2 text-[14px] text-gray-500 max-w-xl">
                No clinical evidence context. No compliance check. No version history. See exactly what you&apos;re giving up.
              </p>
            </div>
            <Link
              href="/vs"
              className="shrink-0 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-[13px] font-semibold text-gray-900 transition hover:border-black/20 hover:bg-gray-50"
            >
              See full comparison <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Dark CTA ── */}
      <section className="bg-gray-950 py-20 md:py-28">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#a5b4fc" }}>
              Get started today
            </p>
            <h2 className="display-lg text-white">
              Stop guessing at doses.<br />Start building on evidence.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-gray-400">
              Free plan includes 3 formulations. No credit card. No setup fee.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href="/sign-up"
                className="rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-gray-950 transition hover:bg-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              >
                Create free account
              </ButtonLink>
              <ButtonLink
                href="/pricing"
                variant="ghost"
                className="rounded-full border border-white/15 px-8 py-4 text-[15px] font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                View pricing
              </ButtonLink>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[12px] text-gray-500">
              {[
                "No credit card required",
                "3 formulations free",
                "Upgrade or cancel anytime",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-gray-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
