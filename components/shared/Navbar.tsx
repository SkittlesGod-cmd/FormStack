"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { useScrolled } from "@/hooks/use-scrolled";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "For agencies", href: "/for-agencies" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const scrolled = useScrolled(24);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (isDashboard) return null;

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
          FormLayer
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
          {!isLoading && (
            <>
              {user ? (
                <>
                  {/* Dashboard link for authenticated users */}
                  <Link
                    href="/dashboard"
                    className="text-sm text-gray-500 transition-colors hover:text-gray-950"
                  >
                    Dashboard
                  </Link>
                  {/* User menu dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-gray-700 transition hover:bg-black/5"
                    >
                      <div className="flex size-7 items-center justify-center rounded-full bg-brand text-white">
                        <User className="size-3.5" />
                      </div>
                      <span className="max-w-[120px] truncate">
                        {user.email?.split("@")[0]}
                      </span>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                        <Link
                          href="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="size-4" />
                          Profile
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            setShowUserMenu(false);
                            await handleSignOut();
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          <LogOut className="size-4" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {!isAuthPage && (
                    <>
                      <ButtonLink
                        href="/sign-in"
                        className="text-sm text-gray-500 transition-colors hover:text-gray-950"
                      >
                        Sign in
                      </ButtonLink>
                      <ButtonLink
                        href="/sign-up"
                        className="rounded-full bg-gray-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                      >
                        Get started
                      </ButtonLink>
                    </>
                  )}
                </>
              )}
            </>
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
            {!isLoading && user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="text-[15px] font-medium text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="text-[15px] font-medium text-gray-900"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileOpen(false);
                    await handleSignOut();
                  }}
                  className="text-left text-[15px] font-medium text-red-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="text-[15px] font-medium text-gray-900"
                >
                  Sign in
                </Link>
                <ButtonLink
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 justify-center rounded-full bg-gray-950 px-5 py-3 text-sm font-medium text-white"
                >
                  Get started
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
