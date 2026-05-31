"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Factory,
  FileText,
  History,
  Link2,
  Loader2,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  X,
  Zap,
} from "lucide-react";

import { FormulationForm, type FormulationFormValues } from "@/components/formulations/FormulationForm";
import { StreamingMarkdown } from "@/components/ui/streaming-markdown";
import {
  CAPSULE_FILL_CAPACITY_MG,
  FORMULATION_STATUSES,
  STATUS_BADGE_CLASSES,
  STATUS_DOT_CLASSES,
  STATUS_LABELS,
  type Formulation,
  type FormulationIngredient,
  type FormulationStatus,
} from "@/lib/formulations/types";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";

type Tab = "overview" | "interactions" | "research" | "compliance" | "handoff" | "edit" | "label";

interface FormulationVersionRow {
  id: string;
  version: number;
  snapshot: Formulation;
  created_at: string;
}

interface Collaborator {
  id: string;
  invited_email: string;
  role: "viewer" | "editor";
  user_id: string | null;
  created_at: string;
}

function StatusBadge({ status }: { status: FormulationStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium", STATUS_BADGE_CLASSES[status])}>
      <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASSES[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diffD = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffD === 0) return "today";
  if (diffD === 1) return "yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Compliance result types ───────────────────────────────────────────────────
interface ComplianceIssue {
  severity: "high" | "medium" | "low";
  ingredient: string | null;
  issue: string;
  detail: string;
  fix?: string;
  cfr_citation?: string;
}
interface ComplianceResult {
  score: number;
  summary: string;
  issues: ComplianceIssue[];
  compliant_claims: string[];
  risky_claims: string[];
  recommendations: string[];
  manual_review_required?: boolean;
  review_disclaimer?: string;
}

// ─── Fill weight calculator ────────────────────────────────────────────────────
function FillWeightCalculator({ formulation }: { formulation: Formulation }) {
  const totalActiveMg = formulation.ingredients.reduce((sum, ing) => {
    if (!ing.dose || !["mg", "g"].includes(ing.unit ?? "mg")) return sum;
    const val = parseFloat(ing.dose);
    if (isNaN(val)) return sum;
    return sum + (ing.unit === "g" ? val * 1000 : val);
  }, 0);

  const capsuleCapacity = formulation.capsule_size
    ? CAPSULE_FILL_CAPACITY_MG[formulation.capsule_size] ?? null
    : null;
  const perServing = formulation.capsules_per_serving ?? 1;
  const totalCapacity = capsuleCapacity ? capsuleCapacity * perServing : null;
  const pctFilled = totalCapacity ? Math.round((totalActiveMg / totalCapacity) * 100) : null;
  const fits = totalCapacity ? totalActiveMg <= totalCapacity : null;

  if (!formulation.capsule_size && totalActiveMg === 0) return null;

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="border-b border-black/[0.05] px-5 py-3.5">
        <h2 className="text-[13px] font-semibold text-gray-900">Fill Weight Calculator</h2>
        <p className="mt-0.5 text-[11px] text-gray-400">Validates that your stack physically fits in the selected capsule size.</p>
      </div>
      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Active fill weight</p>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-gray-950">
              {totalActiveMg > 0 ? `${totalActiveMg.toLocaleString()} mg` : "—"}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">sum of mg/g ingredients</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Capsule capacity</p>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-gray-950">
              {totalCapacity ? `${totalCapacity.toLocaleString()} mg` : "—"}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {capsuleCapacity ? `${formulation.capsule_size} × ${perServing}` : "No capsule selected"}
            </p>
          </div>
          <div className={cn("rounded-xl p-4", fits === false ? "bg-red-50" : fits === true ? "bg-emerald-50" : "bg-gray-50")}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Fit status</p>
            <p className={cn("mt-2 text-[22px] font-semibold tracking-tight",
              fits === false ? "text-red-600" : fits === true ? "text-emerald-600" : "text-gray-400")}>
              {pctFilled != null ? `${pctFilled}% filled` : "—"}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {fits === false ? "❌ Exceeds capsule capacity" : fits === true ? "✓ Fits" : "Set capsule size"}
            </p>
          </div>
        </div>
        {fits === false && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[12px] text-red-700">
            Stack exceeds capsule capacity by {(totalActiveMg - (totalCapacity ?? 0)).toLocaleString()} mg. Consider upgrading to a larger capsule size, splitting into more capsules per serving, or reducing doses.
          </div>
        )}
        {totalActiveMg > 0 && !formulation.capsule_size && (
          <p className="mt-3 text-[11px] text-gray-400">Set a capsule size in Edit to see fit validation.</p>
        )}
      </div>
    </div>
  );
}

// ─── Cost Estimator ────────────────────────────────────────────────────────────
function CostEstimator({ formulation }: { formulation: Formulation }) {
  const withCost = formulation.ingredients.filter(i => i.cost_per_kg_usd && i.dose);
  if (withCost.length === 0) return null;

  const servings = 30; // standard bottle

  const costPerServing = withCost.reduce((sum, ing) => {
    const doseG = parseFloat(ing.dose!) * (ing.unit === "g" ? 1 : ing.unit === "mcg" ? 0.000001 : 0.001);
    return sum + (doseG / 1000) * ing.cost_per_kg_usd!;
  }, 0);

  const cogsPer30 = costPerServing * servings;
  const msrpEstimate = cogsPer30 * 5; // typical 5× markup for MSRP

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="border-b border-black/[0.05] px-5 py-3.5">
        <h2 className="text-[13px] font-semibold text-gray-900">Cost Estimate</h2>
        <p className="mt-0.5 text-[11px] text-gray-400">Estimated bulk COGS based on typical US supplier pricing. Run AI evidence refresh to populate costs.</p>
      </div>
      <div className="p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Cost / serving", value: `$${costPerServing.toFixed(3)}`, sub: "active ingredients only" },
            { label: `COGS / ${servings}-serving bottle`, value: `$${cogsPer30.toFixed(2)}`, sub: "bulk pricing estimate" },
            { label: "Est. retail (5× markup)", value: `$${msrpEstimate.toFixed(2)}`, sub: "typical supplement margin" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl bg-gray-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
              <p className="mt-2 text-[22px] font-semibold tracking-tight text-gray-950">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-black/[0.06]">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-black/[0.05] bg-gray-50">
                <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Ingredient</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400">Est. $/kg</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400">$/serving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {withCost.map(ing => {
                const doseG = parseFloat(ing.dose!) * (ing.unit === "g" ? 1 : ing.unit === "mcg" ? 0.000001 : 0.001);
                const cost = (doseG / 1000) * ing.cost_per_kg_usd!;
                return (
                  <tr key={ing.id}>
                    <td className="px-4 py-2.5 text-gray-800">{ing.name}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">${ing.cost_per_kg_usd!.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-800">${cost.toFixed(4)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-gray-400">Estimates only. Actual prices vary by supplier, volume, and grade. Refresh ingredient evidence to update cost data.</p>
      </div>
    </div>
  );
}

// ─── Formula Score Card ────────────────────────────────────────────────────────
function computeFormulaScore(formulation: Formulation): { score: number; label: string; color: string; breakdown: { label: string; score: number }[] } {
  const ings = formulation.ingredients;
  const gradeScore = ings.length === 0 ? 60 : (ings.reduce((sum, i) => {
    return sum + (i.evidence_grade === "A" ? 92 : i.evidence_grade === "B" ? 68 : i.evidence_grade === "C" ? 40 : 58);
  }, 0) / ings.length);
  const doseScore = ings.length === 0 ? 65 : (ings.reduce((sum, i) => {
    return sum + (i.dose_assessment === "at_studied_dose" ? 95 : i.dose_assessment === "below_studied_dose" ? 62 : i.dose_assessment === "above_studied_dose" ? 48 : 68);
  }, 0) / ings.length);
  const complianceScore = formulation.compliance_score ?? 70;
  const diversityScore = Math.min(95, 40 + ings.length * 7);
  const overall = Math.round(gradeScore * 0.35 + doseScore * 0.35 + complianceScore * 0.2 + diversityScore * 0.1);
  const label = overall >= 85 ? "Excellent" : overall >= 70 ? "Good" : overall >= 55 ? "Fair" : "Needs work";
  const color = overall >= 85 ? "#10b981" : overall >= 70 ? "#5b6ee1" : overall >= 55 ? "#f59e0b" : "#ef4444";
  return {
    score: overall,
    label,
    color,
    breakdown: [
      { label: "Evidence grades", score: Math.round(gradeScore) },
      { label: "Dose accuracy", score: Math.round(doseScore) },
      { label: "Compliance", score: complianceScore },
      { label: "Stack depth", score: Math.round(diversityScore) },
    ],
  };
}

function FormulaScoreCard({ formulation }: { formulation: Formulation }) {
  const { score, label, color, breakdown } = computeFormulaScore(formulation);
  const r = 28; const cx = 36; const cy = 36;
  const circum = 2 * Math.PI * r;
  const filled = circum * (score / 100);
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-xl border border-black/[0.06] bg-white px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Ring */}
      <div className="relative shrink-0">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="7" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${filled} ${circum}`} strokeDashoffset={circum / 4} />
          <text x={cx} y={cy + 5} textAnchor="middle" style={{ fontSize: 15, fontWeight: 700, fill: color, fontFamily: "inherit" }}>{score}</text>
        </svg>
      </div>
      {/* Label + breakdown */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-[15px] font-semibold text-gray-950">Formula score</p>
          <span className="text-[12px] font-semibold" style={{ color }}>{label}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
          {breakdown.map(({ label: l, score: s }) => (
            <div key={l}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-400">{l}</span>
                <span className="text-[10px] font-semibold text-gray-600">{s}</span>
              </div>
              <div className="h-1 rounded-full bg-gray-100">
                <div className="h-1 rounded-full" style={{ width: `${s}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Supplement Facts Label ────────────────────────────────────────────────────
function SupplementFactsTab({ formulation }: { formulation: Formulation }) {
  const [copied, setCopied] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);

  const servingSize = formulation.serving_size || (formulation.capsules_per_serving ? `${formulation.capsules_per_serving} capsule${formulation.capsules_per_serving > 1 ? "s" : ""}` : "1 serving");

  // Compute % DV for common vitamins/minerals
  const DV_MAP: Record<string, { dv: number; unit: string }> = {
    "vitamin c": { dv: 90, unit: "mg" },
    "vitamin d": { dv: 20, unit: "mcg" },
    "vitamin d3": { dv: 20, unit: "mcg" },
    "vitamin e": { dv: 15, unit: "mg" },
    "vitamin k": { dv: 120, unit: "mcg" },
    "vitamin b1": { dv: 1.2, unit: "mg" },
    "thiamine": { dv: 1.2, unit: "mg" },
    "vitamin b2": { dv: 1.3, unit: "mg" },
    "riboflavin": { dv: 1.3, unit: "mg" },
    "niacin": { dv: 16, unit: "mg" },
    "vitamin b5": { dv: 5, unit: "mg" },
    "pantothenic acid": { dv: 5, unit: "mg" },
    "vitamin b6": { dv: 1.7, unit: "mg" },
    "pyridoxine": { dv: 1.7, unit: "mg" },
    "biotin": { dv: 30, unit: "mcg" },
    "vitamin b9": { dv: 400, unit: "mcg" },
    "folate": { dv: 400, unit: "mcg" },
    "folic acid": { dv: 400, unit: "mcg" },
    "vitamin b12": { dv: 2.4, unit: "mcg" },
    "calcium": { dv: 1300, unit: "mg" },
    "iron": { dv: 18, unit: "mg" },
    "magnesium": { dv: 420, unit: "mg" },
    "zinc": { dv: 11, unit: "mg" },
    "selenium": { dv: 55, unit: "mcg" },
    "iodine": { dv: 150, unit: "mcg" },
    "chromium": { dv: 35, unit: "mcg" },
    "manganese": { dv: 2.3, unit: "mg" },
    "potassium": { dv: 4700, unit: "mg" },
  };

  function getDV(ing: { name: string; dose?: string; unit?: string }): string {
    if (!ing.dose) return "†";
    const key = Object.keys(DV_MAP).find(k => ing.name.toLowerCase().includes(k));
    if (!key) return "†";
    const { dv, unit } = DV_MAP[key];
    const doseVal = parseFloat(ing.dose);
    if (isNaN(doseVal)) return "†";
    // Convert to same unit if needed
    let doseInUnit = doseVal;
    const ingUnit = (ing.unit ?? "mg").toLowerCase();
    if (ingUnit === "mcg" && unit === "mg") doseInUnit = doseVal / 1000;
    if (ingUnit === "mg" && unit === "mcg") doseInUnit = doseVal * 1000;
    if (ingUnit === "g" && unit === "mg") doseInUnit = doseVal * 1000;
    const pct = Math.round((doseInUnit / dv) * 100);
    return `${pct}%`;
  }

  function copyLabel() {
    if (!labelRef.current) return;
    const text = Array.from(labelRef.current.querySelectorAll("[data-row]"))
      .map(el => el.textContent).join("\n");
    navigator.clipboard.writeText(text ?? "").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">Supplement Facts Label</h2>
          <p className="text-[11px] text-gray-400">FDA-style panel based on your formulation data. Not for regulatory submission without review.</p>
        </div>
        <button onClick={copyLabel}
          className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 transition hover:border-black/20">
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy text"}
        </button>
      </div>

      {/* The label */}
      <div className="flex justify-center">
        <div ref={labelRef} className="w-72 border-4 border-black bg-white font-['Arial',sans-serif] text-black">
          {/* Header */}
          <div className="border-b-8 border-black px-2 pb-1">
            <p className="text-[28px] font-extrabold leading-none tracking-tight">Supplement Facts</p>
          </div>
          {/* Serving */}
          <div className="border-b border-black px-2 py-1 text-[10px]">
            <p data-row=""><span className="font-bold">Serving Size</span> {servingSize}</p>
            <p data-row=""><span className="font-bold">Servings Per Container</span> 30</p>
          </div>
          {/* Column headers */}
          <div className="border-b-4 border-black px-2 py-0.5">
            <div className="flex justify-end gap-3 text-[9px] font-bold">
              <span>Amount Per Serving</span>
              <span>% Daily Value</span>
            </div>
          </div>
          {/* Ingredients */}
          {formulation.ingredients.map((ing, i) => (
            <div key={ing.id} data-row="" className={cn("flex items-baseline justify-between px-2 py-0.5 text-[10px]", i < formulation.ingredients.length - 1 ? "border-b border-gray-300" : "")}>
              <span className="font-bold pr-2 flex-1">{ing.name}</span>
              <div className="flex items-baseline gap-3 shrink-0">
                <span>{ing.dose ? `${ing.dose}${ing.unit ? ` ${ing.unit}` : ""}` : "—"}</span>
                <span className="w-8 text-right">{getDV(ing)}</span>
              </div>
            </div>
          ))}
          {/* DV footnote */}
          <div className="border-t-4 border-black px-2 py-1 text-[9px]">
            <p>† Daily Value not established.</p>
          </div>
          {/* Other ingredients */}
          {formulation.excipients && formulation.excipients.length > 0 && (
            <div className="border-t border-black px-2 py-1 text-[9px]">
              <p><span className="font-bold">Other Ingredients:</span> {formulation.excipients.map(e => e.name).join(", ")}.</p>
            </div>
          )}
          {/* Disclaimer */}
          <div className="border-t border-black px-2 py-1 text-[8px] leading-tight">
            <p>These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({
  formulation,
  onIngredientRefreshed,
}: {
  formulation: Formulation;
  onIngredientRefreshed: (updated: FormulationIngredient) => void;
}) {
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; dose: string; unit: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveEdit(ingId: string, formulationId: string) {
    if (!editDraft) return;
    setSaving(true);
    try {
      const updated = formulation.ingredients.map(i =>
        i.id === ingId ? { ...i, name: editDraft.name, dose: editDraft.dose, unit: editDraft.unit } : i
      );
      const res = await fetch(`/api/formulations/${formulationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: updated }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onIngredientRefreshed({ ...formulation.ingredients.find(i => i.id === ingId)!, name: editDraft.name, dose: editDraft.dose, unit: editDraft.unit });
      setEditingId(null);
      setEditDraft(null);
    } catch {
      // silently fail for now
    } finally {
      setSaving(false);
    }
  }

  function parseClinicalRange(range: string | undefined): { min: number; max: number; unit: string } | null {
    if (!range) return null;
    const m = range.match(/(\d[\d,]*)\s*[–\-]\s*(\d[\d,]*)\s*(mg|mcg|g|IU|CFU)/i);
    if (!m) return null;
    return { min: parseInt(m[1].replace(/,/g, "")), max: parseInt(m[2].replace(/,/g, "")), unit: m[3] };
  }

  async function refreshIngredient(ing: FormulationIngredient) {
    setRefreshing(ing.id);
    try {
      const res = await fetch("/api/ai/ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_id: ing.id, formulation_id: formulation.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      onIngredientRefreshed(json.ingredient);
      toast.success(`Updated evidence for ${ing.name}`);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to refresh"));
    } finally {
      setRefreshing(null);
    }
  }

  const gradeColor = (g: string | undefined) =>
    g === "A" ? "bg-emerald-100 text-emerald-700" :
    g === "B" ? "bg-amber-100 text-amber-700" :
    g === "C" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500";

  const doseColor = (d: string | undefined) =>
    d === "at_studied_dose" ? "text-emerald-600" :
    d === "below_studied_dose" ? "text-amber-600" :
    d === "above_studied_dose" ? "text-red-500" : "text-gray-400";

  const doseLabel = (d: string | undefined) =>
    d === "at_studied_dose" ? "at dose" :
    d === "below_studied_dose" ? "below dose" :
    d === "above_studied_dose" ? "above dose" : "—";

  return (
    <div className="space-y-4">
      {/* Specs */}
      {[formulation.description, formulation.target_dose, formulation.serving_size, formulation.capsule_size, formulation.capsules_per_serving, formulation.target_population].some(Boolean) && (
        <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/[0.05] px-5 py-3.5">
            <h2 className="text-[13px] font-semibold text-gray-900">Specifications</h2>
          </div>
          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            {([
              ["Description", formulation.description],
              ["Target population", formulation.target_population],
              ["Target dose", formulation.target_dose],
              ["Serving size", formulation.serving_size],
              ["Capsule size", formulation.capsule_size],
              ["Capsules / serving", formulation.capsules_per_serving != null ? String(formulation.capsules_per_serving) : null],
            ] as [string, string | null | undefined][]).filter(([, v]) => v != null && String(v).length > 0).map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</dt>
                <dd className="mt-1 text-[13px] text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Ingredients with evidence, form recs, PubMed links */}
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">
            Ingredients
            <span className="ml-2 font-mono text-[11px] text-gray-400">{formulation.ingredients.length}</span>
          </h2>
          <p className="text-[11px] text-gray-400">
            Click <Sparkles className="inline size-3 text-brand" /> to refresh AI evidence + PubMed citations
          </p>
        </div>
        {formulation.ingredients.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-gray-400">No ingredients yet.</p>
        ) : (
          <ul className="divide-y divide-black/[0.04]">
            {formulation.ingredients.map((ing) => (
              <li key={ing.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  {editingId === ing.id && editDraft ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="text"
                          value={editDraft.name}
                          onChange={e => setEditDraft(d => ({ ...d!, name: e.target.value }))}
                          className="flex-1 min-w-32 h-8 rounded-lg border border-brand/30 bg-white px-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                          placeholder="Ingredient name"
                        />
                        <input
                          type="text"
                          value={editDraft.dose}
                          onChange={e => setEditDraft(d => ({ ...d!, dose: e.target.value }))}
                          className="w-20 h-8 rounded-lg border border-brand/30 bg-white px-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                          placeholder="Dose"
                        />
                        <select
                          value={editDraft.unit}
                          onChange={e => setEditDraft(d => ({ ...d!, unit: e.target.value }))}
                          className="h-8 rounded-lg border border-brand/30 bg-white px-2 text-[13px] outline-none focus:border-brand"
                        >
                          {["mg","mcg","g","IU","CFU","mL","%DV"].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(ing.id, formulation.id)}
                          disabled={saving}
                          className="flex items-center gap-1 rounded-md bg-brand px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                          Save
                        </button>
                        <button type="button" onClick={() => { setEditingId(null); setEditDraft(null); }}
                          className="rounded-md border border-black/[0.08] px-3 py-1 text-[11px] text-gray-500 hover:text-gray-900">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ing.evidence_grade && (
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", gradeColor(ing.evidence_grade))}>
                            {ing.evidence_grade}
                          </span>
                        )}
                        <p className="text-[13px] font-medium text-gray-900">{ing.name || "—"}</p>
                        <button
                          type="button"
                          onClick={() => { setEditingId(ing.id); setEditDraft({ name: ing.name, dose: ing.dose ?? "", unit: ing.unit ?? "mg" }); }}
                          className="rounded p-0.5 text-gray-300 transition hover:bg-gray-100 hover:text-brand"
                          title="Edit inline"
                        >
                          <svg className="size-3" viewBox="0 0 16 16" fill="currentColor"><path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.609zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81 3.09 11.47a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.25.25 0 00.108-.064L11.19 6.25z"/></svg>
                        </button>
                        <p className="font-mono text-[12px] text-gray-400">
                          {ing.dose ? `${ing.dose}${ing.unit ? ` ${ing.unit}` : ""}` : "—"}
                        </p>
                        {ing.dose_assessment && (
                          <span className={cn("text-[11px] font-medium", doseColor(ing.dose_assessment))}>
                            {doseLabel(ing.dose_assessment)}
                          </span>
                        )}
                      </div>
                      {ing.clinical_dose_range && (
                        <p className="mt-1 text-[11px] text-gray-400">Clinical range: {ing.clinical_dose_range}</p>
                      )}
                      {/* Dose bar */}
                      {(() => {
                        const cr = parseClinicalRange(ing.clinical_dose_range);
                        const dose = ing.dose ? parseFloat(ing.dose) : null;
                        if (!cr || dose === null || isNaN(dose)) return null;
                        const total = cr.max - cr.min;
                        const pct = total > 0 ? Math.max(2, Math.min(100, ((dose - cr.min) / total) * 100)) : 50;
                        const barColor = ing.dose_assessment === "at_studied_dose" ? "#10b981"
                          : ing.dose_assessment === "below_studied_dose" ? "#f59e0b"
                          : ing.dose_assessment === "above_studied_dose" ? "#ef4444"
                          : "#5b6ee1";
                        return (
                          <div className="mt-2 space-y-0.5">
                            <div className="relative h-1.5 rounded-full bg-gray-100">
                              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-300">
                              <span>{cr.min}{cr.unit}</span>
                              <span>{cr.max}{cr.unit}</span>
                            </div>
                          </div>
                        );
                      })()}
                      {ing.rationale && (
                        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{ing.rationale}</p>
                      )}
                      {/* Form recommendation */}
                      {ing.form_recommendation && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                          <Zap className="mt-0.5 size-3 shrink-0 text-amber-600" />
                          <p className="text-[11px] text-amber-800">
                            <span className="font-semibold">Better form available:</span> {ing.form_recommendation}
                            {ing.preferred_form && <span className="ml-1 font-medium text-amber-700">→ {ing.preferred_form}</span>}
                          </p>
                        </div>
                      )}
                      {/* PubMed citations */}
                      {ing.pubmed_ids && ing.pubmed_ids.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ing.pubmed_ids.map((pmid, i) => (
                            <a
                              key={pmid}
                              href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={ing.pubmed_titles?.[i] ?? pmid}
                              className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-100 transition"
                            >
                              PMID {pmid}
                              <ExternalLink className="size-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => refreshIngredient(ing)}
                    disabled={refreshing === ing.id}
                    title="Refresh AI evidence + PubMed citations"
                    className="shrink-0 flex size-7 items-center justify-center rounded-md border border-transparent text-gray-300 transition hover:border-brand/20 hover:bg-brand/[0.05] hover:text-brand disabled:opacity-40"
                  >
                    {refreshing === ing.id
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <Sparkles className="size-3.5" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Excipients */}
      {formulation.excipients && formulation.excipients.length > 0 && (
        <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/[0.05] px-5 py-3.5">
            <h2 className="text-[13px] font-semibold text-gray-900">Excipients</h2>
          </div>
          <ul className="divide-y divide-black/[0.04]">
            {formulation.excipients.map(exc => (
              <li key={exc.id} className="flex items-center gap-4 px-5 py-3">
                <p className="flex-1 text-[13px] text-gray-900">{exc.name}</p>
                <p className="text-[11px] text-gray-400">{exc.function}</p>
                {exc.amount_pct != null && (
                  <p className="font-mono text-[12px] text-gray-500">{exc.amount_pct}%</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fill weight calculator */}
      <FillWeightCalculator formulation={formulation} />

      {/* Cost estimator */}
      <CostEstimator formulation={formulation} />

      {/* Notes */}
      {formulation.notes && (
        <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/[0.05] px-5 py-3.5">
            <h2 className="text-[13px] font-semibold text-gray-900">Notes</h2>
          </div>
          <p className="whitespace-pre-wrap px-5 py-4 text-[13px] leading-relaxed text-gray-700">
            {formulation.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Research Tab ──────────────────────────────────────────────────────────────
function ResearchTab({ formulation }: { formulation: Formulation }) {
  const [streaming, setStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function analyze() {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStreaming(true);
    setContent("");
    setError(null);
    setStarted(true);

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: formulation.name,
          type: "formulation",
          context: {
            name: formulation.name,
            description: formulation.description,
            ingredients: formulation.ingredients,
            target_dose: formulation.target_dose,
            serving_size: formulation.serving_size,
            capsule_size: formulation.capsule_size,
            capsules_per_serving: formulation.capsules_per_serving,
            notes: formulation.notes,
          },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }
    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError(getErrorMessage(e, "Research failed"));
      }
    } finally {
      setStreaming(false);
    }
  }

  if (!started) {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-gray-50">
            <svg className="size-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-gray-900">AI Formulation Analysis</p>
          <p className="mt-1.5 max-w-sm mx-auto text-[12px] leading-relaxed text-gray-500">
            Get a comprehensive evidence-based review of your entire stack — dose assessment, synergies, evidence gaps, and optimization suggestions.
          </p>
          <button
            onClick={analyze}
            className="mt-5 flex items-center gap-1.5 rounded-lg bg-gray-950 px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 mx-auto"
          >
            Analyze formulation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-brand/10">
            <svg className="size-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-gray-900">Formulation Analysis</p>
          {streaming && (
            <span className="flex items-center gap-1 text-[11px] text-brand">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              Analyzing
            </span>
          )}
        </div>
        {!streaming && content && (
          <button
            onClick={analyze}
            className="flex items-center gap-1 text-[11px] text-gray-400 transition hover:text-gray-700"
          >
            <RotateCcw className="size-3" />
            Re-analyze
          </button>
        )}
      </div>
      <div className="px-5 py-5">
        {error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <StreamingMarkdown content={content} />
            {streaming && !content && (
              <div className="flex items-center gap-2 text-[12px] text-gray-400">
                <Loader2 className="size-3.5 animate-spin" />
                Retrieving clinical evidence…
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Interactions Tab ─────────────────────────────────────────────────────────
interface InteractionSynergy {
  ingredients: string[];
  type: "absorption" | "pharmacodynamic" | "metabolic";
  effect: string;
  magnitude: "strong" | "moderate" | "mild";
  mechanism: string;
}
interface InteractionAntagonism {
  ingredients: string[];
  type: "absorption" | "pharmacodynamic" | "metabolic" | "safety";
  effect: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
}
interface InteractionTiming {
  ingredient: string;
  timing: string;
}
interface InteractionResult {
  overall_assessment: string;
  synergies: InteractionSynergy[];
  antagonisms: InteractionAntagonism[];
  timing_recommendations: InteractionTiming[];
  population_notes: string;
}

function InteractionsTab({ formulation }: { formulation: Formulation }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulation_id: formulation.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Interaction analysis failed");
      setResult(json as InteractionResult);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Interaction analysis failed"));
    } finally {
      setLoading(false);
    }
  }

  const magnitudeColor = (m: string) =>
    m === "strong" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
    m === "moderate" ? "bg-blue-100 text-blue-700 border-blue-200" :
    "bg-gray-100 text-gray-600 border-gray-200";

  const severityColor = (s: string) =>
    s === "high" ? "bg-red-100 text-red-700 border-red-200" :
    s === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
    "bg-gray-100 text-gray-600 border-gray-200";

  if (!result && !loading) {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-gray-50">
            <Zap className="size-5 text-brand" />
          </div>
          <p className="text-[13px] font-semibold text-gray-900">Ingredient Interaction Analysis</p>
          <p className="mt-1.5 max-w-sm mx-auto text-[12px] leading-relaxed text-gray-500">
            Analyze all ingredient pairs for absorption, metabolism, pharmacodynamic, and safety interactions — with timing recommendations.
          </p>
          <button
            onClick={runAnalysis}
            disabled={formulation.ingredients.length < 2}
            className="mt-5 flex items-center gap-1.5 rounded-lg bg-gray-950 px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40 mx-auto"
          >
            <Zap className="size-3.5" />
            Analyze interactions
          </button>
          {formulation.ingredients.length < 2 && (
            <p className="mt-2 text-[11px] text-gray-400">Add at least 2 ingredients to run interaction analysis.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-10 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <Loader2 className="size-5 animate-spin text-brand mx-auto" />
          <p className="mt-3 text-[13px] text-gray-500">Analyzing ingredient interactions…</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-[13px] font-medium text-red-700">Analysis failed</p>
          <p className="mt-1 text-[12px] text-red-500">{error}</p>
        </div>
      )}

      {result && (
        <>
          {/* Interaction matrix */}
          {(result.synergies.length > 0 || result.antagonisms.length > 0) && formulation.ingredients.length >= 2 && (
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <h2 className="text-[13px] font-semibold text-gray-900">Interaction Matrix</h2>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  <span className="inline-flex items-center gap-1 mr-3"><span className="size-2.5 rounded-sm bg-emerald-100 border border-emerald-200 inline-block" /> Synergy</span>
                  <span className="inline-flex items-center gap-1 mr-3"><span className="size-2.5 rounded-sm bg-red-100 border border-red-200 inline-block" /> Concern</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-sm bg-gray-100 border border-gray-200 inline-block" /> Neutral</span>
                </p>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="text-[10px]">
                  <thead>
                    <tr>
                      <th className="w-24 pr-2" />
                      {formulation.ingredients.map(col => (
                        <th key={col.id} className="px-1 pb-2 font-medium text-gray-500 text-center max-w-[60px]">
                          <div className="truncate max-w-[56px]" title={col.name}>{col.name.split(" ")[0]}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formulation.ingredients.map(row => (
                      <tr key={row.id}>
                        <td className="pr-2 py-0.5 font-medium text-gray-600 max-w-[96px]">
                          <div className="truncate max-w-[90px] text-right" title={row.name}>{row.name.split(" ")[0]}</div>
                        </td>
                        {formulation.ingredients.map(col => {
                          if (row.id === col.id) return (
                            <td key={col.id} className="px-1 py-0.5">
                              <div className="size-8 rounded-md bg-gray-950/5" />
                            </td>
                          );
                          const synergy = result.synergies.find(s =>
                            s.ingredients.some(n => n.toLowerCase().includes(row.name.split(" ")[0].toLowerCase())) &&
                            s.ingredients.some(n => n.toLowerCase().includes(col.name.split(" ")[0].toLowerCase()))
                          );
                          const antagonism = result.antagonisms.find(a =>
                            a.ingredients.some(n => n.toLowerCase().includes(row.name.split(" ")[0].toLowerCase())) &&
                            a.ingredients.some(n => n.toLowerCase().includes(col.name.split(" ")[0].toLowerCase()))
                          );
                          const cls = synergy
                            ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                            : antagonism
                            ? "bg-red-100 border-red-200 text-red-700"
                            : "bg-gray-50 border-gray-200 text-gray-400";
                          const symbol = synergy
                            ? (synergy.magnitude === "strong" ? "+++" : synergy.magnitude === "moderate" ? "++" : "+")
                            : antagonism
                            ? (antagonism.severity === "high" ? "!!!" : antagonism.severity === "medium" ? "!!" : "!")
                            : "·";
                          return (
                            <td key={col.id} className="px-1 py-0.5">
                              <div
                                title={synergy ? `${synergy.effect}` : antagonism ? `${antagonism.effect}` : "No known interaction"}
                                className={cn("size-8 rounded-md border flex items-center justify-center font-bold cursor-default", cls)}
                              >
                                {symbol}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Overall assessment */}
          <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
              <h2 className="text-[13px] font-semibold text-gray-900">Overall Assessment</h2>
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition"
              >
                <RotateCcw className="size-3" />
                Re-run
              </button>
            </div>
            <p className="px-5 py-4 text-[13px] leading-relaxed text-gray-700">{result.overall_assessment}</p>
            {result.population_notes && (
              <div className="mx-5 mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-[12px] text-blue-700">
                <span className="font-semibold">Population note:</span> {result.population_notes}
              </div>
            )}
          </div>

          {/* Synergies */}
          {result.synergies.length > 0 && (
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <h2 className="text-[13px] font-semibold text-gray-900">
                  Synergies
                  <span className="ml-2 font-mono text-[11px] text-gray-400">{result.synergies.length}</span>
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-400">Positive interactions between ingredient pairs.</p>
              </div>
              <ul className="divide-y divide-black/[0.04]">
                {result.synergies.map((s, i) => (
                  <li key={i} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className={cn("shrink-0 mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", magnitudeColor(s.magnitude))}>
                        {s.magnitude}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.ingredients.map((ing, j) => (
                            <span key={ing}>
                              <span className="text-[12px] font-semibold text-gray-900">{ing}</span>
                              {j < s.ingredients.length - 1 && <span className="mx-1 text-[11px] text-gray-400">+</span>}
                            </span>
                          ))}
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{s.type}</span>
                        </div>
                        <p className="mt-1 text-[12px] text-gray-700">{s.effect}</p>
                        <p className="mt-1 text-[11px] text-gray-400">Mechanism: {s.mechanism}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Antagonisms */}
          {result.antagonisms.length > 0 && (
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <h2 className="text-[13px] font-semibold text-gray-900">
                  Concerns
                  <span className="ml-2 font-mono text-[11px] text-gray-400">{result.antagonisms.length}</span>
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-400">Interference, absorption blockers, or safety flags.</p>
              </div>
              <ul className="divide-y divide-black/[0.04]">
                {result.antagonisms.map((a, i) => (
                  <li key={i} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <span className={cn("shrink-0 mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", severityColor(a.severity))}>
                        {a.severity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {a.ingredients.map((ing, j) => (
                            <span key={ing}>
                              <span className="text-[12px] font-semibold text-gray-900">{ing}</span>
                              {j < a.ingredients.length - 1 && <span className="mx-1 text-[11px] text-gray-400">+</span>}
                            </span>
                          ))}
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{a.type}</span>
                        </div>
                        <p className="mt-1 text-[12px] text-gray-700">{a.effect}</p>
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                          <p className="text-[11px] text-amber-800">
                            <span className="font-semibold">Recommendation:</span> {a.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timing recommendations */}
          {result.timing_recommendations.length > 0 && (
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <h2 className="text-[13px] font-semibold text-gray-900">Timing Recommendations</h2>
              </div>
              <ul className="divide-y divide-black/[0.04]">
                {result.timing_recommendations.map((t, i) => (
                  <li key={i} className="flex items-start gap-4 px-5 py-3">
                    <p className="min-w-0 w-32 shrink-0 text-[12px] font-semibold text-gray-900 truncate">{t.ingredient}</p>
                    <p className="text-[12px] text-gray-600">{t.timing}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.synergies.length === 0 && result.antagonisms.length === 0 && (
            <div className="rounded-xl border border-black/[0.06] bg-white px-5 py-8 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[13px] text-gray-500">No significant interactions found between the ingredients in this stack.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Compliance Tab ────────────────────────────────────────────────────────────
function ComplianceTab({
  formulation,
  onScoreUpdate,
  onFormulationUpdate,
}: {
  formulation: Formulation;
  onScoreUpdate: (score: number) => void;
  onFormulationUpdate: (updated: Formulation) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyingFix, setApplyingFix] = useState<number | null>(null);

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulation_id: formulation.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Compliance check failed");
      setResult(json as ComplianceResult);
      if (typeof json.score === "number") onScoreUpdate(json.score);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Compliance check failed"));
    } finally {
      setLoading(false);
    }
  }

  async function applyFix(issue: ComplianceIssue, idx: number) {
    if (!issue.fix) return;
    setApplyingFix(idx);
    try {
      // Auto-fix: if a specific ingredient is named, update its notes to reflect the fix
      // Otherwise, append the fix recommendation to the formulation's notes
      let updatedNotes = formulation.notes ?? "";
      const fixNote = `[Compliance fix] ${issue.issue}: ${issue.fix}`;
      updatedNotes = updatedNotes ? `${updatedNotes}\n\n${fixNote}` : fixNote;

      // If the fix references a specific ingredient, also update that ingredient's notes
      let updatedIngredients = formulation.ingredients;
      if (issue.ingredient) {
        updatedIngredients = formulation.ingredients.map(ing =>
          ing.name.toLowerCase().includes(issue.ingredient!.toLowerCase())
            ? { ...ing, notes: ing.notes ? `${ing.notes}; ${issue.fix}` : issue.fix }
            : ing
        );
      }

      const res = await fetch(`/api/formulations/${formulation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updatedNotes, ingredients: updatedIngredients }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to apply fix");
      onFormulationUpdate(json.formulation);
      toast.success("Fix applied to formulation");

      // Remove fixed issue from result
      setResult(r => r ? { ...r, issues: r.issues.filter((_, i) => i !== idx) } : r);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to apply fix"));
    } finally {
      setApplyingFix(null);
    }
  }

  const severityColor = (s: string) =>
    s === "high" ? "text-red-600 bg-red-50 border-red-100" :
    s === "medium" ? "text-amber-600 bg-amber-50 border-amber-100" :
    "text-blue-600 bg-blue-50 border-blue-100";

  const scoreColor = (n: number) =>
    n >= 90 ? "text-emerald-600" : n >= 70 ? "text-amber-600" : "text-red-600";

  if (!result && !loading) {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-gray-50">
            <ShieldCheck className="size-5 text-brand" />
          </div>
          <p className="text-[13px] font-semibold text-gray-900">FDA Compliance Review</p>
          <p className="mt-1.5 max-w-sm mx-auto text-[12px] leading-relaxed text-gray-500">
            Analyze your formulation against DSHEA guidelines — structure/function claims, ingredient safety, prohibited disease claims, and required disclaimers.
          </p>
          <button
            onClick={runCheck}
            className="mt-5 flex items-center gap-1.5 rounded-lg bg-gray-950 px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 mx-auto"
          >
            <ShieldCheck className="size-3.5" />
            Run compliance check
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-10 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <Loader2 className="size-5 animate-spin text-brand mx-auto" />
          <p className="mt-3 text-[13px] text-gray-500">Running compliance analysis…</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-[13px] font-medium text-red-700">Compliance check failed</p>
          <p className="mt-1 text-[12px] text-red-500">{error}</p>
        </div>
      )}

      {result && (
        <>
          {/* Score card */}
          <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
              <h2 className="text-[13px] font-semibold text-gray-900">Compliance Score</h2>
              <button
                onClick={runCheck}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition"
              >
                <RotateCcw className="size-3" />
                Re-run
              </button>
            </div>
            <div className="flex items-center gap-6 p-5">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-gray-100">
                <span className={cn("font-mono text-2xl font-bold", scoreColor(result.score))}>
                  {result.score}
                </span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-900">
                  {result.score >= 90 ? "Fully compliant" :
                   result.score >= 70 ? "Minor issues" :
                   result.score >= 50 ? "Requires review" : "Major concerns"}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{result.summary}</p>
                {result.review_disclaimer && (
                  <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
                    {result.review_disclaimer}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Issues with auto-fix */}
          {result.issues.length > 0 && (
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <h2 className="text-[13px] font-semibold text-gray-900">
                  Issues
                  <span className="ml-2 font-mono text-[11px] text-gray-400">{result.issues.length}</span>
                </h2>
                <p className="mt-0.5 text-[11px] text-gray-400">Click &quot;Apply fix&quot; to automatically patch the formulation notes.</p>
              </div>
              <ul className="divide-y divide-black/[0.04] p-2">
                {result.issues.map((issue, i) => (
                  <li key={i} className="rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 mt-0.5", severityColor(issue.severity))}>
                        {issue.severity}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900">{issue.issue}</p>
                        {issue.ingredient && (
                          <p className="mt-0.5 text-[11px] text-brand">{issue.ingredient}</p>
                        )}
                        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{issue.detail}</p>
                        {issue.cfr_citation && (
                          <p className="mt-1 font-mono text-[10px] text-gray-400">{issue.cfr_citation}</p>
                        )}
                        {issue.fix && (
                          <div className="mt-2 flex items-center gap-2">
                            <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1 flex-1">
                              Fix: {issue.fix}
                            </p>
                            <button
                              type="button"
                              onClick={() => applyFix(issue, i)}
                              disabled={applyingFix === i}
                              className="shrink-0 flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {applyingFix === i ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                              Apply fix
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Claims */}
          <div className="grid gap-4 sm:grid-cols-2">
            {result.compliant_claims.length > 0 && (
              <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="border-b border-black/[0.05] px-5 py-3.5">
                  <h2 className="text-[13px] font-semibold text-gray-900">Defensible Claims</h2>
                </div>
                <ul className="space-y-2 p-4">
                  {result.compliant_claims.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                      <span className="mt-0.5 size-4 shrink-0 rounded-full bg-emerald-100 text-center text-[9px] font-bold text-emerald-600 leading-4">✓</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.risky_claims.length > 0 && (
              <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="border-b border-black/[0.05] px-5 py-3.5">
                  <h2 className="text-[13px] font-semibold text-gray-900">Claims to Avoid</h2>
                </div>
                <ul className="space-y-2 p-4">
                  {result.risky_claims.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                      <span className="mt-0.5 size-4 shrink-0 rounded-full bg-red-100 text-center text-[9px] font-bold text-red-600 leading-4">✗</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <h2 className="text-[13px] font-semibold text-gray-900">Recommendations</h2>
              </div>
              <ul className="space-y-2.5 p-5">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[12px] text-gray-700">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Handoff Tab ──────────────────────────────────────────────────────────────
const CERTIFICATIONS = ["cGMP", "NSF Certified", "Informed Sport", "Kosher", "Halal", "Organic"];
const TIMELINES = ["ASAP (< 4 weeks)", "3 months", "6 months", "12 months", "Flexible"];

interface RFQState {
  moq: string;
  targetCost: string;
  timeline: string;
  certifications: string[];
  packaging: string;
  requirements: string;
}

function HandoffTab({ formulation }: { formulation: Formulation }) {
  const [rfq, setRfq] = useState<RFQState>({
    moq: "", targetCost: "", timeline: TIMELINES[1],
    certifications: [], packaging: "", requirements: "",
  });
  const [streaming, setStreaming] = useState(false);
  const [brief, setBrief] = useState("");
  const [briefError, setBriefError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [shareLoading, setShareLoading] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Collaborators state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collabLoading, setCollabLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/formulations/${formulation.id}/collaborators`)
      .then(r => r.json())
      .then(j => { if (!cancelled && j.collaborators) setCollaborators(j.collaborators); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCollabLoading(false); });
    return () => { cancelled = true; };
  }, [formulation.id]);

  function toggleCert(cert: string) {
    setRfq(r => ({
      ...r,
      certifications: r.certifications.includes(cert)
        ? r.certifications.filter(c => c !== cert)
        : [...r.certifications, cert],
    }));
  }

  async function generateBrief() {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStreaming(true);
    setBrief("");
    setBriefError(null);
    setStarted(true);

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Manufacturer brief: ${formulation.name}`,
          type: "formulation",
          context: {
            name: formulation.name,
            description: formulation.description,
            ingredients: formulation.ingredients,
            target_dose: formulation.target_dose,
            serving_size: formulation.serving_size,
            capsule_size: formulation.capsule_size,
            capsules_per_serving: formulation.capsules_per_serving,
            product_type: formulation.product_type,
            notes: [
              formulation.notes,
              "",
              "--- RFQ Requirements ---",
              rfq.moq && `MOQ: ${rfq.moq}`,
              rfq.targetCost && `Target cost per unit: ${rfq.targetCost}`,
              rfq.timeline && `Timeline: ${rfq.timeline}`,
              rfq.certifications.length > 0 && `Required certifications: ${rfq.certifications.join(", ")}`,
              rfq.packaging && `Packaging: ${rfq.packaging}`,
              rfq.requirements && `Special requirements: ${rfq.requirements}`,
            ].filter(Boolean).join("\n"),
          },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setBrief(accumulated);
      }
    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setBriefError(getErrorMessage(e, "Failed to generate brief"));
      }
    } finally {
      setStreaming(false);
    }
  }

  async function generateShareLink() {
    setShareLoading(true);
    setShareError(null);
    try {
      const res = await fetch(`/api/formulations/${formulation.id}/share`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create share link");
      setShareToken(json.token);
    } catch (e: unknown) {
      setShareError(getErrorMessage(e, "Failed to create share link"));
    } finally {
      setShareLoading(false);
    }
  }

  const shareUrl = shareToken
    ? (typeof window !== "undefined" ? `${window.location.origin}/f/${shareToken}` : `/f/${shareToken}`)
    : "";

  function copyShare() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/formulations/${formulation.id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to invite");
      setCollaborators(c => {
        const exists = c.find(x => x.invited_email === json.collaborator.invited_email);
        if (exists) return c.map(x => x.invited_email === json.collaborator.invited_email ? json.collaborator : x);
        return [...c, json.collaborator];
      });
      setInviteEmail("");
      toast.success(`Invited ${json.collaborator.invited_email}`);
    } catch (e: unknown) {
      setInviteError(getErrorMessage(e, "Failed to invite"));
    } finally {
      setInviting(false);
    }
  }

  async function removeCollaborator(email: string) {
    try {
      await fetch(`/api/formulations/${formulation.id}/collaborators?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      setCollaborators(c => c.filter(x => x.invited_email !== email));
      toast.success("Collaborator removed");
    } catch {
      toast.error("Failed to remove collaborator");
    }
  }

  const inputClass = "h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15";
  const labelClass = "text-[11px] font-semibold uppercase tracking-widest text-gray-400";

  return (
    <div className="space-y-4">
      {/* Structured brief summary */}
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">Formulation Summary</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">Structured spec sheet for manufacturer outreach.</p>
        </div>
        <div className="p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className={labelClass}>Product name</p>
              <p className="mt-1 text-[13px] font-medium text-gray-900">{formulation.name}</p>
            </div>
            {formulation.product_type && (
              <div>
                <p className={labelClass}>Format</p>
                <p className="mt-1 text-[13px] text-gray-700 capitalize">{formulation.product_type}</p>
              </div>
            )}
            {formulation.serving_size && (
              <div>
                <p className={labelClass}>Serving size</p>
                <p className="mt-1 text-[13px] text-gray-700">{formulation.serving_size}</p>
              </div>
            )}
            {formulation.target_dose && (
              <div>
                <p className={labelClass}>Total actives / serving</p>
                <p className="mt-1 text-[13px] text-gray-700">{formulation.target_dose}</p>
              </div>
            )}
            {formulation.compliance_score != null && (
              <div>
                <p className={labelClass}>Compliance score</p>
                <p className={cn("mt-1 text-[13px] font-semibold", formulation.compliance_score >= 90 ? "text-emerald-600" : formulation.compliance_score >= 70 ? "text-amber-600" : "text-red-600")}>
                  {formulation.compliance_score}/100
                </p>
              </div>
            )}
          </div>

          {formulation.ingredients.length > 0 && (
            <div className="mt-5">
              <p className={cn(labelClass, "mb-3")}>Ingredient stack ({formulation.ingredients.length})</p>
              <div className="overflow-hidden rounded-lg border border-black/[0.06]">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-black/[0.05] bg-gray-50">
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-widest text-gray-400 text-[10px]">Ingredient</th>
                      <th className="px-4 py-2 text-right font-semibold uppercase tracking-widest text-gray-400 text-[10px]">Dose</th>
                      <th className="hidden px-4 py-2 text-center font-semibold uppercase tracking-widest text-gray-400 text-[10px] sm:table-cell">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {formulation.ingredients.map(ing => (
                      <tr key={ing.id}>
                        <td className="px-4 py-2.5 text-gray-900">{ing.name}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-500">
                          {ing.dose ? `${ing.dose} ${ing.unit ?? "mg"}` : "—"}
                        </td>
                        <td className="hidden px-4 py-2.5 text-center sm:table-cell">
                          {ing.evidence_grade ? (
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              ing.evidence_grade === "A" ? "bg-emerald-100 text-emerald-700" :
                              ing.evidence_grade === "B" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-600"
                            )}>
                              {ing.evidence_grade}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RFQ */}
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">Request for Quote</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">Provide manufacturing constraints to include in the brief.</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>MOQ</label>
            <input type="text" value={rfq.moq} onChange={e => setRfq(r => ({ ...r, moq: e.target.value }))} placeholder="e.g. 1,000 units" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Target cost / unit</label>
            <input type="text" value={rfq.targetCost} onChange={e => setRfq(r => ({ ...r, targetCost: e.target.value }))} placeholder="e.g. $2.50/unit" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Timeline</label>
            <select value={rfq.timeline} onChange={e => setRfq(r => ({ ...r, timeline: e.target.value }))} className={inputClass}>
              {TIMELINES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Packaging format</label>
            <input type="text" value={rfq.packaging} onChange={e => setRfq(r => ({ ...r, packaging: e.target.value }))} placeholder="e.g. 60-count HDPE bottle" className={inputClass} />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className={labelClass}>Certifications needed</label>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATIONS.map(c => {
                const on = rfq.certifications.includes(c);
                return (
                  <button type="button" key={c} onClick={() => toggleCert(c)}
                    className={cn("rounded-full border px-3 py-1 text-[11px] font-medium transition",
                      on ? "border-brand bg-brand/[0.08] text-brand" : "border-black/[0.08] bg-white text-gray-500 hover:border-black/20 hover:text-gray-900"
                    )}>
                    {on && <Check className="mr-1 inline size-3" />}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className={labelClass}>Special requirements</label>
            <textarea value={rfq.requirements} onChange={e => setRfq(r => ({ ...r, requirements: e.target.value }))} rows={3}
              placeholder="e.g. Vegan capsule, no titanium dioxide, custom blend label…"
              className="w-full resize-none rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15" />
          </div>
        </div>
      </div>

      {/* Brief generator */}
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-brand/10">
              <Factory className="size-3.5 text-brand" />
            </div>
            <p className="text-[13px] font-semibold text-gray-900">AI Manufacturer Brief</p>
            {streaming && (
              <span className="flex items-center gap-1 text-[11px] text-brand">
                <span className="size-1.5 animate-pulse rounded-full bg-brand" />
                Generating
              </span>
            )}
          </div>
          {!streaming && brief && (
            <button onClick={generateBrief} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700">
              <RotateCcw className="size-3" />
              Re-generate
            </button>
          )}
        </div>
        <div className="px-5 py-5">
          {!started && !streaming ? (
            <div className="py-10 text-center">
              <p className="text-[12px] leading-relaxed text-gray-500 max-w-sm mx-auto">
                Generate a manufacturer-ready brief combining your formulation, ingredient details, and RFQ requirements.
              </p>
              <button onClick={generateBrief}
                className="mt-4 mx-auto flex items-center gap-1.5 rounded-lg bg-gray-950 px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800">
                <FileText className="size-3.5" />
                Generate manufacturer brief
              </button>
            </div>
          ) : briefError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-[12px] text-red-600">{briefError}</div>
          ) : (
            <>
              <StreamingMarkdown content={brief} />
              {streaming && !brief && (
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <Loader2 className="size-3.5 animate-spin" />
                  Assembling brief…
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Share link */}
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-brand/10">
              <Link2 className="size-3.5 text-brand" />
            </div>
            <p className="text-[13px] font-semibold text-gray-900">Public Share Link</p>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Anyone with this link can view a read-only version of this formulation.</p>
        </div>
        <div className="p-5">
          {!shareToken ? (
            <button onClick={generateShareLink} disabled={shareLoading}
              className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-50">
              {shareLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
              Generate share link
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input type="text" value={shareUrl} readOnly
                className="h-9 flex-1 rounded-lg border border-black/[0.08] bg-gray-50 px-3 font-mono text-[12px] text-gray-700 outline-none" />
              <button onClick={copyShare}
                className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02]">
                {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
          {shareError && <p className="mt-2 text-[11px] text-red-500">{shareError}</p>}
        </div>
      </div>

      {/* Collaborators */}
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-brand/10">
              <UserPlus className="size-3.5 text-brand" />
            </div>
            <p className="text-[13px] font-semibold text-gray-900">Team Collaborators</p>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Invite team members to view or edit this formulation.</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Invite form */}
          <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="h-9 flex-1 min-w-48 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as "editor" | "viewer")}
              className="h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none"
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button type="submit" disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-50">
              {inviting ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
              Invite
            </button>
          </form>
          {inviteError && <p className="text-[12px] text-red-500">{inviteError}</p>}

          {/* Collaborators list */}
          {collabLoading ? (
            <p className="text-[12px] text-gray-400">Loading…</p>
          ) : collaborators.length === 0 ? (
            <p className="text-[12px] text-gray-400">No collaborators yet. Invite your team above.</p>
          ) : (
            <ul className="divide-y divide-black/[0.04] rounded-lg border border-black/[0.06]">
              {collaborators.map(c => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                      {c.invited_email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-gray-900">{c.invited_email}</p>
                      <p className="text-[10px] text-gray-400">
                        {c.user_id ? "Active" : "Invite pending"} · {c.role === "editor" ? "Can edit" : "Can view"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCollaborator(c.invited_email)}
                    className="flex size-7 items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Version History ───────────────────────────────────────────────────────────
function VersionHistory({
  formulationId,
  onRestore,
}: {
  formulationId: string;
  onRestore: (snapshot: Formulation) => void;
}) {
  const [versions, setVersions] = useState<FormulationVersionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/formulations/${formulationId}/versions`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && Array.isArray(json.versions)) setVersions(json.versions);
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [formulationId]);

  return (
    <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="border-b border-black/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <History className="size-3.5 text-gray-400" />
          <h2 className="text-[13px] font-semibold text-gray-900">Version history</h2>
          <span className="font-mono text-[11px] text-gray-400">{versions.length}</span>
        </div>
        <p className="mt-0.5 text-[11px] text-gray-400">Snapshots saved each time you update this formulation.</p>
      </div>
      {loading ? (
        <p className="px-5 py-6 text-center text-[12px] text-gray-400">Loading…</p>
      ) : versions.length === 0 ? (
        <p className="px-5 py-6 text-center text-[12px] text-gray-400">No prior versions yet.</p>
      ) : (
        <ul className="divide-y divide-black/[0.04]">
          {versions.map(v => (
            <li key={v.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-3">
              <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-600">v{v.version}</span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-gray-900">{v.snapshot?.name ?? "Untitled"}</p>
                <p className="text-[11px] text-gray-400">
                  {new Date(v.created_at).toLocaleString()} · {Array.isArray(v.snapshot?.ingredients) ? v.snapshot.ingredients.length : 0} ingredients · {v.snapshot?.status ? STATUS_LABELS[v.snapshot.status] : "—"}
                </p>
              </div>
              <button
                onClick={() => onRestore(v.snapshot)}
                className="rounded-md border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02]"
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FormulationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [editFormKey, setEditFormKey] = useState(0);
  const [editOverrides, setEditOverrides] = useState<Partial<FormulationFormValues> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/formulations/${id}`, { cache: "no-store" });
        if (res.status === 404) { if (!cancelled) setError("Formulation not found"); return; }
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json() as { formulation: Formulation };
        if (!cancelled) setFormulation(json.formulation);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [id]);

  async function handleUpdate(values: FormulationFormValues) {
    const res = await fetch(`/api/formulations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to update");
    }
    const json = await res.json() as { formulation: Formulation };
    setFormulation(json.formulation);
    setTab("overview");
    toast.success("Formulation updated");
  }

  async function handleStatusChange(next: FormulationStatus) {
    if (!formulation || formulation.status === next) return;
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/formulations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json() as { formulation: Formulation };
      setFormulation(json.formulation);
      toast.success(`Moved to ${STATUS_LABELS[next]}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/formulations/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
      toast.success("Formulation deleted");
      router.push("/dashboard/formulations");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/formulations/${id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        if (json.limit) toast.error("Formulation limit reached. Upgrade your plan.");
        else throw new Error(json.error ?? "Failed to duplicate");
        return;
      }
      toast.success("Formulation duplicated");
      router.push(`/dashboard/formulations/${json.formulation.id}`);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to duplicate"));
    } finally {
      setDuplicating(false);
    }
  }

  function exportDossier() {
    if (!formulation) return;
    const lines = [
      `# ${formulation.name}`,
      `Status: ${STATUS_LABELS[formulation.status]}`,
      `Updated: ${new Date(formulation.updated_at).toLocaleDateString()}`,
      formulation.compliance_score != null ? `Compliance score: ${formulation.compliance_score}/100` : "",
      "",
      formulation.description ? `## Description\n${formulation.description}` : "",
      "",
      "## Specifications",
      formulation.target_dose ? `Target dose: ${formulation.target_dose}` : "",
      formulation.serving_size ? `Serving size: ${formulation.serving_size}` : "",
      formulation.capsule_size ? `Capsule size: ${formulation.capsule_size}` : "",
      formulation.capsules_per_serving != null ? `Capsules per serving: ${formulation.capsules_per_serving}` : "",
      "",
      "## Ingredient Stack",
      ...formulation.ingredients.map(i => `- ${i.name}: ${i.dose || "?"}${i.unit || " mg"}${i.evidence_grade ? ` (Grade ${i.evidence_grade})` : ""}`),
      "",
      formulation.notes ? `## Notes\n${formulation.notes}` : "",
    ].filter(l => l !== undefined).join("\n").trim();

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formulation.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-dossier.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error || !formulation) {
    return (
      <div className="py-20 text-center">
        <p className="text-[13px] font-medium text-gray-900">{error ?? "Formulation not found"}</p>
        <Link href="/dashboard/formulations" className="mt-3 inline-block text-[12px] text-brand hover:underline">
          Back to formulations
        </Link>
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "interactions", label: "Interactions" },
    { key: "research", label: "Research" },
    { key: "compliance", label: `Compliance${formulation.compliance_score != null ? ` · ${formulation.compliance_score}` : ""}` },
    { key: "label", label: "Label" },
    { key: "handoff", label: "Handoff" },
    { key: "edit", label: "Edit" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/formulations"
            className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-gray-700"
          >
            <ChevronLeft className="size-3.5" />
            Formulations
          </Link>
          <div className="mt-2 flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-gray-950">{formulation.name}</h1>
            <StatusBadge status={formulation.status} />
          </div>
          <p className="mt-1 text-[12px] text-gray-400">
            Updated {relativeDate(formulation.updated_at)}
            {formulation.compliance_score != null && ` · Compliance ${formulation.compliance_score}/100`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/formulations/${id}/print`}
            className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02]"
          >
            <FileText className="size-3.5" />
            Export PDF
          </Link>
          <button
            onClick={exportDossier}
            className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02]"
          >
            <Download className="size-3.5" />
            Export
          </button>
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02] disabled:opacity-50"
          >
            {duplicating ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
            Duplicate
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-[12px] font-medium text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mr-1">Status</span>
        {FORMULATION_STATUSES.map(s => (
          <button
            key={s}
            type="button"
            disabled={statusBusy || formulation.status === s}
            onClick={() => handleStatusChange(s)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-medium transition border",
              formulation.status === s
                ? "bg-gray-950 text-white border-gray-950"
                : "bg-white text-gray-500 border-black/[0.08] hover:border-black/20 hover:text-gray-900"
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Formula score card */}
      <FormulaScoreCard formulation={formulation} />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-black/[0.06]">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "relative px-3 py-2 text-[13px] font-medium transition",
              tab === key ? "text-gray-950" : "text-gray-400 hover:text-gray-700"
            )}
          >
            {label}
            {tab === key && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-brand" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <OverviewTab
          formulation={formulation}
          onIngredientRefreshed={updated =>
            setFormulation(f => f
              ? { ...f, ingredients: f.ingredients.map(i => i.id === updated.id ? updated : i) }
              : f
            )
          }
        />
      )}
      {tab === "interactions" && <InteractionsTab formulation={formulation} />}
      {tab === "research" && <ResearchTab formulation={formulation} />}
      {tab === "compliance" && (
        <ComplianceTab
          formulation={formulation}
          onScoreUpdate={score => setFormulation(f => f ? { ...f, compliance_score: score } : f)}
          onFormulationUpdate={updated => setFormulation(updated)}
        />
      )}
      {tab === "label" && <SupplementFactsTab formulation={formulation} />}
      {tab === "handoff" && <HandoffTab formulation={formulation} />}
      {tab === "edit" && (
        <div className="space-y-5">
          <FormulationForm
            key={editFormKey}
            submitLabel="Save changes"
            showStatus
            defaultValues={{
              name: formulation.name,
              description: formulation.description ?? "",
              status: formulation.status,
              target_dose: formulation.target_dose ?? "",
              serving_size: formulation.serving_size ?? "",
              capsule_size: formulation.capsule_size ?? "",
              capsules_per_serving: formulation.capsules_per_serving,
              notes: formulation.notes ?? "",
              ingredients: formulation.ingredients ?? [],
              target_population: formulation.target_population ?? "",
              excipients: formulation.excipients ?? [],
              ...(editOverrides ?? {}),
            }}
            onSubmit={handleUpdate}
            onCancel={() => setTab("overview")}
          />
          <VersionHistory
            formulationId={id}
            onRestore={snapshot => {
              setEditOverrides({
                name: snapshot.name,
                description: snapshot.description ?? "",
                status: snapshot.status,
                target_dose: snapshot.target_dose ?? "",
                serving_size: snapshot.serving_size ?? "",
                capsule_size: snapshot.capsule_size ?? "",
                capsules_per_serving: snapshot.capsules_per_serving,
                notes: snapshot.notes ?? "",
                ingredients: Array.isArray(snapshot.ingredients) ? snapshot.ingredients : [],
              });
              setEditFormKey(k => k + 1);
              toast.success("Version loaded into editor — review and save to apply.");
            }}
          />
        </div>
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <h3 className="text-[15px] font-semibold text-gray-950">Delete formulation?</h3>
            <p className="mt-1.5 text-[13px] text-gray-500">
              &quot;{formulation.name}&quot; will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-black/[0.08] px-4 py-2 text-[13px] font-medium text-gray-700 transition hover:bg-black/[0.02]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 className="size-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
