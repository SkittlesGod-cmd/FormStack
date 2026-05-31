"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Printer, ChevronLeft, Loader2 } from "lucide-react";
import { SupplementFactsPanel } from "@/components/formulations/SupplementFactsPanel";
import { STATUS_LABELS, type Formulation, type FormulationIngredient } from "@/lib/formulations/types";

const GRADE_CONFIG = {
  A: { label: "Strong RCT", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  B: { label: "Moderate", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  C: { label: "Emerging", cls: "bg-gray-100 text-gray-600 border border-gray-200" },
};

const DOSE_ASSESSMENT_LABELS = {
  at_studied_dose: { label: "At clinical dose", cls: "text-emerald-600" },
  below_studied_dose: { label: "↓ Below clinical dose", cls: "text-orange-600" },
  above_studied_dose: { label: "↑ Above clinical dose", cls: "text-blue-600" },
};

export default function FormulationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/formulations/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const json = (await res.json()) as { formulation: Formulation };
        if (!cancelled) setFormulation(json.formulation);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !formulation) {
    return (
      <div className="py-20 text-center">
        <p className="text-[13px] font-medium text-gray-900">{error ?? "Not found"}</p>
        <Link href="/dashboard/formulations" className="mt-3 inline-block text-[12px] text-brand hover:underline">
          Back to formulations
        </Link>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const hasEvidence = formulation.ingredients.some((i: FormulationIngredient) => i.evidence_grade);
  const scoreColor = formulation.compliance_score != null
    ? formulation.compliance_score >= 80 ? "#059669"
      : formulation.compliance_score >= 60 ? "#d97706"
      : "#dc2626"
    : undefined;

  return (
    <div className="mx-auto max-w-[860px] space-y-5 px-4 py-6 print:max-w-none print:px-0 print:py-0">
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          @page { margin: 0.6in; size: letter; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/dashboard/formulations/${id}`}
          className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-gray-700"
        >
          <ChevronLeft className="size-3.5" />
          Back to formulation
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800"
        >
          <Printer className="size-3.5" />
          Print / Save as PDF
        </button>
      </div>

      <div className="print-page rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.1] pb-5">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-brand" />
            <span className="text-[15px] font-bold tracking-tight text-gray-950">FormLayer</span>
            <span className="rounded-full border border-black/[0.07] bg-gray-50 px-2.5 py-0.5 text-[10px] font-medium text-gray-500">
              Formulation Dossier
            </span>
          </div>
          <span className="text-[11px] text-gray-400">{today}</span>
        </div>

        {/* Title + meta */}
        <div className="mt-6">
          <h1 className="text-[30px] font-bold tracking-[-0.02em] text-gray-950">{formulation.name}</h1>
          {formulation.description && (
            <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{formulation.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-[12px]">
            <span className="rounded-full border border-black/[0.07] bg-gray-50 px-3 py-1 text-gray-600">
              {STATUS_LABELS[formulation.status]}
            </span>
            {formulation.product_type && (
              <span className="rounded-full border border-black/[0.07] bg-gray-50 px-3 py-1 text-gray-600 capitalize">
                {formulation.product_type}
              </span>
            )}
            {formulation.compliance_score != null && (
              <span
                className="rounded-full border px-3 py-1 font-semibold"
                style={{ color: scoreColor, borderColor: scoreColor + "33", backgroundColor: scoreColor + "10" }}
              >
                Compliance: {formulation.compliance_score}/100
              </span>
            )}
            {formulation.serving_size && (
              <span className="rounded-full border border-black/[0.07] bg-gray-50 px-3 py-1 text-gray-600">
                Serving: {formulation.serving_size}
              </span>
            )}
          </div>
        </div>

        {/* Supplement Facts + specs side by side */}
        <div className="mt-8 grid gap-8 md:grid-cols-[auto_1fr]">
          <div>
            <SupplementFactsPanel formulation={formulation} />
          </div>
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Manufacturing Specs</h2>
            <dl className="mt-3 space-y-1.5 text-[12px]">
              {([
                ["Serving size",    formulation.serving_size],
                ["Target dose",     formulation.target_dose],
                ["Capsule size",    formulation.capsule_size],
                ["Units / serving", formulation.capsules_per_serving != null ? String(formulation.capsules_per_serving) : null],
                ["Product type",    formulation.product_type],
              ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[140px_1fr] gap-2 border-b border-black/[0.05] py-1.5">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>

            {formulation.compliance_score != null && (
              <div className="mt-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Compliance</h2>
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="flex size-14 items-center justify-center rounded-full border-4"
                    style={{ borderColor: scoreColor + "33" }}
                  >
                    <span className="font-mono text-[18px] font-bold" style={{ color: scoreColor }}>
                      {formulation.compliance_score}
                    </span>
                  </div>
                  <div className="text-[12px] text-gray-500">
                    <p className="font-medium text-gray-900">
                      {formulation.compliance_score >= 90 ? "Fully compliant"
                        : formulation.compliance_score >= 75 ? "Minor issues"
                        : formulation.compliance_score >= 50 ? "Requires review"
                        : "Major concerns"}
                    </p>
                    <p>DSHEA / FDA structure-function review</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ingredient detail table */}
        <div className="mt-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Ingredient Detail
            {hasEvidence && <span className="ml-2 font-normal normal-case text-gray-400">with clinical evidence grades</span>}
          </h2>

          <table className="mt-3 w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-black/[0.1]">
                <th className="py-2 text-left font-semibold text-gray-700">Ingredient</th>
                <th className="py-2 text-right font-semibold text-gray-700">Dose</th>
                {hasEvidence && (
                  <th className="py-2 text-center font-semibold text-gray-700">Evidence</th>
                )}
                {hasEvidence && (
                  <th className="py-2 text-left font-semibold text-gray-700">Clinical Range</th>
                )}
              </tr>
            </thead>
            <tbody>
              {formulation.ingredients.map((ing: FormulationIngredient, i: number) => {
                const gradeConfig = ing.evidence_grade ? GRADE_CONFIG[ing.evidence_grade] : null;
                const doseInfo = ing.dose_assessment ? DOSE_ASSESSMENT_LABELS[ing.dose_assessment] : null;
                return (
                  <>
                    <tr key={`${ing.id || i}-main`} className="border-b border-black/[0.05]">
                      <td className="py-2 font-medium text-gray-900">{ing.name || "—"}</td>
                      <td className="py-2 text-right font-mono text-gray-700">
                        {ing.dose ? `${ing.dose} ${ing.unit || "mg"}` : "—"}
                      </td>
                      {hasEvidence && (
                        <td className="py-2 text-center">
                          {gradeConfig && (
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${gradeConfig.cls}`}>
                              {ing.evidence_grade}
                            </span>
                          )}
                        </td>
                      )}
                      {hasEvidence && (
                        <td className="py-2 text-gray-500">
                          {ing.clinical_dose_range || "—"}
                          {doseInfo && (
                            <span className={`ml-2 text-[10px] font-medium ${doseInfo.cls}`}>{doseInfo.label}</span>
                          )}
                        </td>
                      )}
                    </tr>
                    {ing.rationale && (
                      <tr key={`${ing.id || i}-rationale`} className="border-b border-black/[0.04]">
                        <td colSpan={hasEvidence ? 4 : 2} className="pb-2 pt-0.5 text-[11px] italic leading-relaxed text-gray-400">
                          {ing.rationale}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {formulation.notes && (
          <div className="mt-7">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-gray-700">{formulation.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-9 flex items-center justify-between border-t border-black/[0.08] pt-4">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-brand" />
            <span className="text-[10px] font-semibold text-gray-400">FormLayer</span>
          </div>
          <p className="text-center text-[10px] text-gray-400">
            For product development purposes only. Statements have not been evaluated by the FDA.
          </p>
          <p className="text-[10px] text-gray-400">{today}</p>
        </div>
      </div>
    </div>
  );
}
