import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/auth-context";
import { Analytics } from "@vercel/analytics/next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formlayer.co";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FormLayer — AI Supplement Formulation Platform",
    template: "%s | FormLayer",
  },
  description:
    "Evidence-backed supplement formulations in minutes. RAG-powered ingredient research, FDA compliance checking, and manufacturer connections for supplement brands and agencies.",
  keywords: [
    "supplement formulation",
    "nutraceutical AI",
    "supplement brand",
    "ingredient research",
    "FDA compliance",
    "supplement manufacturer",
  ],
  openGraph: {
    title: "FormLayer — AI Supplement Formulation Platform",
    description:
      "Evidence-backed supplement formulations in minutes. RAG-powered ingredient research, FDA compliance checking, and manufacturer connections.",
    url: siteUrl,
    siteName: "FormLayer",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FormLayer — AI Supplement Formulation Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FormLayer — AI Supplement Formulation Platform",
    description:
      "Evidence-backed supplement formulations in minutes. RAG-powered ingredient research, FDA compliance checking, and manufacturer connections.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FormLayer",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI-powered nutraceutical supplement formulation platform. RAG-powered ingredient research, FDA compliance checking, and manufacturer connections.",
  url: siteUrl,
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "49",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "49",
        priceCurrency: "USD",
        unitText: "MONTH",
      },
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "149",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "149",
        priceCurrency: "USD",
        unitText: "MONTH",
      },
    },
  ],
  publisher: {
    "@type": "Organization",
    name: "FormLayer",
    url: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
