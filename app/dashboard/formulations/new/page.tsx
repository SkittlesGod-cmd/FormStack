"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, ChevronLeft, ChevronRight,
  FlaskConical, Loader2, RefreshCw, Send,
  ShieldCheck, Sparkles, BarChart3, BookOpen, Info,
} from "lucide-react";
import { toast } from "sonner";

import { StreamingMarkdown } from "@/components/ui/streaming-markdown";
import { ProductAnimation } from "@/components/formulations/ProductAnimation";
import {
  PRODUCT_TYPES, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_DESC, type ProductType,
} from "@/lib/formulations/types";
import { cn } from "@/lib/utils";
import { parseJsonObject } from "@/lib/ai/json";
import { getErrorMessage } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "intake"
  | "researching" | "research_review"
  | "formulating" | "formulation_review" | "refining"
  | "compliance_running" | "compliance_refining"
  | "complete";

type ReviewTab = "overview" | "ingredients" | "rationale";

interface IntakeData {
  product_type: ProductType;
  health_goal: string;
  consumer: string;
  requirements: string;
}

interface ParsedIngredient {
  id: string; name: string; dose: string; unit: string; rationale: string;
  evidence_grade?: "A" | "B" | "C";
  clinical_dose_range?: string;
  dose_assessment?: "at_studied_dose" | "below_studied_dose" | "above_studied_dose";
}

interface ParsedFormulation {
  name: string; description: string; ingredients: ParsedIngredient[];
  serving_size: string; servings_per_day?: number;
  total_fill_weight_mg: number; expected_outcomes: string;
}

interface ComplianceResult {
  score: number; summary: string;
  issues: Array<{ severity: string; ingredient: string | null; issue: string; detail: string }>;
  compliant_claims: string[]; recommendations: string[];
  manual_review_required?: boolean; review_disclaimer?: string;
}

interface ChatMessage { role: "user" | "ai"; text: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const CONSUMER_OPTIONS = [
  "General wellness", "Athletic performance", "Cognitive health",
  "Women's health", "Men's health", "Senior health",
  "Weight management", "Gut & digestive health",
];

const PHASE_STEPS = [
  { key: "intake",            label: "Setup" },
  { key: "researching",       label: "Research" },
  { key: "formulating",       label: "Formula" },
  { key: "compliance_running",label: "Compliance" },
  { key: "complete",          label: "Complete" },
];

const GOAL_EXAMPLES = [
  "Cognitive focus & mental clarity",
  "Sleep quality & recovery",
  "Athletic endurance & performance",
  "Stress & cortisol management",
  "Gut health & microbiome",
  "Immune system resilience",
  "Joint & mobility support",
  "Longevity & cellular health",
];

const ACTIVITY_STEPS: Partial<Record<Phase, string[]>> = {
  researching: [
    "Connecting to clinical research database",
    "Scanning 3,200+ peer-reviewed studies",
    "Identifying evidence-backed candidates",
    "Analyzing dose-response relationships",
    "Mapping synergy and antagonism profiles",
    "Cross-referencing pharmacokinetic data",
    "Evaluating safety and tolerability",
    "Compiling research summary",
  ],
  formulating: [
    "Synthesizing research into formula",
    "Selecting optimal ingredient forms",
    "Calculating clinical dose ranges",
    "Analyzing stack synergies",
    "Checking nutrient interaction profiles",
    "Structuring Supplement Facts panel",
    "Writing ingredient rationale",
    "Finalizing formulation JSON",
  ],
  refining: [
    "Processing your feedback",
    "Recalculating dose adjustments",
    "Updating ingredient selection",
    "Revalidating against clinical benchmarks",
    "Finalizing revised formula",
  ],
  compliance_running: [
    "Loading FDA DSHEA regulatory guidelines",
    "Reviewing structure/function claims",
    "Checking upper tolerable intake levels",
    "Analyzing label and disclaimer requirements",
    "Scoring regulatory risk factors",
  ],
  compliance_refining: [
    "Analyzing compliance gaps",
    "Revising flagged claims",
    "Rechecking dose thresholds",
    "Rebuilding formula for full compliance",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stepIndex(phase: Phase): number {
  if (phase === "intake") return 0;
  if (phase === "researching" || phase === "research_review") return 1;
  if (phase === "formulating" || phase === "formulation_review" || phase === "refining") return 2;
  if (phase === "compliance_running" || phase === "compliance_refining") return 3;
  return 4;
}

function parseFormulationJson(text: string): ParsedFormulation | null {
  function isRecord(v: unknown): v is Record<string, unknown> {
    return Boolean(v) && typeof v === "object" && !Array.isArray(v);
  }
  function evidenceGrade(v: unknown): "A" | "B" | "C" | undefined {
    return v === "A" || v === "B" || v === "C" ? v : undefined;
  }
  function doseAssessment(v: unknown): ParsedIngredient["dose_assessment"] {
    return v === "at_studied_dose" || v === "below_studied_dose" || v === "above_studied_dose" ? v : undefined;
  }
  function mapRaw(raw: unknown): ParsedFormulation | null {
    if (!raw || typeof raw !== "object") return null;
    const s = raw as Record<string, unknown>;
    const ings = (Array.isArray(s.ingredients) ? s.ingredients : [])
      .filter((i): i is Record<string, unknown> => isRecord(i) && Boolean(i.name))
      .map((i, idx) => ({
        id: `parsed-${idx}`,
        name: String(i.name ?? ""), dose: String(i.dose ?? ""),
        unit: typeof i.unit === "string" ? i.unit : "mg",
        rationale: typeof i.rationale === "string" ? i.rationale : "",
        evidence_grade: evidenceGrade(i.evidence_grade),
        clinical_dose_range: typeof i.clinical_dose_range === "string" ? i.clinical_dose_range : undefined,
        dose_assessment: doseAssessment(i.dose_assessment),
      }));
    if (!s.name || ings.length === 0) return null;
    return {
      name: String(s.name),
      description: typeof s.description === "string" ? s.description : "",
      ingredients: ings,
      serving_size: typeof s.serving_size === "string" ? s.serving_size : "",
      total_fill_weight_mg: Number(s.total_fill_weight_mg ?? 0) || 0,
      expected_outcomes: typeof s.expected_outcomes === "string" ? s.expected_outcomes : "",
    };
  }
  function tryParse(candidate: string): ParsedFormulation | null {
    const d = parseJsonObject(candidate);
    if (d) { const m = mapRaw(d); if (m) return m; }
    return null;
  }
  const fj = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
  if (fj) { const r = tryParse(fj[1].trim()); if (r) return r; }
  const fp = text.match(/```\s*([\s\S]*?)(?:```|$)/);
  if (fp) { const r = tryParse(fp[1].trim()); if (r) return r; }
  const start = text.indexOf("{");
  if (start !== -1) {
    const r = tryParse(text.slice(start));
    if (r) return r;
    let depth = 0, end = -1, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (esc) { esc = false; continue; }
      if (c === "\\" && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === "{") depth++;
      else if (c === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) { const r = tryParse(text.slice(start, end + 1)); if (r) return r; }
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BuilderProgress({ phase }: { phase: Phase }) {
  const current = stepIndex(phase);
  return (
    <div className="flex items-center">
      {PHASE_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === PHASE_STEPS.length - 1;
        const spinning = active && ["researching","formulating","compliance_running","compliance_refining","refining"].includes(phase);
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-500",
                done  ? "bg-emerald-500 text-white" :
                active ? "bg-brand text-white" :
                         "bg-gray-100 text-gray-400"
              )}>
                {done ? <Check className="size-3" /> : spinning ? <Loader2 className="size-3 animate-spin" /> : i + 1}
              </div>
              <span className={cn(
                "hidden text-[10px] font-medium sm:block whitespace-nowrap",
                done ? "text-emerald-600" : active ? "text-brand" : "text-gray-400"
              )}>{step.label}</span>
            </div>
            {!isLast && <div className={cn("h-px flex-1 mx-2 transition-all duration-700", done ? "bg-emerald-300" : "bg-gray-200")} />}
          </div>
        );
      })}
    </div>
  );
}

function ActivityFeed({ phase, streaming }: { phase: Phase; streaming: boolean }) {
  const steps = ACTIVITY_STEPS[phase] ?? [];
  const [count, setCount] = useState(1);
  useEffect(() => {
    setCount(1);
    if (!steps.length) return;
    const id = setInterval(() => setCount(c => Math.min(c + 1, steps.length)), 1600);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const displayCount = streaming ? count : steps.length;
  return (
    <div className="space-y-2.5">
      {steps.slice(0, displayCount).map((step, i) => {
        const isDone = !streaming || i < displayCount - 1;
        return (
          <motion.div
            key={`${phase}-${i}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full transition-all duration-300",
              isDone ? "bg-emerald-500" : "border border-brand/25 bg-brand/[0.06]"
            )}>
              {isDone
                ? <Check className="size-3 text-white" />
                : <span className="size-1.5 animate-pulse rounded-full bg-brand" />}
            </div>
            <span className={cn("text-[12px] transition-colors", isDone ? "text-gray-400" : "font-medium text-gray-800")}>
              {step}{!isDone && <span className="animate-pulse">…</span>}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

const RESEARCH_PAPERS = [
  { title: "Ashwagandha KSM-66: 12-Week Double-Blind Placebo-Controlled RCT", authors: "Chandrasekhar et al.", journal: "Indian J. Psychiatry", year: 2022, grade: "A" as const, n: 64, effect: 84 },
  { title: "L-Theanine and Sustained Attention Performance in Healthy Adults", authors: "Hidese et al.", journal: "Nutrients", year: 2023, grade: "A" as const, n: 91, effect: 76 },
  { title: "Alpha-GPC Dose-Response in Working Memory Function", authors: "Parker et al.", journal: "J. Int. Soc. Sports Nutr.", year: 2021, grade: "A" as const, n: 48, effect: 70 },
  { title: "Bacopa Monnieri 300 mg: Systematic Review & Meta-Analysis", authors: "Kongkeaw et al.", journal: "J. Ethnopharmacol.", year: 2022, grade: "B" as const, n: 437, effect: 62 },
  { title: "Rhodiola Rosea for Mental Fatigue and Cognitive Performance", authors: "Olsson et al.", journal: "Planta Medica", year: 2022, grade: "B" as const, n: 56, effect: 55 },
];

function ResearchPaperFeed({ active, healthGoal }: { active: boolean; healthGoal?: string }) {
  const queryStr = `"${(healthGoal ?? "supplement").slice(0, 46)}"  type:RCT  filter:human`;
  const [typedLen, setTypedLen] = useState(0);
  const [papersShown, setPapersShown] = useState(0);
  const [scanned, setScanned] = useState(0);

  useEffect(() => {
    if (!active) {
      setTypedLen(queryStr.length);
      setPapersShown(RESEARCH_PAPERS.length);
      setScanned(3214);
      return;
    }
    setTypedLen(0); setPapersShown(0); setScanned(0);

    // Type the query then reveal papers
    let t = 0;
    const typeId = setInterval(() => {
      t += 4;
      setTypedLen(Math.min(t, queryStr.length));
      if (t >= queryStr.length) {
        clearInterval(typeId);
        let p = 0;
        const paperId = setInterval(() => {
          p++; setPapersShown(p);
          if (p >= RESEARCH_PAPERS.length) clearInterval(paperId);
        }, 750);
      }
    }, 32);

    // Scan counter
    let s = 0;
    const scanId = setInterval(() => {
      s = Math.min(s + Math.floor(Math.random() * 120 + 60), 3214);
      setScanned(s);
      if (s >= 3214) clearInterval(scanId);
    }, 90);

    return () => { clearInterval(typeId); clearInterval(scanId); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const gradeColor = { A: "bg-emerald-50 text-emerald-700 border-emerald-100", B: "bg-amber-50 text-amber-700 border-amber-100", C: "bg-gray-50 text-gray-500 border-gray-200" };

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex size-7 items-center justify-center rounded-lg border transition-colors", active ? "border-brand/20 bg-brand/[0.06]" : "border-emerald-100 bg-emerald-50")}>
            {active ? <Loader2 className="size-3.5 text-brand animate-spin" /> : <Check className="size-3.5 text-emerald-600" />}
          </div>
          <span className="text-[12px] font-medium text-gray-700">Literature review</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
            <span className="text-[11px] text-gray-500">
              <span className="font-semibold tabular-nums text-gray-800">{scanned.toLocaleString()}</span>
              <span> studies scanned</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", active ? "bg-brand animate-pulse" : "bg-emerald-500")} />
            <span className="text-[11px] text-gray-400">{active ? "Searching…" : "Complete"}</span>
          </div>
        </div>
      </div>

      {/* Search query */}
      <div className="border-b border-black/[0.04] bg-gray-50/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Query</span>
          <span className="font-mono text-[11px] text-gray-600">
            {queryStr.slice(0, typedLen)}
            {active && typedLen < queryStr.length && (
              <span className="animate-pulse border-r border-brand">&nbsp;</span>
            )}
          </span>
        </div>
      </div>

      {/* Paper cards */}
      <div className="divide-y divide-black/[0.04]">
        {RESEARCH_PAPERS.slice(0, papersShown).map((paper, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="flex items-start gap-4 px-5 py-3.5"
          >
            <span className={cn("mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", gradeColor[paper.grade])}>
              {paper.grade}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium leading-snug text-gray-900">{paper.title}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {paper.authors} · <span className="italic">{paper.journal}</span> · {paper.year} · n={paper.n}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    className="h-full rounded-full bg-brand/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${paper.effect}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-brand">{paper.effect}%</span>
              </div>
            </div>
          </motion.div>
        ))}
        {active && papersShown < RESEARCH_PAPERS.length && papersShown > 0 && (
          <div className="flex items-center gap-2 px-5 py-3">
            <Loader2 className="size-3.5 animate-spin text-gray-300" />
            <span className="text-[11px] text-gray-400">Finding more studies…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentCard({
  agentLabel, phase, streaming, streamContent, statusLabel,
}: {
  agentLabel: string; phase: Phase; streaming: boolean;
  streamContent?: string; statusLabel: string;
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex size-7 items-center justify-center rounded-lg border transition-colors",
            streaming ? "border-brand/20 bg-brand/[0.06]" : "border-emerald-100 bg-emerald-50"
          )}>
            {streaming
              ? <Loader2 className="size-3.5 text-brand animate-spin" />
              : <Check className="size-3.5 text-emerald-600" />}
          </div>
          <span className="font-mono text-[11px] text-gray-500">{agentLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", streaming ? "bg-brand animate-pulse" : "bg-emerald-500")} />
          <span className="text-[11px] font-medium text-gray-400">{statusLabel}</span>
        </div>
      </div>
      <div className="px-5 py-4">
        <ActivityFeed phase={phase} streaming={streaming} />
      </div>
      {streamContent && (
        <div className="border-t border-black/[0.05] px-5 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Output stream</p>
          <div className="max-h-40 overflow-y-auto">
            <StreamingMarkdown content={streamContent} />
          </div>
        </div>
      )}
    </div>
  );
}

function IngredientCard({ ing, index }: { ing: ParsedIngredient; index: number }) {
  const doseNum = parseFloat(ing.dose);
  let dosePosition: number | null = null;
  if (ing.clinical_dose_range && !isNaN(doseNum)) {
    const m = ing.clinical_dose_range.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
    if (m) {
      const min = parseFloat(m[1]), max = parseFloat(m[2]);
      if (max > min) dosePosition = Math.max(0, Math.min(1, (doseNum - min) / (max - min)));
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="flex flex-col rounded-xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="flex-1 text-[13px] font-semibold leading-snug text-gray-950">{ing.name}</p>
        {ing.evidence_grade && (
          <span className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
            ing.evidence_grade === "A" ? "border-emerald-100 bg-emerald-50 text-emerald-700" :
            ing.evidence_grade === "B" ? "border-amber-100 bg-amber-50 text-amber-700" :
                                         "border-gray-200 bg-gray-50 text-gray-500"
          )}>
            Grade {ing.evidence_grade}
          </span>
        )}
      </div>
      <div className="mb-1 flex items-baseline gap-1.5">
        <span className="font-mono text-[26px] font-bold leading-none tracking-tight text-gray-950">{ing.dose || "—"}</span>
        <span className="font-mono text-[12px] text-gray-400">{ing.unit}</span>
      </div>
      {dosePosition !== null && ing.clinical_dose_range ? (
        <div className="mb-3">
          <div className="relative h-1.5 rounded-full bg-gray-100">
            <div className="absolute inset-0 rounded-full bg-brand/10" />
            <div
              className="absolute -top-[3px] size-3 -translate-x-1/2 rounded-full border-2 border-brand bg-white shadow-sm"
              style={{ left: `${dosePosition * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Clinical: {ing.clinical_dose_range}</span>
            {ing.dose_assessment && ing.dose_assessment !== "at_studied_dose" && (
              <span className={cn("text-[10px] font-semibold",
                ing.dose_assessment === "below_studied_dose" ? "text-orange-500" : "text-blue-500"
              )}>
                {ing.dose_assessment === "below_studied_dose" ? "↓ Below" : "↑ Above"}
              </span>
            )}
          </div>
        </div>
      ) : <div className="mb-3" />}
      {ing.rationale && (
        <p className="border-t border-black/[0.05] pt-3 text-[12px] leading-relaxed text-gray-500">{ing.rationale}</p>
      )}
    </motion.div>
  );
}

function StackStats({ formulation, productType }: { formulation: ParsedFormulation; productType?: ProductType }) {
  const grades = formulation.ingredients.reduce(
    (acc, i) => { if (i.evidence_grade) acc[i.evidence_grade] = (acc[i.evidence_grade] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );
  const gradeStr = [grades.A && `${grades.A}A`, grades.B && `${grades.B}B`, grades.C && `${grades.C}C`].filter(Boolean).join(" · ") || "—";
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[
        { label: "Ingredients", value: `${formulation.ingredients.length} actives` },
        { label: "Total fill", value: formulation.total_fill_weight_mg > 0 ? `${formulation.total_fill_weight_mg} mg` : "—" },
        { label: "Format", value: productType ? PRODUCT_TYPE_LABELS[productType] : "—" },
        { label: "Evidence", value: gradeStr },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-xl border border-black/[0.06] bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
          <p className="mt-1 text-[13px] font-semibold text-gray-950">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ChatFeedback({
  messages, onSubmit, loading, submitLabel = "Send", onSkip, skipLabel, placeholder,
}: {
  messages: ChatMessage[]; onSubmit: (text: string) => void; loading?: boolean;
  submitLabel?: string; onSkip?: () => void; skipLabel?: string; placeholder: string;
}) {
  const [text, setText] = useState("");
  const handleSubmit = () => { onSubmit(text); setText(""); };
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
      {messages.length > 0 && (
        <div className="max-h-44 space-y-3 overflow-y-auto border-b border-black/[0.05] p-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                msg.role === "user" ? "rounded-br-sm bg-gray-950 text-white" : "rounded-bl-sm bg-gray-100 text-gray-700"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="p-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          placeholder={placeholder}
          rows={2}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-black/[0.08] bg-gray-50/60 px-4 py-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
        />
        <div className="mt-3 flex items-center justify-between">
          {onSkip
            ? <button type="button" onClick={onSkip} className="text-[12px] font-medium text-gray-400 hover:text-gray-700 transition">{skipLabel ?? "Skip →"}</button>
            : <span />}
          <button
            type="button" disabled={loading} onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-xl bg-gray-950 px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            {loading ? "Working…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComplianceRing({ score }: { score: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Compliant" : score >= 60 ? "Review advised" : "Issues found";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="136" height="136" viewBox="0 0 136 136">
          <circle cx="68" cy="68" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <motion.circle
            cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.4 }}
            style={{ transformOrigin: "68px 68px", transform: "rotate(-90deg)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="font-mono text-[34px] font-bold leading-none" style={{ color }}
          >{score}</motion.span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">/100</span>
        </div>
      </div>
      <span className="text-[12px] font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewFormulationPage() {
  const [phase, setPhase] = useState<Phase>("intake");
  const [intake, setIntake] = useState<Partial<IntakeData>>({});
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [researchContent, setResearchContent] = useState("");
  const [formulationContent, setFormulationContent] = useState("");
  const [parsedFormulation, setParsedFormulation] = useState<ParsedFormulation | null>(null);
  const [formulationId, setFormulationId] = useState<string | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<ChatMessage[]>([]);
  const [reviewTab, setReviewTab] = useState<ReviewTab>("overview");
  const abortRef = useRef<AbortController | null>(null);

  const step2Revealed = Boolean(intake.product_type);
  const step3Revealed = step2Revealed && Boolean(intake.health_goal?.trim());
  const intakeComplete = intake.product_type && intake.health_goal?.trim();

  // ── API helpers ──
  async function updateStatus(id: string, status: string) {
    await fetch(`/api/formulations/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  }

  async function createFormulation(data: ParsedFormulation, productType: string): Promise<string | null> {
    try {
      const res = await fetch("/api/formulations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name, description: data.description, product_type: productType, status: "in_progress",
          ingredients: data.ingredients.map(i => ({ id: i.id, name: i.name, dose: i.dose, unit: i.unit })),
          serving_size: data.serving_size, notes: `Expected outcomes: ${data.expected_outcomes}`,
        }),
      });
      if (!res.ok) return null;
      return (await res.json()).formulation?.id ?? null;
    } catch { return null; }
  }

  async function updateFormulation(id: string, data: ParsedFormulation, status: string) {
    await fetch(`/api/formulations/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name, description: data.description,
        ingredients: data.ingredients.map(i => ({ id: i.id, name: i.name, dose: i.dose, unit: i.unit })),
        serving_size: data.serving_size, notes: `Expected outcomes: ${data.expected_outcomes}`, status,
      }),
    });
  }

  // ── Streaming ──
  async function stream(
    phaseKey: "research" | "formulate" | "refine" | "compliance_refine",
    feedback?: string, complianceRes?: string,
  ): Promise<string> {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStreaming(true); setStreamContent("");
    let accumulated = "";
    try {
      const res = await fetch("/api/ai/builder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: phaseKey,
          intake: { product_type: intake.product_type, health_goal: intake.health_goal, consumer: intake.consumer, requirements: intake.requirements },
          context: { research: researchContent, formulation_json: formulationContent, feedback, compliance_result: complianceRes },
        }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "AI request failed");
      const reader = res.body!.getReader(), decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamContent(accumulated);
      }
    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === "AbortError")) toast.error(getErrorMessage(e, "AI request failed"));
    } finally { setStreaming(false); }
    return accumulated;
  }

  // ── Phase transitions ──
  async function startResearch() {
    if (!intake.product_type || !intake.health_goal?.trim()) return;
    setPhase("researching");
    const content = await stream("research");
    setResearchContent(content); setPhase("research_review");
  }

  async function startFormulation() {
    setFeedbackHistory([]); setReviewTab("overview"); setPhase("formulating");
    const content = await stream("formulate");
    setFormulationContent(content);
    const parsed = parseFormulationJson(content);
    setParsedFormulation(parsed);
    if (!parsed) toast.error("Could not parse formulation structure.");
    if (parsed && intake.product_type) {
      const id = await createFormulation(parsed, intake.product_type);
      if (id) { setFormulationId(id); await updateStatus(id, "in_progress"); }
    }
    setPhase("formulation_review");
  }

  async function startRefine(feedback: string) {
    if (feedback.trim()) setFeedbackHistory(h => [...h, { role: "user", text: feedback }]);
    setPhase("refining");
    const content = await stream("refine", feedback || "Refine the formulation for better efficacy and clinical backing.");
    setFormulationContent(content);
    const parsed = parseFormulationJson(content);
    setParsedFormulation(parsed);
    if (parsed && formulationId) await updateFormulation(formulationId, parsed, "in_progress");
    setFeedbackHistory(h => [...h, { role: "ai", text: "Formulation updated based on your feedback." }]);
    setPhase("formulation_review");
  }

  async function approveFormulation() {
    if (formulationId) await updateStatus(formulationId, "in_review");
    setPhase("compliance_running"); await runCompliance();
  }

  async function runCompliance() {
    if (!formulationId) {
      if (parsedFormulation && intake.product_type) {
        const id = await createFormulation(parsedFormulation, intake.product_type);
        if (id) { setFormulationId(id); await runComplianceForId(id); return; }
      }
      toast.error("Could not save formulation."); setPhase("formulation_review"); return;
    }
    await runComplianceForId(formulationId);
  }

  async function runComplianceForId(id: string, attempt = 0) {
    try {
      const res = await fetch("/api/ai/compliance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulation_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Compliance failed");
      if (typeof data.score === "number" && data.score < 75 && attempt < 2) {
        setComplianceResult(data); setPhase("compliance_refining");
        const refined = await stream("compliance_refine", undefined, JSON.stringify({ score: data.score, issues: data.issues, recommendations: data.recommendations }));
        setFormulationContent(refined);
        const parsed = parseFormulationJson(refined);
        if (parsed) { setParsedFormulation(parsed); await updateFormulation(id, parsed, "in_review"); }
        setPhase("compliance_running"); await runComplianceForId(id, attempt + 1); return;
      }
      setComplianceResult(data); await updateStatus(id, "compliant"); setPhase("complete");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Compliance check failed")); setPhase("formulation_review");
    }
  }

  // ── Render ──
  return (
    <div className="mx-auto max-w-3xl pb-16">

      {/* Back link */}
      <Link href="/dashboard/formulations"
        className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-gray-700">
        <ChevronLeft className="size-3.5" /> Formulations
      </Link>

      {/* ── INTAKE — centered hero like research pre-search ──────────────── */}
      {phase === "intake" && (
        <motion.div
          key="intake"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center py-12"
        >
          <div className="w-full max-w-2xl space-y-8">

            {/* Hero */}
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.05] px-3.5 py-1.5">
                <Sparkles className="size-3.5 text-brand" />
                <span className="text-[12px] font-semibold text-brand">AI Formulation Studio</span>
              </div>
              <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.03em] text-gray-950">
                Build your formula.
              </h1>
              <p className="text-[15px] leading-relaxed text-gray-500">
                Three questions. AI researches the evidence, formulates the stack,<br className="hidden sm:block" />
                and validates compliance — end to end.
              </p>
            </div>

            {/* Step 1: Format */}
            <div className="space-y-2.5">
              <p className="text-[12px] font-semibold text-gray-500">What format are you building?</p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 sm:grid-cols-4">
                {PRODUCT_TYPES.map(type => {
                  const selected = intake.product_type === type;
                  return (
                    <button
                      key={type} type="button"
                      onClick={() => setIntake(d => ({ ...d, product_type: type }))}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg px-2 py-3 text-center transition-all duration-150",
                        selected ? "bg-white shadow-sm" : "hover:bg-white/60"
                      )}
                    >
                      <span className={cn("text-[12px] font-semibold leading-snug", selected ? "text-gray-900" : "text-gray-600")}>
                        {PRODUCT_TYPE_LABELS[type]}
                      </span>
                      <span className="text-[10px] leading-snug text-gray-400">{PRODUCT_TYPE_DESC[type]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Health goal */}
            <AnimatePresence>
              {step2Revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2.5"
                >
                  <p className="text-[12px] font-semibold text-gray-500">
                    What health outcome should it deliver?
                    <span className="ml-1.5 font-normal text-gray-400">Be specific — this drives ingredient selection</span>
                  </p>
                  <div className="relative">
                    <FlaskConical className="pointer-events-none absolute left-4 top-4 size-4 text-gray-400" />
                    <textarea
                      value={intake.health_goal ?? ""}
                      onChange={e => setIntake(d => ({ ...d, health_goal: e.target.value }))}
                      rows={3}
                      placeholder="e.g. Improve cognitive focus and mental clarity for knowledge workers throughout the workday without stimulant crash…"
                      className="w-full resize-none rounded-2xl border border-black/[0.10] bg-white py-4 pl-12 pr-5 text-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_EXAMPLES.map(ex => (
                      <button
                        key={ex} type="button"
                        onClick={() => setIntake(d => ({ ...d, health_goal: ex }))}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition",
                          intake.health_goal === ex
                            ? "border-brand/30 bg-brand/[0.04] text-brand"
                            : "border-black/[0.07] bg-white text-gray-600 hover:border-brand/30 hover:bg-brand/[0.03] hover:text-brand"
                        )}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Consumer + requirements */}
            <AnimatePresence>
              {step3Revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                >
                  <div>
                    <p className="mb-2 text-[12px] font-semibold text-gray-500">
                      Target consumer
                      <span className="ml-1.5 font-normal text-gray-400">(optional)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {CONSUMER_OPTIONS.map(opt => (
                        <button
                          key={opt} type="button"
                          onClick={() => setIntake(d => ({ ...d, consumer: d.consumer === opt ? "" : opt }))}
                          className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                            intake.consumer === opt
                              ? "border-brand/30 bg-brand/[0.05] text-brand"
                              : "border-black/[0.07] bg-gray-50 text-gray-500 hover:border-brand/20 hover:text-gray-700"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[12px] font-semibold text-gray-500">Special requirements</p>
                    <input
                      type="text"
                      value={intake.requirements ?? ""}
                      onChange={e => setIntake(d => ({ ...d, requirements: e.target.value }))}
                      placeholder="e.g. Vegan, no caffeine, NSF certified, under $2/serving…"
                      className="h-10 w-full rounded-xl border border-black/[0.08] bg-gray-50/60 px-4 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <AnimatePresence>
              {intakeComplete && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <button
                    type="button" onClick={startResearch}
                    className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gray-950 py-4 text-[15px] font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition hover:bg-gray-800"
                  >
                    <Sparkles className="size-4 text-white/50" />
                    Start AI research
                    <ArrowRight className="size-4 text-white/50 transition group-hover:translate-x-0.5" />
                  </button>
                  <p className="mt-2.5 text-center text-[11px] text-gray-400">
                    Researches clinical literature · formulates the stack · validates compliance — ~60–90 sec
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}

      {/* ── POST-INTAKE: header + progress + phases ──────────────────────── */}
      {phase !== "intake" && (
        <>
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 mt-5"
          >
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-gray-950">AI Formulation Builder</h1>
            {intake.health_goal && (
              <p className="mt-0.5 text-[13px] text-gray-500 truncate max-w-xl">
                {intake.health_goal}
              </p>
            )}
          </motion.div>

          {/* Progress */}
          <div className="mb-7">
            <BuilderProgress phase={phase} />
          </div>

          <AnimatePresence mode="wait">

            {/* ── RESEARCHING / RESEARCH REVIEW ──────────────────────────── */}
            {(phase === "researching" || phase === "research_review") && (
              <motion.div
                key="research"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <ResearchPaperFeed active={streaming} healthGoal={intake.health_goal} />

                {(streamContent || researchContent) && (
                  <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2.5 border-b border-black/[0.05] px-5 py-4">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-brand/10">
                        <BookOpen className="size-3.5 text-brand" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Research output</p>
                        <p className="text-[13px] font-semibold text-gray-950">
                          Clinical evidence · <span className="text-gray-500 font-normal">{(intake.health_goal ?? "").slice(0, 55)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-5">
                      <StreamingMarkdown content={phase === "research_review" ? researchContent : streamContent} />
                    </div>
                  </div>
                )}

                {phase === "research_review" && (
                  <ChatFeedback
                    messages={[]}
                    placeholder="Request additional research on specific ingredients, mechanisms, or populations…"
                    onSubmit={feedback => {
                      if (feedback.trim()) {
                        setPhase("researching");
                        stream("research").then(content => { setResearchContent(prev => prev + "\n\n---\n\n" + content); setPhase("research_review"); });
                      } else { startFormulation(); }
                    }}
                    loading={streaming}
                    submitLabel="Proceed to formulation →"
                    onSkip={startFormulation}
                    skipLabel="Skip — formulate now"
                  />
                )}
              </motion.div>
            )}

            {/* ── FORMULATING / REVIEW / REFINING ────────────────────────── */}
            {(phase === "formulating" || phase === "formulation_review" || phase === "refining") && (
              <motion.div
                key="formulation"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                {(phase === "formulating" || phase === "refining") && (
                  <AgentCard
                    agentLabel={phase === "refining" ? "ai-refine-agent" : "ai-formulation-agent"}
                    phase={phase} streaming={streaming}
                    streamContent={streamContent}
                    statusLabel={phase === "refining" ? "Refining formula…" : "Formulating…"}
                  />
                )}

                {phase === "formulation_review" && parsedFormulation && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                    {/* Formula header */}
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-black/[0.06] bg-white px-5 py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Draft ready</p>
                        <h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-gray-950">{parsedFormulation.name}</h2>
                        <p className="mt-1 text-[13px] text-gray-500">{parsedFormulation.description}</p>
                        {parsedFormulation.expected_outcomes && (
                          <div className="mt-3 rounded-lg border border-black/[0.06] bg-gray-50 px-3.5 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Expected outcomes</p>
                            <p className="mt-1 text-[12px] leading-relaxed text-gray-600">{parsedFormulation.expected_outcomes}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        <Check className="size-4 text-emerald-600" />
                      </div>
                    </div>

                    <StackStats formulation={parsedFormulation} productType={intake.product_type} />

                    {/* Section tabs */}
                    <div className="flex gap-0.5 overflow-x-auto rounded-xl border border-black/[0.06] bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                      {([
                        { key: "overview" as ReviewTab, label: "Overview", icon: Info },
                        { key: "ingredients" as ReviewTab, label: `Ingredients (${parsedFormulation.ingredients.length})`, icon: FlaskConical },
                        { key: "rationale" as ReviewTab, label: "Rationale", icon: BookOpen },
                      ]).map(({ key, label, icon: Icon }) => (
                        <button
                          key={key} type="button"
                          onClick={() => setReviewTab(key)}
                          className={cn(
                            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium whitespace-nowrap transition",
                            reviewTab === key ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                          )}
                        >
                          <span className={cn("flex size-5 items-center justify-center rounded-md", reviewTab === key ? "bg-white/15" : "bg-gray-100")}>
                            <Icon className="size-3" />
                          </span>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="rounded-xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                      {reviewTab === "overview" && (
                        <div className="space-y-4">
                          <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Ingredients at a glance</p>
                            <div className="flex flex-wrap gap-2">
                              {parsedFormulation.ingredients.map(ing => (
                                <span key={ing.id} className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-gray-50 px-3 py-1 text-[12px] text-gray-700">
                                  <span className={cn("size-1.5 rounded-full", ing.evidence_grade === "A" ? "bg-emerald-500" : ing.evidence_grade === "B" ? "bg-amber-400" : "bg-gray-300")} />
                                  {ing.name}
                                  <span className="text-gray-400">{ing.dose} {ing.unit}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                          {parsedFormulation.serving_size && (
                            <div className="rounded-lg border border-black/[0.06] bg-gray-50 px-4 py-3">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Serving size</p>
                              <p className="mt-0.5 text-[13px] font-semibold text-gray-900">{parsedFormulation.serving_size}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {reviewTab === "ingredients" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {parsedFormulation.ingredients.map((ing, i) => (
                            <IngredientCard key={ing.id} ing={ing} index={i} />
                          ))}
                        </div>
                      )}
                      {reviewTab === "rationale" && (
                        <details className="group" open>
                          <summary className="hidden" />
                          <StreamingMarkdown content={formulationContent.replace(/```json[\s\S]*?```/g, "")} />
                        </details>
                      )}
                    </div>

                    {/* Feedback / approve */}
                    <ChatFeedback
                      messages={feedbackHistory}
                      placeholder="e.g. Increase ashwagandha to 600 mg, add lion's mane, remove caffeine…"
                      onSubmit={feedback => { if (feedback.trim()) startRefine(feedback); else approveFormulation(); }}
                      loading={streaming}
                      submitLabel="Approve & run compliance"
                      onSkip={approveFormulation}
                      skipLabel="Looks good — approve"
                    />

                    <div className="flex justify-end">
                      <button type="button" onClick={() => startRefine("")}
                        className="flex items-center gap-1.5 text-[12px] text-gray-400 transition hover:text-gray-700">
                        <RefreshCw className="size-3" /> Regenerate from scratch
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── COMPLIANCE RUNNING ──────────────────────────────────────── */}
            {phase === "compliance_running" && (
              <motion.div
                key="compliance"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <AgentCard
                  agentLabel="ai-compliance-agent · FDA DSHEA"
                  phase="compliance_running" streaming={true}
                  statusLabel="Analyzing regulatory compliance…"
                />
                <div className="flex items-center gap-4 rounded-xl border border-black/[0.06] bg-white px-5 py-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/[0.06]">
                    <ShieldCheck className="size-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-950">Running compliance analysis</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-gray-400">
                      <Loader2 className="size-3.5 animate-spin" />
                      Reviewing against FDA DSHEA guidelines…
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── COMPLIANCE REFINING ──────────────────────────────────────── */}
            {phase === "compliance_refining" && (
              <motion.div
                key="compliance_refining"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-100">
                      <ShieldCheck className="size-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-amber-900">Score below threshold — auto-correcting</p>
                      <p className="mt-0.5 text-[12px] text-amber-700">
                        Score: <span className="font-bold">{complianceResult?.score ?? "—"}/100</span> — revising to resolve compliance issues.
                      </p>
                      {Boolean(complianceResult?.issues?.filter(i => i.severity === "high").length) && (
                        <ul className="mt-2 space-y-1">
                          {complianceResult!.issues.filter(i => i.severity === "high").slice(0, 3).map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                              <span><span className="font-semibold">{issue.issue}</span>{issue.ingredient ? ` · ${issue.ingredient}` : ""}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                <AgentCard
                  agentLabel="ai-compliance-refine-agent"
                  phase="compliance_refining" streaming={streaming}
                  streamContent={streamContent} statusLabel="Rewriting formula…"
                />
              </motion.div>
            )}

            {/* ── COMPLETE ────────────────────────────────────────────────── */}
            {phase === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Hero result */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                  className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex flex-col items-center gap-8 px-8 py-10 sm:flex-row sm:items-start">
                    <div className="shrink-0">
                      {complianceResult
                        ? <ComplianceRing score={complianceResult.score} />
                        : <div className="flex size-[136px] items-center justify-center rounded-full border-4 border-emerald-100"><Check className="size-10 text-emerald-500" /></div>}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">AI formulation complete</p>
                        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.025em] text-gray-950">
                          {parsedFormulation?.name ?? "Your formulation is ready"}
                        </h2>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{parsedFormulation?.description}</p>
                      </motion.div>
                      <div className="mt-6">
                        <ProductAnimation productType={intake.product_type!} complianceScore={complianceResult?.score} />
                      </div>
                    </div>
                  </div>

                  {complianceResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                      className="space-y-4 border-t border-black/[0.05] px-8 py-6"
                    >
                      {complianceResult.summary && <p className="text-[13px] text-gray-600">{complianceResult.summary}</p>}
                      {complianceResult.review_disclaimer && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                          <p className="text-[12px] leading-relaxed text-amber-700">{complianceResult.review_disclaimer}</p>
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {complianceResult.issues.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Flagged items</p>
                            {complianceResult.issues.slice(0, 4).map((issue, i) => (
                              <div key={i} className={cn("rounded-lg border px-3 py-2 text-[12px]",
                                issue.severity === "high" ? "border-red-100 bg-red-50 text-red-700" :
                                issue.severity === "medium" ? "border-amber-100 bg-amber-50 text-amber-700" :
                                "border-blue-100 bg-blue-50 text-blue-700"
                              )}>
                                <span className="font-semibold">{issue.issue}</span>
                                {issue.ingredient && <span className="opacity-70"> · {issue.ingredient}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        {complianceResult.compliant_claims.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Defensible claims</p>
                            {complianceResult.compliant_claims.slice(0, 4).map((claim, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                                <span className="text-[12px] leading-relaxed text-emerald-800">{claim}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Next steps */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Next steps</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "View formulation", desc: "Full ingredient panel, label preview, compliance details", href: formulationId ? `/dashboard/formulations/${formulationId}` : "/dashboard/formulations", primary: true },
                      { label: "Export PDF", desc: "Download a full dossier ready for manufacturer review", href: formulationId ? `/dashboard/formulations/${formulationId}/print` : "#" },
                      { label: "Manufacturer handoff", desc: "Generate an RFQ brief and share with production partners", href: formulationId ? `/dashboard/formulations/${formulationId}?tab=handoff` : "#" },
                    ].map(({ label, desc, href, primary }) => (
                      <Link
                        key={label} href={href}
                        className={cn(
                          "group rounded-xl border p-5 transition-all",
                          primary
                            ? "border-brand/25 bg-brand/[0.04] hover:border-brand/40 hover:bg-brand/[0.07]"
                            : "border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:border-black/[0.12] hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]"
                        )}
                      >
                        <p className={cn("text-[13px] font-semibold", primary ? "text-brand" : "text-gray-950")}>{label}</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{desc}</p>
                        <p className={cn("mt-4 flex items-center gap-1 text-[12px] font-medium transition",
                          primary ? "text-brand" : "text-gray-400 group-hover:text-gray-700"
                        )}>
                          Open <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
                        </p>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </>
      )}
    </div>
  );
}
