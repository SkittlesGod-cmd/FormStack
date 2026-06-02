"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// FormLayer · marketing home
// Editorial premium design: aurora hero, live formulation card, three-act
// product anatomy, real claims (no fabricated testimonials or vanity stats).
// ─────────────────────────────────────────────────────────────────────────────

// Ingredients reveal one at a time on the hero card.
const INGREDIENTS = [
  { name: "Lactobacillus rhamnosus GG", dose: "10B CFU", grade: "A", note: "Within RCT range" },
  { name: "Zinc Bisglycinate",          dose: "30 mg",   grade: "A", note: "Within RCT range" },
  { name: "Vitamin D₃ (Cholecalciferol)", dose: "2,000 IU", grade: "B", note: "Within RCT range" },
  { name: "Berberine HCl",              dose: "500 mg",  grade: "B", note: "Consider 1,000 mg" },
] as const;

const HERO_PHASES = ["Searching clinical literature…", "Mapping ingredients to outcomes…", "Scoring FDA compliance…", "Ready for manufacturer."] as const;

const ACTS = [
  {
    eyebrow: "01 · Research",
    title: "Citations come standard.",
    body: "Every ingredient is grounded in published human RCTs — graded A, B, or C by trial quality and volume. No more PubMed grinding. No more guesswork on doses.",
    bullets: ["Evidence grades A–C", "Dose ranges from human trials", "Interaction flags surfaced upfront"],
  },
  {
    eyebrow: "02 · Formulate",
    title: "From outcome to stack in minutes.",
    body: "Describe what you want the product to do. FormLayer composes the ingredient stack, justifies every dose, and gives you a workspace to iterate — fast.",
    bullets: ["Outcome-driven composition", "Per-ingredient rationale", "Version history, one-click restore"],
  },
  {
    eyebrow: "03 · Comply",
    title: "Know your label risk before legal does.",
    body: "A 100-point FDA compliance score with issue flags per ingredient. Auto-fix suggestions for common violations. Nothing leaves the workspace blind.",
    bullets: ["FDA 100-pt compliance score", "Issues flagged per ingredient", "Auto-fix for common violations"],
  },
] as const;

const FOR = [
  { kind: "Founders",     line: "Launch a first product without hiring an R&D team."  },
  { kind: "In-house R&D", line: "Cut research and dose-validation cycles by weeks."   },
  { kind: "Brand operators", line: "Move from concept to spec without external consultants." },
  { kind: "CPG agencies", line: "Manage every client formulation in one workspace." },
] as const;

const PRINCIPLES = [
  { k: "Evidence", v: "Every recommendation traces back to a published human RCT." },
  { k: "Restraint",  v: "We refuse to invent doses, claims, or interactions." },
  { k: "Handoff",  v: "The output is what a manufacturer needs — not a marketing deck." },
] as const;

export default function HomePage() {
  return (
    <div className="overflow-x-hidden bg-[#fbfaf7]">
      <Hero />
      <ProofBar />
      <ActsSection />
      <WorkspaceSection />
      <AnatomySection />
      <PrinciplesSection />
      <TimelineSection />
      <ForWhomSection />
      <FaqSection />
      <FinalCTA />
    </div>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────

function Hero() {
  const { scrollYProgress } = useScroll();
  const cardY = useTransform(scrollYProgress, [0, 0.25], [0, -40]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.4]);

  return (
    <section className="relative isolate overflow-hidden pt-24 pb-28 md:pt-32 md:pb-36">
      {/* Aurora backdrop */}
      <div className="aurora" />
      {/* Soft grid + grain */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]">
        <div className="subtle-grid absolute inset-0" />
      </div>
      <div className="grain pointer-events-none absolute inset-0 -z-10" />
      {/* Floating particles — the "imaginary" layer */}
      <Constellation />

      <div className="page-shell relative">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mx-auto flex w-fit items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-3.5 py-1.5 text-[11.5px] font-medium tracking-wide text-gray-700 shadow-[0_1px_2px_rgba(17,17,17,0.04)] backdrop-blur"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-brand/70" />
            <span className="relative size-1.5 rounded-full bg-brand" />
          </span>
          Now in private beta · invite-only
        </motion.div>

        {/* Headline — three lines, controlled wrap, italic given breathing room */}
        <motion.h1
          style={{ opacity: headlineOpacity }}
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="display-2xl mx-auto mt-8 max-w-[1040px] px-4 text-center"
        >
          <span className="block text-gradient-ink">Supplement formulation,</span>
          <span className="mt-1 block">
            <span className="text-gradient-brand italic inline-block pr-[0.14em] pb-[0.08em] leading-[1.02]">rebuilt</span>{" "}
            <span className="text-gradient-ink">on evidence.</span>
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12 }}
          className="mx-auto mt-8 max-w-[52ch] text-balance-tight text-center text-[17px] leading-[1.55] text-gray-500"
        >
          One workspace for clinical research, FDA compliance, and the manufacturer brief —
          so a complete formulation takes an afternoon, not a quarter.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/sign-up"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gray-950 px-7 py-3.5 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_24px_rgba(17,17,17,0.2)] transition-all hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_12px_32px_rgba(91,110,225,0.35)]"
          >
            <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/15 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative">Request access</span>
            <span className="relative transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/features"
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/70 px-6 py-3.5 text-[14px] font-medium text-gray-900 backdrop-blur transition hover:border-black/15 hover:bg-white"
          >
            See the product
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-5 text-center text-[12px] text-gray-400"
        >
          For brands, R&D teams, and CPG agencies building evidence-led products.
        </motion.p>

        {/* Live formulation card */}
        <motion.div style={{ y: cardY }} className="mx-auto mt-20 max-w-[860px]">
          <LiveFormulationCard />
        </motion.div>
      </div>
    </section>
  );
}

// Drifting particles — the dreamy "imaginary" overlay
function Constellation() {
  const dots = [
    { l: "8%",  t: "18%", s: 4, d: 0,    o: 0.55 },
    { l: "16%", t: "62%", s: 2, d: 1.2,  o: 0.5  },
    { l: "22%", t: "32%", s: 3, d: 0.6,  o: 0.4  },
    { l: "78%", t: "20%", s: 3, d: 0.8,  o: 0.55 },
    { l: "88%", t: "48%", s: 2, d: 1.6,  o: 0.5  },
    { l: "92%", t: "70%", s: 4, d: 0.3,  o: 0.45 },
    { l: "38%", t: "8%",  s: 2, d: 2.0,  o: 0.4  },
    { l: "62%", t: "12%", s: 3, d: 1.4,  o: 0.5  },
    { l: "50%", t: "85%", s: 2, d: 0.5,  o: 0.35 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      {dots.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: p.o, y: [0, -10, 0] }}
          transition={{ duration: 6 + p.d, repeat: Infinity, ease: "easeInOut", delay: p.d }}
          style={{ left: p.l, top: p.t, width: p.s, height: p.s }}
          className="absolute rounded-full bg-brand shadow-[0_0_8px_rgba(91,110,225,0.6)]"
        />
      ))}
    </div>
  );
}

// ─── Live formulation card (the centerpiece) ─────────────────────────────────

function LiveFormulationCard() {
  const [phase, setPhase] = useState(0);
  const [visibleIngs, setVisibleIngs] = useState(0);
  const [score, setScore] = useState(0);

  // Animate phases on a loop.
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    let t4: ReturnType<typeof setTimeout>;
    let cancelled = false;
    let cycleTimer: ReturnType<typeof setTimeout>;

    const cycle = () => {
      if (cancelled) return;
      setPhase(0); setVisibleIngs(0); setScore(0);
      t1 = setTimeout(() => setPhase(1), 1400);
      t2 = setTimeout(() => {
        // reveal ingredients one by one
        for (let i = 1; i <= INGREDIENTS.length; i++) {
          setTimeout(() => setVisibleIngs(i), (i - 1) * 380);
        }
      }, 2100);
      t3 = setTimeout(() => {
        setPhase(2);
        // animate score 0 → 91
        let s = 0;
        const id = setInterval(() => {
          s += 3;
          if (s >= 91) { s = 91; clearInterval(id); }
          setScore(s);
        }, 28);
      }, 4400);
      t4 = setTimeout(() => setPhase(3), 6000);
      cycleTimer = setTimeout(cycle, 9000);
    };
    cycle();
    return () => {
      cancelled = true;
      [t1, t2, t3, t4, cycleTimer].forEach(t => t && clearTimeout(t));
    };
  }, []);

  return (
    <div className="relative">
      {/* Soft halo */}
      <div className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 rounded-[40px] bg-gradient-to-b from-white/0 via-[#c3b3ff]/30 to-white/0 blur-2xl" />

      <div className="cinema-card overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-black/[0.05] bg-white/40 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#ff6058]/70" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]/70" />
            <span className="size-2.5 rounded-full bg-[#27c93f]/70" />
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-[11px] text-gray-500">
            <span className="size-1.5 rounded-full bg-brand animate-pulse" />
            formlayer.co / workspace
          </div>
          <div className="w-12" />
        </div>

        {/* Body */}
        <div className="grid gap-0 md:grid-cols-[1.35fr_1fr]">
          {/* Left: formulation */}
          <div className="border-b border-black/[0.05] p-7 md:border-b-0 md:border-r">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">Formulation</p>
                <h3 className="mt-1.5 text-[20px] font-semibold tracking-[-0.022em] text-gray-950">Gut–Skin Support Stack</h3>
                <p className="mt-1 text-[12.5px] text-gray-500">Targeted at women 18–35 · capsule · 4 ingredients</p>
              </div>
              <AnimatePresence>
                {phase >= 2 && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                  >
                    {score} / 100
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Phase line */}
            <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-gray-50/80 px-3.5 py-2.5 ring-1 ring-black/[0.04]">
              <div className="relative flex size-4 items-center justify-center">
                {phase < 3 ? (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" />
                    <span className="relative size-2 rounded-full bg-brand" />
                  </>
                ) : (
                  <svg viewBox="0 0 16 16" className="size-4 text-emerald-600">
                    <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
                    <path d="M4.5 8.5l2.2 2 4.8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="text-[12.5px] font-medium text-gray-700"
                >
                  {HERO_PHASES[phase]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Ingredients */}
            <ul className="mt-4 space-y-1.5">
              {INGREDIENTS.map((ing, i) => {
                const shown = i < visibleIngs;
                return (
                  <motion.li
                    key={ing.name}
                    initial={false}
                    animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-3 rounded-xl border border-black/[0.04] bg-white px-3 py-2.5"
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                        ing.grade === "A" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {ing.grade}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-gray-900">{ing.name}</p>
                      <p className="truncate text-[10.5px] text-gray-400">{ing.note}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[11.5px] text-gray-700">{ing.dose}</span>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          {/* Right: live compliance ring + meta */}
          <div className="flex flex-col justify-between gap-5 p-7">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">FDA compliance</p>
              <div className="mt-5 flex items-end gap-4">
                <ComplianceRing score={score} active={phase >= 2} />
                <div className="pb-1">
                  <p className="text-[11px] text-gray-400">Status</p>
                  <p className="text-[13px] font-semibold text-gray-950">
                    {phase >= 3 ? "Ready" : phase >= 2 ? "Scoring…" : "Pending"}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                {[
                  { label: "Label claims",     ok: phase >= 2 },
                  { label: "Daily-value math", ok: phase >= 2 },
                  { label: "Allergen disclosure", ok: phase >= 3 },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between text-[11.5px]">
                    <span className="text-gray-500">{label}</span>
                    <span className={ok ? "text-emerald-600" : "text-gray-300"}>
                      {ok ? "✓ Passing" : "Queued"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {phase >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5"
                >
                  <p className="text-[10.5px] font-semibold uppercase tracking-widest text-emerald-700">Manufacturer brief</p>
                  <p className="mt-1 text-[12px] leading-snug text-emerald-800">
                    Supplement Facts panel + clinical rationale + share link generated.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceRing({ score, active }: { score: number; active: boolean }) {
  const r = 32, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative size-[88px]">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(17,17,17,0.05)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="url(#g)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={active ? offset : c}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c8dff" />
            <stop offset="100%" stopColor="#b88af2" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-semibold tracking-tight text-gray-950 tabular-nums">{score}</span>
        <span className="text-[9px] uppercase tracking-widest text-gray-400">score</span>
      </div>
    </div>
  );
}

// ─── PROOF BAR ───────────────────────────────────────────────────────────────

function ProofBar() {
  const items = [
    "Built on published RCTs",
    "FDA-aware label review",
    "Manufacturer-ready briefs",
    "Version-controlled workspace",
    "Citations, not claims",
    "Evidence grades per ingredient",
  ];
  return (
    <section className="relative border-y border-black/[0.05] bg-white/70 py-5 backdrop-blur">
      <div className="page-shell">
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee-track flex w-max items-center gap-12 whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.18em] text-gray-400">
            {[...items, ...items].map((s, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="size-1 rounded-full bg-brand/60" /> {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── THREE ACTS (Research / Formulate / Comply) ─────────────────────────────

function ActsSection() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">The workflow</p>
          <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
            Three acts. One workspace.
          </h2>
          <p className="body-md mx-auto mt-5 max-w-xl text-gray-500">
            The full path from health goal to manufacturer brief — without the spreadsheets,
            the citation hunts, or the legal surprises.
          </p>
        </div>

        <div className="mt-24 space-y-32">
          {ACTS.map((act, i) => (
            <ActRow key={act.title} act={act} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ActRow({ act, index }: { act: typeof ACTS[number]; index: number }) {
  const reverse = index % 2 === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`grid gap-12 md:gap-20 md:grid-cols-2 md:items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{act.eyebrow}</p>
        <h3 className="mt-4 text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] text-gradient-ink md:text-[48px]">
          {act.title}
        </h3>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-gray-500">{act.body}</p>
        <ul className="mt-7 space-y-2.5">
          {act.bullets.map(b => (
            <li key={b} className="flex items-start gap-2.5 text-[14px] text-gray-700">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        <div className="absolute -inset-8 -z-10 rounded-[44px] bg-gradient-to-br from-[#dcd1ff]/40 via-transparent to-[#b9c8ff]/40 blur-2xl" />
        {index === 0 && <ResearchPanel />}
        {index === 1 && <FormulatePanel />}
        {index === 2 && <CompliancePanel />}
      </div>
    </motion.div>
  );
}

function ResearchPanel() {
  const papers = [
    { title: "Bacopa monnieri 300 mg: meta-analysis", grade: "A", n: 437, eff: 78 },
    { title: "Ashwagandha KSM-66 12-week RCT",         grade: "A", n: 64,  eff: 84 },
    { title: "L-Theanine and sustained attention",     grade: "B", n: 91,  eff: 62 },
  ];
  return (
    <div className="cinema-card overflow-hidden p-5">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        <span>Clinical literature</span>
        <span>3,214 studies scanned</span>
      </div>
      <div className="mt-3 space-y-2">
        {papers.map((p) => (
          <div key={p.title} className="rounded-xl border border-black/[0.05] bg-white/80 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-[12.5px] font-medium text-gray-900">{p.title}</p>
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${p.grade === "A" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{p.grade}</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[10.5px] text-gray-400">n = {p.n}</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#b88af2] transition-all" style={{ width: `${p.eff}%` }} />
              </div>
              <span className="font-mono text-[10.5px] tabular-nums text-gray-500">{p.eff}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormulatePanel() {
  return (
    <div className="cinema-card overflow-hidden p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Stack composition</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { n: "Magnesium Glycinate", d: "200 mg", g: "A" },
          { n: "L-Theanine",          d: "200 mg", g: "A" },
          { n: "Apigenin",            d: "50 mg",  g: "B" },
          { n: "Glycine",             d: "3 g",    g: "B" },
        ].map((ing) => (
          <div key={ing.n} className="rounded-xl border border-black/[0.05] bg-white/85 p-3">
            <div className="flex items-center justify-between">
              <span className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${ing.g === "A" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{ing.g}</span>
              <span className="font-mono text-[11px] text-gray-600">{ing.d}</span>
            </div>
            <p className="mt-2 text-[12px] font-medium text-gray-900">{ing.n}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-gradient-to-br from-brand/5 to-[#b88af2]/5 p-3.5 ring-1 ring-brand/10">
        <p className="text-[10.5px] font-semibold uppercase tracking-widest text-brand">Rationale</p>
        <p className="mt-1 text-[12px] leading-relaxed text-gray-700">
          GABAergic stack targeting onset latency in adults 30–55, anchored on glycine 3 g per 2024 meta-analysis.
        </p>
      </div>
    </div>
  );
}

function CompliancePanel() {
  return (
    <div className="cinema-card overflow-hidden p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">FDA review</p>
          <p className="mt-3 text-[44px] font-semibold leading-none tracking-[-0.04em] text-gray-950 tabular-nums">94<span className="text-[20px] text-gray-300">/100</span></p>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">Ready to ship</span>
      </div>
      <div className="mt-4 space-y-1.5">
        {[
          { l: "Label claim wording",      s: "Passed", ok: true },
          { l: "DV calculations",          s: "Passed", ok: true },
          { l: "Allergen disclosure",      s: "Passed", ok: true },
          { l: "Structure-function claim", s: "Reword recommended", ok: false },
        ].map(r => (
          <div key={r.l} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] hover:bg-gray-50/60">
            <span className="text-gray-700">{r.l}</span>
            <span className={r.ok ? "text-emerald-600" : "text-amber-600"}>
              {r.ok ? "✓ " : "⚠ "}{r.s}
            </span>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-[12.5px] font-medium text-gray-950 transition hover:bg-gray-50">
        Apply auto-fix
      </button>
    </div>
  );
}

// ─── ANATOMY OF A BRIEF ──────────────────────────────────────────────────────

function AnatomySection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fbfaf7] to-white py-28 md:py-36">
      <div className="page-shell">
        <div className="grid gap-14 md:grid-cols-[1fr_1.05fr] md:items-center">
          <div>
            <p className="eyebrow">What you ship</p>
            <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
              The output is a brief a manufacturer can actually quote.
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-gray-500">
              Not a slide deck. Not a spreadsheet export. A complete, version-controlled brief —
              Supplement Facts panel, clinical rationale per ingredient, certifications needed,
              and a live share link.
            </p>
            <ul className="mt-7 space-y-3 text-[14px] text-gray-700">
              {[
                "Supplement Facts panel · auto-generated",
                "Clinical rationale · per ingredient, with citations",
                "Live manufacturer share link · always current",
                "Version history · one-click restore",
              ].map(l => (
                <li key={l} className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  {l}
                </li>
              ))}
            </ul>
          </div>

          <SupplementFactsPanel />
        </div>
      </div>
    </section>
  );
}

function SupplementFactsPanel() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-[#dcd1ff]/40 via-transparent to-[#b9c8ff]/40 blur-2xl" />
      <div className="cinema-card overflow-hidden">
        <div className="border-b-[6px] border-double border-black/85 px-6 pt-6 pb-3">
          <h3 className="font-serif text-[26px] font-bold tracking-tight text-gray-950">Supplement Facts</h3>
          <p className="mt-1 text-[12px] text-gray-700">Serving Size 2 Capsules · Servings Per Container 30</p>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between border-b border-black/30 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-700">
            <span>Amount Per Serving</span><span>% DV*</span>
          </div>
          {[
            { n: "Vitamin D₃ (Cholecalciferol)", a: "2,000 IU", dv: "250%" },
            { n: "Zinc (as Bisglycinate)",        a: "30 mg",    dv: "273%" },
            { n: "L. rhamnosus GG",               a: "10B CFU",  dv: "†" },
            { n: "Berberine HCl",                 a: "500 mg",   dv: "†" },
          ].map(r => (
            <div key={r.n} className="flex items-center justify-between border-b border-black/10 py-2 text-[12.5px] text-gray-900">
              <span>{r.n}</span>
              <span className="flex gap-6">
                <span className="font-medium tabular-nums">{r.a}</span>
                <span className="w-10 text-right tabular-nums text-gray-600">{r.dv}</span>
              </span>
            </div>
          ))}
          <p className="mt-3 text-[10.5px] leading-relaxed text-gray-500">
            *Percent Daily Values based on a 2,000 calorie diet.<br />†Daily Value not established.
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-black/[0.05] bg-gray-50/60 px-6 py-3">
          <span className="text-[10.5px] font-semibold uppercase tracking-widest text-brand">FormLayer · v3.2</span>
          <span className="text-[10.5px] text-gray-500">Generated 12 sec ago</span>
        </div>
      </div>
    </div>
  );
}

// ─── PRINCIPLES (ideology) ───────────────────────────────────────────────────

function PrinciplesSection() {
  return (
    <section className="relative isolate overflow-hidden py-32 md:py-40">
      <div className="aurora aurora-dark absolute inset-0 -z-10 opacity-60" />
      <div className="absolute inset-0 -z-10 bg-gray-950" />
      <div className="grain pointer-events-none absolute inset-0 -z-10" />

      <div className="page-shell relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a5b4fc]">What we believe</p>
          <h2 className="display-lg mt-5 text-balance-tight text-white">
            We don&apos;t invent doses.<br />
            <span className="text-gradient-brand-dark italic">We surface evidence.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-gray-400">
            FormLayer is a thinking-tool, not a content generator. Every claim it shows is
            traceable to a published trial. If the evidence isn&apos;t there, the tool says so.
          </p>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {PRINCIPLES.map(({ k, v }, i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-7 backdrop-blur-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a5b4fc]">{k}</p>
              <p className="mt-4 text-[18px] leading-relaxed text-white/90">{v}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOR WHOM ────────────────────────────────────────────────────────────────

function ForWhomSection() {
  return (
    <section className="relative py-28 md:py-36">
      <div className="page-shell">
        <div className="grid gap-14 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Who it&apos;s for</p>
            <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
              Built for teams that ship real products.
            </h2>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {FOR.map(({ kind, line }) => (
              <li key={kind} className="rounded-2xl border border-black/[0.05] bg-white/70 p-6 backdrop-blur transition hover:border-brand/20 hover:bg-white">
                <p className="text-[14px] font-semibold tracking-[-0.01em] text-gray-950">{kind}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-500">{line}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── FINAL CTA ───────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden pb-28 pt-12 md:pb-36">
      <div className="page-shell">
        <div className="relative overflow-hidden rounded-[36px] border border-black/[0.05] bg-white p-12 text-center shadow-[0_30px_80px_-30px_rgba(91,110,225,0.35)] md:p-20">
          <div className="aurora absolute inset-0 -z-10 opacity-70" />
          <div className="grain pointer-events-none absolute inset-0 -z-10" />

          <p className="eyebrow">Start building</p>
          <h2 className="display-lg mt-5 text-balance-tight text-gradient-ink">
            Stop guessing at doses.<br />Start building on evidence.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[16px] leading-relaxed text-gray-500">
            FormLayer is in private beta. Request access and we&apos;ll get back to you within two business days.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-full bg-gray-950 px-7 py-3.5 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_24px_rgba(17,17,17,0.2)] transition-all hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_12px_32px_rgba(91,110,225,0.35)]"
            >
              Request access
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-7 py-3.5 text-[14px] font-medium text-gray-900 transition hover:border-black/15 hover:bg-gray-50"
            >
              View pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── WORKSPACE PREVIEW ───────────────────────────────────────────────────────

function WorkspaceSection() {
  return (
    <section className="relative isolate overflow-hidden py-28 md:py-36">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]">
        <div className="subtle-grid absolute inset-0" />
      </div>
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Inside the workspace</p>
          <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
            Every formulation, every revision,<br />in one calm place.
          </h2>
          <p className="body-md mx-auto mt-5 max-w-xl text-gray-500">
            Status pills tell you what&apos;s ready for review. Version history tells you what
            changed and why. Nothing leaves your workspace blind.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-[1100px]"
        >
          <div className="pointer-events-none absolute -inset-12 -z-10 rounded-[44px] bg-gradient-to-br from-[#dcd1ff]/35 via-transparent to-[#b9c8ff]/35 blur-3xl" />
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}

function DashboardMock() {
  const items = [
    { name: "Sleep Architect Stack",   prod: "Capsule",  status: "Compliant",  score: 94, color: "emerald" as const },
    { name: "Gut–Skin Support",         prod: "Capsule",  status: "In review",  score: 91, color: "emerald" as const },
    { name: "Pre-Workout v3",           prod: "Powder",   status: "Drafting",   score: 72, color: "amber"   as const },
    { name: "Adaptogen Daily",          prod: "Capsule",  status: "Compliant",  score: 88, color: "emerald" as const },
    { name: "Liver Reset (women 40+)",  prod: "Softgel",  status: "Drafting",   score: 64, color: "amber"   as const },
    { name: "Cognitive Edge",           prod: "Capsule",  status: "Refining",   score: 81, color: "emerald" as const },
  ];
  const colorMap = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber:   "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <div className="cinema-card overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-black/[0.05] bg-white/40 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#ff6058]/70" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]/70" />
          <span className="size-2.5 rounded-full bg-[#27c93f]/70" />
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-[11px] text-gray-500">
          <span className="size-1.5 rounded-full bg-brand animate-pulse" /> formlayer.co / workspace
        </div>
        <div className="w-12" />
      </div>

      <div className="grid grid-cols-[200px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-black/[0.05] bg-white/60 p-4 backdrop-blur">
          <div className="flex items-center gap-2 px-2 pb-4">
            <span className="relative flex size-5 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#a48bff] via-[#7c8dff] to-[#5b6ee1]" />
              <span className="absolute inset-[3px] rounded-full bg-white/85" />
              <span className="relative size-1.5 rounded-full bg-gray-950" />
            </span>
            <span className="text-[12.5px] font-medium tracking-[-0.018em] text-gray-950">FormLayer</span>
          </div>
          <nav className="space-y-0.5">
            {[
              { l: "Overview",      active: false },
              { l: "Formulations",  active: true  },
              { l: "Research",      active: false },
              { l: "Agents",        active: false, pro: true },
              { l: "Billing",       active: false },
            ].map(({ l, active, pro }) => (
              <div key={l} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] ${active ? "bg-black/[0.05] text-gray-950 font-medium" : "text-gray-500"}`}>
                <span>{l}</span>
                {pro && <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-brand">Pro</span>}
              </div>
            ))}
          </nav>
          <div className="mt-6 rounded-xl border border-black/[0.05] bg-gradient-to-br from-brand/[0.08] to-[#b88af2]/[0.05] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand">This month</p>
            <p className="mt-1.5 text-[18px] font-semibold leading-none tracking-tight text-gray-950 tabular-nums">8 / 25</p>
            <p className="mt-1 text-[10.5px] text-gray-500">formulations used</p>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-black/[0.05]">
              <div className="h-full w-[32%] rounded-full bg-gradient-to-r from-brand to-[#b88af2]" />
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Workspace</p>
              <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.022em] text-gray-950">Your formulations</h3>
            </div>
            <button className="rounded-full bg-gray-950 px-3.5 py-1.5 text-[11.5px] font-medium text-white">+ New</button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {items.map((it) => (
              <div key={it.name} className="rounded-xl border border-black/[0.05] bg-white/85 p-3.5 transition hover:border-brand/20 hover:shadow-[0_4px_16px_rgba(91,110,225,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-gray-950">{it.name}</p>
                    <p className="mt-0.5 text-[10.5px] text-gray-400">{it.prod} · updated 2h ago</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold ${colorMap[it.color]}`}>{it.status}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#b88af2] transition-all" style={{ width: `${it.score}%` }} />
                  </div>
                  <span className="w-7 text-right font-mono text-[10.5px] tabular-nums text-gray-600">{it.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TIMELINE / "THE BUILD" ─────────────────────────────────────────────────

function TimelineSection() {
  const steps = [
    { t: "0:00", k: "Brief",      v: "You describe the product, the consumer, and the outcome." },
    { t: "0:08", k: "Research",   v: "FormLayer pulls dose ranges and grades from published human RCTs." },
    { t: "0:24", k: "Formulate",  v: "The stack composes itself, with rationale per ingredient." },
    { t: "0:52", k: "Comply",     v: "A 100-point FDA compliance score is generated with auto-fixes." },
    { t: "1:30", k: "Ship",       v: "Manufacturer brief and Supplement Facts panel are ready." },
  ];
  return (
    <section className="relative py-28 md:py-36">
      <div className="page-shell">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">The build</p>
          <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
            From idea to manufacturer in 90 seconds.
          </h2>
          <p className="body-md mx-auto mt-5 max-w-xl text-gray-500">
            A typical first draft — not a marketing claim, the actual timing of the
            five phases FormLayer runs end-to-end.
          </p>
        </div>

        <div className="relative mx-auto mt-20 max-w-[920px]">
          {/* The line */}
          <div className="absolute left-[60px] top-3 bottom-3 w-px bg-gradient-to-b from-transparent via-brand/30 to-transparent md:left-1/2 md:-translate-x-px" />

          <ul className="space-y-12">
            {steps.map((s, i) => (
              <motion.li
                key={s.k}
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className={`relative grid grid-cols-[120px_1fr] items-start gap-6 md:grid-cols-2 md:gap-12 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2 md:[&>*:first-child]:text-left md:[&>*:last-child]:text-right" : "md:[&>*:first-child]:text-right"}`}
              >
                <div>
                  <span className="font-mono text-[12px] text-brand">{s.t}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-[-44px] top-1.5 size-2.5 rounded-full bg-brand ring-4 ring-white md:hidden" />
                  <span className="absolute -left-[58px] top-1.5 hidden size-2.5 rounded-full bg-brand ring-4 ring-white md:block" />
                  <p className="text-[18px] font-semibold tracking-[-0.018em] text-gray-950">{s.k}</p>
                  <p className="mt-1.5 max-w-[42ch] text-[14.5px] leading-relaxed text-gray-500">{s.v}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQ = [
  { q: "Is FormLayer regulated as medical advice?", a: "No. FormLayer is a research and design tool for supplement formulators. It surfaces published clinical evidence and computes label-compliance scores, but every formulation must still be reviewed by your regulatory and legal team before manufacture or sale." },
  { q: "Where does the clinical evidence come from?", a: "Published human randomized controlled trials, meta-analyses, and peer-reviewed systematic reviews — primarily from PubMed and indexed journals. Every ingredient recommendation traces back to a citation surfaced inside the workspace." },
  { q: "How is the FDA compliance score computed?", a: "It's a 100-point rubric across label claims, daily-value math, allergen disclosure, structure-function language, and ingredient identity. Issues are flagged per ingredient; common violations carry one-click auto-fix suggestions you can review and accept." },
  { q: "Can I share a formulation with a manufacturer?", a: "Yes. Every formulation produces a manufacturer-ready brief and a live read-only share link. The brief auto-updates as you revise the formulation, so the manufacturer always sees the current version — no stale PDFs." },
  { q: "What happens to my data?", a: "Your formulations are private to your workspace by default. We don't train models on customer data, and team-shared workspaces use role-based access. See the Security page for details on encryption and tenancy." },
  { q: "How do I get access?", a: "FormLayer is in private beta. Request access from the homepage and we get back within two business days with onboarding for you and your team." },
] as const;

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-28 md:py-36">
      <div className="page-shell">
        <div className="grid gap-14 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">Common questions</p>
            <h2 className="display-md mt-4 text-balance-tight text-gradient-ink">
              What founders ask before they sign up.
            </h2>
            <p className="mt-5 max-w-sm text-[14.5px] leading-relaxed text-gray-500">
              Still curious? Email us at hello@formlayer.co and a real person
              will reply within a day.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white/70 backdrop-blur">
            {FAQ.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} className={i !== 0 ? "border-t border-black/[0.05]" : ""}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/80"
                  >
                    <span className="text-[15px] font-medium tracking-[-0.01em] text-gray-950">{item.q}</span>
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border border-black/[0.08] text-[14px] text-gray-500 transition-transform ${isOpen ? "rotate-45 bg-brand/[0.06] text-brand" : ""}`}>
                      +
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-[14px] leading-relaxed text-gray-600">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
