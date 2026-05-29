export type PlanId = "free" | "starter" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // USD per month
  priceId: string | null; // Paddle price ID
  formulationLimit: number; // -1 = unlimited
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceId: null,
    formulationLimit: 3,
    features: [
      "3 formulations",
      "AI ingredient research",
      "Supplement Facts panel",
      "Basic compliance check",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 49,
    priceId: process.env.PADDLE_STARTER_PRICE_ID ?? null,
    formulationLimit: 15,
    highlighted: true,
    features: [
      "15 formulations",
      "Full AI formulation builder",
      "Autonomous research → formulate flow",
      "Compliance auto-fix loop",
      "PDF dossier export",
      "Priority AI processing",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 149,
    priceId: process.env.PADDLE_PRO_PRICE_ID ?? null,
    formulationLimit: -1,
    features: [
      "Unlimited formulations",
      "Everything in Starter",
      "Manufacturer handoff & RFQ brief",
      "Formulation versioning",
      "Public share links",
      "Team collaboration (coming soon)",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro"];

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}

export function canCreateFormulation(plan: PlanId, currentCount: number): boolean {
  const limit = PLANS[plan].formulationLimit;
  if (limit === -1) return true;
  return currentCount < limit;
}

export function canUseBuilder(plan: PlanId): boolean {
  return plan === "starter" || plan === "pro";
}

export function canUseHandoff(plan: PlanId): boolean {
  return plan === "pro";
}

export function canUseVersioning(plan: PlanId): boolean {
  return plan === "pro";
}
