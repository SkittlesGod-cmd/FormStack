"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Beaker, FlaskConical, ShieldCheck, Clock } from "lucide-react";
import { createBrowserClient } from "@/utils/supabase/client";
import {
  PRODUCT_TYPE_LABELS,
  type ProductType,
  type FormulationStatus,
} from "@/lib/formulations/types";

interface Formulation {
  id: string;
  name: string;
  status: FormulationStatus;
  product_type: string | null;
  ingredients: unknown[];
  compliance_score: number | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  draft:       { label: "Draft",       dot: "bg-zinc-400",    text: "text-zinc-600",    bg: "bg-zinc-50  border-zinc-200/80" },
  in_progress: { label: "In Progress", dot: "bg-brand",       text: "text-brand-600",   bg: "bg-brand-50 border-brand-100"  },
  review:      { label: "In Review",   dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50 border-amber-100"  },
  compliant:   { label: "Compliant",   dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diffD = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffD === 0) return "Today";
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function hour() { return new Date().getHours(); }

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, draft: 0, active: 0, compliant: 0, avgCompliance: null as number | null });

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Parallel: recent 5 for display + all for stats
        const [recentRes, allRes] = await Promise.all([
          supabase
            .from("formulations")
            .select("id, name, status, product_type, ingredients, compliance_score, created_at, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(5),
          supabase
            .from("formulations")
            .select("status, compliance_score")
            .eq("user_id", user.id),
        ]);
        setFormulations(recentRes.data ?? []);
        const all = allRes.data ?? [];
        const scored = all.filter(f => f.compliance_score != null);
        setStats({
          total:     all.length,
          draft:     all.filter(f => f.status === "draft").length,
          active:    all.filter(f => f.status === "in_progress" || f.status === "review").length,
          compliant: all.filter(f => f.status === "compliant").length,
          avgCompliance: scored.length > 0
            ? Math.round(scored.reduce((s, f) => s + (f.compliance_score as number), 0) / scored.length)
            : null,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "there";

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            {hour() < 12 ? "Good morning" : hour() < 18 ? "Good afternoon" : "Good evening"}
          </p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-gray-950">
            {displayName.split(" ")[0]}
          </h1>
        </div>
        <Link
          href="/dashboard/formulations/new"
          className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800"
        >
          <Plus className="size-3.5" />
          New formulation
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { label: "Formulations", value: stats.total,     sub: "total in workspace",  icon: Beaker,       color: "text-gray-400" },
          { label: "Draft",        value: stats.draft,     sub: "pending review",       icon: Clock,        color: "text-zinc-400" },
          { label: "Active",       value: stats.active,    sub: "in development",       icon: FlaskConical, color: "text-brand"    },
          { label: "Compliant",    value: stats.compliant, sub: "cleared for label",    icon: ShieldCheck,  color: "text-emerald-500" },
        ]).map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-gray-400">{label}</p>
              <Icon className={`size-3.5 ${color}`} />
            </div>
            <p className="mt-2 font-mono text-[28px] font-semibold tracking-tight text-gray-950">
              {value}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent formulations */}
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">Recent formulations</h2>
          {formulations.length > 0 && (
            <Link
              href="/dashboard/formulations"
              className="flex items-center gap-1 text-[12px] font-medium text-brand transition hover:text-brand-dark"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          )}
        </div>

        {formulations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {formulations.map((f) => {
              const ingCount = Array.isArray(f.ingredients) ? f.ingredients.length : 0;
              const typeLabel = f.product_type
                ? PRODUCT_TYPE_LABELS[f.product_type as ProductType] ?? f.product_type
                : null;
              return (
                <Link
                  key={f.id}
                  href={`/dashboard/formulations/${f.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-black/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-gray-900 group-hover:text-brand transition-colors">
                      {f.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {typeLabel && <span>{typeLabel}{" · "}</span>}
                      {ingCount} ingredient{ingCount !== 1 ? "s" : ""}
                      {" · "}
                      {relativeDate(f.updated_at)}
                      {f.compliance_score !== null && (
                        <span className={`ml-2 font-mono font-semibold ${
                          f.compliance_score >= 80 ? "text-emerald-600"
                            : f.compliance_score >= 60 ? "text-amber-600"
                            : "text-red-500"
                        }`}>
                          {f.compliance_score}% compliant
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={f.status} />
                    <ArrowRight className="size-3.5 text-gray-300 group-hover:text-brand transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions — always show */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Quick actions</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "New formulation",
              desc: "Start a capsule, tablet, softgel, gummy, powder, or topical — AI drafts your ingredient stack.",
              href: "/dashboard/formulations/new",
              cta: "Get started",
            },
            {
              title: "Research an ingredient",
              desc: "Pull evidence-backed mechanisms, clinical dosing, safety limits, and synergy data for any compound.",
              href: "/dashboard/research",
              cta: "Open research",
            },
            {
              title: "Compliance check",
              desc: "Run a regulatory review of your ingredient list and label claims against FDA structure/function rules.",
              href: formulations.length > 0 ? "/dashboard/formulations" : "#",
              cta: formulations.length > 0 ? "Pick a formulation" : "Create a formulation first",
            },
          ].map(({ title, desc, href, cta }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition hover:border-black/[0.12] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
            >
              <p className="text-[13px] font-semibold text-gray-900">{title}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">{desc}</p>
              <p className="mt-4 flex items-center gap-1 text-[12px] font-medium text-brand">
                {cta} <ArrowRight className="size-3 transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-black/[0.06] bg-gray-50">
        <Beaker className="size-6 text-gray-300" />
      </div>
      <p className="text-[14px] font-semibold text-gray-900">No formulations yet</p>
      <p className="mt-1.5 mx-auto max-w-sm text-[12px] leading-relaxed text-gray-400">
        Start by telling the AI what type of product you're building — capsule, tablet, softgel, gummy, or powder — and your health goal. It will draft an evidence-backed starting stack in seconds.
      </p>
      <Link
        href="/dashboard/formulations/new"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800"
      >
        <Plus className="size-3.5" />
        Start a formulation
      </Link>
    </div>
  );
}
