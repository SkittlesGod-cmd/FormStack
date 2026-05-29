import { createClient } from "@/utils/supabase/server";
import type { PlanId } from "./plans";

export interface Subscription {
  plan: PlanId;
  status: string;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const FREE_SUB: Subscription = {
  plan: "free",
  status: "active",
  paddle_customer_id: null,
  paddle_subscription_id: null,
  current_period_end: null,
  cancel_at_period_end: false,
};

export async function getUserSubscription(userId: string): Promise<Subscription> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, paddle_customer_id, paddle_subscription_id, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .single();

  if (!data) return FREE_SUB;

  // Treat canceled/past_due as free for gating purposes
  const effectivePlan: PlanId =
    data.status === "active" || data.status === "trialing"
      ? (data.plan as PlanId)
      : "free";

  return { ...data, plan: effectivePlan };
}

export async function getFormulationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("formulations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}
