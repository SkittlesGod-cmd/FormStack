import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { EventName } from "@paddle/paddle-node-sdk";
import { createClient } from "@/utils/supabase/server";
import { PADDLE_WEBHOOK_SECRET } from "@/lib/billing/paddle";
import type { PlanId } from "@/lib/billing/plans";

// Verify Paddle signature without the SDK's 5-second timestamp window
// (Paddle reuses the original ts on retries, so the SDK always rejects retried webhooks)
function verifySignature(rawBody: string, secret: string, signatureHeader: string): boolean {
  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) parts[k] = v;
  }
  if (!parts.ts || !parts.h1) return false;
  const computed = createHmac("sha256", secret).update(`${parts.ts}:${rawBody}`).digest("hex");
  return computed === parts.h1;
}

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

  if (!verifySignature(rawBody, PADDLE_WEBHOOK_SECRET, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();
  const eventType: string = event.event_type ?? "";

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
    console.log("[webhook] sub.custom_data:", JSON.stringify(sub.custom_data));
    console.log("[webhook] sub.customer_id:", sub.customer_id);
    console.log("[webhook] sub.items:", JSON.stringify(sub.items?.[0]));
    const userId: string | undefined = sub.custom_data?.user_id;
    if (!userId) {
      console.log("[webhook] no user_id in custom_data — skipping upsert");
      return NextResponse.json({ received: true });
    }

    const priceId = sub.items?.[0]?.price?.id;
    const plan = planFromPriceId(priceId);

    await upsertSubscription({
      user_id: userId,
      paddle_customer_id: sub.customer_id,
      paddle_subscription_id: sub.id,
      plan,
      status: sub.status,
      current_period_end: sub.current_billing_period?.ends_at ?? null,
      cancel_at_period_end: sub.scheduled_change?.action === "cancel",
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
