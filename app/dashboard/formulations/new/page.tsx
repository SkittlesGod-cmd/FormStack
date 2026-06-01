"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { StreamingMarkdown } from "@/components/ui/streaming-markdown";
import { ProductAnimation } from "@/components/formulations/ProductAnimation";
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_DESC,
  type ProductType,
} from "@/lib/formulations/types";
import { cn } from "@/lib/utils";
import { parseJsonObject } from "@/lib/ai/json";
import { getErrorMessage } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "intake"
  | "researching"
  | "research_review"
  | "formulating"
  | "formulation_review"
  | "refining"
  | "compliance_running"
  | "compliance_refining"
  | "complete";

interface IntakeData {
  product_type: ProductType;
  health_goal: string;
  consumer: string;
  requirements: string;
}

interface ParsedIngredient {
  id: string;
  name: string;
  dose: string;
  unit: string;
  rationale: string;
  evidence_grade?: "A" | "B" | "C";
  clinical_dose_range?: string;
  dose_assessment?: "at_studied_dose" | "below_studied_dose" | "above_studied_dose";
}

interface ParsedFormulation {
  name: string;
  description: string;
  ingredients: ParsedIngredient[];
  serving_size: string;
  servings_per_day?: number;
  total_fill_weight_mg: number;
  expected_outcomes: string;
}

interface ComplianceResult {
  score: number;
  summary: string;
  issues: Array<{ severity: string; ingredient: string | null; issue: string; detail: string }>;
  compliant_claims: string[];
  recommendations: string[];
  manual_review_required?: boolean;
  review_disclaimer?: string;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONSUMER_OPTIONS = [
  "General wellness", "Athletic performance", "Cognitive health",
  "Women's health", "Men's health", "Senior health",
  "Weight management", "Gut & digestive health",
];

const PHASE_STEPS = [
  { key: "intake", label: "Setup" },
  { key: "researching", label: "Research" },
  { key: "formulating", label: "Formulation" },
  { key: "compliance_running", label: "Compliance" },
  { key: "complete", label: "Complete" },
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
  function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  function evidenceGrade(value: unknown): "A" | "B" | "C" | undefined {
    return value === "A" || value === "B" || value === "C" ? value : undefined;
  }
  function doseAssessment(value: unknown): ParsedIngredient["dose_assessment"] {
    return value === "at_studied_dose" || value === "below_studied_dose" || value === "above_studied_dose" ? value : undefined;
  }
  function mapRaw(raw: unknown): ParsedFormulation | null {
    if (!raw || typeof raw !== "object") return null;
    const source = raw as Record<string, unknown>;
    const rawIngredients = Array.isArray(source.ingredients) ? source.ingredients : [];
    const ingredients = rawIngredients
      .filter((ing): ing is Record<string, unknown> => isRecord(ing) && Boolean(ing.name))
      .map((ing, i) => ({
        id: `parsed-${i}`,
        name: String(ing.name ?? ""),
        dose: String(ing.dose ?? ""),
        unit: typeof ing.unit === "string" ? ing.unit : "mg",
        rationale: typeof ing.rationale === "string" ? ing.rationale : "",
        evidence_grade: evidenceGrade(ing.evidence_grade),
        clinical_dose_range: typeof ing.clinical_dose_range === "string" ? ing.clinical_dose_range : undefined,
        dose_assessment: doseAssessment(ing.dose_assessment),
      }));
    if (!source.name || ingredients.length === 0) return null;
    return {
      name: String(source.name),
      description: typeof source.description === "string" ? source.description : "",
      ingredients,
      serving_size: typeof source.serving_size === "string" ? source.serving_size : "",
      total_fill_weight_mg: Number(source.total_fill_weight_mg ?? 0) || 0,
      expected_outcomes: typeof source.expected_outcomes === "string" ? source.expected_outcomes : "",
    };
  }
  function tryParse(candidate: string): ParsedFormulation | null {
    const direct = parseJsonObject(candidate);
    if (direct) { const m = mapRaw(direct); if (m) return m; }
    return null;
  }

  const fenceJson = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
  if (fenceJson) { const r = tryParse(fenceJson[1].trim()); if (r) return r; }
  const fencePlain = text.match(/```\s*([\s\S]*?)(?:```|$)/);
  if (fencePlain) { const r = tryParse(fencePlain[1].trim()); if (r) return r; }
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
    <div className="mb-10 flex items-center">
      {PHASE_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === PHASE_STEPS.length - 1;
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "flex size-7 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-500",
                done ? "bg-emerald-500 text-white" :
                active ? "bg-gray-950 text-white ring-4 ring-gray-950/10" :
                "bg-gray-100 text-gray-400"
              )}>
                {done ? <Check className="size-3.5" /> : (
                  active && ["researching","formulating","compliance_running","compliance_refining","refining"].includes(phase)
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : i + 1
                )}
              </div>
              <span className={cn(
                "hidden text-[11px] font-medium sm:block whitespace-nowrap",
                done ? "text-emerald-600" : active ? "text-gray-950" : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={cn(
                "mx-1 h-px flex-1 transition-all duration-700",
                done ? "bg-emerald-400" : "bg-gray-200"
              )} />
            )}
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
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3"
          >
            <div className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full transition-all duration-300",
              isDone ? "bg-emerald-500" : "bg-brand"
            )}>
              {isDone
                ? <Check className="size-3 text-white" />
                : <span className="size-1.5 animate-pulse rounded-full bg-white" />
              }
            </div>
            <span className={cn(
              "font-mono text-[12px] transition-colors",
              isDone ? "text-gray-400" : "font-medium text-gray-900"
            )}>
              {step}{!isDone && <span className="animate-pulse">…</span>}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function TerminalCard({
  agentLabel,
  phase,
  streaming,
  streamContent,
  statusLabel,
  statusColor,
}: {
  agentLabel: string;
  phase: Phase;
  streaming: boolean;
  streamContent?: string;
  statusLabel: string;
  statusColor: "brand" | "amber" | "emerald";
}) {
  const colorMap = {
    brand: "text-brand",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
  };
  const dotMap = {
    brand: "bg-brand",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
  };
  return (
    <div className="rounded-2xl border border-gray-950/[0.08] bg-gray-950 px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/60" />
            <span className="size-2.5 rounded-full bg-amber-400/60" />
            <span className="size-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <span className="font-mono text-[11px] text-white/40">{agentLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "size-1.5 rounded-full",
            streaming ? "animate-pulse" : "",
            dotMap[statusColor]
          )} />
          <span className={cn("text-[11px] font-medium", colorMap[statusColor])}>{statusLabel}</span>
        </div>
      </div>
      <ActivityFeed phase={phase} streaming={streaming} />
      {streamContent && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-2 font-mono text-[10px] text-white/30">output stream</p>
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
      const min = parseFloat(m[1]);
      const max = parseFloat(m[2]);
      if (max > min) dosePosition = Math.max(0, Math.min(1, (doseNum - min) / (max - min)));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex flex-col rounded-xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="flex-1 text-[13px] font-semibold leading-snug text-gray-950">{ing.name}</p>
        {ing.evidence_grade && (
          <span className={cn(
            "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            ing.evidence_grade === "A"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : ing.evidence_grade === "B"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-gray-200 bg-gray-100 text-gray-500"
          )}>
            Grade {ing.evidence_grade}
          </span>
        )}
      </div>

      <div className="mb-1 flex items-baseline gap-1.5">
        <span className="font-mono text-[28px] font-bold leading-none tracking-tight text-gray-950">
          {ing.dose || "—"}
        </span>
        <span className="font-mono text-[13px] text-gray-400">{ing.unit}</span>
      </div>

      {dosePosition !== null && ing.clinical_dose_range ? (
        <div className="mb-3">
          <div className="relative h-1.5 rounded-full bg-gray-100">
            <div className="absolute inset-0 rounded-full bg-brand/15" />
            <div
              className="absolute -top-[3px] size-3 -translate-x-1/2 rounded-full border-2 border-brand bg-white shadow-sm"
              style={{ left: `${dosePosition * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Clinical: {ing.clinical_dose_range}</span>
            {ing.dose_assessment && ing.dose_assessment !== "at_studied_dose" && (
              <span className={cn(
                "text-[10px] font-semibold",
                ing.dose_assessment === "below_studied_dose" ? "text-orange-500" : "text-blue-500"
              )}>
                {ing.dose_assessment === "below_studied_dose" ? "↓ Below studied" : "↑ Above studied"}
              </span>
            )}
          </div>
        </div>
      ) : <div className="mb-3" />}

      {ing.rationale && (
        <p className="border-t border-black/[0.05] pt-3 text-[12px] leading-relaxed text-gray-500">
          {ing.rationale}
        </p>
      )}
    </motion.div>
  );
}

function StackStats({ formulation, productType }: { formulation: ParsedFormulation; productType?: ProductType }) {
  const grades = formulation.ingredients.reduce(
    (acc, ing) => { if (ing.evidence_grade) acc[ing.evidence_grade] = (acc[ing.evidence_grade] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );
  const gradeStr = [grades.A && `${grades.A}A`, grades.B && `${grades.B}B`, grades.C && `${grades.C}C`].filter(Boolean).join(" / ") || "—";
  const stats = [
    { label: "Ingredients", value: `${formulation.ingredients.length} actives` },
    { label: "Total fill", value: formulation.total_fill_weight_mg > 0 ? `${formulation.total_fill_weight_mg} mg` : "—" },
    { label: "Format", value: productType ? PRODUCT_TYPE_LABELS[productType] : "—" },
    { label: "Evidence", value: gradeStr },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map(({ label, value }) => (
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
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  loading?: boolean;
  submitLabel?: string;
  onSkip?: () => void;
  skipLabel?: string;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const handleSubmit = () => { onSubmit(text); setText(""); };

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
      {messages.length > 0 && (
        <div className="max-h-48 space-y-3 overflow-y-auto border-b border-black/[0.05] p-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                msg.role === "user"
                  ? "rounded-br-sm bg-gray-950 text-white"
                  : "rounded-bl-sm bg-gray-100 text-gray-700"
              )}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {messages.length === 0 ? "Request changes or approve" : "Continue conversation"}
        </p>
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
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-[12px] font-medium text-gray-400 transition hover:text-gray-700"
            >
              {skipLabel ?? "Skip →"}
            </button>
          ) : <span />}
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
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
            cx="68" cy="68" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.4 }}
            style={{ transformOrigin: "68px 68px", transform: "rotate(-90deg)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="font-mono text-[34px] font-bold leading-none"
            style={{ color }}
          >
            {score}
          </motion.span>
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
  const abortRef = useRef<AbortController | null>(null);

  const step2Revealed = Boolean(intake.product_type);
  const step3Revealed = step2Revealed && Boolean(intake.health_goal?.trim());
  const intakeComplete = intake.product_type && intake.health_goal?.trim();

  // ── Helpers ──
  async function updateStatus(id: string, status: string) {
    await fetch(`/api/formulations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function createFormulation(data: ParsedFormulation, productType: string): Promise<string | null> {
    try {
      const res = await fetch("/api/formulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          product_type: productType,
          status: "in_progress",
          ingredients: data.ingredients.map(i => ({ id: i.id, name: i.name, dose: i.dose, unit: i.unit })),
          serving_size: data.serving_size,
          notes: `Expected outcomes: ${data.expected_outcomes}`,
        }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.formulation?.id ?? null;
    } catch {
      return null;
    }
  }

  async function updateFormulation(id: string, data: ParsedFormulation, status: string) {
    await fetch(`/api/formulations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        ingredients: data.ingredients.map(i => ({ id: i.id, name: i.name, dose: i.dose, unit: i.unit })),
        serving_size: data.serving_size,
        notes: `Expected outcomes: ${data.expected_outcomes}`,
        status,
      }),
    });
  }

  // ── Streaming ──
  async function stream(
    phaseKey: "research" | "formulate" | "refine" | "compliance_refine",
    feedback?: string,
    complianceRes?: string,
  ): Promise<string> {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStreaming(true);
    setStreamContent("");

    let accumulated = "";
    try {
      const res = await fetch("/api/ai/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: phaseKey,
          intake: {
            product_type: intake.product_type,
            health_goal: intake.health_goal,
            consumer: intake.consumer,
            requirements: intake.requirements,
          },
          context: {
            research: researchContent,
            formulation_json: formulationContent,
            feedback,
            compliance_result: complianceRes,
          },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "AI request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamContent(accumulated);
      }
    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        toast.error(getErrorMessage(e, "AI request failed"));
      }
    } finally {
      setStreaming(false);
    }
    return accumulated;
  }

  // ── Phase transitions ──
  async function startResearch() {
    if (!intake.product_type || !intake.health_goal?.trim()) return;
    setPhase("researching");
    const content = await stream("research");
    setResearchContent(content);
    setPhase("research_review");
  }

  async function startFormulation() {
    setFeedbackHistory([]);
    setPhase("formulating");
    const content = await stream("formulate");
    setFormulationContent(content);
    const parsed = parseFormulationJson(content);
    setParsedFormulation(parsed);
    if (!parsed) toast.error("Could not parse formulation structure. You can review and regenerate.");
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
    setPhase("compliance_running");
    await runCompliance();
  }

  async function runCompliance() {
    if (!formulationId) {
      if (parsedFormulation && intake.product_type) {
        const id = await createFormulation(parsedFormulation, intake.product_type);
        if (id) { setFormulationId(id); await runComplianceForId(id); return; }
      }
      toast.error("Could not save formulation. Please review and try again.");
      setPhase("formulation_review");
      return;
    }
    await runComplianceForId(formulationId);
  }

  async function runComplianceForId(id: string, attempt = 0) {
    try {
      const res = await fetch("/api/ai/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulation_id: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Compliance failed");

      if (typeof data.score === "number" && data.score < 75 && attempt < 2) {
        setComplianceResult(data);
        setPhase("compliance_refining");
        const complianceSummary = JSON.stringify({
          score: data.score, issues: data.issues,
          recommendations: data.recommendations,
          risky_claims: data.risky_claims,
          auto_fix_guidance: data.auto_fix_guidance,
        });
        const refined = await stream("compliance_refine", undefined, complianceSummary);
        setFormulationContent(refined);
        const parsed = parseFormulationJson(refined);
        if (parsed) { setParsedFormulation(parsed); await updateFormulation(id, parsed, "in_review"); }
        setPhase("compliance_running");
        await runComplianceForId(id, attempt + 1);
        return;
      }

      setComplianceResult(data);
      await updateStatus(id, "compliant");
      setPhase("complete");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Compliance check failed"));
      setPhase("formulation_review");
    }
  }

  // ── Render ──
  return (
    <div className="mx-auto max-w-3xl pb-16">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/dashboard/formulations"
          className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-gray-700"
        >
          <ChevronLeft className="size-3.5" />
          Formulations
        </Link>

        {phase === "intake" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-gray-100 px-3 py-1">
              <Sparkles className="size-3 text-gray-500" />
              <span className="text-[11px] font-semibold tracking-wide text-gray-600">AI Formulation Studio</span>
            </div>
            <h1 className="text-[32px] font-semibold tracking-[-0.035em] text-gray-950">
              Build a new formula
            </h1>
            <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-gray-500">
              Brief the AI on your product. It researches clinical evidence, formulates the stack, and validates compliance — end to end.
            </p>
          </motion.div>
        )}

        {phase !== "intake" && (
          <div className="mt-4">
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-gray-950">
              AI Formulation Builder
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
              {intake.health_goal ? `Building: ${intake.health_goal.slice(0, 60)}${intake.health_goal.length > 60 ? "…" : ""}` : "Processing your formulation…"}
            </p>
          </div>
        )}
      </div>

      <BuilderProgress phase={phase} />

      <AnimatePresence mode="wait">

        {/* ── INTAKE ────────────────────────────────────────────────────────── */}
        {phase === "intake" && (
          <motion.div
            key="intake"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-3"
          >
            {/* Step 1: Product format */}
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="px-6 pt-6 pb-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white transition-colors",
                    intake.product_type ? "bg-emerald-500" : "bg-gray-950"
                  )}>
                    {intake.product_type ? <Check className="size-3.5" /> : "1"}
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-950">What format are you building?</h2>
                    <p className="text-[12px] text-gray-400">Choose the delivery form for your supplement</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRODUCT_TYPES.map(type => {
                    const selected = intake.product_type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setIntake(d => ({ ...d, product_type: type }))}
                        className={cn(
                          "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all duration-200",
                          selected
                            ? "border-gray-950 bg-gray-950 shadow-[0_4px_20px_rgba(0,0,0,0.18)]"
                            : "border-black/[0.07] hover:border-black/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                        )}
                      >
                        <p className={cn(
                          "text-[13px] font-semibold leading-snug",
                          selected ? "text-white" : "text-gray-900"
                        )}>
                          {PRODUCT_TYPE_LABELS[type]}
                        </p>
                        <p className={cn(
                          "text-[11px] leading-snug",
                          selected ? "text-white/50" : "text-gray-400"
                        )}>
                          {PRODUCT_TYPE_DESC[type]}
                        </p>
                        {selected && (
                          <div className="absolute top-3 right-3">
                            <Check className="size-4 text-white/70" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Health goal */}
            <AnimatePresence>
              {step2Revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                >
                  <div className="px-6 pt-6 pb-5">
                    <div className="mb-5 flex items-center gap-3">
                      <div className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white transition-colors",
                        intake.health_goal?.trim() ? "bg-emerald-500" : "bg-gray-950"
                      )}>
                        {intake.health_goal?.trim() ? <Check className="size-3.5" /> : "2"}
                      </div>
                      <div>
                        <h2 className="text-[15px] font-semibold text-gray-950">
                          What health outcome should it deliver?
                        </h2>
                        <p className="text-[12px] text-gray-400">Be specific — this drives ingredient selection and dosing</p>
                      </div>
                    </div>

                    <textarea
                      value={intake.health_goal ?? ""}
                      onChange={e => setIntake(d => ({ ...d, health_goal: e.target.value }))}
                      rows={4}
                      placeholder="e.g. Improve cognitive focus and mental clarity for knowledge workers throughout the workday without stimulant crash…"
                      className="w-full resize-none rounded-xl border border-black/[0.1] bg-gray-50/60 px-4 py-3.5 text-[13px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-black/[0.04]"
                    />

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {[
                        "Cognitive focus & mental clarity",
                        "Sleep quality & recovery",
                        "Athletic endurance & performance",
                        "Stress & cortisol management",
                        "Gut health & microbiome",
                        "Immune system resilience",
                        "Joint & mobility support",
                        "Longevity & cellular health",
                      ].map(ex => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => setIntake(d => ({ ...d, health_goal: ex }))}
                          className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                            intake.health_goal === ex
                              ? "border-gray-950 bg-gray-950 text-white"
                              : "border-black/[0.06] bg-gray-50 text-gray-500 hover:border-black/20 hover:text-gray-800"
                          )}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3: Consumer & requirements */}
            <AnimatePresence>
              {step3Revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                >
                  <div className="px-6 pt-6 pb-5">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[12px] font-bold text-gray-500">
                        3
                      </div>
                      <div>
                        <h2 className="text-[15px] font-semibold text-gray-950">
                          Target consumer &amp; requirements
                          <span className="ml-2 text-[11px] font-normal text-gray-400">(optional)</span>
                        </h2>
                        <p className="text-[12px] text-gray-400">Tailor the formula to a specific audience and constraints</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <p className="mb-2.5 text-[12px] font-semibold text-gray-600">Target consumer</p>
                        <div className="flex flex-wrap gap-1.5">
                          {CONSUMER_OPTIONS.map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setIntake(d => ({ ...d, consumer: d.consumer === opt ? "" : opt }))}
                              className={cn(
                                "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                                intake.consumer === opt
                                  ? "border-gray-950 bg-gray-950 text-white"
                                  : "border-black/[0.06] bg-gray-50 text-gray-500 hover:border-black/20 hover:text-gray-700"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-[12px] font-semibold text-gray-600">Special requirements</p>
                        <input
                          type="text"
                          value={intake.requirements ?? ""}
                          onChange={e => setIntake(d => ({ ...d, requirements: e.target.value }))}
                          placeholder="e.g. Vegan, no caffeine, NSF certified, under $2/serving…"
                          className="h-10 w-full rounded-xl border border-black/[0.08] bg-gray-50/60 px-4 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-black/[0.04]"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start CTA */}
            <AnimatePresence>
              {intakeComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2"
                >
                  <button
                    type="button"
                    onClick={startResearch}
                    className="group w-full rounded-2xl bg-gray-950 px-8 py-5 text-center shadow-[0_8px_32px_rgba(0,0,0,0.14)] transition hover:bg-gray-800"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Sparkles className="size-5 text-white/60" />
                      <span className="text-[15px] font-semibold text-white">Start AI research</span>
                      <ArrowRight className="size-5 text-white/60 transition group-hover:translate-x-0.5" />
                    </div>
                    <p className="mt-1.5 text-[12px] text-white/40">
                      AI scans clinical literature, formulates the stack, and runs compliance — typically 60–90 seconds
                    </p>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── RESEARCHING / RESEARCH REVIEW ──────────────────────────────── */}
        {(phase === "researching" || phase === "research_review") && (
          <motion.div
            key="research"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <TerminalCard
              agentLabel={`ai-research-agent — ${PRODUCT_TYPE_LABELS[intake.product_type!] ?? "supplement"}`}
              phase="researching"
              streaming={streaming}
              statusLabel={streaming ? "Running" : "Complete"}
              statusColor={streaming ? "brand" : "emerald"}
            />

            {(streamContent || researchContent) && (
              <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="border-b border-black/[0.05] px-6 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Research output</p>
                  <h3 className="mt-0.5 text-[14px] font-semibold text-gray-950">
                    Clinical evidence for{" "}
                    <span className="text-gray-950">{(intake.health_goal ?? "").slice(0, 60)}</span>
                  </h3>
                </div>
                <div className="px-6 py-5">
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
                    stream("research").then(content => {
                      setResearchContent(prev => prev + "\n\n---\n\n" + content);
                      setPhase("research_review");
                    });
                  } else {
                    startFormulation();
                  }
                }}
                loading={streaming}
                submitLabel={streaming ? "Working…" : "Proceed to formulation →"}
                onSkip={startFormulation}
                skipLabel="Skip — formulate now"
              />
            )}
          </motion.div>
        )}

        {/* ── FORMULATING / REVIEW / REFINING ─────────────────────────────── */}
        {(phase === "formulating" || phase === "formulation_review" || phase === "refining") && (
          <motion.div
            key="formulation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {(phase === "formulating" || phase === "refining") && (
              <TerminalCard
                agentLabel={phase === "refining" ? "ai-refine-agent" : "ai-formulation-agent"}
                phase={phase}
                streaming={streaming}
                streamContent={streamContent}
                statusLabel={phase === "refining" ? "Refining" : "Formulating"}
                statusColor="brand"
              />
            )}

            {phase === "formulation_review" && parsedFormulation && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Formula header */}
                <div className="rounded-2xl border border-black/[0.06] bg-white px-6 py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                        Formulation draft ready
                      </p>
                      <h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-gray-950">
                        {parsedFormulation.name}
                      </h2>
                      <p className="mt-1 text-[13px] text-gray-500">{parsedFormulation.description}</p>
                    </div>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="size-4 text-emerald-600" />
                    </div>
                  </div>
                  {parsedFormulation.expected_outcomes && (
                    <div className="mt-4 rounded-xl border border-black/[0.06] bg-gray-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Expected outcomes</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-gray-700">{parsedFormulation.expected_outcomes}</p>
                    </div>
                  )}
                </div>

                <StackStats formulation={parsedFormulation} productType={intake.product_type} />

                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Ingredient stack — {parsedFormulation.ingredients.length} actives
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {parsedFormulation.ingredients.map((ing, i) => (
                      <IngredientCard key={i} ing={ing} index={i} />
                    ))}
                  </div>
                </div>

                <details className="group rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                  <summary className="flex cursor-pointer items-center gap-2 px-5 py-3.5 text-[12px] font-medium text-gray-500 hover:text-gray-800">
                    <ChevronRight className="size-3.5 transition group-open:rotate-90" />
                    Show full AI rationale
                  </summary>
                  <div className="border-t border-black/[0.05] px-5 py-5">
                    <StreamingMarkdown content={formulationContent.replace(/```json[\s\S]*?```/g, "")} />
                  </div>
                </details>

                <ChatFeedback
                  messages={feedbackHistory}
                  placeholder="e.g. Increase ashwagandha to 600 mg, add lion's mane, remove caffeine…"
                  onSubmit={feedback => {
                    if (feedback.trim()) { startRefine(feedback); } else { approveFormulation(); }
                  }}
                  loading={streaming}
                  submitLabel="Approve & run compliance"
                  onSkip={approveFormulation}
                  skipLabel="Looks good — approve"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => startRefine("")}
                    className="flex items-center gap-1.5 text-[12px] text-gray-400 transition hover:text-gray-700"
                  >
                    <RefreshCw className="size-3" />
                    Regenerate from scratch
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── COMPLIANCE RUNNING ───────────────────────────────────────────── */}
        {phase === "compliance_running" && (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <TerminalCard
              agentLabel="ai-compliance-agent — FDA DSHEA"
              phase="compliance_running"
              streaming={true}
              statusLabel="Analyzing"
              statusColor="amber"
            />
            <div className="flex items-center justify-center gap-4 rounded-2xl border border-black/[0.06] bg-white px-6 py-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-black/[0.08] bg-gray-100">
                <ShieldCheck className="size-6 text-gray-600" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-950">Running compliance analysis</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-gray-400">
                  <Loader2 className="size-3.5 animate-spin" />
                  Reviewing against FDA DSHEA guidelines…
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── COMPLIANCE REFINING ──────────────────────────────────────────── */}
        {phase === "compliance_refining" && (
          <motion.div
            key="compliance_refining"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-100">
                  <ShieldCheck className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-amber-900">
                    Score below threshold — auto-correcting
                  </p>
                  <p className="mt-0.5 text-[12px] text-amber-700">
                    Score: <span className="font-bold">{complianceResult?.score ?? "—"}/100</span>
                    {" "}— AI is automatically revising the formulation to resolve compliance issues.
                  </p>
                  {Boolean(complianceResult?.issues?.filter(i => i.severity === "high").length) && (
                    <ul className="mt-2 space-y-1">
                      {complianceResult!.issues.filter(i => i.severity === "high").slice(0, 3).map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span><span className="font-semibold">{issue.issue}</span>{issue.ingredient ? ` — ${issue.ingredient}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <TerminalCard
              agentLabel="ai-compliance-refine-agent"
              phase="compliance_refining"
              streaming={streaming}
              streamContent={streamContent}
              statusLabel="Rewriting"
              statusColor="brand"
            />
          </motion.div>
        )}

        {/* ── COMPLETE ─────────────────────────────────────────────────────── */}
        {phase === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Hero result card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            >
              <div className="flex flex-col items-center gap-8 px-8 py-12 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  {complianceResult
                    ? <ComplianceRing score={complianceResult.score} />
                    : (
                      <div className="flex size-[136px] items-center justify-center rounded-full border-4 border-emerald-100">
                        <Check className="size-10 text-emerald-500" />
                      </div>
                    )
                  }
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      AI formulation complete
                    </p>
                    <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.025em] text-gray-950">
                      {parsedFormulation?.name ?? "Your formulation is ready"}
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                      {parsedFormulation?.description}
                    </p>
                  </motion.div>
                  <div className="mt-6">
                    <ProductAnimation
                      productType={intake.product_type!}
                      complianceScore={complianceResult?.score}
                    />
                  </div>
                </div>
              </div>

              {complianceResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-4 border-t border-black/[0.05] px-8 py-6"
                >
                  {complianceResult.summary && (
                    <p className="text-[13px] text-gray-600">{complianceResult.summary}</p>
                  )}
                  {complianceResult.review_disclaimer && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <p className="text-[12px] leading-relaxed text-amber-700">{complianceResult.review_disclaimer}</p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {complianceResult.issues.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Flagged items</p>
                        {complianceResult.issues.slice(0, 4).map((issue, i) => (
                          <div key={i} className={cn(
                            "rounded-lg border px-3 py-2 text-[12px]",
                            issue.severity === "high" ? "border-red-100 bg-red-50 text-red-700" :
                            issue.severity === "medium" ? "border-amber-100 bg-amber-50 text-amber-700" :
                            "border-blue-100 bg-blue-50 text-blue-700"
                          )}>
                            <span className="font-semibold">{issue.issue}</span>
                            {issue.ingredient && <span className="opacity-70"> — {issue.ingredient}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {complianceResult.compliant_claims.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Defensible claims</p>
                        {complianceResult.compliant_claims.slice(0, 4).map((claim, i) => (
                          <div key={i} className="flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
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
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Next steps</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "View formulation",
                    desc: "Full ingredient panel, label preview, compliance details",
                    href: formulationId ? `/dashboard/formulations/${formulationId}` : "/dashboard/formulations",
                    primary: true,
                  },
                  {
                    label: "Export PDF",
                    desc: "Download a full dossier ready for manufacturer review",
                    href: formulationId ? `/dashboard/formulations/${formulationId}/print` : "#",
                  },
                  {
                    label: "Manufacturer handoff",
                    desc: "Generate an RFQ brief and share with production partners",
                    href: formulationId ? `/dashboard/formulations/${formulationId}?tab=handoff` : "#",
                  },
                ].map(({ label, desc, href, primary }) => (
                  <Link
                    key={label}
                    href={href}
                    className={cn(
                      "group rounded-2xl border p-5 transition-all",
                      primary
                        ? "border-gray-950 bg-gray-950 hover:bg-gray-800"
                        : "border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:border-black/[0.12] hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]"
                    )}
                  >
                    <p className={cn("text-[13px] font-semibold", primary ? "text-white" : "text-gray-950")}>
                      {label}
                    </p>
                    <p className={cn("mt-1 text-[12px] leading-relaxed", primary ? "text-white/50" : "text-gray-500")}>{desc}</p>
                    <p className={cn(
                      "mt-4 flex items-center gap-1 text-[12px] font-medium transition",
                      primary ? "text-white/60 group-hover:text-white/80" : "text-gray-400 group-hover:text-gray-700"
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
    </div>
  );
}
