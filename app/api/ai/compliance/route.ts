import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, MODEL } from "@/lib/ai/client";
import { COMPLIANCE_SYSTEM } from "@/lib/ai/prompts";
import { z } from "zod";

const bodySchema = z.object({
  formulation_id: z.string().uuid(),
});

function repairJson(s: string): any | null {
  try { return JSON.parse(s); } catch {}

  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  const suffix = (inString ? '"' : "") + stack.reverse().join("");
  if (suffix) {
    const trimmed = s.replace(/,\s*$/, "");
    try { return JSON.parse(trimmed + suffix); } catch {}
    const lastComma = trimmed.lastIndexOf(",");
    if (lastComma > 0) {
      try { return JSON.parse(trimmed.slice(0, lastComma) + suffix); } catch {}
    }
  }
  return null;
}

function extractJson(raw: string): any | null {
  // Try the full string first
  const direct = repairJson(raw.trim());
  if (direct && typeof direct === "object") return direct;

  // Find the outermost { ... }
  const start = raw.indexOf("{");
  if (start === -1) return null;

  // Try everything from first { to end (handles truncated JSON)
  const fromStart = repairJson(raw.slice(start));
  if (fromStart && typeof fromStart === "object") return fromStart;

  // Find matching close brace
  let depth = 0, end = -1, inStr = false, esc = false;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (esc) { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end !== -1) {
    const slice = repairJson(raw.slice(start, end + 1));
    if (slice && typeof slice === "object") return slice;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { formulation_id } = parsed.data;

  const { data: formulation, error: fetchErr } = await supabase
    .from("formulations")
    .select("*")
    .eq("id", formulation_id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !formulation) {
    return NextResponse.json({ error: "Formulation not found" }, { status: 404 });
  }

  const ingredientList = Array.isArray(formulation.ingredients) && formulation.ingredients.length > 0
    ? formulation.ingredients.map((ing: any) => `- ${ing.name}: ${ing.dose || "?"}${ing.unit || "mg"}`).join("\n")
    : "No ingredients specified";

  const prompt = `Analyze this formulation for FDA compliance:

Name: ${formulation.name}
Description: ${formulation.description ?? "Not specified"}
Serving size: ${formulation.serving_size ?? "Not specified"}

Ingredients:
${ingredientList}

Notes / Intended claims: ${formulation.notes ?? "None"}

Return ONLY the JSON object. Start with { and end with }.`;

  try {
    const ai = getAIClient();
    const message = await ai.chat.completions.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        { role: "system", content: COMPLIANCE_SYSTEM },
        { role: "user", content: prompt },
      ],
    });

    const raw = message.choices[0]?.message?.content ?? "";
    const result = extractJson(raw);

    if (!result || typeof result.score !== "number") {
      // Return a safe fallback rather than 502 — the formulation still gets saved
      const fallback = {
        score: 50,
        summary: "Compliance analysis could not be fully parsed. Manual review recommended.",
        regulatory_category: "unclear",
        issues: [{ severity: "medium", ingredient: null, issue: "Automated analysis incomplete", detail: "The AI response could not be parsed. Please run compliance again or review manually." }],
        compliant_claims: [],
        risky_claims: [],
        recommendations: ["Re-run compliance analysis", "Review formulation claims manually before launch"],
      };
      await supabase.from("formulations").update({ compliance_score: 50, updated_at: new Date().toISOString() }).eq("id", formulation_id).eq("user_id", user.id);
      return NextResponse.json(fallback);
    }

    const score = Math.round(Math.min(100, Math.max(0, result.score)));
    await supabase
      .from("formulations")
      .update({ compliance_score: score, updated_at: new Date().toISOString() })
      .eq("id", formulation_id)
      .eq("user_id", user.id);

    return NextResponse.json({ ...result, score });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "AI request failed" }, { status: 500 });
  }
}
