"use client";

import Link from "next/link";
import { Check, ArrowRight, Zap } from "lucide-react";
import { PLANS, PLAN_ORDER } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  function handleCheckout(planId: string) {
    window.location.href = `/dashboard/billing?upgrade=${planId}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-gray-950">
            NutraCloud
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[13px] text-gray-500 hover:text-gray-800 transition">
              Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-gray-950 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-gray-800 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-14 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Pricing</p>
          <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.03em] text-gray-950">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-[15px] text-gray-500 max-w-md mx-auto">
            Start free. Upgrade when you&apos;re ready to scale.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {PLAN_ORDER.map(planId => {
            const plan = PLANS[planId];
            return (
              <div
                key={planId}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-7",
                  plan.highlighted
                    ? "border-brand bg-white shadow-[0_0_0_1px_var(--color-brand),0_8px_32px_rgba(0,0,0,0.08)]"
                    : "border-black/[0.08] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white">
                      <Zap className="size-3" />
                      Most popular
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-[13px] font-semibold text-gray-500">{plan.name}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-[34px] font-semibold tracking-tight text-gray-950">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-[13px] text-gray-400">/mo</span>
                    )}
                  </div>
                </div>

                <ul className="my-7 flex-1 space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={cn(
                        "mt-0.5 size-4 shrink-0",
                        plan.highlighted ? "text-brand" : "text-gray-400"
                      )} />
                      <span className="text-[13px] text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>

                {planId === "free" ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] bg-gray-50 py-2.5 text-[13px] font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Get started free
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCheckout(planId)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-medium transition",
                      plan.highlighted
                        ? "bg-brand text-white hover:bg-brand/90"
                        : "bg-gray-950 text-white hover:bg-gray-800"
                    )}
                  >
                    Get {plan.name}
                    <ArrowRight className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-[12px] text-gray-400">
          Payments processed securely by{" "}
          <span className="font-medium text-gray-600">Paddle</span> — your Merchant of Record.
          Cancel anytime.
        </p>
      </div>
    </div>
  );
}
