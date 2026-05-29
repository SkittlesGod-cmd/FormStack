import { NextRequest, NextResponse } from "next/server";
import { Webhooks, EventName } from "@paddle/paddle-node-sdk";
import { createClient } from "@/utils/supabase/server";
import { PADDLE_WEBHOOK_SECRET } from "@/lib/billing/paddle";
import type { PlanId } from "@/lib/billing/plans";

// Map Paddle price IDs → plan IDs
function planFromPriceId(priceId: string | undefined): PlanId {
  if (!priceId) return "free";
  if (priceId === process.env.PADDLE_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.PADDLE_PRO_PRICE_ID) return "pro";
  return "free";
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") ?? "";

  if (!PADDLE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: any;
  try {
    event = await new Webhooks().unmarshal(rawBody, PADDLE_WEBHOOK_SECRET, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = await createClient();
  const eventType: string = event.eventType ?? event.event_type ?? "";

  // Helper — upsert subscription row
  async function upsertSubscription(data: Record<string, unknown>) {
    await supabase
      .from("subscriptions")
      .upsert(data, { onConflict: "paddle_subscription_id" });
  }

  if (
    eventType === EventName.SubscriptionCreated ||
    eventType === EventName.SubscriptionActivated ||
    eventType === EventName.SubscriptionUpdated ||
    eventType === EventName.SubscriptionTrialing
  ) {
    const sub = event.data;
    const userId: string | undefined = sub.customData?.user_id;
    if (!userId) return NextResponse.json({ received: true });

    const priceId = sub.items?.[0]?.price?.id;
    const plan = planFromPriceId(priceId);

    await upsertSubscription({
      user_id: userId,
      paddle_customer_id: sub.customerId,
      paddle_subscription_id: sub.id,
      plan,
      status: sub.status,
      current_period_end: sub.currentBillingPeriod?.endsAt ?? null,
      cancel_at_period_end: sub.scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    });
  }

  if (eventType === EventName.SubscriptionCanceled) {
    const sub = event.data;
    await supabase
      .from("subscriptions")
      .update({ status: "canceled", plan: "free", updated_at: new Date().toISOString() })
      .eq("paddle_subscription_id", sub.id);
  }

  if (eventType === EventName.SubscriptionPastDue || eventType === EventName.SubscriptionPaused) {
    const sub = event.data;
    await supabase
      .from("subscriptions")
      .update({ status: sub.status, updated_at: new Date().toISOString() })
      .eq("paddle_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
