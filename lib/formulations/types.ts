import { z } from "zod";

export const FORMULATION_STATUSES = [
  "draft",
  "in_progress",
  "review",
  "compliant",
] as const;

export type FormulationStatus = (typeof FORMULATION_STATUSES)[number];

export const PRODUCT_TYPES = [
  "capsule",
  "tablet",
  "softgel",
  "gummy",
  "powder",
  "liquid",
  "topical",
  "strip",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  capsule:  "Capsule",
  tablet:   "Tablet",
  softgel:  "Softgel",
  gummy:    "Gummy",
  powder:   "Powder",
  liquid:   "Liquid / Tincture",
  topical:  "Topical / Gel",
  strip:    "Oral Strip",
};

export const PRODUCT_TYPE_DESC: Record<ProductType, string> = {
  capsule:  "Hard-shell gelatin or HPMC",
  tablet:   "Compressed powder with binders",
  softgel:  "Liquid-filled gelatin capsule",
  gummy:    "Gelatin or pectin-based chewable",
  powder:   "Loose powder or single-serve sachet",
  liquid:   "Dropper bottle or liquid supplement",
  topical:  "Cream, gel, or transdermal patch",
  strip:    "Fast-dissolving oral film strip",
};

export const PRODUCT_TYPE_SERVING: Record<ProductType, string> = {
  capsule:  "e.g. 2 capsules",
  tablet:   "e.g. 1 tablet",
  softgel:  "e.g. 1 softgel",
  gummy:    "e.g. 2 gummies",
  powder:   "e.g. 1 scoop (5g)",
  liquid:   "e.g. 1 mL dropper",
  topical:  "e.g. pea-sized amount",
  strip:    "e.g. 1 strip",
};

export const formulationIngredientSchema = z.object({
  id: z.string().min(1, "Ingredient id is required"),
  name: z.string().min(1, "Ingredient name is required"),
  dose: z.string().optional().default(""),
  unit: z.string().optional().default("mg"),
  notes: z.string().optional(),
  // AI-enriched fields
  evidence_grade: z.enum(["A", "B", "C"]).optional(),
  clinical_dose_range: z.string().optional(),
  dose_assessment: z.enum(["at_studied_dose", "below_studied_dose", "above_studied_dose"]).optional(),
  rationale: z.string().optional(),
});

export type FormulationIngredient = z.infer<typeof formulationIngredientSchema>;

const baseFormulationFields = {
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  product_type: z.string().optional().nullable(),
  status: z.enum(FORMULATION_STATUSES).optional(),
  ingredients: z.array(formulationIngredientSchema).optional(),
  target_dose: z.string().max(120).optional().nullable(),
  serving_size: z.string().max(120).optional().nullable(),
  capsule_size: z.string().max(40).optional().nullable(),
  capsules_per_serving: z
    .number()
    .int("Must be a whole number")
    .min(1)
    .max(20)
    .optional()
    .nullable(),
  notes: z.string().max(4000).optional().nullable(),
  compliance_score: z.number().int().min(0).max(100).optional().nullable(),
};

export const createFormulationSchema = z.object(baseFormulationFields);
export const updateFormulationSchema = z
  .object(baseFormulationFields)
  .partial();

export type CreateFormulationInput = z.infer<typeof createFormulationSchema>;
export type UpdateFormulationInput = z.infer<typeof updateFormulationSchema>;

export interface Formulation {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  product_type: string | null;
  status: FormulationStatus;
  ingredients: FormulationIngredient[];
  target_dose: string | null;
  serving_size: string | null;
  capsule_size: string | null;
  capsules_per_serving: number | null;
  notes: string | null;
  compliance_score: number | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<FormulationStatus, string> = {
  draft:       "Draft",
  in_progress: "In Progress",
  review:      "In Review",
  compliant:   "Compliant",
};

export const STATUS_BADGE_CLASSES: Record<FormulationStatus, string> = {
  draft:       "bg-zinc-50 text-zinc-500 border border-zinc-200/80",
  in_progress: "bg-brand-50 text-brand-600 border border-brand-100",
  review:      "bg-amber-50 text-amber-600 border border-amber-100",
  compliant:   "bg-emerald-50 text-emerald-700 border border-emerald-100",
};

export const STATUS_DOT_CLASSES: Record<FormulationStatus, string> = {
  draft:       "bg-zinc-400",
  in_progress: "bg-brand",
  review:      "bg-amber-400",
  compliant:   "bg-emerald-500",
};
