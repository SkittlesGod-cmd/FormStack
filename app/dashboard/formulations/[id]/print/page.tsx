"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Printer, ChevronLeft, Loader2 } from "lucide-react";
import { SupplementFactsPanel } from "@/components/formulations/SupplementFactsPanel";
import { STATUS_LABELS, type Formulation } from "@/lib/formulations/types";

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

  return (
    <div className="mx-auto max-w-[820px] space-y-6 px-4 py-6 print:max-w-none print:px-0 print:py-0">
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; box-shadow: none !important; border: none !important; }
          @page { margin: 0.5in; }
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

      <div className="print-page rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)] print:rounded-none print:border-0 print:shadow-none print:p-0">
        {/* Branding header */}
        <div className="flex items-center justify-between border-b border-black/[0.1] pb-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand" />
            <span className="text-[14px] font-semibold text-gray-950">NutraCloud</span>
            <span className="text-[11px] text-gray-400">Formulation Dossier</span>
          </div>
          <span className="text-[11px] text-gray-400">{today}</span>
        </div>

        {/* Title */}
        <div className="mt-5">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-gray-950">{formulation.name}</h1>
          {formulation.description && (
            <p className="mt-2 text-[13px] leading-relaxed text-gray-700">{formulation.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
            <span>Status: <strong className="text-gray-900">{STATUS_LABELS[formulation.status]}</strong></span>
            {formulation.compliance_score != null && (
              <span>· Compliance: <strong className="text-gray-900">{formulation.compliance_score}/100</strong></span>
            )}
          </div>
        </div>

        {/* Supplement Facts */}
        <div className="mt-6 grid gap-6 md:grid-cols-[auto_1fr]">
          <div>
            <SupplementFactsPanel formulation={formulation} />
          </div>
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">Manufacturing Specs</h2>
            <dl className="mt-3 grid gap-2 text-[12px]">
              {([
                ["Serving size", formulation.serving_size],
                ["Total active dose", formulation.target_dose],
                ["Capsule size", formulation.capsule_size],
                ["Units / serving", formulation.capsules_per_serving != null ? String(formulation.capsules_per_serving) : null],
                ["Product type", formulation.product_type],
              ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-2 border-b border-black/[0.05] py-1">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Ingredient detail */}
        <div className="mt-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">Ingredient Detail</h2>
          <table className="mt-3 w-full text-[12px]">
            <thead>
              <tr className="border-b border-black/[0.1] text-left">
                <th className="py-2 font-semibold text-gray-700">Ingredient</th>
                <th className="py-2 font-semibold text-gray-700">Dose</th>
                <th className="py-2 font-semibold text-gray-700">Unit</th>
              </tr>
            </thead>
            <tbody>
              {formulation.ingredients.map((ing, i) => (
                <tr key={ing.id || i} className="border-b border-black/[0.05]">
                  <td className="py-2 font-medium text-gray-900">{ing.name || "—"}</td>
                  <td className="py-2 font-mono text-gray-700">{ing.dose || "—"}</td>
                  <td className="py-2 font-mono text-gray-500">{ing.unit || "mg"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {formulation.notes && (
          <div className="mt-6">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-gray-700">
              {formulation.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-black/[0.1] pt-3 text-center text-[10px] text-gray-400">
          Generated by NutraCloud · This dossier is for product development purposes. Statements have not been evaluated by the FDA.
        </div>
      </div>
    </div>
  );
}
