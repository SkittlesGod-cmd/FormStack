import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserSubscription, getFormulationCount } from "@/lib/billing/subscription";

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [sub, count] = await Promise.all([
    getUserSubscription(user.id),
    getFormulationCount(user.id),
  ]);

  return NextResponse.json({ subscription: sub, formulation_count: count });
}
