import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore EnhanceLabs features: RAG-powered ingredient research, automated FDA compliance checking, certificate of analysis parsing, and direct manufacturer connections.",
  alternates: {
    canonical: "/features",
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
