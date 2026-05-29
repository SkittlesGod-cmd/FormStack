"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ArrowRight, Loader2, ExternalLink, Zap, AlertCircle } from "lucide-react";
import { PLANS, PLAN_ORDER, getPlan, type PlanId } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BillingState {
  plan: PlanId;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  formulation_count: number;
}

declare global {
  interface Window {
    Paddle?: any;
  }
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const upgradePlan = searchParams.get("upgrade");
  const paddleLoaded = useRef(false);

  const [state, setState] = useState<BillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Load Paddle.js
  useEffect(() => {
    if (paddleLoaded.current) return;
    paddleLoaded.current = true;

    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? "sandbox";
    if (!clientToken) return;

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (window.Paddle) {
        if (env !== "production") window.Paddle.Environment.set("sandbox");
        window.Paddle.Initialize({ token: clientToken });
      }
    };
    document.head.appendChild(script);
  }, []);

  // Fetch subscription state
  useEffect(() => {
    fetch("/api/billing/subscription")
      .then(r => r.json())
      .then(data => {
        setState({
          plan: data.subscription.plan,
          status: data.subscription.status,
          current_period_end: data.subscription.current_period_end,
          cancel_at_period_end: data.subscription.cancel_at_period_end,
          formulation_count: data.formulation_count,
        });
      })
      .catch(() => toast.error("Could not load billing info"))
      .finally(() => setLoading(false));
  }, []);

  // Auto-open checkout if redirected from pricing page
  useEffect(() => {
    if (!upgradePlan || !state || state.plan !== "free") return;
    const timer = setTimeout(() => openCheckout(upgradePlan), 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgradePlan, state]);

  async function openCheckout(planId: string) {
    const plan = PLANS[planId as PlanId];
    if (!plan?.priceId) {
      toast.error("Price ID not configured yet — add PADDLE_STARTER_PRICE_ID / PADDLE_PRO_PRICE_ID to .env.local");
      return;
    }
    if (!window.Paddle) {
      toast.error("Paddle.js not loaded — add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN to .env.local");
      return;
    }

    setCheckoutLoading(planId);

    // Get user email for pre-fill
    const userRes = await fetch("/api/auth/user").catch(() => null);
    const userData = userRes ? await userRes.json().catch(() => ({})) : {};

    window.Paddle.Checkout.open({
      items: [{ priceId: plan.priceId, quantity: 1 }],
      customer: userData.email ? { email: userData.email } : undefined,
      customData: userData.id ? { user_id: userData.id } : undefined,
      settings: { displayMode: "overlay", theme: "light" },
      events: {
        onCompleted: () => {
          toast.success("Subscription activated! Refreshing…");
          setTimeout(() => window.location.reload(), 2000);
        },
        onClose: () => setCheckoutLoading(null),
      },
    });
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  const currentPlan = getPlan(state?.plan);
  const formulationLimit = currentPlan.formulationLimit;
  const used = state?.formulation_count ?? 0;
  const usagePct = formulationLimit === -1 ? 0 : Math.min(100, (used / formulationLimit) * 100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Account</p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-gray-950">Billing</h1>
        <p className="mt-1 text-[13px] text-gray-500">
          Manage your plan and usage. Payments handled by Paddle.
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {/* Current plan card */}
          <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="border-b border-black/[0.05] px-5 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Current plan</p>
            </div>
            <div className="flex items-center justify-between gap-6 p-5">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  currentPlan.highlighted ? "bg-brand/10" : "bg-gray-100"
                )}>
                  <Zap className={cn("size-5", currentPlan.highlighted ? "text-brand" : "text-gray-400")} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-900">{currentPlan.name}</p>
                  <p className="text-[12px] text-gray-400">
                    {state?.status === "active" ? "Active" : state?.status}
                    {state?.cancel_at_period_end && " · Cancels at period end"}
                    {state?.current_period_end && !state.cancel_at_period_end && (
                      <> · Renews {new Date(state.current_period_end).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
              {state?.plan !== "free" && (
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-gray-50 px-4 py-2 text-[12px] font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  {portalLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
                  Manage subscription
                </button>
              )}
            </div>

            {/* Usage bar */}
            <div className="border-t border-black/[0.05] px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-medium text-gray-600">Formulations used</p>
                <p className="text-[12px] font-semibold text-gray-900">
                  {used} / {formulationLimit === -1 ? "∞" : formulationLimit}
                </p>
              </div>
              {formulationLimit !== -1 && (
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      usagePct >= 90 ? "bg-red-400" : usagePct >= 70 ? "bg-amber-400" : "bg-brand"
                    )}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              )}
              {formulationLimit !== -1 && usagePct >= 80 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                  <AlertCircle className="size-3.5 shrink-0 text-amber-500" />
                  <p className="text-[12px] text-amber-700">
                    {used >= formulationLimit
                      ? "You've reached your formulation limit. Upgrade to create more."
                      : `You're at ${Math.round(usagePct)}% of your limit.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Plan comparison */}
          {state?.plan === "free" && (
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Upgrade your plan</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {PLAN_ORDER.filter(p => p !== "free").map(planId => {
                  const plan = PLANS[planId];
                  return (
                    <div
                      key={planId}
                      className={cn(
                        "relative rounded-xl border p-6",
                        plan.highlighted
                          ? "border-brand/30 bg-brand/[0.02]"
                          : "border-black/[0.07] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                      )}
                    >
                      {plan.highlighted && (
                        <span className="absolute right-4 top-4 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                          Popular
                        </span>
                      )}
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-[26px] font-semibold tracking-tight text-gray-950">${plan.price}</span>
                        <span className="text-[12px] text-gray-400">/mo</span>
                        <span className="ml-2 text-[13px] font-semibold text-gray-600">{plan.name}</span>
                      </div>
                      <ul className="mb-5 space-y-2">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className={cn("mt-0.5 size-3.5 shrink-0", plan.highlighted ? "text-brand" : "text-gray-400")} />
                            <span className="text-[12px] text-gray-700">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => openCheckout(planId)}
                        disabled={checkoutLoading === planId}
                        className={cn(
                          "flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-medium transition disabled:opacity-50",
                          plan.highlighted
                            ? "bg-brand text-white hover:bg-brand/90"
                            : "bg-gray-950 text-white hover:bg-gray-800"
                        )}
                      >
                        {checkoutLoading === planId
                          ? <><Loader2 className="size-3.5 animate-spin" /> Opening checkout…</>
                          : <>Upgrade to {plan.name} <ArrowRight className="size-3.5" /></>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
