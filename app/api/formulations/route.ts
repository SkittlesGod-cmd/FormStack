import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";
import {
  FORMULATION_STATUSES,
  createFormulationSchema,
} from "@/lib/formulations/types";
import { getUserSubscription, getFormulationCount } from "@/lib/billing/subscription";
import { canCreateFormulation } from "@/lib/billing/plans";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status")?.trim();

  let query = supabase
    .from("formulations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (search) {
    // ilike is safe for user-supplied text via the supabase JS client (parameterised)
    query = query.ilike("name", `%${search}%`);
  }

  if (
    status &&
    (FORMULATION_STATUSES as readonly string[]).includes(status)
  ) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch formulations", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ formulations: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Plan gating
  const [sub, count] = await Promise.all([
    getUserSubscription(user.id),
    getFormulationCount(user.id),
  ]);
  if (!canCreateFormulation(sub.plan, count)) {
    return NextResponse.json(
      { error: "Formulation limit reached. Upgrade your plan to create more.", plan: sub.plan, limit: true },
      { status: 403 }
    );
  }

  const parsed = createFormulationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: z.treeifyError(parsed.error),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const { data, error } = await supabase
    .from("formulations")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description ?? null,
      product_type: input.product_type ?? null,
      status: input.status ?? "draft",
      ingredients: input.ingredients ?? [],
      target_dose: input.target_dose ?? null,
      serving_size: input.serving_size ?? null,
      capsule_size: input.capsule_size ?? null,
      capsules_per_serving: input.capsules_per_serving ?? null,
      notes: input.notes ?? null,
      compliance_score: input.compliance_score ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create formulation", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ formulation: data }, { status: 201 });
}
