"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  RefreshCw,
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
}

interface ParsedFormulation {
  name: string;
  description: string;
  ingredients: ParsedIngredient[];
  serving_size: string;
  total_fill_weight_mg: number;
  expected_outcomes: string;
}

interface ComplianceResult {
  score: number;
  summary: string;
  issues: Array<{ severity: string; ingredient: string | null; issue: string; detail: string }>;
  compliant_claims: string[];
  recommendations: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONSUMER_OPTIONS = [
  "General wellness", "Athletic performance", "Cognitive health",
  "Women's health", "Men's health", "Senior health",
  "Weight management", "Gut & digestive health",
];

const PHASE_LABELS: Record<Phase, string> = {
  intake: "Setup",
  researching: "Research",
  research_review: "Research",
  formulating: "Formulation",
  formulation_review: "Formulation",
  refining: "Formulation",
  compliance_running: "Compliance",
  compliance_refining: "Compliance",
  complete: "Complete",
};

const PHASES_ORDERED: Phase[] = [
  "intake", "researching", "research_review",
  "formulating", "formulation_review", "refining",
  "compliance_running", "complete",
];

const PHASE_STEPS = [
  { key: "intake", label: "Setup" },
  { key: "researching", label: "Research" },
  { key: "formulating", label: "Formulation" },
  { key: "compliance_running", label: "Compliance" },
  { key: "complete", label: "Complete" },
];

function stepIndex(phase: Phase): number {
  if (phase === "intake") return 0;
  if (phase === "researching" || phase === "research_review") return 1;
  if (phase === "formulating" || phase === "formulation_review" || phase === "refining") return 2;
  if (phase === "compliance_running" || phase === "compliance_refining") return 3;
  return 4;
}

function parseFormulationJson(text: string): ParsedFormulation | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/);
    if (!match) return null;
    const raw = JSON.parse(match[1]);
    return {
      name: raw.name ?? "",
      description: raw.description ?? "",
      ingredients: (raw.ingredients ?? []).map((ing: any, i: number) => ({
        id: `parsed-${i}`,
        name: ing.name ?? "",
        dose: String(ing.dose ?? ""),
        unit: ing.unit ?? "mg",
        rationale: ing.rationale ?? "",
      })),
      serving_size: raw.serving_size ?? "",
      total_fill_weight_mg: raw.total_fill_weight_mg ?? 0,
      expected_outcomes: raw.expected_outcomes ?? "",
    };
  } catch {
    return null;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhaseIndicator({ phase }: { phase: Phase }) {
  const current = stepIndex(phase);
  return (
    <div className="flex items-center gap-2 mb-8">
      {PHASE_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all",
                done ? "bg-brand text-white" :
                active ? "bg-brand/10 text-brand ring-2 ring-brand/30" :
                "bg-gray-100 text-gray-400"
              )}>
                {done ? <Check className="size-3" /> : (
                  active && (phase === "researching" || phase === "formulating" || phase === "compliance_running" || phase === "compliance_refining" || phase === "refining")
                    ? <Loader2 className="size-3 animate-spin" />
                    : i + 1
                )}
              </div>
              <span className={cn(
                "hidden text-[12px] font-medium sm:block",
                done ? "text-brand" : active ? "text-gray-900" : "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
            {i < PHASE_STEPS.length - 1 && (
              <div className={cn("h-px w-8 transition-all", done ? "bg-brand" : "bg-gray-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FeedbackBox({
  label, placeholder, onSubmit, loading, submitLabel = "Submit", onSkip, skipLabel,
}: {
  label: string; placeholder: string;
  onSubmit: (text: string) => void;
  loading?: boolean; submitLabel?: string;
  onSkip?: () => void; skipLabel?: string;
}) {
  const [text, setText] = useState("");
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <p className="text-[12px] font-semibold text-gray-700">{label}</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MessageSquare className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full resize-none rounded-lg border border-black/[0.08] bg-white py-2 pl-9 pr-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-gray-500 transition hover:text-gray-800"
          >
            {skipLabel ?? "Skip"}
          </button>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => { onSubmit(text); setText(""); }}
          className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-5 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
          {loading ? "Working…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewFormulationPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("intake");
  const [intake, setIntake] = useState<Partial<IntakeData>>({});
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [researchContent, setResearchContent] = useState("");
  const [formulationContent, setFormulationContent] = useState("");
  const [parsedFormulation, setParsedFormulation] = useState<ParsedFormulation | null>(null);
  const [formulationId, setFormulationId] = useState<string | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Status helper ──
  async function updateStatus(id: string, status: string) {
    await fetch(`/api/formulations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  // ── Create formulation in DB ──
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

  // ── Update formulation ingredients ──
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

  // ── Stream from builder API ──
  async function stream(
    phaseKey: "research" | "formulate" | "refine" | "compliance_refine",
    feedback?: string,
    complianceResult?: string,
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
            compliance_result: complianceResult,
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
    } catch (e: any) {
      if (e.name !== "AbortError") toast.error(e.message ?? "AI request failed");
    } finally {
      setStreaming(false);
    }
    return accumulated;
  }

  // ── Phase: Start Research ──
  async function startResearch() {
    if (!intake.product_type || !intake.health_goal?.trim()) return;
    setPhase("researching");
    const content = await stream("research");
    setResearchContent(content);
    setPhase("research_review");
  }

  // ── Phase: Start Formulation ──
  async function startFormulation() {
    setPhase("formulating");
    const content = await stream("formulate");
    setFormulationContent(content);
    const parsed = parseFormulationJson(content);
    setParsedFormulation(parsed);

    // Create in DB
    if (parsed && intake.product_type) {
      const id = await createFormulation(parsed, intake.product_type);
      if (id) {
        setFormulationId(id);
        await updateStatus(id, "in_progress");
      }
    }

    setPhase("formulation_review");
  }

  // ── Phase: Refine ──
  async function startRefine(feedback: string) {
    setPhase("refining");
    const content = await stream("refine", feedback || "Refine the formulation for better efficacy and clinical backing.");
    setFormulationContent(content);
    const parsed = parseFormulationJson(content);
    setParsedFormulation(parsed);

    // Update in DB
    if (parsed && formulationId) {
      await updateFormulation(formulationId, parsed, "in_progress");
    }
    setPhase("formulation_review");
  }

  // ── Phase: Approve → Compliance ──
  async function approveFormulation() {
    if (formulationId) await updateStatus(formulationId, "in_review");
    setPhase("compliance_running");
    await runCompliance();
  }

  // ── Phase: Compliance ──
  async function runCompliance() {
    if (!formulationId) {
      // No ID yet — create with current parsed data
      if (parsedFormulation && intake.product_type) {
        const id = await createFormulation(parsedFormulation, intake.product_type);
        if (id) {
          setFormulationId(id);
          await runComplianceForId(id);
        }
      }
    } else {
      await runComplianceForId(formulationId);
    }
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

      // Auto-fix loop: if score < 75 and we haven't already tried twice, refine
      if (typeof data.score === "number" && data.score < 75 && attempt < 2) {
        setComplianceResult(data);
        setPhase("compliance_refining");

        const complianceSummary = JSON.stringify({
          score: data.score,
          issues: data.issues,
          recommendations: data.recommendations,
          risky_claims: data.risky_claims,
          auto_fix_guidance: data.auto_fix_guidance,
        });

        const refined = await stream("compliance_refine", undefined, complianceSummary);
        setFormulationContent(refined);
        const parsed = parseFormulationJson(refined);
        if (parsed) {
          setParsedFormulation(parsed);
          await updateFormulation(id, parsed, "in_review");
        }

        setPhase("compliance_running");
        await runComplianceForId(id, attempt + 1);
        return;
      }

      setComplianceResult(data);
      await updateStatus(id, "compliant");
      setPhase("complete");
    } catch (e: any) {
      toast.error(e.message ?? "Compliance check failed");
      setPhase("formulation_review");
    }
  }

  // ── Rendered intake data ──
  const intakeComplete = intake.product_type && intake.health_goal?.trim();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/formulations"
          className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-gray-700"
        >
          <ChevronLeft className="size-3.5" />
          Formulations
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-gray-950">
          AI Formulation Builder
        </h1>
        <p className="mt-1 text-[13px] text-gray-500">
          Answer a few questions — the AI researches, formulates, and validates your product autonomously.
        </p>
      </div>

      {/* Phase indicator */}
      <PhaseIndicator phase={phase} />

      <AnimatePresence mode="wait">

        {/* ── INTAKE ──────────────────────────────────────────────────────── */}
        {phase === "intake" && (
          <motion.div
            key="intake"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {/* Product type */}
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Step 1</p>
                <h2 className="mt-0.5 text-[14px] font-semibold text-gray-900">What delivery format are you building?</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
                {PRODUCT_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setIntake(d => ({ ...d, product_type: type }))}
                    className={cn(
                      "group flex flex-col gap-2 rounded-xl border p-4 text-left transition",
                      intake.product_type === type
                        ? "border-brand bg-brand/[0.04]"
                        : "border-black/[0.07] bg-gray-50/50 hover:border-black/20 hover:bg-white"
                    )}
                  >
                    <p className={cn(
                      "text-[13px] font-semibold",
                      intake.product_type === type ? "text-brand" : "text-gray-900"
                    )}>
                      {PRODUCT_TYPE_LABELS[type]}
                    </p>
                    <p className="text-[11px] leading-snug text-gray-400">{PRODUCT_TYPE_DESC[type]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Health goal */}
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Step 2</p>
                <h2 className="mt-0.5 text-[14px] font-semibold text-gray-900">What health goal does this product address?</h2>
              </div>
              <div className="space-y-3 p-5">
                <textarea
                  value={intake.health_goal ?? ""}
                  onChange={e => setIntake(d => ({ ...d, health_goal: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Improve cognitive focus and mental clarity for knowledge workers throughout the workday…"
                  className="w-full resize-none rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
                <div className="flex flex-wrap gap-1.5">
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
                        "rounded-full border px-3 py-1 text-[11px] transition",
                        intake.health_goal === ex
                          ? "border-brand/30 bg-brand/[0.06] text-brand"
                          : "border-black/[0.06] bg-gray-50 text-gray-500 hover:border-brand/20 hover:text-gray-700"
                      )}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Consumer + requirements */}
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Step 3 — Optional</p>
                <h2 className="mt-0.5 text-[14px] font-semibold text-gray-900">Target consumer & special requirements</h2>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="mb-2 text-[12px] font-medium text-gray-600">Target consumer</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CONSUMER_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setIntake(d => ({ ...d, consumer: d.consumer === opt ? "" : opt }))}
                        className={cn(
                          "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                          intake.consumer === opt
                            ? "border-brand/30 bg-brand/[0.06] text-brand"
                            : "border-black/[0.06] bg-gray-50 text-gray-500 hover:border-black/20 hover:text-gray-700"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-medium text-gray-600">Special requirements</p>
                  <input
                    type="text"
                    value={intake.requirements ?? ""}
                    onChange={e => setIntake(d => ({ ...d, requirements: e.target.value }))}
                    placeholder="e.g. Vegan, no caffeine, NSF certified, under $2/serving…"
                    className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
                  />
                </div>
              </div>
            </div>

            {/* Start */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={startResearch}
                disabled={!intakeComplete}
                className="flex items-center gap-2 rounded-lg bg-gray-950 px-6 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
              >
                <Sparkles className="size-3.5" />
                Start AI research
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── RESEARCHING ─────────────────────────────────────────────────── */}
        {(phase === "researching" || phase === "research_review") && (
          <motion.div
            key="research"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Phase 1 — Research</p>
                  <h2 className="mt-0.5 text-[14px] font-semibold text-gray-900">
                    Scanning clinical evidence for{" "}
                    <span className="text-brand">{PRODUCT_TYPE_LABELS[intake.product_type!]}</span>
                  </h2>
                </div>
                {streaming && (
                  <div className="flex items-center gap-1.5 text-[11px] text-brand">
                    <span className="size-1.5 animate-pulse rounded-full bg-brand" />
                    Analyzing
                  </div>
                )}
                {!streaming && phase === "research_review" && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <Check className="size-3" />
                    Done
                  </span>
                )}
              </div>
              <div className="px-5 py-5">
                {streaming && !streamContent && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-400">
                    <Loader2 className="size-3.5 animate-spin" />
                    Retrieving clinical evidence…
                  </div>
                )}
                <StreamingMarkdown content={phase === "research_review" ? researchContent : streamContent} />
              </div>
            </div>

            {phase === "research_review" && (
              <FeedbackBox
                label="Research complete. Ready to formulate — or request additional research?"
                placeholder="e.g. Include more research on nootropics, or dig deeper into magnesium forms…"
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
                submitLabel={streaming ? "Working…" : "Proceed to formulation"}
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Phase 2 — {phase === "refining" ? "Refining" : "Formulation"}
                  </p>
                  <h2 className="mt-0.5 text-[14px] font-semibold text-gray-900">
                    {phase === "refining" ? "Applying your feedback…" :
                     phase === "formulating" ? "Drafting your formulation…" :
                     "Formulation draft ready"}
                  </h2>
                </div>
                {(streaming) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-brand">
                    <span className="size-1.5 animate-pulse rounded-full bg-brand" />
                    {phase === "refining" ? "Refining" : "Formulating"}
                  </div>
                )}
                {!streaming && phase === "formulation_review" && parsedFormulation && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <Check className="size-3" />
                    Ready
                  </span>
                )}
              </div>

              {/* Parsed formulation card */}
              {!streaming && parsedFormulation && phase === "formulation_review" ? (
                <div className="p-5 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[17px] font-semibold tracking-tight text-gray-950">{parsedFormulation.name}</p>
                      <p className="mt-1 text-[13px] text-gray-500">{parsedFormulation.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-medium text-gray-400">Total fill</p>
                      <p className="font-mono text-[16px] font-semibold text-gray-900">
                        {parsedFormulation.total_fill_weight_mg > 0 ? `${parsedFormulation.total_fill_weight_mg} mg` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Ingredients table */}
                  <div className="rounded-lg border border-black/[0.06] overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-black/[0.05] bg-gray-50/80 px-4 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Ingredient</span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Dose</span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Unit</span>
                    </div>
                    {parsedFormulation.ingredients.map((ing, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto_auto] items-start gap-3 border-b border-black/[0.04] px-4 py-3 last:border-0">
                        <div>
                          <p className="text-[13px] font-medium text-gray-900">{ing.name}</p>
                          {ing.rationale && (
                            <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{ing.rationale}</p>
                          )}
                        </div>
                        <p className="font-mono text-[13px] font-semibold text-gray-700 pt-px">{ing.dose}</p>
                        <p className="font-mono text-[12px] text-gray-400 pt-px">{ing.unit}</p>
                      </div>
                    ))}
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      ["Serving size", parsedFormulation.serving_size],
                      ["Ingredients", `${parsedFormulation.ingredients.length} actives`],
                      ["Format", PRODUCT_TYPE_LABELS[intake.product_type!] ?? intake.product_type],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-black/[0.05] bg-gray-50/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
                        <p className="mt-1 text-[13px] font-medium text-gray-900">{value || "—"}</p>
                      </div>
                    ))}
                  </div>

                  {/* Expected outcomes */}
                  {parsedFormulation.expected_outcomes && (
                    <div className="rounded-lg border border-brand/10 bg-brand/[0.03] px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-1">Expected outcomes</p>
                      <p className="text-[12px] leading-relaxed text-gray-700">{parsedFormulation.expected_outcomes}</p>
                    </div>
                  )}

                  {/* Full AI response (collapsible) */}
                  <details className="group">
                    <summary className="cursor-pointer list-none text-[12px] font-medium text-gray-400 hover:text-gray-700 transition flex items-center gap-1">
                      <ChevronRight className="size-3.5 transition group-open:rotate-90" />
                      Show full AI rationale
                    </summary>
                    <div className="mt-3 border-t border-black/[0.05] pt-3">
                      <StreamingMarkdown content={formulationContent.replace(/```json[\s\S]*?```/g, "")} />
                    </div>
                  </details>
                </div>
              ) : (
                <div className="px-5 py-5">
                  {streaming && !streamContent && (
                    <div className="flex items-center gap-2 text-[12px] text-gray-400">
                      <Loader2 className="size-3.5 animate-spin" />
                      Drafting formulation from research…
                    </div>
                  )}
                  <StreamingMarkdown content={streamContent} />
                </div>
              )}
            </div>

            {phase === "formulation_review" && !streaming && (
              <div className="space-y-3">
                <FeedbackBox
                  label="Request changes, or approve this formulation to run compliance."
                  placeholder="e.g. Increase ashwagandha to 600mg, add lion's mane, remove caffeine…"
                  onSubmit={feedback => {
                    if (feedback.trim()) {
                      startRefine(feedback);
                    } else {
                      approveFormulation();
                    }
                  }}
                  loading={streaming}
                  submitLabel="Approve & run compliance"
                  onSkip={approveFormulation}
                  skipLabel="Approve — looks good"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => startRefine("")}
                    className="flex items-center gap-1.5 text-[12px] text-gray-400 transition hover:text-gray-700"
                  >
                    <RefreshCw className="size-3" />
                    Regenerate formulation
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── COMPLIANCE RUNNING ───────────────────────────────────────────── */}
        {phase === "compliance_running" && (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-5 rounded-xl border border-black/[0.06] bg-white p-10 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/[0.04]">
                <ShieldCheck className="size-7 text-brand" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-gray-900">Running compliance analysis</p>
                <p className="mt-1.5 flex items-center gap-2 text-[13px] text-gray-400">
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-100">
                  <ShieldCheck className="size-4.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-amber-900">
                    Compliance score below threshold — auto-fixing
                  </p>
                  <p className="mt-1 text-[12px] text-amber-700">
                    Score: <span className="font-bold">{complianceResult?.score ?? "—"}/100</span>
                    {" "}— The AI identified compliance issues and is automatically revising the formulation to meet FDA guidelines.
                  </p>
                  {complianceResult?.issues?.filter(i => i.severity === "high").length ? (
                    <ul className="mt-2 space-y-1">
                      {complianceResult.issues.filter(i => i.severity === "high").slice(0, 3).map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-700">
                          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span><span className="font-semibold">{issue.issue}</span>{issue.ingredient ? ` — ${issue.ingredient}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 border-b border-black/[0.05] px-5 py-3.5">
                <Loader2 className="size-3.5 animate-spin text-brand" />
                <p className="text-[13px] font-semibold text-gray-900">Rewriting formulation for compliance…</p>
              </div>
              <div className="px-5 py-5">
                {streamContent ? (
                  <StreamingMarkdown content={streamContent} />
                ) : (
                  <p className="text-[12px] text-gray-400">Applying regulatory corrections…</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── COMPLETE ─────────────────────────────────────────────────────── */}
        {phase === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Animation hero */}
            <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
              <div className="flex flex-col items-center gap-6 px-8 py-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Complete</p>
                  <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-gray-950">
                    {parsedFormulation?.name ?? "Your formulation is ready"}
                  </h2>
                  <p className="mt-2 text-[13px] text-gray-500 max-w-sm mx-auto">
                    {parsedFormulation?.description}
                  </p>
                </motion.div>

                <ProductAnimation
                  productType={intake.product_type!}
                  complianceScore={complianceResult?.score}
                />

                {/* Compliance summary */}
                {complianceResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="w-full max-w-lg space-y-3"
                  >
                    <p className="text-center text-[12px] font-semibold text-gray-500">{complianceResult.summary}</p>

                    {complianceResult.issues.length > 0 && (
                      <div className="space-y-2">
                        {complianceResult.issues.slice(0, 3).map((issue, i) => (
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
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Defensible claims</p>
                        {complianceResult.compliant_claims.slice(0, 3).map((claim, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                            {claim}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Next steps */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
            >
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Next steps</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "View formulation",
                    desc: "See full ingredient panel, specs, and edit details",
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
                      "group rounded-xl border p-5 transition",
                      primary
                        ? "border-brand/20 bg-brand/[0.04] hover:bg-brand/[0.08]"
                        : "border-black/[0.06] bg-white hover:border-black/[0.12] shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                    )}
                  >
                    <p className={cn("text-[13px] font-semibold", primary ? "text-brand" : "text-gray-900")}>
                      {label}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{desc}</p>
                    <p className={cn("mt-3 flex items-center gap-1 text-[12px] font-medium",
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
    </div>
  );
}
