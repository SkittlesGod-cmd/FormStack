import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/utils/supabase/admin";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { token } = await params;

  if (!token || token.length < 8) {
    return NextResponse.json({ error: "Invalid share token" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Public sharing is not configured. SUPABASE_SERVICE_ROLE_KEY is missing." },
      { status: 503 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("formulations")
    .select("id, name, description, product_type, status, ingredients, target_dose, serving_size, capsule_size, capsules_per_serving, compliance_score, created_at, updated_at")
    .eq("share_token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to load formulation" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ formulation: data });
}
