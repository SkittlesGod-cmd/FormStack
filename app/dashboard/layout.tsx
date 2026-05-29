"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Beaker, ChevronDown, CreditCard, FlaskConical, LayoutDashboard, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/formulations", label: "Formulations", icon: Beaker },
  { href: "/dashboard/research", label: "Research", icon: FlaskConical },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authUser, setAuthUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createBrowserClient().auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const res = await fetch("/api/auth/sign-out", { method: "POST" });
    window.location.href = res.redirected ? res.url : "/";
  };

  const displayName =
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    authUser?.email?.split("@")[0] ||
    "Account";
  const avatar = authUser?.user_metadata?.picture || authUser?.user_metadata?.avatar_url;
  const initials = displayName[0]?.toUpperCase() ?? "A";

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 h-12 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[13px] font-semibold tracking-[-0.01em] text-gray-950"
          >
            <span className="size-1.5 rounded-full bg-brand" />
            NutraCloud
          </Link>

          {/* Center nav */}
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-3 py-1.5 text-[13px] font-medium transition-colors rounded-md",
                  isActive(href, exact)
                    ? "text-gray-950 bg-black/[0.05]"
                    : "text-gray-500 hover:text-gray-900 hover:bg-black/[0.03]"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-[13px] text-gray-700 transition hover:bg-black/[0.05]"
            >
              {avatar ? (
                <img src={avatar} alt="" className="size-6 rounded-full object-cover" />
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
                  {initials}
                </span>
              )}
              <span className="hidden max-w-[100px] truncate font-medium sm:block">
                {displayName}
              </span>
              <ChevronDown className="size-3 text-gray-400" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                  <div className="border-b border-black/[0.06] px-3.5 py-2.5">
                    <p className="text-[12px] font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{authUser?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-gray-700 transition hover:bg-black/[0.04]"
                    >
                      <User className="size-3.5 text-gray-400" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-gray-700 transition hover:bg-black/[0.04]"
                    >
                      <CreditCard className="size-3.5 text-gray-400" />
                      Billing
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-500 transition hover:bg-red-50/80 disabled:opacity-50"
                    >
                      <LogOut className="size-3.5" />
                      {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 py-8">{children}</main>
    </div>
  );
}
