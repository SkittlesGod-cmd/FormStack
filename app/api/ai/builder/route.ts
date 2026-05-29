import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, MODEL, MAX_TOKENS } from "@/lib/ai/client";
import {
  BUILDER_RESEARCH_SYSTEM,
  BUILDER_FORMULATE_SYSTEM,
  BUILDER_REFINE_SYSTEM,
  BUILDER_COMPLIANCE_REFINE_SYSTEM,
} from "@/lib/ai/prompts";
import { z } from "zod";

const bodySchema = z.object({
  phase: z.union([
    z.literal("research"),
    z.literal("formulate"),
    z.literal("refine"),
    z.literal("compliance_refine"),
  ]),
  intake: z.object({
    product_type: z.string(),
    health_goal: z.string(),
    consumer: z.string().optional(),
    requirements: z.string().optional(),
  }),
  context: z.object({
    research: z.string().optional(),
    formulation_json: z.string().optional(),
    feedback: z.string().optional(),
    compliance_result: z.string().optional(),
  }).optional(),
});

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

  const { phase, intake, context } = parsed.data;

  let system: string;
  let userMessage: string;

  if (phase === "research") {
    system = BUILDER_RESEARCH_SYSTEM;
    userMessage = `Research ingredients for a ${intake.product_type} product targeting: ${intake.health_goal}${
      intake.consumer ? `\nTarget consumer: ${intake.consumer}` : ""
    }${
      intake.requirements ? `\nSpecial requirements: ${intake.requirements}` : ""
    }

IMPORTANT: Begin with the mandatory regulatory classification before any ingredient research.`;

  } else if (phase === "formulate") {
    system = BUILDER_FORMULATE_SYSTEM;
    userMessage = `Create a complete, FDA-compliant ${intake.product_type} formulation for: ${intake.health_goal}${
      intake.consumer ? `\nTarget consumer: ${intake.consumer}` : ""
    }${
      intake.requirements ? `\nSpecial requirements: ${intake.requirements}` : ""
    }

Based on this research:
${context?.research ?? "No prior research provided."}

CRITICAL: Apply all compliance rules. Use only compliant claim language. No disease names anywhere in the JSON fields.`;

  } else if (phase === "refine") {
    system = BUILDER_REFINE_SYSTEM;
    userMessage = `Current formulation:
${context?.formulation_json ?? ""}

User feedback and requested changes:
${context?.feedback ?? "Apply general improvements for efficacy and clinical backing."}

Goal: ${intake.health_goal}
Product type: ${intake.product_type}

IMPORTANT: Fix any compliance issues you notice (disease claim language, unsafe doses) in addition to the user's requested changes.`;

  } else {
    // compliance_refine
    system = BUILDER_COMPLIANCE_REFINE_SYSTEM;
    userMessage = `Fix this formulation to achieve a compliance score of 85+.

CURRENT FORMULATION:
${context?.formulation_json ?? ""}

COMPLIANCE ANALYSIS (what failed):
${context?.compliance_result ?? ""}

Product type: ${intake.product_type}
Health goal: ${intake.health_goal}

Apply every fix identified in the compliance analysis. Output the complete revised formulation as JSON.`;
  }

  try {
    const ai = getAIClient();
    const stream = await ai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(enc.encode(text));
          }
        } finally {
          controller.close();
        }
      },
      cancel() { stream.controller.abort(); },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "AI request failed" }, { status: 500 });
  }
}
