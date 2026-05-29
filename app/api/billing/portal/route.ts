import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getPaddleClient } from "@/lib/billing/paddle";
import { getUserSubscription } from "@/lib/billing/subscription";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getUserSubscription(user.id);
  if (!sub.paddle_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  try {
    const paddle = getPaddleClient();
    const session = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id,
      sub.paddle_subscription_id ? [sub.paddle_subscription_id] : []
    );
    return NextResponse.json({ url: (session as any).urls?.general?.overview ?? (session as any).url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to create portal session" }, { status: 500 });
  }
}
