"use client";

import type { Formulation, FormulationIngredient } from "@/lib/formulations/types";

// %DV reference values (per FDA daily values for adults & children >= 4 years)
// dose normalized to a common unit, plus DV in the same unit.
type DVRef = { dv: number; unit: "mg" | "mcg" | "g" | "IU" };

const DV_LOOKUP: Record<string, DVRef> = {
  "vitamin a":   { dv: 900,  unit: "mcg" },
  "vitamin c":   { dv: 90,   unit: "mg"  },
  "vitamin d":   { dv: 20,   unit: "mcg" },
  "vitamin d3":  { dv: 20,   unit: "mcg" },
  "vitamin e":   { dv: 15,   unit: "mg"  },
  "vitamin k":   { dv: 120,  unit: "mcg" },
  "vitamin b12": { dv: 2.4,  unit: "mcg" },
  "cobalamin":   { dv: 2.4,  unit: "mcg" },
  "magnesium":   { dv: 420,  unit: "mg"  },
  "zinc":        { dv: 11,   unit: "mg"  },
  "iron":        { dv: 18,   unit: "mg"  },
  "calcium":     { dv: 1300, unit: "mg"  },
  "thiamin":     { dv: 1.2,  unit: "mg"  },
  "riboflavin":  { dv: 1.3,  unit: "mg"  },
  "niacin":      { dv: 16,   unit: "mg"  },
  "vitamin b6":  { dv: 1.7,  unit: "mg"  },
  "folate":      { dv: 400,  unit: "mcg" },
  "biotin":      { dv: 30,   unit: "mcg" },
  "pantothenic acid": { dv: 5, unit: "mg" },
  "phosphorus":  { dv: 1250, unit: "mg"  },
  "iodine":      { dv: 150,  unit: "mcg" },
  "selenium":    { dv: 55,   unit: "mcg" },
  "copper":      { dv: 0.9,  unit: "mg"  },
  "manganese":   { dv: 2.3,  unit: "mg"  },
  "chromium":    { dv: 35,   unit: "mcg" },
  "molybdenum":  { dv: 45,   unit: "mcg" },
  "chloride":    { dv: 2300, unit: "mg"  },
  "sodium":      { dv: 2300, unit: "mg"  },
  "potassium":   { dv: 4700, unit: "mg"  },
};

function normalizeToUnit(value: number, from: string, to: "mg" | "mcg" | "g" | "IU"): number | null {
  const f = from.toLowerCase().trim();
  if (f === to.toLowerCase()) return value;
  // mass conversions
  const mg = (v: number, unit: string): number | null => {
    if (unit === "mg") return v;
    if (unit === "mcg" || unit === "µg" || unit === "ug") return v / 1000;
    if (unit === "g") return v * 1000;
    return null;
  };
  const fromMg = mg(value, f);
  if (fromMg == null) return null;
  if (to === "mg") return fromMg;
  if (to === "mcg") return fromMg * 1000;
  if (to === "g") return fromMg / 1000;
  return null;
}

function computeDV(ing: FormulationIngredient): number | null {
  const key = (ing.name ?? "").toLowerCase().trim();
  const ref = DV_LOOKUP[key];
  if (!ref) {
    // Try partial match (e.g. "Vitamin C (Ascorbic Acid)")
    const hit = Object.keys(DV_LOOKUP).find(k => key.includes(k));
    if (!hit) return null;
    const r = DV_LOOKUP[hit];
    const num = parseFloat(ing.dose);
    if (!isFinite(num)) return null;
    const norm = normalizeToUnit(num, ing.unit || "mg", r.unit);
    if (norm == null) return null;
    return Math.round((norm / r.dv) * 100);
  }
  const num = parseFloat(ing.dose);
  if (!isFinite(num)) return null;
  const norm = normalizeToUnit(num, ing.unit || "mg", ref.unit);
  if (norm == null) return null;
  return Math.round((norm / ref.dv) * 100);
}

interface Props {
  formulation: Formulation;
}

export function SupplementFactsPanel({ formulation }: Props) {
  const servingSize = formulation.serving_size || (formulation.capsules_per_serving ? `${formulation.capsules_per_serving} capsule${formulation.capsules_per_serving === 1 ? "" : "s"}` : "1 serving");

  return (
    <div
      style={{
        border: "2px solid #000",
        background: "#fff",
        color: "#000",
        padding: "8px 10px",
        fontFamily: 'Helvetica, Arial, sans-serif',
        maxWidth: 360,
        fontSize: 12,
        lineHeight: 1.25,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>
        Supplement Facts
      </div>
      <div style={{ borderBottom: "1px solid #000", paddingBottom: 4 }}>
        <div>Serving Size: {servingSize}</div>
        {formulation.target_dose && (
          <div style={{ fontSize: 11, color: "#000" }}>
            Total active: {formulation.target_dose}
          </div>
        )}
      </div>

      <div
        style={{
          borderBottom: "6px solid #000",
          display: "flex",
          justifyContent: "space-between",
          padding: "4px 0 2px",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        <span>Amount Per Serving</span>
        <span>% Daily Value</span>
      </div>

      {formulation.ingredients.length === 0 ? (
        <div style={{ padding: "12px 0", fontSize: 11, color: "#555", textAlign: "center" }}>
          No ingredients listed.
        </div>
      ) : (
        formulation.ingredients.map((ing, i) => {
          const dv = computeDV(ing);
          return (
            <div
              key={ing.id || i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 8,
                alignItems: "baseline",
                padding: "4px 0",
                borderBottom: "1px solid #000",
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 700 }}>{ing.name || "—"}</span>
              <span style={{ fontFamily: 'Menlo, Consolas, monospace' }}>
                {ing.dose || "—"}{ing.dose ? ` ${ing.unit || "mg"}` : ""}
              </span>
              <span style={{ fontFamily: 'Menlo, Consolas, monospace', minWidth: 36, textAlign: "right" }}>
                {dv != null ? `${dv}%` : "†"}
              </span>
            </div>
          );
        })
      )}

      <div style={{ paddingTop: 6, fontSize: 10, color: "#000" }}>
        † Daily Value (DV) not established.
      </div>
    </div>
  );
}

export default SupplementFactsPanel;
