import { ArrowRight, CheckCircle2, Factory, FileText, Microscope, ShieldCheck, Users, Workflow } from "lucide-react";
import { ButtonLink } from "@/components/button-link";

const FEATURE_GROUPS = [
  {
    icon: Microscope,
    eyebrow: "Research",
    title: "Find the signal faster.",
    description:
      "Search by indication, ingredient, and target population without rebuilding the same clinical context in every project.",
    bullets: [
      "Ingredient and indication-driven evidence search",
      "Dose context and comparison notes",
      "Persistent rationale inside each formulation workspace",
    ],
  },
  {
    icon: ShieldCheck,
    eyebrow: "Compliance",
    title: "Review claims before they become rework.",
    description:
      "Keep positioning, support language, and internal notes closer to the formulation itself so teams can spot issues earlier.",
    bullets: [
      "Structure and support language review",
      "Internal decision logging for teams and clients",
      "Cleaner handoff into legal and brand review",
    ],
  },
  {
    icon: Factory,
    eyebrow: "Manufacturing",
    title: "Move from draft to handoff with less friction.",
    description:
      "Package the work into deliverables that make manufacturer outreach and downstream execution feel more standardized.",
    bullets: [
      "Manufacturer-ready dossier exports",
      "RFQ preparation and comparison support",
      "Fewer disconnected spreadsheets and PDFs",
    ],
  },
];

const ADDITIONAL_CAPABILITIES = [
  { icon: Workflow, title: "Versioned formulation workspaces", body: "Keep iterations, notes, and working decisions in one place." },
  { icon: Users, title: "Agency and multi-brand support", body: "Manage different brands or clients without losing context between projects." },
  { icon: FileText, title: "Exportable deliverables", body: "Turn internal formulation work into client-facing or manufacturer-facing output." },
  { icon: ShieldCheck, title: "Compliance-aware writing support", body: "Make review easier before language leaves the product team." },
];

export default function FeaturesPage() {
  return (
    <div className="pb-8">
      <section className="page-shell page-hero">
        <div className="max-w-3xl">
          <p className="eyebrow">Features</p>
          <h1 className="display-lg mt-4 text-gray-950">
            A more coherent system for supplement product development.
          </h1>
          <p className="body-lg mt-6 max-w-2xl">
            EnhanceLabs is designed for teams that want stronger research
            context, cleaner compliance review, and a more organized path into
            manufacturing.
          </p>
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="space-y-5">
          {FEATURE_GROUPS.map(({ icon: Icon, eyebrow, title, description, bullets }) => (
            <div
              key={title}
              className="surface-card grid gap-8 p-7 md:p-9 lg:grid-cols-[220px_minmax(0,1fr)]"
            >
              <div>
                <div className="inline-flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <Icon className="size-5" />
                </div>
                <p className="eyebrow mt-5">{eyebrow}</p>
              </div>
              <div>
                <h2 className="display-md text-gray-950">{title}</h2>
                <p className="body-md mt-4 max-w-2xl">{description}</p>
                <ul className="mt-6 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                  {bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="grid gap-4 md:grid-cols-2">
          {ADDITIONAL_CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-soft p-6">
              <div className="inline-flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-gray-950">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell section-pad">
        <div className="surface-card px-6 py-10 md:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Next step</p>
              <h2 className="display-md mt-4 text-gray-950">
                See how the workflow fits your team.
              </h2>
              <p className="body-md mt-5">
                Join the waitlist and we’ll share access details as the product
                opens up to more brands and agencies.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href="/get-access"
                className="rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Join waitlist
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
        </div>
      </section>
    </div>
  );
}
