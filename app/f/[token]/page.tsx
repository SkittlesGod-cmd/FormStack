"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { SupplementFactsPanel } from "@/components/formulations/SupplementFactsPanel";
import type { Formulation, FormulationIngredient } from "@/lib/formulations/types";

const GRADE_CONFIG = {
  A: { label: "Strong RCT", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  B: { label: "Moderate", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  C: { label: "Emerging", bg: "bg-gray-50 text-gray-600 border-gray-200" },
};

const DOSE_CONFIG = {
  at_studied_dose: null,
  below_studied_dose: { label: "↓ Below clinical dose", cls: "text-orange-600" },
  above_studied_dose: { label: "↑ Above clinical dose", cls: "text-blue-600" },
};

function EvidenceBadge({ grade }: { grade: "A" | "B" | "C" }) {
  const cfg = GRADE_CONFIG[grade];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg}`}>
      {grade} · {cfg.label}
    </span>
  );
}

function IngredientRow({ ing }: { ing: FormulationIngredient }) {
  const doseInfo = ing.dose_assessment ? DOSE_CONFIG[ing.dose_assessment] : null;
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-gray-900">{ing.name || "—"}</p>
          {ing.evidence_grade && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <EvidenceBadge grade={ing.evidence_grade} />
              {doseInfo && (
                <span className={`text-[11px] font-medium ${doseInfo.cls}`}>{doseInfo.label}</span>
              )}
              {ing.clinical_dose_range && (
                <span className="text-[11px] text-gray-400">Clinical range: {ing.clinical_dose_range}</span>
              )}
            </div>
          )}
          {ing.rationale && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500 italic">{ing.rationale}</p>
          )}
        </div>
        <span className="shrink-0 font-mono text-[13px] text-gray-700">
          {ing.dose ? `${ing.dose} ${ing.unit || "mg"}` : "—"}
        </span>
      </div>
    </li>
  );
}

export default function PublicSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/f/${token}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        if (!cancelled) setFormulation(json.formulation);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="size-5 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !formulation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <p className="text-[15px] font-medium text-gray-900">This formulation is not available</p>
        <p className="mt-1.5 text-[13px] text-gray-500">{error ?? "The link may have expired or been revoked."}</p>
        <Link href="/" className="mt-4 text-[12px] font-medium text-brand hover:underline">
          Visit FormLayer
        </Link>
      </div>
    );
  }

  const ingCount = formulation.ingredients.length;
  const hasEvidence = formulation.ingredients.some(i => i.evidence_grade);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-black/[0.06] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-[860px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand" />
            <span className="text-[14px] font-semibold text-gray-950">FormLayer</span>
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-gray-950 px-4 py-1.5 text-[12px] font-medium text-white transition hover:bg-gray-800"
          >
            Create free account
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-4 py-10">
        {/* Header card */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-7 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Shared formulation</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-gray-950">{formulation.name}</h1>
          {formulation.description && (
            <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{formulation.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-[12px]">
            <span className="rounded-full border border-black/[0.07] bg-gray-50 px-3 py-1 text-gray-600">
              {ingCount} ingredient{ingCount !== 1 ? "s" : ""}
            </span>
            {formulation.serving_size && (
              <span className="rounded-full border border-black/[0.07] bg-gray-50 px-3 py-1 text-gray-600">
                {formulation.serving_size}
              </span>
            )}
            {formulation.compliance_score != null && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${
                formulation.compliance_score >= 80
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : formulation.compliance_score >= 60
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}>
                <ShieldCheck className="size-3" />
                {formulation.compliance_score}/100 compliance
              </span>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr]">
          {/* Supplement Facts */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <SupplementFactsPanel formulation={formulation} />
          </div>

          {/* Ingredient detail */}
          <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="border-b border-black/[0.05] px-6 py-4">
              <h2 className="text-[13px] font-semibold text-gray-900">
                Ingredient Stack
                {hasEvidence && (
                  <span className="ml-2 text-[11px] font-normal text-gray-400">with clinical evidence grades</span>
                )}
              </h2>
            </div>
            <ul className="divide-y divide-black/[0.04] px-6 py-2">
              {formulation.ingredients.map((ing, i) => (
                <IngredientRow key={ing.id || i} ing={ing} />
              ))}
            </ul>
          </div>
        </div>

        {/* Notes / expected outcomes */}
        {formulation.notes && (
          <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">{formulation.notes}</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.04] to-brand/[0.01] p-6">
          <p className="text-[14px] font-semibold text-gray-950">Build your own evidence-backed supplement</p>
          <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
            FormLayer uses AI to draft clinically-dosed formulations, run FDA compliance checks, and generate manufacturer-ready briefs — in minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-lg bg-gray-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-lg border border-black/[0.08] bg-white px-4 py-2 text-[13px] font-medium text-gray-700 transition hover:bg-black/[0.02]"
            >
              See pricing
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          Generated by FormLayer · For product development purposes. Statements have not been evaluated by the FDA.
        </p>
      </div>
    </div>
  );
}
