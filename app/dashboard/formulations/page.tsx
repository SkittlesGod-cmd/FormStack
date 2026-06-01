"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Copy, FlaskConical, LayoutGrid,
  LayoutList, Loader2, Plus, Search, Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  FORMULATION_STATUSES,
  PRODUCT_TYPE_LABELS,
  STATUS_LABELS,
  type Formulation,
  type FormulationIngredient,
  type FormulationStatus,
} from "@/lib/formulations/types";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meta { count: number; limit: number; plan: string; canCreate: boolean; }
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

function scoreColor(s: number | null): string {
  if (s === null) return "text-gray-300";
  if (s >= 80) return "text-emerald-600";
  if (s >= 60) return "text-amber-500";
  return "text-red-500";
}

const STATUS_DOT: Record<FormulationStatus, string> = {
  compliant:   "bg-emerald-500",
  in_progress: "bg-brand",
  review:      "bg-amber-400",
  draft:       "bg-zinc-300",
};

const STATUS_TEXT_COLOR: Record<FormulationStatus, string> = {
  compliant:   "text-emerald-600",
  in_progress: "text-gray-600",
  review:      "text-amber-600",
  draft:       "text-zinc-500",
};

// ─── Evidence segment bar ─────────────────────────────────────────────────────

function EvidenceBar({ ingredients }: { ingredients: FormulationIngredient[] }) {
  if (!ingredients.length) return null;
  return (
    <div className="flex w-full gap-px overflow-hidden rounded-full" style={{ height: 5 }}>
      {ingredients.map((ing, i) => (
        <div
          key={i}
          className={cn(
            "flex-1",
            ing.evidence_grade === "A" ? "bg-emerald-400" :
            ing.evidence_grade === "B" ? "bg-amber-400" :
            ing.evidence_grade === "C" ? "bg-orange-400" :
            "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

// ─── Grade pills ──────────────────────────────────────────────────────────────

function GradePills({ ingredients }: { ingredients: FormulationIngredient[] }) {
  const c = ingredients.reduce((a, i) => {
    if (i.evidence_grade) a[i.evidence_grade] = (a[i.evidence_grade] ?? 0) + 1;
    return a;
  }, {} as Record<string, number>);
  if (!c.A && !c.B && !c.C) return null;
  return (
    <div className="flex items-center gap-1">
      {c.A ? <span className="rounded bg-emerald-50 px-1 text-[9px] font-bold text-emerald-600">{c.A}A</span> : null}
      {c.B ? <span className="rounded bg-amber-50 px-1 text-[9px] font-bold text-amber-600">{c.B}B</span> : null}
      {c.C ? <span className="rounded bg-gray-100 px-1 text-[9px] font-bold text-gray-500">{c.C}C</span> : null}
    </div>
  );
}

// ─── Stats tiles ──────────────────────────────────────────────────────────────

function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={cn("mt-1 font-mono text-[22px] font-bold leading-none tracking-tight", accent ?? "text-gray-950")}>
        {value}
      </p>
    </div>
  );
}

// ─── Formula card (grid) ──────────────────────────────────────────────────────

function FormulaCard({
  f, onDuplicate, duplicating, index,
}: {
  f: Formulation; onDuplicate: (e: React.MouseEvent, id: string) => void;
  duplicating: string | null; index: number;
}) {
  const ings = f.ingredients ?? [];
  const first3 = ings.slice(0, 3);
  const extra = Math.max(0, ings.length - 3);
  const productLabel = f.product_type
    ? (PRODUCT_TYPE_LABELS[f.product_type as keyof typeof PRODUCT_TYPE_LABELS] ?? f.product_type)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Link
        href={`/dashboard/formulations/${f.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-black/[0.12] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex flex-col gap-1.5">
            {productLabel && (
              <span className="w-fit rounded-md border border-black/[0.06] bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {productLabel}
              </span>
            )}
            {ings.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] font-semibold text-gray-700">{ings.length}</span>
                <span className="text-[11px] text-gray-400">ingredient{ings.length !== 1 ? "s" : ""}</span>
                <GradePills ingredients={ings} />
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", STATUS_DOT[f.status])} />
              <span className={cn("text-[11px] font-semibold", STATUS_TEXT_COLOR[f.status])}>
                {STATUS_LABELS[f.status]}
              </span>
            </div>
            {f.compliance_score !== null && (
              <span className={cn("font-mono text-[11px] font-bold", scoreColor(f.compliance_score))}>
                {f.compliance_score}/100
              </span>
            )}
          </div>
        </div>

        {/* Name + description */}
        <div className="flex-1 px-5 pb-4">
          <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.015em] text-gray-950 transition-colors group-hover:text-brand">
            {f.name}
          </h3>
          {f.description && (
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-gray-500">
              {f.description}
            </p>
          )}
        </div>

        {/* Evidence bar */}
        {ings.length > 0 && (
          <div className="px-5 pb-3">
            <EvidenceBar ingredients={ings} />
          </div>
        )}

        {/* Ingredient pills */}
        {ings.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4">
            {first3.map((ing, i) => (
              <span key={i} className="rounded-full border border-black/[0.06] bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                {ing.name}
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded-full border border-black/[0.06] bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-400">
                +{extra} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/[0.05] bg-gray-50/60 px-5 py-2.5">
          <span className="text-[11px] text-gray-400">{relativeDate(f.updated_at)}</span>
          <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={e => onDuplicate(e, f.id)}
              disabled={duplicating === f.id}
              title="Duplicate"
              className="flex size-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
            >
              {duplicating === f.id ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3" />}
            </button>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-brand">
              Open <ArrowRight className="size-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Formula row (list) ───────────────────────────────────────────────────────

function FormulaRow({
  f, onDuplicate, duplicating,
}: {
  f: Formulation; onDuplicate: (e: React.MouseEvent, id: string) => void; duplicating: string | null;
}) {
  const ings = f.ingredients ?? [];
  const productLabel = f.product_type
    ? (PRODUCT_TYPE_LABELS[f.product_type as keyof typeof PRODUCT_TYPE_LABELS] ?? f.product_type)
    : null;

  return (
    <Link
      href={`/dashboard/formulations/${f.id}`}
      className="group flex items-center gap-4 border-b border-black/[0.04] px-5 py-3.5 transition last:border-0 hover:bg-gray-50/60"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-black/[0.06] bg-gray-50">
        <FlaskConical className="size-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-gray-950 transition group-hover:text-brand">
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
      <div className="flex shrink-0 items-center gap-5">
        <span className="hidden font-mono text-[12px] text-gray-400 sm:block">{ings.length} ing.</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[f.status])} />
          <span className={cn("hidden text-[12px] font-semibold sm:block", STATUS_TEXT_COLOR[f.status])}>
            {STATUS_LABELS[f.status]}
          </span>
        </div>
        {f.compliance_score !== null && (
          <span className={cn("hidden font-mono text-[12px] font-bold sm:block", scoreColor(f.compliance_score))}>
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyLibrary({ hasFilter, atLimit }: { hasFilter: boolean; atLimit: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative mb-6">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <FlaskConical className="size-7 text-gray-300" />
        </div>
        <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-black/[0.06] bg-white shadow-sm">
          <Plus className="size-2.5 text-gray-400" />
        </div>
      </div>
      <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-gray-950">
        {hasFilter ? "No formulas match" : "Your formula library is empty"}
      </h3>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-gray-500">
        {hasFilter
          ? "Try a different search or remove the status filter."
          : "Create your first AI-powered formulation. Research, formulate, and validate in one automated flow."
        }
      </p>
      {!hasFilter && !atLimit && (
        <Link
          href="/dashboard/formulations/new"
          className="mt-6 flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          <Plus className="size-4" />
          New formula
        </Link>
      )}
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="px-5 pt-5 pb-3 flex justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-14 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100/70" />
        </div>
        <div className="h-4 w-16 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="flex-1 space-y-2 px-5 pb-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100/60" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100/40" />
      </div>
      <div className="px-5 pb-3">
        <div className="h-1 w-full animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="flex gap-1.5 px-5 pb-4">
        {[56, 44, 52].map((w, i) => (
          <div key={i} className="h-5 animate-pulse rounded-full bg-gray-100" style={{ width: w }} />
        ))}
      </div>
      <div className="border-t border-black/[0.04] bg-gray-50/60 px-5 py-2.5">
        <div className="h-3 w-14 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
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
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/formulations", { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then(json => { if (!cancelled) { setFormulations(json.formulations); setMeta(json.meta); } })
      .catch(e => { if (!cancelled) setError(e.message ?? "Something went wrong"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    let list = formulations;
    if (statusFilter !== "all") list = list.filter(f => f.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(f =>
      f.name.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q)
    );
    return list;
  }, [formulations, statusFilter, search]);

  const stats = useMemo(() => {
    const compliant = formulations.filter(f => f.status === "compliant").length;
    const inPipeline = formulations.filter(f => f.status === "in_progress" || f.status === "review").length;
    const scored = formulations.filter(f => f.compliance_score !== null);
    const avg = scored.length
      ? Math.round(scored.reduce((s, f) => s + (f.compliance_score ?? 0), 0) / scored.length)
      : null;
    const counts: Record<FormulationStatus, number> = { draft: 0, in_progress: 0, review: 0, compliant: 0 };
    for (const f of formulations) counts[f.status]++;
    return { compliant, inPipeline, avg, counts };
  }, [formulations]);

  async function handleDuplicate(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(id);
    try {
      const res = await fetch(`/api/formulations/${id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.limit ? "Formulation limit reached. Upgrade your plan." : (json.error ?? "Failed to duplicate"));
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
  const showStats = !loading && !error && formulations.length > 0;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Formula Library
          </p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.025em] text-gray-950">
            Formulations
          </h1>
        </div>
        <div className="flex items-center gap-2">
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
              className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              <Plus className="size-4" />
              New formula
            </Link>
          )}
        </div>
      </div>

      {/* ── Plan banner ─────────────────────────────────────────────────────── */}
      {atLimit && meta && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50 px-5 py-3.5">
          <div>
            <p className="text-[13px] font-semibold text-amber-900">
              {meta.limit === 0 ? "No formulations included" : `${meta.count}/${meta.limit} used`} on {meta.plan} plan
            </p>
            <p className="mt-0.5 text-[12px] text-amber-700">Upgrade to create more and unlock advanced features.</p>
          </div>
          <Link href="/dashboard/billing" className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-amber-700">
            Upgrade
          </Link>
        </div>
      )}

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          <StatTile label="Total" value={String(formulations.length)} />
          <StatTile
            label="Compliant"
            value={String(stats.compliant)}
            accent={stats.compliant > 0 ? "text-emerald-600" : undefined}
          />
          <StatTile
            label="In pipeline"
            value={String(stats.inPipeline)}
            accent={undefined}
          />
          {stats.avg !== null ? (
            <StatTile
              label="Avg. compliance"
              value={String(stats.avg)}
              accent={stats.avg >= 80 ? "text-emerald-600" : stats.avg >= 60 ? "text-amber-500" : "text-red-500"}
            />
          ) : (
            meta && meta.limit !== -1 ? (
              <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Usage</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${Math.min(100, (meta.count / meta.limit) * 100)}%` }}
                    />
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-gray-400">{meta.count}/{meta.limit}</span>
                </div>
              </div>
            ) : <div />
          )}
        </motion.div>
      )}

      {/* ── Search + filter + view toggle ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search formulas… (/)"
            className="h-9 w-full rounded-xl border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/10"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Status pills */}
          {!loading && formulations.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {(["all", ...FORMULATION_STATUSES] as const).map(s => {
                const count = s === "all" ? formulations.length : stats.counts[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition",
                      statusFilter === s
                        ? "border-gray-950 bg-gray-950 text-white"
                        : "border-black/[0.08] bg-white text-gray-500 hover:border-black/20 hover:text-gray-800"
                    )}
                  >
                    {s === "all" ? "All" : STATUS_LABELS[s]}
                    {count > 0 && (
                      <span className={cn("ml-1.5 font-mono text-[10px]", statusFilter === s ? "opacity-50" : "text-gray-400")}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {/* View toggle */}
          <div className="flex overflow-hidden rounded-xl border border-black/[0.08] bg-white">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn("flex size-9 items-center justify-center transition", viewMode === "grid" ? "bg-gray-950 text-white" : "text-gray-400 hover:text-gray-700")}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn("flex size-9 items-center justify-center transition", viewMode === "list" ? "bg-gray-950 text-white" : "text-gray-400 hover:text-gray-700")}
            >
              <LayoutList className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-[13px] text-red-600">{error}</div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyLibrary hasFilter={hasFilter} atLimit={atLimit} />
      )}

      {!loading && !error && filtered.length > 0 && (
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((f, i) => (
                <FormulaCard key={f.id} f={f} index={i} onDuplicate={handleDuplicate} duplicating={duplicating} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            >
              <div className="grid items-center gap-4 border-b border-black/[0.05] bg-gray-50/60 px-5 py-2.5"
                style={{ gridTemplateColumns: "auto 1fr auto auto auto auto auto" }}>
                <span className="w-8" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Name</span>
                <span className="hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:block">Ingredients</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                <span className="hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:block">Score</span>
                <span className="hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:block">Updated</span>
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
