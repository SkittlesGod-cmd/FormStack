"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// /methodology — how the FormLayer engine actually works
// ─────────────────────────────────────────────────────────────────────────────

const GRADES = [
  {
    g: "A",
    color: "from-emerald-400 to-emerald-600",
    band: "bg-emerald-50 text-emerald-800",
    title: "Multiple human RCTs, consistent effect",
    body: "Two or more randomized controlled trials in humans, with consistent direction of effect and adequate sample size. Confidence interval excludes null. Reproduced across independent groups.",
    examples: ["Magnesium glycinate · sleep onset", "Ashwagandha KSM-66 · cortisol", "L-theanine · sustained attention"],
  },
  {
    g: "B",
    color: "from-amber-400 to-amber-600",
    band: "bg-amber-50 text-amber-800",
    title: "Mixed human evidence or single-trial signal",
    body: "Evidence is real but limited: a single RCT, mixed-direction outcomes across trials, or studies with methodological caveats. Mechanism plausibility supports inclusion; effect size may be smaller or variable.",
    examples: ["Bacopa monnieri · cognition", "Berberine · metabolic markers", "Rhodiola · mental fatigue"],
  },
  {
    g: "C",
    color: "from-gray-400 to-gray-600",
    band: "bg-gray-100 text-gray-800",
    title: "Mechanistic, animal, or observational only",
    body: "Underlying biology is supportive but human evidence is preliminary — animal models, observational cohorts, or in-vitro studies. We disclose this explicitly. We do not present these as established benefits.",
    examples: ["Many novel polyphenols", "Emerging adaptogens", "Most mushroom extracts at low dose"],
  },
] as const;

const COMPLIANCE_AXES = [
  { l: "Label claim wording",      w: 25, ex: "Structure-function vs. disease claims (21 CFR §101.93)" },
  { l: "Daily-value math",         w: 20, ex: "% DV computed against 2018 FDA RDIs, flagged if missing" },
  { l: "Allergen disclosure",      w: 15, ex: "Top-9 allergen presence and contains-statement formatting" },
  { l: "Ingredient identity",      w: 15, ex: "Compendial names, source organisms, salt forms, viability claims" },
  { l: "Upper-limit safety",       w: 15, ex: "Tolerable upper intake (UL) and ingredient-specific ceilings" },
  { l: "Format & layout",          w: 10, ex: "Serving size, container count, font-size rules for the Supplement Facts panel" },
];

const PIPELINE = [
  { k: "Intake",       v: "Free-text health goal + consumer profile + product format. Parsed into structured outcomes." },
  { k: "Retrieve",     v: "Vector + lexical search across an indexed corpus of human RCTs, meta-analyses, and FDA guidance." },
  { k: "Rank",         v: "Studies scored on trial design, sample size, indexing source, and ingredient/outcome match." },
  { k: "Synthesize",   v: "Per-ingredient evidence summary with grade, dose range, citation, and conflict flags." },
  { k: "Compose",      v: "Stack proposed for the outcome with rationale, respecting interaction and upper-limit constraints." },
  { k: "Audit",        v: "100-point compliance score on the composed stack; per-issue auto-fix suggestions surfaced." },
  { k: "Brief",        v: "Supplement Facts panel + clinical rationale + share link generated for manufacturer handoff." },
];

export default function MethodologyPage() {
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
            <span className="size-1.5 rounded-full bg-brand" /> Methodology
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="display-2xl mx-auto mt-8 max-w-[1040px] px-4 text-center"
          >
            <span className="block text-gradient-ink">How the engine</span>
            <span className="mt-1 block">
              <span className="text-gradient-brand italic inline-block pr-[0.14em] pb-[0.08em] leading-[1.02]">actually</span>{" "}
              <span className="text-gradient-ink">works.</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}
            className="mx-auto mt-8 max-w-[58ch] text-balance-tight text-center text-[17px] leading-[1.6] text-gray-500"
          >
            FormLayer isn&apos;t magic — it&apos;s a disciplined pipeline of retrieval, grading,
            and compliance auditing on top of a curated corpus of human trials. Here&apos;s
            the whole thing, in plain language.
          </motion.p>
        </div>
      </section>

      {/* ── GRADE RUBRIC ────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Evidence grades</p>
            <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
              Three grades. One honest answer.
            </h2>
            <p className="body-md mx-auto mt-5 max-w-xl text-gray-500">
              Every ingredient FormLayer surfaces carries a grade. It tells you, at a glance,
              how much human evidence stands behind it — and what kind.
            </p>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            {GRADES.map((grade, i) => (
              <motion.div
                key={grade.g}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="cinema-card relative overflow-hidden p-7"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${grade.color}`} />
                <span className={`inline-flex size-9 items-center justify-center rounded-xl text-[15px] font-bold ${grade.band}`}>{grade.g}</span>
                <h3 className="mt-5 text-[18px] font-semibold leading-snug tracking-[-0.02em] text-gray-950">{grade.title}</h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-gray-500">{grade.body}</p>
                <div className="mt-5 border-t border-black/[0.05] pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Typical examples</p>
                  <ul className="mt-2 space-y-1.5">
                    {grade.examples.map(e => (
                      <li key={e} className="text-[12.5px] text-gray-700">{e}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIPELINE ────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-white to-[#fbfaf7] py-24 md:py-32">
        <div className="page-shell">
          <div className="grid gap-14 md:grid-cols-[1fr_1.3fr] md:items-start">
            <div>
              <p className="eyebrow">The pipeline</p>
              <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
                Seven steps from a sentence to a brief.
              </h2>
              <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-gray-500">
                Each step has guardrails. No fabricated citations, no out-of-range doses,
                no auto-applied label edits — you stay in control at every gate.
              </p>
            </div>
            <ol className="relative space-y-3">
              {PIPELINE.map((p, i) => (
                <motion.li
                  key={p.k}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="group flex items-start gap-4 rounded-2xl border border-black/[0.05] bg-white/80 p-5 backdrop-blur transition hover:border-brand/20 hover:shadow-[0_4px_16px_rgba(91,110,225,0.06)]"
                >
                  <span className="font-mono text-[11px] text-brand">0{i + 1}</span>
                  <div>
                    <p className="text-[14.5px] font-semibold tracking-[-0.012em] text-gray-950">{p.k}</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-gray-500">{p.v}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE SCORE BREAKDOWN ──────────────────────────────────── */}
      <section className="relative py-24 md:py-32">
        <div className="page-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Compliance scoring</p>
            <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
              Where the 100 points come from.
            </h2>
            <p className="body-md mx-auto mt-5 max-w-xl text-gray-500">
              The compliance score is a transparent rubric. You can see every axis, its
              weight, and exactly what triggered a deduction.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-3xl border border-black/[0.06] bg-white/70 backdrop-blur">
            <div className="border-b border-black/[0.05] bg-white/40 px-6 py-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gray-400">100-point rubric</p>
            </div>
            {COMPLIANCE_AXES.map((axis, i) => (
              <div key={axis.l} className={`grid grid-cols-[1.4fr_60px] gap-4 px-6 py-5 md:grid-cols-[1.4fr_1fr_60px] ${i !== 0 ? "border-t border-black/[0.05]" : ""}`}>
                <div>
                  <p className="text-[14px] font-semibold tracking-[-0.012em] text-gray-950">{axis.l}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-gray-500 md:hidden">{axis.ex}</p>
                </div>
                <p className="hidden text-[12.5px] leading-relaxed text-gray-500 md:block">{axis.ex}</p>
                <div className="flex items-center justify-end gap-2">
                  <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 md:block">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#b88af2]" style={{ width: `${(axis.w / 25) * 100}%` }} />
                  </div>
                  <span className="font-mono text-[12.5px] tabular-nums text-gray-700">{axis.w} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRINCIPLES ──────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden py-24 md:py-32">
        <div className="aurora aurora-dark absolute inset-0 -z-10 opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gray-950" />
        <div className="grain pointer-events-none absolute inset-0 -z-10" />

        <div className="page-shell relative">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a5b4fc]">Guardrails</p>
            <h2 className="display-lg mt-5 text-balance-tight text-white">
              The lines we won&apos;t cross.
            </h2>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-3">
            {[
              { k: "No invented citations", v: "If the engine can't find a source, it says so. It does not fabricate." },
              { k: "No auto-applied edits", v: "Auto-fixes are suggestions for human review. You always click to accept." },
              { k: "No model training",     v: "Your formulations are private. We don't train any model on customer data." },
            ].map((p, i) => (
              <motion.div
                key={p.k}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-7 backdrop-blur-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a5b4fc]">{p.k}</p>
                <p className="mt-4 text-[16px] leading-relaxed text-white/90">{p.v}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pb-28 pt-12 md:pb-36">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-[36px] border border-black/[0.05] bg-white p-12 text-center shadow-[0_30px_80px_-30px_rgba(91,110,225,0.35)] md:p-20">
            <div className="aurora absolute inset-0 -z-10 opacity-70" />
            <div className="grain pointer-events-none absolute inset-0 -z-10" />

            <p className="eyebrow">See it in action</p>
            <h2 className="display-lg mt-5 text-balance-tight text-gradient-ink">
              Want to watch the engine run?
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-gray-500">
              Request access and we&apos;ll walk you through your first formulation, end to end.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/sign-up" className="group inline-flex items-center gap-2 rounded-full bg-gray-950 px-7 py-3.5 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_24px_rgba(17,17,17,0.2)] transition-all hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_12px_32px_rgba(91,110,225,0.35)]">
                Request access <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link href="/manifesto" className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-7 py-3.5 text-[14px] font-medium text-gray-900 transition hover:border-black/15 hover:bg-gray-50">
                Read the manifesto
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
