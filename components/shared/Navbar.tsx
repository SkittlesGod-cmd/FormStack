"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { useScrolled } from "@/hooks/use-scrolled";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "For agencies", href: "/for-agencies" },
];

export function Navbar() {
  const pathname = usePathname();
  const scrolled = useScrolled(24);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <div
        className={cn(
          "mx-auto flex h-16 max-w-[1180px] items-center justify-between rounded-full border px-5 transition-all duration-300",
          scrolled
            ? "border-black/8 bg-[rgba(255,255,255,0.82)] shadow-[0_16px_40px_rgba(17,17,17,0.08)] backdrop-blur-xl"
            : "border-black/6 bg-[rgba(255,255,255,0.7)] backdrop-blur-xl"
        )}
      >
        <Link href="/" className="shrink-0 text-[15px] font-semibold tracking-[-0.02em] text-gray-950">
          EnhanceLabs
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                data-active={isActive || undefined}
                className={cn(
                  "nav-link text-sm transition-colors",
                  isActive ? "text-gray-950" : "text-gray-500 hover:text-gray-950"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/admin/waitlist"
            className="text-sm text-gray-500 transition-colors hover:text-gray-950"
          >
            Admin
          </Link>
          <ButtonLink
            href="/get-access"
            className="rounded-full bg-gray-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Join waitlist
          </ButtonLink>
        </div>

        <button
          type="button"
          className="rounded-full p-2 text-gray-700 transition hover:bg-black/5 md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="mx-auto mt-3 max-w-[1180px] rounded-[28px] border border-black/8 bg-[rgba(255,255,255,0.94)] p-5 shadow-[0_24px_60px_rgba(17,17,17,0.1)] backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="text-[15px] font-medium text-gray-900"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/admin/waitlist"
              onClick={() => setMobileOpen(false)}
              className="text-[15px] font-medium text-gray-900"
            >
              Admin
            </Link>
            <ButtonLink
              href="/get-access"
              onClick={() => setMobileOpen(false)}
              className="mt-2 justify-center rounded-full bg-gray-950 px-5 py-3 text-sm font-medium text-white"
            >
              Join waitlist
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
