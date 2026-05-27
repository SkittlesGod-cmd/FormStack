import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    note: "For early exploration",
    description: "A lightweight starting point for founders evaluating supplement concepts.",
    features: [
      "Limited formulation workspaces",
      "Core evidence search",
      "Basic claim drafting support",
    ],
    emphasis: false,
  },
  {
    name: "Pro",
    price: "$149/mo",
    note: "For operating teams",
    description: "The full workflow for brands moving actively from formulation into launch planning.",
    features: [
      "Unlimited formulation workspaces",
      "Expanded research and compliance workflow",
      "Manufacturer handoff support",
    ],
    emphasis: true,
  },
  {
    name: "Agency",
    price: "Custom",
    note: "For multi-brand partners",
    description: "For agencies managing multiple client programs and more collaborative review cycles.",
    features: [
      "Everything in Pro",
      "Multi-client workspaces",
      "White-label and support options",
    ],
    emphasis: false,
  },
];

const FAQ = [
  {
    question: "Do I need a contract to get started?",
    answer: "No. The waitlist is the first step, and we’ll discuss fit before opening access.",
  },
  {
    question: "Is pricing per seat?",
    answer: "The current packaging is product-oriented rather than seat-heavy, especially for smaller teams.",
  },
  {
    question: "Can agencies get custom terms?",
    answer: "Yes. Agencies with multiple client workflows can request custom access and support.",
  },
];

export default function PricingPage() {
  return (
    <div className="pb-8">
      <section className="page-shell page-hero">
        <div className="max-w-3xl">
          <p className="eyebrow">Pricing</p>
          <h1 className="display-lg mt-4 text-gray-950">
            Simple packaging for teams doing serious work.
          </h1>
          <p className="body-lg mt-6 max-w-2xl">
            Pricing is designed to stay legible. Start small, expand as the
            workflow becomes central to your product operation, and talk to us
            directly if you run across multiple brands or clients.
          </p>
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map(({ name, price, note, description, features, emphasis }) => (
            <div
              key={name}
              className={cn(
                "rounded-[28px] border p-7 md:p-8",
                emphasis
                  ? "border-gray-950 bg-gray-950 text-white shadow-[0_32px_90px_rgba(17,17,17,0.16)]"
                  : "border-black/6 bg-white"
              )}
            >
              <p
                className={cn(
                  "text-sm font-medium",
                  emphasis ? "text-white/70" : "text-gray-500"
                )}
              >
                {note}
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{name}</h2>
              <p className="mt-3 text-4xl font-semibold tracking-[-0.05em]">{price}</p>
              <p
                className={cn(
                  "mt-4 text-sm leading-6",
                  emphasis ? "text-white/72" : "text-gray-600"
                )}
              >
                {description}
              </p>
              <ul className="mt-7 space-y-3 text-sm">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        emphasis ? "text-white" : "text-brand"
                      )}
                    />
                    <span className={emphasis ? "text-white/82" : "text-gray-600"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="max-w-lg">
            <p className="eyebrow">Questions</p>
            <h2 className="display-md mt-4 text-gray-950">
              Clearer access, fewer surprises.
            </h2>
            <p className="body-md mt-5">
              We want packaging to feel straightforward, especially for teams
              still proving out their operating model.
            </p>
          </div>
          <div className="space-y-4">
            {FAQ.map(({ question, answer }) => (
              <div key={question} className="surface-soft p-6">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-gray-950">
                  {question}
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="surface-card px-6 py-10 md:px-10 text-center">
          <p className="eyebrow">Get started</p>
          <h2 className="display-md mt-4 text-gray-950">
            Join the waitlist and we’ll point you to the right plan.
          </h2>
          <p className="body-md mx-auto mt-5 max-w-2xl">
            Early access is still controlled, but pricing conversations are
            already open for brands and agencies evaluating the workflow.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href="/get-access"
              className="rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Join waitlist
            </ButtonLink>
            <ButtonLink
              href="/for-agencies"
              variant="ghost"
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:border-black/20 hover:bg-black/[0.02]"
            >
              For agencies <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
