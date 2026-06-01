"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Copy, FlaskConical, LayoutGrid, LayoutList,
  Loader2, Plus, Search, ShieldCheck, Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  FORMULATION_STATUSES,
  PRODUCT_TYPE_LABELS,
  STATUS_DOT_CLASSES,
  STATUS_LABELS,
  type Formulation,
  type FormulationStatus,
} from "@/lib/formulations/types";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meta {
  count: number;
  limit: number;
  plan: string;
  canCreate: boolean;
}

type ViewMode = "grid" | "list";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diffD = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffD === 0) return "Today";
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-gray-300";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-gray-50 border-gray-100";
  if (score >= 80) return "bg-emerald-50 border-emerald-100";
  if (score >= 60) return "bg-amber-50 border-amber-100";
  return "bg-red-50 border-red-100";
}

function gradeDistribution(ingredients: Formulation["ingredients"]) {
  const counts = { A: 0, B: 0, C: 0, none: 0 };
  for (const ing of ingredients) {
    if (ing.evidence_grade === "A") counts.A++;
    else if (ing.evidence_grade === "B") counts.B++;
    else if (ing.evidence_grade === "C") counts.C++;
    else counts.none++;
  }
  return counts;
}

// Mini compliance ring (SVG)
function ScoreRing({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex size-10 items-center justify-center rounded-full border border-gray-100 bg-gray-50">
          <span className="font-mono text-[10px] text-gray-300">—</span>
        </div>
      </div>
    );
  }
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={r} fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
          <circle
            cx="20" cy="20" r={r}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - dash}
            style={{ transformOrigin: "20px 20px", transform: "rotate(-90deg)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[10px] font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Status pipeline ──────────────────────────────────────────────────────────

const PIPELINE: Array<{ status: FormulationStatus; label: string }> = [
  { status: "draft",       label: "Draft" },
  { status: "in_progress", label: "In Progress" },
  { status: "review",      label: "Review" },
  { status: "compliant",   label: "Compliant" },
];

const STATUS_BG: Record<FormulationStatus, string> = {
  draft:       "bg-zinc-100 text-zinc-600",
  in_progress: "bg-brand/10 text-brand",
  review:      "bg-amber-100 text-amber-700",
  compliant:   "bg-emerald-100 text-emerald-700",
};

function StatusPipeline({
  formulations, active, onSelect,
}: {
  formulations: Formulation[];
  active: FormulationStatus | "all";
  onSelect: (s: FormulationStatus | "all") => void;
}) {
  const counts = useMemo(() => {
    const c: Record<FormulationStatus, number> = { draft: 0, in_progress: 0, review: 0, compliant: 0 };
    for (const f of formulations) c[f.status] = (c[f.status] ?? 0) + 1;
    return c;
  }, [formulations]);

  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={cn(
          "shrink-0 rounded-l-xl border px-4 py-2 text-[12px] font-semibold transition",
          active === "all"
            ? "border-gray-950 bg-gray-950 text-white z-10"
            : "border-black/[0.08] bg-white text-gray-500 hover:border-black/20 hover:text-gray-800"
        )}
      >
        All <span className="ml-1.5 font-mono text-[11px] opacity-70">{formulations.length}</span>
      </button>
      {PIPELINE.map((stage, i) => {
        const isLast = i === PIPELINE.length - 1;
        const isActive = active === stage.status;
        return (
          <button
            key={stage.status}
            type="button"
            onClick={() => onSelect(stage.status)}
            className={cn(
              "shrink-0 border-y border-r px-4 py-2 text-[12px] font-semibold transition",
              isLast ? "rounded-r-xl" : "",
              isActive
                ? cn("z-10 border-l text-white", {
                    "border-zinc-700 bg-zinc-700": stage.status === "draft",
                    "border-brand bg-brand": stage.status === "in_progress",
                    "border-amber-500 bg-amber-500": stage.status === "review",
                    "border-emerald-600 bg-emerald-600": stage.status === "compliant",
                  })
                : "border-black/[0.08] bg-white text-gray-500 hover:border-black/20 hover:text-gray-800"
            )}
          >
            <span className={cn(
              "flex items-center gap-1.5",
            )}>
              <span className={cn(
                "size-1.5 rounded-full",
                isActive ? "bg-white/80" : STATUS_DOT_CLASSES[stage.status]
              )} />
              {stage.label}
              {counts[stage.status] > 0 && (
                <span className={cn(
                  "font-mono text-[11px]",
                  isActive ? "opacity-70" : "text-gray-400"
                )}>
                  {counts[stage.status]}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Formula card (grid view) ─────────────────────────────────────────────────

function FormulaCard({
  f, onDuplicate, duplicating,
}: {
  f: Formulation;
  onDuplicate: (e: React.MouseEvent, id: string) => void;
  duplicating: string | null;
}) {
  const ingCount = Array.isArray(f.ingredients) ? f.ingredients.length : 0;
  const firstThree = (f.ingredients ?? []).slice(0, 3).map(i => i.name);
  const remaining = Math.max(0, ingCount - 3);
  const grades = gradeDistribution(f.ingredients ?? []);
  const hasGrades = grades.A + grades.B + grades.C > 0;
  const productLabel = f.product_type ? (PRODUCT_TYPE_LABELS[f.product_type as keyof typeof PRODUCT_TYPE_LABELS] ?? f.product_type) : null;

  return (
    <Link
      href={`/dashboard/formulations/${f.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-black/[0.12] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
    >
      {/* Top: product type + status */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          {productLabel && (
            <span className="rounded-md border border-black/[0.06] bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              {productLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASSES[f.status])} />
          <span className="text-[11px] font-medium text-gray-500">{STATUS_LABELS[f.status]}</span>
        </div>
      </div>

      {/* Name + description */}
      <div className="flex-1 px-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-gray-950 group-hover:text-brand transition-colors">
              {f.name}
            </h3>
            {f.description && (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-gray-500">
                {f.description}
              </p>
            )}
          </div>
          <div className="shrink-0 pt-0.5">
            <ScoreRing score={f.compliance_score ?? null} />
          </div>
        </div>
      </div>

      {/* Divider + ingredient section */}
      <div className="border-t border-black/[0.05] px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            {ingCount} ingredient{ingCount !== 1 ? "s" : ""}
          </span>
          {hasGrades && (
            <div className="flex items-center gap-1">
              {grades.A > 0 && (
                <span className="rounded-sm bg-emerald-50 px-1 text-[9px] font-bold text-emerald-600">{grades.A}A</span>
              )}
              {grades.B > 0 && (
                <span className="rounded-sm bg-amber-50 px-1 text-[9px] font-bold text-amber-600">{grades.B}B</span>
              )}
              {grades.C > 0 && (
                <span className="rounded-sm bg-gray-100 px-1 text-[9px] font-bold text-gray-500">{grades.C}C</span>
              )}
            </div>
          )}
        </div>

        {/* Ingredient name pills */}
        {ingCount > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {firstThree.map((name, i) => (
              <span
                key={i}
                className="rounded-full border border-black/[0.06] bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600"
              >
                {name}
              </span>
            ))}
            {remaining > 0 && (
              <span className="rounded-full border border-black/[0.06] bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-400">
                +{remaining} more
              </span>
            )}
          </div>
        ) : (
          <p className="text-[11px] italic text-gray-300">No ingredients added</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-black/[0.04] bg-gray-50/50 px-5 py-2.5">
        <span className="text-[11px] text-gray-400">{relativeDate(f.updated_at)}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={e => onDuplicate(e, f.id)}
            disabled={duplicating === f.id}
            title="Duplicate"
            className="flex size-6 items-center justify-center rounded-md text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 disabled:opacity-40"
          >
            {duplicating === f.id
              ? <Loader2 className="size-3 animate-spin" />
              : <Copy className="size-3" />
            }
          </button>
          <span className="ml-1 flex items-center gap-0.5 text-[11px] font-medium text-gray-300 opacity-0 transition group-hover:text-brand group-hover:opacity-100">
            Open <ArrowRight className="size-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Formula row (list view) ──────────────────────────────────────────────────

function FormulaRow({
  f, onDuplicate, duplicating,
}: {
  f: Formulation;
  onDuplicate: (e: React.MouseEvent, id: string) => void;
  duplicating: string | null;
}) {
  const ingCount = Array.isArray(f.ingredients) ? f.ingredients.length : 0;
  const productLabel = f.product_type ? (PRODUCT_TYPE_LABELS[f.product_type as keyof typeof PRODUCT_TYPE_LABELS] ?? f.product_type) : null;

  return (
    <Link
      href={`/dashboard/formulations/${f.id}`}
      className="group flex items-center gap-4 border-b border-black/[0.04] px-5 py-3.5 transition last:border-0 hover:bg-black/[0.02]"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/[0.06] bg-gray-50">
        <FlaskConical className="size-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-gray-900 group-hover:text-brand transition-colors">
            {f.name}
          </p>
          {productLabel && (
            <span className="hidden shrink-0 rounded border border-black/[0.06] bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:inline-block">
              {productLabel}
            </span>
          )}
        </div>
        {f.description && (
          <p className="mt-0.5 truncate text-[11px] text-gray-400">{f.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="hidden font-mono text-[12px] text-gray-400 sm:block">
          {ingCount} ing.
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASSES[f.status])} />
          <span className="hidden text-[12px] text-gray-500 sm:block">{STATUS_LABELS[f.status]}</span>
        </div>
        {f.compliance_score !== null && (
          <span className={cn("hidden font-mono text-[12px] font-semibold sm:block", scoreColor(f.compliance_score))}>
            {f.compliance_score}/100
          </span>
        )}
        <span className="hidden text-[12px] text-gray-400 sm:block">{relativeDate(f.updated_at)}</span>
        <button
          type="button"
          onClick={e => onDuplicate(e, f.id)}
          disabled={duplicating === f.id}
          title="Duplicate"
          className="flex size-7 items-center justify-center rounded-md border border-transparent text-gray-300 opacity-0 transition hover:border-black/[0.08] hover:bg-gray-50 hover:text-gray-600 group-hover:opacity-100 disabled:opacity-40"
        >
          {duplicating === f.id ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </Link>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip({ formulations, meta }: { formulations: Formulation[]; meta: Meta | null }) {
  const compliant = formulations.filter(f => f.status === "compliant").length;
  const inProgress = formulations.filter(f => f.status === "in_progress" || f.status === "review").length;
  const avgScore = useMemo(() => {
    const scored = formulations.filter(f => f.compliance_score !== null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((sum, f) => sum + (f.compliance_score ?? 0), 0) / scored.length);
  }, [formulations]);

  const items = [
    { label: "Total formulas", value: formulations.length.toString() },
    { label: "Compliant", value: compliant.toString(), accent: compliant > 0 ? "text-emerald-600" : undefined },
    { label: "In pipeline", value: inProgress.toString(), accent: inProgress > 0 ? "text-brand" : undefined },
    ...(avgScore !== null ? [{ label: "Avg. compliance", value: `${avgScore}`, accent: scoreColor(avgScore) }] : []),
    ...(meta && meta.limit !== -1 ? [{ label: "Limit", value: `${meta.count}/${meta.limit}` }] : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.slice(0, 4).map(item => (
        <div key={item.label} className="rounded-xl border border-black/[0.06] bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{item.label}</p>
          <p className={cn("mt-1 font-mono text-[22px] font-bold leading-none tracking-tight", item.accent ?? "text-gray-950")}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilter, atLimit }: { hasFilter: boolean; atLimit: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-black/[0.06] bg-gradient-to-b from-white to-gray-50 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <FlaskConical className="size-7 text-gray-300" />
      </div>
      <h3 className="text-[15px] font-semibold text-gray-950">
        {hasFilter ? "No matches found" : "Your formula library is empty"}
      </h3>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-gray-400">
        {hasFilter
          ? "Try adjusting your search or filter to see more formulas."
          : "Create your first AI-powered formulation to get started. Research, formulate, and validate — all in one flow."
        }
      </p>
      {!hasFilter && !atLimit && (
        <Link
          href="/dashboard/formulations/new"
          className="mt-6 flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-black/10 transition hover:bg-gray-800"
        >
          <Plus className="size-4" />
          Build your first formula
        </Link>
      )}
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FormulationsListPage() {
  const router = useRouter();
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FormulationStatus | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/formulations", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json() as { formulations: Formulation[]; meta: Meta };
        if (!cancelled) {
          setFormulations(json.formulations);
          setMeta(json.meta);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = formulations;
    if (statusFilter !== "all") list = list.filter(f => f.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(f => f.name.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q));
    return list;
  }, [formulations, statusFilter, search]);

  async function handleDuplicate(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(id);
    try {
      const res = await fetch(`/api/formulations/${id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        if (json.limit) {
          toast.error("Formulation limit reached. Upgrade your plan.");
        } else {
          throw new Error(json.error ?? "Failed to duplicate");
        }
        return;
      }
      toast.success("Formulation duplicated");
      router.push(`/dashboard/formulations/${json.formulation.id}`);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to duplicate"));
    } finally {
      setDuplicating(null);
    }
  }

  const atLimit = Boolean(meta && !meta.canCreate);
  const hasFilter = Boolean(search.trim()) || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Formula Library</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.025em] text-gray-950">Formulations</h1>
        </div>
        {atLimit ? (
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
          >
            <Zap className="size-3.5" />
            Upgrade
          </Link>
        ) : (
          <Link
            href="/dashboard/formulations/new"
            className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-black/10 transition hover:bg-gray-800"
          >
            <Plus className="size-4" />
            New formula
          </Link>
        )}
      </div>

      {/* ── Plan banner ── */}
      {atLimit && meta && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div>
            <p className="text-[13px] font-semibold text-amber-900">
              {meta.limit === 0 ? "No formulations included" : `${meta.count}/${meta.limit} used`} on {meta.plan} plan
            </p>
            <p className="mt-0.5 text-[12px] text-amber-700">Upgrade to create more formulations and unlock advanced features.</p>
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-amber-700"
          >
            Upgrade plan
          </Link>
        </div>
      )}

      {/* ── Usage bar (not at limit) ── */}
      {meta && !atLimit && meta.limit !== -1 && (
        <div className="flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${Math.min(100, (meta.count / meta.limit) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] text-gray-400">{meta.count}/{meta.limit}</span>
        </div>
      )}

      {/* ── Stats strip ── */}
      {!loading && !error && formulations.length > 0 && (
        <StatsStrip formulations={formulations} meta={meta} />
      )}

      {/* ── Filter + search bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search formulas…"
            className="h-9 w-full rounded-xl border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
        </div>
        <div className="flex items-center gap-2">
          {!loading && formulations.length > 0 && (
            <StatusPipeline
              formulations={formulations}
              active={statusFilter}
              onSelect={setStatusFilter}
            />
          )}
          {/* View toggle */}
          <div className="flex rounded-xl border border-black/[0.08] bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex size-9 items-center justify-center transition",
                viewMode === "grid" ? "bg-gray-950 text-white" : "text-gray-400 hover:text-gray-700"
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex size-9 items-center justify-center transition",
                viewMode === "list" ? "bg-gray-950 text-white" : "text-gray-400 hover:text-gray-700"
              )}
            >
              <LayoutList className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-black/[0.04] px-5 py-4 last:border-0">
              <div className="size-8 animate-pulse rounded-lg bg-gray-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-48 animate-pulse rounded bg-gray-100" />
                <div className="h-2.5 w-32 animate-pulse rounded bg-gray-100/70" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-[13px] text-red-600">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState hasFilter={hasFilter} atLimit={atLimit} />
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {filtered.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <FormulaCard f={f} onDuplicate={handleDuplicate} duplicating={duplicating} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            >
              {/* List header */}
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 border-b border-black/[0.05] bg-gray-50/60 px-5 py-2.5">
                <span className="w-8" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Name</span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:block">Ingredients</span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:block">Score</span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:block">Updated</span>
                <span className="w-7" />
              </div>
              {filtered.map(f => (
                <FormulaRow key={f.id} f={f} onDuplicate={handleDuplicate} duplicating={duplicating} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
