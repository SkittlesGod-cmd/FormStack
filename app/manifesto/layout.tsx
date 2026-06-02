import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "Why FormLayer exists. We refuse to invent doses or fabricate claims. Every recommendation is anchored in published human RCTs.",
  alternates: { canonical: "/manifesto" },
};

export default function ManifestoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
