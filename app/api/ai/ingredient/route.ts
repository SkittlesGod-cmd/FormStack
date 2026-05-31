import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, MODEL } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/ratelimit";
import { searchPubMed } from "@/lib/pubmed";
import { z } from "zod";

const bodySchema = z.object({
  ingredient_id: z.string(),
  formulation_id: z.string().uuid(),
});

const SYSTEM = `You are a clinical research scientist specializing in dietary supplement formulation. Return ONLY a JSON object, no other text.

Given an ingredient name, dose, and formulation context, return evidence enrichment data in this exact shape:
{
  "evidence_grade": "A" | "B" | "C",
  "clinical_dose_range": "e.g. '200–400 mg/day'",
  "dose_assessment": "at_studied_dose" | "below_studied_dose" | "above_studied_dose",
  "rationale": "1-2 sentences: primary mechanism, key evidence, dose context",
  "preferred_form": "most bioavailable form of this ingredient, e.g. 'Magnesium Glycinate' or null if current form is already optimal",
  "form_recommendation": "brief explanation if a better form exists, e.g. 'Glycinate absorbs 4× better than oxide at equivalent doses', or null if current form is fine",
  "cost_per_kg_usd": estimated bulk price per kg in USD as a number (e.g. 45 for common ingredients, 800 for premium extracts)
}

Evidence grade:
- A: ≥2 published RCTs showing efficacy in humans
- B: 1 RCT or strong mechanistic evidence with human data
- C: Emerging, animal-only, or very limited human data

Dose assessment relative to most effective clinical dose:
- at_studied_dose: within the clinically studied range
- below_studied_dose: lower than what achieved efficacy in RCTs
- above_studied_dose: exceeds the studied range

For cost_per_kg_usd, use realistic bulk pricing ranges (typical US supplement supplier pricing):
- Common commodities (creatine, vitamin C, zinc): 20–80
- Standard botanical extracts (ashwagandha, turmeric): 50–200
- Patented/branded extracts (KSM-66, Bioperine): 200–600
- Specialty compounds (NMN, urolithin A): 500–5000
- Probiotics per billion CFU adjust accordingly`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = await checkRateLimit(user.id);
  if (!allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ingredient_id, formulation_id } = parsed.data;

  const { data: formulation } = await supabase
    .from("formulations")
    .select("*")
    .eq("id", formulation_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!formulation) return NextResponse.json({ error: "Formulation not found" }, { status: 404 });

  const ingredient = (formulation.ingredients as any[])?.find((i: any) => i.id === ingredient_id);
  if (!ingredient) return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });

  const population = formulation.target_population ?? "general healthy adults";

  const prompt = `Ingredient: ${ingredient.name}
Dose: ${ingredient.dose || "unspecified"} ${ingredient.unit || "mg"}
Target population: ${population}
Formulation context: ${formulation.name} — ${formulation.description ?? "no description"}

Return the JSON object only.`;

  // Run AI enrichment and PubMed search in parallel
  const [aiResponse, pubmedArticles] = await Promise.allSettled([
    (async () => {
      const ai = getAIClient();
      const response = await ai.chat.completions.create({
        model: MODEL,
        max_tokens: 512,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
      });
      return response.choices[0]?.message?.content ?? "";
    })(),
    searchPubMed(
      `${ingredient.name} supplement clinical trial randomized controlled`,
      4
    ),
  ]);

  let aiResult: any = null;
  if (aiResponse.status === "fulfilled") {
    const raw = aiResponse.value;
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1) aiResult = JSON.parse(raw.slice(start, end + 1));
    } catch {}
  }

  if (!aiResult || !aiResult.evidence_grade) {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 });
  }

  const articles = pubmedArticles.status === "fulfilled" ? pubmedArticles.value : [];
  const enriched = {
    ...aiResult,
    pubmed_ids: articles.map(a => a.pmid),
    pubmed_titles: articles.map(a => a.title),
  };

  // Patch ingredient in the formulation
  const updatedIngredients = (formulation.ingredients as any[]).map((i: any) =>
    i.id === ingredient_id ? { ...i, ...enriched } : i
  );

  await supabase
    .from("formulations")
    .update({ ingredients: updatedIngredients, updated_at: new Date().toISOString() })
    .eq("id", formulation_id)
    .eq("user_id", user.id);

  return NextResponse.json({ ingredient: { ...ingredient, ...enriched }, articles });
}
