import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Confirm ownership of the formulation first.
  const { data: f } = await supabase
    .from("formulations")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!f) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("formulation_versions")
    .select("id, version, snapshot, created_at")
    .eq("formulation_id", id)
    .eq("user_id", user.id)
    .order("version", { ascending: false });

  if (error) {
    // If table missing, return empty list rather than crashing.
    return NextResponse.json({ versions: [] });
  }

  return NextResponse.json({ versions: data ?? [] });
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: current } = await supabase
    .from("formulations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const version = (current as { version?: number }).version ?? 1;

  const { data, error } = await supabase
    .from("formulation_versions")
    .insert({
      formulation_id: id,
      user_id: user.id,
      version,
      snapshot: current,
    })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to snapshot", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ version: data }, { status: 201 });
}
