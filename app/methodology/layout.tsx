import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How FormLayer grades evidence, sources clinical literature, and computes FDA compliance scores. The full explanation of the engine.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
