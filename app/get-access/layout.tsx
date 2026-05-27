import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Get Early Access",
  description:
    "Join the EnhanceLabs waitlist and be among the first to use AI-powered supplement formulation. Early access members get priority onboarding and locked-in pricing.",
  alternates: {
    canonical: "/get-access",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function GetAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
