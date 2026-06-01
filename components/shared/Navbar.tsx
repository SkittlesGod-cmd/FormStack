"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useScrolled } from "@/hooks/use-scrolled";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";

const NAV_LINKS = [
  { label: "Product", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Agencies", href: "/for-agencies" },
  { label: "Journal", href: "/blog" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const scrolled = useScrolled(8);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading } = useAuth();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  if (isDashboard) return null;

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-[1140px] items-center justify-between rounded-full px-2 pl-5 transition-all duration-500",
          scrolled
            ? "border border-black/[0.06] bg-white/85 shadow-[0_8px_28px_rgba(17,17,17,0.06)] backdrop-blur-2xl"
            : "border border-transparent bg-white/40 backdrop-blur-xl"
        )}
      >
        {/* Logomark */}
        <Link href="/" className="flex items-center gap-2.5 pr-6 text-[15px] font-medium tracking-[-0.022em] text-gray-950">
          <span className="relative flex size-5 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#a48bff] via-[#7c8dff] to-[#5b6ee1] opacity-90" />
            <span className="absolute inset-[3px] rounded-full bg-white/85" />
            <span className="relative size-1.5 rounded-full bg-gray-950" />
          </span>
          FormLayer
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13.5px] font-medium tracking-[-0.005em] transition-colors",
                  isActive ? "text-gray-950" : "text-gray-500 hover:text-gray-950"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="hidden items-center gap-1.5 md:flex">
          {!isLoading && (
            user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full px-4 py-1.5 text-[13.5px] font-medium text-gray-500 transition-colors hover:text-gray-950"
                >
                  Open app
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full px-4 py-2 text-[13.5px] font-medium text-gray-400 transition-colors hover:text-gray-700"
                >
                  Sign out
                </button>
              </>
            ) : (
              !isAuthPage && (
                <>
                  <Link
                    href="/sign-in"
                    className="rounded-full px-4 py-1.5 text-[13.5px] font-medium text-gray-500 transition-colors hover:text-gray-950"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="group relative inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_4px_14px_rgba(17,17,17,0.18)] transition-all hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_6px_20px_rgba(91,110,225,0.35)]"
                  >
                    Get started
                    <span className="ml-0.5 transition-transform group-hover:translate-x-0.5">→</span>
                  </Link>
                </>
              )
            )
          )}
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

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mx-auto mt-3 max-w-[1140px] overflow-hidden rounded-3xl border border-black/[0.07] bg-white/95 p-6 shadow-[0_24px_60px_rgba(17,17,17,0.12)] backdrop-blur-2xl md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className="rounded-xl px-3 py-3 text-[15px] font-medium text-gray-900 transition hover:bg-black/[0.04]">
                {label}
              </Link>
            ))}
          </nav>
          <div className="my-4 h-px bg-black/[0.06]" />
          {!isLoading && (
            user ? (
              <div className="flex flex-col gap-1">
                <Link href="/dashboard" className="rounded-xl px-3 py-3 text-[15px] font-medium text-gray-900 transition hover:bg-black/[0.04]">Open app</Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl px-3 py-3 text-left text-[15px] font-medium text-red-600 transition hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link href="/sign-in" className="rounded-xl px-3 py-3 text-[15px] font-medium text-gray-900 transition hover:bg-black/[0.04]">Sign in</Link>
                <Link
                  href="/sign-up"
                  className="flex items-center justify-center gap-1.5 rounded-full bg-gray-950 px-5 py-3 text-[14px] font-medium text-white shadow-[0_4px_14px_rgba(17,17,17,0.18)]"
                >
                  Get started <span>→</span>
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </header>
  );
}
