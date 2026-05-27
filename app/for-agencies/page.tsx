import { ArrowRight, Clock3, ShieldCheck, Users, Waypoints } from "lucide-react";
import { ButtonLink } from "@/components/button-link";

const STATS = [
  { value: "72h", label: "target turnaround for a polished formulation draft" },
  { value: "1", label: "shared system for client context, research, and handoff" },
  { value: "50+", label: "manufacturer relationships available through the workflow" },
];

const AGENCY_BENEFITS = [
  {
    icon: Clock3,
    title: "Move faster without looking careless.",
    body: "Agencies can structure research, decisions, and client-facing outputs in the same place instead of rebuilding each project from scratch.",
  },
  {
    icon: Users,
    title: "Support multiple clients more cleanly.",
    body: "Separate brands, projects, and working notes while keeping your internal process consistent across accounts.",
  },
  {
    icon: ShieldCheck,
    title: "Make review feel less reactive.",
    body: "Bring compliance-aware language closer to the formulation so your team can spot weak claims earlier.",
  },
  {
    icon: Waypoints,
    title: "Hand work off with less translation.",
    body: "Manufacturer-ready outputs help bridge the gap between strategy work and operational execution.",
  },
];

const WORKFLOW = [
  "Capture the client brief and target outcome.",
  "Build the ingredient thesis with evidence and dose context.",
  "Refine language and claims before external review.",
  "Export a cleaner package for clients or manufacturers.",
];

export default function ForAgenciesPage() {
  return (
    <div className="pb-8">
      <section className="page-shell page-hero">
        <div className="max-w-3xl">
          <p className="eyebrow">For agencies</p>
          <h1 className="display-lg mt-4 text-gray-950">
            Built for agencies shaping supplement products for other brands.
          </h1>
          <p className="body-lg mt-6 max-w-2xl">
            EnhanceLabs helps agencies keep formulation work more legible,
            repeatable, and easier to hand off across clients, reviewers, and
            manufacturing partners.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink
              href="/get-access"
              className="rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Request agency access
            </ButtonLink>
            <ButtonLink
              href="/pricing"
              variant="ghost"
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:border-black/20 hover:bg-black/[0.02]"
            >
              Review pricing <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="page-shell pb-10">
        <div className="grid gap-4 md:grid-cols-3">
          {STATS.map(({ value, label }) => (
            <div key={label} className="surface-soft p-6">
              <p className="text-4xl font-semibold tracking-[-0.04em] text-gray-950">
                {value}
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="grid gap-4 md:grid-cols-2">
          {AGENCY_BENEFITS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-card p-7">
              <div className="inline-flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-gray-950">
                {title}
              </h2>
              <p className="mt-4 body-md">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="surface-card grid gap-8 p-7 md:p-9 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div>
            <p className="eyebrow">Typical workflow</p>
            <h2 className="display-md mt-4 text-gray-950">
              Structured enough for clients, flexible enough for real work.
            </h2>
            <p className="body-md mt-5">
              The goal is not just to create a better looking deck. It is to
              make the path from idea to deliverable feel more consistent across
              your engagements.
            </p>
          </div>
          <ul className="space-y-4">
            {WORKFLOW.map((item, index) => (
              <li key={item} className="flex gap-4 rounded-[24px] bg-black/[0.02] p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-950 text-sm font-medium text-white">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="surface-card px-6 py-10 md:px-10 text-center">
          <p className="eyebrow">Agency access</p>
          <h2 className="display-md mt-4 text-gray-950">
            Join the waitlist for agency onboarding.
          </h2>
          <p className="body-md mx-auto mt-5 max-w-2xl">
            We are opening access selectively for agencies that need a more
            rigorous product development workflow across multiple brands.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href="/get-access"
              className="rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Request agency access
            </ButtonLink>
            <ButtonLink
              href="/features"
              variant="ghost"
              className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:border-black/20 hover:bg-black/[0.02]"
            >
              Explore features <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
