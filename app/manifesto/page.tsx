"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// /manifesto — what FormLayer believes
// ─────────────────────────────────────────────────────────────────────────────

const TENETS = [
  {
    n: "01",
    k: "We don't invent doses.",
    v: "Every recommendation traces back to a published human RCT. If the evidence isn't there, the tool says so out loud. Invented confidence is the opposite of useful.",
  },
  {
    n: "02",
    k: "Evidence is a primitive, not a feature.",
    v: "Citations aren't a footnote you toggle on for marketing. They're the substrate the whole workspace runs on. Take them away and FormLayer is just another text editor.",
  },
  {
    n: "03",
    k: "The brief is the product.",
    v: "What you ship to your manufacturer matters more than the slide deck. The output is a Supplement Facts panel, a clinical rationale per ingredient, and a live share link — not a PDF that goes stale the moment it leaves your laptop.",
  },
  {
    n: "04",
    k: "Compliance is a co-author, not a gatekeeper.",
    v: "We surface label and claim risk early — when fixing it is cheap — not in the legal review that adds a month to your launch. Auto-fix suggestions are for review, never auto-applied.",
  },
  {
    n: "05",
    k: "Calm beats clever.",
    v: "Supplement formulation is a serious craft. The workspace should feel like a research library, not a casino. We design for the team that will still be here in five years.",
  },
] as const;

const CONTRAST = [
  { good: "Surfaced from a 2024 meta-analysis (n=437)", bad: "Likely beneficial for inflammation" },
  { good: "Within RCT range · 200–600 mg",              bad: "Standard dosage" },
  { good: "Reword: structure-function claim 21 CFR §101.93", bad: "Approved for label use" },
  { good: "Issue: zinc upper limit at 40 mg/day",        bad: "Looks good" },
];

export default function ManifestoPage() {
  return (
    <div className="overflow-x-hidden bg-[#fbfaf7]">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-28 pb-24 md:pt-36 md:pb-32">
        <div className="aurora" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]">
          <div className="subtle-grid absolute inset-0" />
        </div>
        <div className="grain pointer-events-none absolute inset-0 -z-10" />

        <div className="page-shell relative">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="mx-auto flex w-fit items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-3.5 py-1.5 text-[11.5px] font-medium tracking-wide text-gray-700 backdrop-blur"
          >
            <span className="size-1.5 rounded-full bg-brand" /> Manifesto
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="display-2xl mx-auto mt-8 max-w-[1040px] px-4 text-center"
          >
            <span className="block text-gradient-ink">The supplement industry</span>
            <span className="mt-1 block">
              <span className="text-gradient-brand italic inline-block pr-[0.14em] pb-[0.08em] leading-[1.02]">runs</span>{" "}
              <span className="text-gradient-ink">on vibes.</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}
            className="mx-auto mt-8 max-w-[58ch] text-balance-tight text-center text-[17px] leading-[1.6] text-gray-500"
          >
            We&apos;re building the opposite — a workspace where every recommendation has a
            citation, every claim has a compliance check, and every formulation has a paper
            trail. FormLayer is a tool for the people who take this craft seriously.
          </motion.p>
        </div>
      </section>

      {/* ── TENETS ───────────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What we believe</p>
            <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
              Five things FormLayer will never compromise on.
            </h2>
          </div>

          <div className="mt-20 space-y-6">
            {TENETS.map((t, i) => (
              <motion.div
                key={t.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="group relative grid gap-6 rounded-3xl border border-black/[0.05] bg-white/70 p-8 backdrop-blur transition-all hover:border-brand/20 hover:shadow-[0_8px_32px_rgba(91,110,225,0.08)] md:grid-cols-[140px_1fr] md:p-10"
              >
                <div>
                  <span className="font-mono text-[12.5px] text-brand">{t.n}</span>
                </div>
                <div>
                  <h3 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-gray-950 md:text-[32px]">{t.k}</h3>
                  <p className="mt-4 max-w-[58ch] text-[15.5px] leading-relaxed text-gray-500">{t.v}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTRAST: WHAT WE WON'T SAY ─────────────────────────────────── */}
      <section className="relative isolate overflow-hidden py-24 md:py-32">
        <div className="aurora aurora-dark absolute inset-0 -z-10 opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gray-950" />
        <div className="grain pointer-events-none absolute inset-0 -z-10" />

        <div className="page-shell relative">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a5b4fc]">What we won&apos;t say</p>
            <h2 className="display-lg mt-5 text-balance-tight text-white">
              Specificity, or silence.<br />
              <span className="text-gradient-brand-dark italic">Never the in-between.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-gray-400">
              The supplement industry is full of confident vagueness. FormLayer answers
              with a citation, or it tells you it doesn&apos;t know.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-3xl border border-white/[0.08]">
            <div className="grid grid-cols-2 border-b border-white/[0.08] bg-white/[0.02] px-6 py-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              <span>FormLayer says</span>
              <span>What it refuses to say</span>
            </div>
            {CONTRAST.map((c, i) => (
              <div key={i} className={`grid grid-cols-2 gap-6 px-6 py-5 ${i !== 0 ? "border-t border-white/[0.06]" : ""}`}>
                <p className="text-[14px] text-white/90">{c.good}</p>
                <p className="text-[14px] text-gray-500 line-through decoration-red-500/50 decoration-1">{c.bad}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32">
        <div className="page-shell">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Who this is for</p>
            <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
              For builders who treat doses like they matter.
            </h2>
            <p className="mt-6 mx-auto max-w-xl text-[16px] leading-relaxed text-gray-500">
              If you&apos;re launching the kind of supplement product that earns trust over
              years — not the kind that wins a TikTok cycle — FormLayer is built for you.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pb-28 pt-12 md:pb-36">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-[36px] border border-black/[0.05] bg-white p-12 text-center shadow-[0_30px_80px_-30px_rgba(91,110,225,0.35)] md:p-20">
            <div className="aurora absolute inset-0 -z-10 opacity-70" />
            <div className="grain pointer-events-none absolute inset-0 -z-10" />

            <p className="eyebrow">Build with us</p>
            <h2 className="display-lg mt-5 text-balance-tight text-gradient-ink">
              Evidence in. Formulation out.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-gray-500">
              FormLayer is in private beta. If this is the way you already work — or want to —
              request access and we&apos;ll be in touch.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/sign-up" className="group inline-flex items-center gap-2 rounded-full bg-gray-950 px-7 py-3.5 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_24px_rgba(17,17,17,0.2)] transition-all hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_12px_32px_rgba(91,110,225,0.35)]">
                Request access <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link href="/methodology" className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-7 py-3.5 text-[14px] font-medium text-gray-900 transition hover:border-black/15 hover:bg-gray-50">
                Read the methodology
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
