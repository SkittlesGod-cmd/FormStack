import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If a share_token already exists, return it.
  const { data: existing } = await supabase
    .from("formulations")
    .select("id, share_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existingToken = (existing as { share_token?: string | null }).share_token;
  if (existingToken) {
    return NextResponse.json({ token: existingToken });
  }

  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

  const { data, error } = await supabase
    .from("formulations")
    .update({ share_token: token })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("share_token")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create share link. Has the share_token column been added?", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ token: (data as { share_token?: string }).share_token ?? token });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("formulations")
    .update({ share_token: null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to revoke share link" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
