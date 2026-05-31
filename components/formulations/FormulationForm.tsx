"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, Plus, Trash2, Sparkles, Loader2, X, Info, Check } from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createFormulationSchema,
  FORMULATION_STATUSES,
  STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_SERVING,
  TARGET_POPULATIONS,
  type CreateFormulationInput,
  type FormulationExcipient,
  type FormulationIngredient,
  type ProductType,
} from "@/lib/formulations/types";

export type FormulationFormValues = CreateFormulationInput & {
  ingredients: FormulationIngredient[];
  excipients?: FormulationExcipient[];
};

interface Props {
  defaultValues?: Partial<FormulationFormValues>;
  submitLabel: string;
  showStatus?: boolean;
  onSubmit: (values: FormulationFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

function newIngredient(): FormulationIngredient {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "",
    dose: "",
    unit: "mg",
  };
}

const fieldClass = "h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15";
const labelClass = "text-[12px] font-medium text-gray-600";

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1 text-[11px] leading-snug text-gray-400">
      <Info className="mt-px size-3 shrink-0" />
      {children}
    </p>
  );
}

const UNIT_OPTIONS = ["mg", "mcg", "g", "IU", "CFU", "mL", "%DV", "mg NE", "mg ATE"];

// ── Sortable ingredient row ────────────────────────────────────────────────────
interface SortableIngredientRowProps {
  fieldId: string;
  idx: number;
  register: ReturnType<typeof useForm<FormulationFormValues>>["register"];
  control: ReturnType<typeof useForm<FormulationFormValues>>["control"];
  onRemove: () => void;
}

function SortableIngredientRow({ fieldId, idx, register, control, onRemove }: SortableIngredientRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-12 items-center gap-2 rounded-lg border border-black/[0.06] bg-gray-50/50 p-2.5"
    >
      <div className="col-span-1 flex justify-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-gray-300 hover:text-gray-500 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      <Controller
        control={control}
        name={`ingredients.${idx}.id`}
        render={({ field: f }) => <input type="hidden" {...f} value={f.value ?? ""} />}
      />
      <div className="col-span-11 md:col-span-5">
        <Input
          {...register(`ingredients.${idx}.name`)}
          placeholder="e.g. L-Theanine, Ashwagandha KSM-66®"
          className={cn(fieldClass, "h-8")}
        />
      </div>
      <div className="col-span-5 md:col-span-2">
        <Input
          {...register(`ingredients.${idx}.dose`)}
          placeholder="200"
          className={cn(fieldClass, "h-8")}
        />
      </div>
      <div className="col-span-5 md:col-span-2">
        <select
          {...register(`ingredients.${idx}.unit`)}
          className={cn(fieldClass, "h-8")}
        >
          {UNIT_OPTIONS.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2 md:col-span-2 flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="flex size-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

const COMMON_EXCIPIENTS = [
  { name: "Magnesium Stearate", function: "lubricant" },
  { name: "Silicon Dioxide (Silica)", function: "flow agent" },
  { name: "Microcrystalline Cellulose (MCC)", function: "filler/binder" },
  { name: "Hydroxypropyl Methylcellulose (HPMC)", function: "capsule shell" },
  { name: "Stearic Acid", function: "lubricant" },
  { name: "Rice Flour", function: "filler" },
  { name: "Dicalcium Phosphate", function: "filler/binder" },
];

function ExcipientsSection({
  register,
  watch,
  setValue,
}: {
  register: any;
  watch: any;
  setValue: any;
}) {
  const excipients: FormulationExcipient[] = watch("excipients") ?? [];

  function add(name: string, fn: string) {
    if (excipients.some(e => e.name === name)) return;
    setValue("excipients", [
      ...excipients,
      { id: crypto.randomUUID(), name, function: fn, amount_pct: undefined },
    ]);
  }

  function remove(id: string) {
    setValue("excipients", excipients.filter(e => e.id !== id));
  }

  return (
    <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="border-b border-black/[0.05] px-5 py-3.5">
        <h2 className="text-[13px] font-semibold text-gray-900">Excipients & inactive ingredients</h2>
        <p className="mt-0.5 text-[11px] text-gray-400">Flow agents, fillers, lubricants — required on the Supplement Facts panel. Affects fill weight calculation.</p>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {COMMON_EXCIPIENTS.map(e => {
            const added = excipients.some(x => x.name === e.name);
            return (
              <button
                type="button"
                key={e.name}
                onClick={() => added ? remove(excipients.find(x => x.name === e.name)!.id) : add(e.name, e.function)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                  added
                    ? "border-gray-950 bg-gray-950 text-white"
                    : "border-black/[0.08] bg-white text-gray-500 hover:border-black/20 hover:text-gray-900"
                )}
              >
                {added && <Check className="mr-1 inline size-3" />}
                {e.name}
                <span className="ml-1 text-[9px] opacity-60">({e.function})</span>
              </button>
            );
          })}
        </div>
        {excipients.length > 0 && (
          <ul className="space-y-2">
            {excipients.map((exc, idx) => (
              <li key={exc.id} className="flex items-center gap-2 rounded-lg border border-black/[0.06] bg-gray-50/50 px-3 py-2">
                <span className="flex-1 text-[12px] text-gray-900">{exc.name}</span>
                <span className="text-[11px] text-gray-400">{exc.function}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="%"
                  value={exc.amount_pct ?? ""}
                  onChange={e => {
                    const updated = [...excipients];
                    updated[idx] = { ...updated[idx], amount_pct: e.target.value ? Number(e.target.value) : undefined };
                    setValue("excipients", updated);
                  }}
                  className="w-16 rounded-md border border-black/[0.08] bg-white px-2 py-1 text-[12px] text-center outline-none focus:border-brand"
                />
                <span className="text-[11px] text-gray-400">% of fill</span>
                <button type="button" onClick={() => remove(exc.id)} className="text-gray-300 hover:text-red-500 transition">
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-gray-400">Total fill = actives + excipients. Typical excipient load: 2–5% lubricant + 5–20% filler.</p>
      </div>
    </section>
  );
}

export function FormulationForm({ defaultValues, submitLabel, showStatus = false, onSubmit, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestGoal, setSuggestGoal] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, formState: { errors }, setValue } = useForm<FormulationFormValues>({
    resolver: zodResolver(createFormulationSchema) as any,
    defaultValues: {
      name: "", description: "", product_type: null, status: "draft",
      target_dose: "", serving_size: "", capsule_size: "",
      capsules_per_serving: null, notes: "", ingredients: [],
      target_population: "", excipients: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "ingredients" });
  const watchedIngredients = watch("ingredients");
  const watchedProductType = watch("product_type") as ProductType | null | undefined;

  const showCapsuleFields = !watchedProductType ||
    watchedProductType === "capsule" ||
    watchedProductType === "softgel";

  const servingPlaceholder = watchedProductType
    ? PRODUCT_TYPE_SERVING[watchedProductType as ProductType] ?? "e.g. 2 capsules"
    : "e.g. 2 capsules";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = fields.findIndex(f => f.id === active.id);
    const newIdx = fields.findIndex(f => f.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) move(oldIdx, newIdx);
  }

  async function runSuggest() {
    if (!suggestGoal.trim() || suggesting) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      const existing = (watchedIngredients ?? []).map(i => i.name).filter(Boolean);
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: suggestGoal, existing_ingredients: existing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Suggestion failed");
      const suggestions: Array<{ name: string; dose: string; unit: string }> = data.suggestions ?? [];
      suggestions.forEach(s => {
        append({ id: crypto.randomUUID(), name: s.name, dose: s.dose ?? "", unit: s.unit ?? "mg" });
      });
      setSuggestOpen(false);
      setSuggestGoal("");
    } catch (e: any) {
      setSuggestError(e.message ?? "Suggestion failed");
    } finally {
      setSuggesting(false);
    }
  }

  const internalSubmit = handleSubmit(async values => {
    setSubmitting(true);
    try { await onSubmit(values); } finally { setSubmitting(false); }
  });

  return (
    <form onSubmit={internalSubmit} className="space-y-5">

      {watchedProductType && (
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-brand/20 bg-brand/[0.05] px-3 py-1 text-[12px] font-medium text-brand">
            {PRODUCT_TYPE_LABELS[watchedProductType as ProductType] ?? watchedProductType}
          </span>
          <span className="text-[12px] text-gray-400">delivery format</span>
        </div>
      )}

      <input type="hidden" {...register("product_type")} />

      {/* Basic info */}
      <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">Product identity</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">Name and intended purpose of this formulation.</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="name" className={labelClass}>
              Product name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. Focus Stack Pro, Daily Calm Capsule, Recovery Blend"
              className={cn(fieldClass, errors.name && "border-red-400")}
            />
            {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            <FieldHint>Use a name that reflects the product's primary benefit or SKU identifier.</FieldHint>
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="description" className={labelClass}>Health claim / intended purpose</Label>
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              placeholder="Describe what this product is designed to do — e.g. 'Supports cognitive performance and sustained focus in healthy adults.' This text informs compliance review and label copy."
              className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15 resize-none"
            />
            <FieldHint>Keep to structure/function claims only. Avoid disease claims (e.g. "treats", "cures").</FieldHint>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target_population" className={labelClass}>Target population</Label>
            <select id="target_population" {...register("target_population")} className={fieldClass}>
              <option value="">— Select target population —</option>
              {TARGET_POPULATIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <FieldHint>Affects AI dose recommendations — clinical doses vary by population (age, sex, health status).</FieldHint>
          </div>

          {showStatus && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status" className={labelClass}>Pipeline status</Label>
              <select id="status" {...register("status")} className={fieldClass}>
                {FORMULATION_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <FieldHint>Track where this formula sits in your R&D pipeline.</FieldHint>
            </div>
          )}
        </div>
      </section>

      {/* Dosage & format */}
      <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">Dosage & format specs</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Manufacturing parameters used in the Supplement Facts panel and bill of materials.
          </p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="serving_size" className={labelClass}>Serving size</Label>
            <Input
              id="serving_size"
              {...register("serving_size")}
              placeholder={servingPlaceholder}
              className={fieldClass}
            />
            <FieldHint>
              {watchedProductType === "powder"
                ? "Typically one scoop — include gram weight (e.g. 1 scoop / 5g)."
                : watchedProductType === "liquid"
                ? "Dropper size or volume in mL (e.g. 1 mL, 30 drops)."
                : "Number of units per serving as it will appear on the label."}
            </FieldHint>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target_dose" className={labelClass}>Total active dose per serving</Label>
            <Input
              id="target_dose"
              {...register("target_dose")}
              placeholder="e.g. 850 mg total actives"
              className={fieldClass}
            />
            <FieldHint>Sum of all active ingredient weights — used to estimate fill weight and capsule count.</FieldHint>
          </div>

          {showCapsuleFields && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="capsule_size" className={labelClass}>
                  {watchedProductType === "softgel" ? "Softgel size" : "Capsule size"}
                </Label>
                <select id="capsule_size" {...register("capsule_size")} className={fieldClass}>
                  <option value="">— Select —</option>
                  {watchedProductType === "softgel"
                    ? ["Mini (0.3 mL)", "Small (0.5 mL)", "Medium (1.0 mL)", "Large (1.5 mL)", "Jumbo (2.0 mL)"].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))
                    : ["#000 (1.37 mL)", "#00 (0.91 mL)", "#0 (0.68 mL)", "#1 (0.50 mL)", "#2 (0.37 mL)", "#3 (0.30 mL)", "#4 (0.21 mL)"].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))
                  }
                </select>
                <FieldHint>
                  {watchedProductType === "softgel"
                    ? "Softgel fill volume determines maximum liquid payload per unit."
                    : "#00 (~500–600 mg fill) is the most common retail capsule. #000 holds ~800–1000 mg."}
                </FieldHint>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="capsules_per_serving" className={labelClass}>
                  {watchedProductType === "softgel" ? "Softgels per serving" : "Capsules per serving"}
                </Label>
                <Input
                  id="capsules_per_serving"
                  type="number"
                  min={1}
                  max={20}
                  {...register("capsules_per_serving", {
                    setValueAs: v => (v === "" || v == null) ? null : Number(v),
                  })}
                  placeholder="e.g. 2"
                  className={cn(fieldClass, errors.capsules_per_serving && "border-red-400")}
                />
                {errors.capsules_per_serving && (
                  <p className="text-[11px] text-red-500">{errors.capsules_per_serving.message}</p>
                )}
                <FieldHint>Higher counts allow more total fill weight but affect consumer compliance.</FieldHint>
              </div>
            </>
          )}

          {watchedProductType === "tablet" && (
            <div className="md:col-span-2">
              <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 text-[12px] text-amber-700">
                Tablet specs are managed in the manufacturing dossier. Record your total tablet weight in "Total active dose" above.
              </div>
            </div>
          )}

          {watchedProductType === "gummy" && (
            <div className="md:col-span-2">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] text-blue-700">
                Gummy specs (pectin vs gelatin, sugar content, moisture) are handled in the manufacturing spec sheet.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Ingredients */}
      <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900">Active ingredients</h2>
            <p className="text-[11px] text-gray-400">Drag to reorder. Each compound, dose, and unit as in the Supplement Facts panel.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setSuggestOpen(v => !v); setSuggestError(null); }}
              className="flex items-center gap-1.5 rounded-md border border-brand/20 bg-brand/[0.04] px-3 py-1.5 text-[12px] font-medium text-brand transition hover:bg-brand/[0.08]"
            >
              <Sparkles className="size-3.5" />
              AI suggest
            </button>
            <button
              type="button"
              onClick={() => append(newIngredient())}
              className="flex items-center gap-1.5 rounded-md border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02]"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* AI suggest panel */}
        {suggestOpen && (
          <div className="border-b border-black/[0.05] bg-brand/[0.02] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 mt-0.5">
                <Sparkles className="size-3.5 text-brand" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[13px] font-medium text-gray-900">AI ingredient suggestions</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Describe the health goal — AI returns evidence-backed compounds with clinical doses.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={suggestGoal}
                    onChange={e => setSuggestGoal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), runSuggest())}
                    placeholder="e.g. Cognitive performance, sleep quality, stress resilience…"
                    className="h-9 flex-1 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={runSuggest}
                    disabled={!suggestGoal.trim() || suggesting}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
                  >
                    {suggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    {suggesting ? "Thinking…" : "Suggest"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSuggestOpen(false); setSuggestGoal(""); setSuggestError(null); }}
                    className="flex size-9 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-gray-400 transition hover:text-gray-700"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                {suggestError && <p className="text-[12px] text-red-500">{suggestError}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="p-5">
          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/[0.08] py-10 text-center">
              <p className="text-[12px] font-medium text-gray-500">No ingredients yet</p>
              <p className="mt-1 text-[11px] text-gray-400">
                Use "AI suggest" to auto-populate from a health goal, or add manually.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-1">
                <span className="col-span-1" />
                <span className="col-span-11 text-[11px] font-semibold uppercase tracking-widest text-gray-400 md:col-span-5">Ingredient / compound</span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 md:col-span-2 md:block">Dose</span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 md:col-span-2 md:block">Unit</span>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  {fields.map((field, idx) => (
                    <SortableIngredientRow
                      key={field.id}
                      fieldId={field.id}
                      idx={idx}
                      register={register}
                      control={control}
                      onRemove={() => remove(idx)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <p className="pt-1 text-[11px] text-gray-400">
                {fields.length} ingredient{fields.length !== 1 ? "s" : ""} — list all actives exactly as they will appear in the Supplement Facts panel.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">Internal notes</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">Sourcing preferences, manufacturing constraints, claim ideas, open questions.</p>
        </div>
        <div className="p-5">
          <textarea
            {...register("notes")}
            rows={4}
            placeholder="e.g. Prefer KSM-66® ashwagandha from Ixoreal. Target MSRP $49.99. Considering 'promotes calm focus' as primary claim…"
            className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15 resize-none"
          />
        </div>
      </section>

      {/* Excipients */}
      <ExcipientsSection register={register} watch={watch} setValue={setValue} />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-black/[0.08] bg-white px-4 py-2 text-[13px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gray-950 px-5 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
