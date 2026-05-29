import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Factory,
  Microscope,
  ShieldCheck,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";

const TRUST_MARKS = [
  "Founders",
  "R&D teams",
  "Brand operators",
  "Agency strategists",
  "Manufacturer partners",
];

const PLATFORM_PILLARS = [
  {
    icon: Microscope,
    title: "Start with the evidence.",
    description:
      "Search clinical research, compare ingredients, and work from dose ranges grounded in published human data instead of scattered notes.",
    points: [
      "Structured ingredient research",
      "Dose and evidence context",
      "Citation-backed recommendations",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Write with more confidence.",
    description:
      "Turn formulation decisions into cleaner claims, label language, and internal rationale before they reach legal review or manufacturing.",
    points: [
      "Claims review workflow",
      "Compliance-aware copy support",
      "Internal audit trail",
    ],
  },
  {
    icon: Factory,
    title: "Move into production.",
    description:
      "Package the work into a single operating layer for manufacturer outreach, quote comparison, and client-ready deliverables.",
    points: [
      "RFQ handoff",
      "Manufacturer coordination",
      "Delivery-ready dossier export",
    ],
  },
];

const CAPABILITIES = [
  {
    title: "Clinical search",
    body: "Retrieve evidence by ingredient, indication, population, and format in one place.",
  },
  {
    title: "Formulation workspaces",
    body: "Keep product decisions, revisions, and notes organized around each concept.",
  },
  {
    title: "Compliance review",
    body: "Pressure-test claims before they end up in decks, labels, or outbound marketing.",
  },
  {
    title: "Manufacturer handoff",
    body: "Share cleaner formulation packages with manufacturers when the stack is ready.",
  },
  {
    title: "Agency visibility",
    body: "Support multiple brands and clients without losing context across projects.",
  },
  {
    title: "Exportable outputs",
    body: "Produce deliverables your team can actually pass along internally or externally.",
  },
];

const PROOF_POINTS = [
  { value: "AI-powered", label: "evidence-based ingredient research and formulation analysis" },
  { value: "< 60s", label: "to generate a complete formulation from a single health goal" },
  { value: "3-step", label: "workflow from research to compliance review to manufacturer handoff" },
];

export default function HomePage() {
  return (
    <div className="pb-8">
      <section className="page-shell page-hero">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className="eyebrow">Nutraceutical operating system</p>
            <h1 className="display-xl mt-5 text-gray-950">
              Build better supplement products with a calmer workflow.
            </h1>
            <p className="body-lg mt-6 max-w-2xl">
              NutraCloud brings research, formulation logic, compliance review,
              and manufacturer handoff into one product layer for brands and
              agencies working in supplements.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink
                href="/sign-up"
                className="rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Get started free
              </ButtonLink>
              <ButtonLink
                href="/sign-in"
                variant="ghost"
                className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:border-black/20 hover:bg-black/[0.02]"
              >
                Sign in <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
            <p className="fine-print mt-5">
              Built for teams that want more rigor without adding more operational drag.
            </p>
          </div>

          <div className="surface-card relative overflow-hidden p-6 md:p-8">
            <div className="subtle-grid absolute inset-0 opacity-50" />
            <div className="relative">
              <div className="flex items-center justify-between border-b border-black/6 pb-4">
                <div>
                  <p className="text-sm font-medium text-gray-950">Formulation workspace</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Gut-skin support concept for acne-prone women 18–35
                  </p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                  Evidence review active
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="surface-soft p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Research
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-950">
                    847 studies
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Filtered for indication, dose relevance, and study quality.
                  </p>
                </div>
                <div className="surface-soft p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Compliance
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-950">
                    3 claim risks
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Flagged before label copy goes out for review.
                  </p>
                </div>
                <div className="surface-soft p-5 md:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                        Manufacturer handoff
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-gray-950">
                        Ready for RFQ
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-950 px-3 py-1 text-xs font-medium text-white">
                      dossier prepared
                    </span>
                  </div>
                  <ul className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                    {[
                      "Supplement facts draft",
                      "Ingredient rationale",
                      "Evidence notes",
                      "Manufacturer summary",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-brand" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-8 md:pb-12">
        <div className="surface-soft flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-5 text-sm text-gray-500">
          {TRUST_MARKS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="max-w-2xl">
          <p className="eyebrow">A simpler flow</p>
          <h2 className="display-lg mt-4 text-gray-950">
            One workflow from first research pass to final handoff.
          </h2>
          <p className="body-md mt-5 max-w-xl">
            The product is designed to reduce context switching. Research,
            decision-making, compliance review, and factory coordination stay in
            the same system instead of being spread across docs, chat threads,
            and spreadsheets.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PLATFORM_PILLARS.map(({ icon: Icon, title, description, points }) => (
            <div key={title} className="surface-card p-7">
              <div className="inline-flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-gray-950">
                {title}
              </h3>
              <p className="mt-4 body-md">{description}</p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="max-w-lg">
            <p className="eyebrow">What the platform covers</p>
            <h2 className="display-md mt-4 text-gray-950">
              Designed to feel operational, not theatrical.
            </h2>
            <p className="body-md mt-5">
              The experience is intentionally straightforward. Teams come here
              to make better decisions, document them clearly, and move into
              production with less rework.
            </p>
            <Link
              href="/features"
              className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-gray-950"
            >
              See the full feature set <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {CAPABILITIES.map(({ title, body }) => (
              <div key={title} className="surface-soft p-6">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-gray-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="surface-card overflow-hidden">
          <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,0.9fr)_1fr] lg:items-center">
            <div>
              <p className="eyebrow">Operational proof</p>
              <h2 className="display-md mt-4 text-gray-950">
                Cleaner decisions lead to cleaner launches.
              </h2>
              <p className="body-md mt-5 max-w-xl">
                Whether you are an internal product team or an outside agency,
                the value is in making the entire path feel more legible.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {PROOF_POINTS.map(({ value, label }) => (
                <div key={label} className="rounded-[24px] bg-black/[0.02] p-5">
                  <p className="text-4xl font-semibold tracking-[-0.04em] text-gray-950">
                    {value}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-gray-600">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="surface-card px-6 py-10 text-center md:px-10">
          <p className="eyebrow">Get access</p>
          <h2 className="display-md mt-4 text-gray-950">
            Join the waitlist for early access.
          </h2>
          <p className="body-md mx-auto mt-5 max-w-2xl">
            We are opening the platform carefully for supplement brands,
            operators, and agencies that want a more rigorous product development
            workflow.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink
              href="/sign-up"
              className="rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Create account
            </ButtonLink>
            <ButtonLink
              href="/pricing"
              variant="ghost"
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:border-black/20 hover:bg-black/[0.02]"
            >
              Review pricing
            </ButtonLink>
            <Link
              href="/sign-up"
              className="text-sm font-medium text-brand hover:underline"
            >
              or sign up directly <ArrowRight className="inline size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
