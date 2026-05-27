import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Agencies",
  description:
    "EnhanceLabs for supplement agencies: manage multiple brands, streamline formulation workflows, and deliver FDA-compliant products faster with AI-powered tools.",
  alternates: {
    canonical: "/for-agencies",
  },
};

export default function ForAgenciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
