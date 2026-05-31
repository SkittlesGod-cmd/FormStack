"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Beaker, Bot, ChevronDown, CreditCard, FlaskConical, LayoutDashboard, Lock, LogOut, User, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/formulations", label: "Formulations", icon: Beaker },
  { href: "/dashboard/research", label: "Research", icon: FlaskConical },
  { href: "/dashboard/agents", label: "Agents", icon: Bot, pro: true },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

interface FormulationItem { id: string; name: string; status: string; updated_at: string; }

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [formulations, setFormulations] = useState<FormulationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetch("/api/formulations").then(r => r.json()).then(d => {
      setFormulations(d.formulations ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const NAV_ACTIONS = [
    { label: "Formulations", href: "/dashboard/formulations", icon: "beaker" },
    { label: "New formulation", href: "/dashboard/formulations/new", icon: "plus" },
    { label: "Research", href: "/dashboard/research", icon: "flask" },
    { label: "Billing", href: "/dashboard/billing", icon: "card" },
  ];

  const filteredFormulations = formulations.filter(f =>
    !query || f.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const filteredActions = NAV_ACTIONS.filter(a =>
    !query || a.label.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [
    ...filteredFormulations.map(f => ({ type: "formulation" as const, data: f })),
    ...filteredActions.map(a => ({ type: "action" as const, data: a })),
  ];

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && allItems[selected]) {
        const item = allItems[selected];
        const href = item.type === "formulation"
          ? `/dashboard/formulations/${item.data.id}`
          : (item.data as { href: string }).href;
        window.location.href = href;
        onClose();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [allItems, selected, onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-[20vh] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3">
          <Search className="size-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search formulations, jump to page…"
            className="flex-1 bg-transparent text-[14px] text-gray-900 outline-none placeholder:text-gray-400"
          />
          <kbd className="rounded border border-black/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-gray-400">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {loading ? (
            <p className="px-4 py-6 text-center text-[13px] text-gray-400">Loading…</p>
          ) : allItems.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-gray-400">No results for &ldquo;{query}&rdquo;</p>
          ) : (
            <>
              {filteredFormulations.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Formulations</p>
                  {filteredFormulations.map((f, i) => (
                    <a
                      key={f.id}
                      href={`/dashboard/formulations/${f.id}`}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 text-[13px] transition",
                        selected === i ? "bg-brand/[0.06] text-brand" : "text-gray-800 hover:bg-gray-50"
                      )}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand text-[10px] font-bold">
                        {f.name[0]?.toUpperCase()}
                      </span>
                      <span className="flex-1 truncate font-medium">{f.name}</span>
                      <ArrowRight className="size-3.5 shrink-0 opacity-40" />
                    </a>
                  ))}
                </>
              )}
              {filteredActions.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Quick actions</p>
                  {filteredActions.map((a, i) => {
                    const itemIdx = filteredFormulations.length + i;
                    return (
                      <a
                        key={a.href}
                        href={a.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-[13px] transition",
                          selected === itemIdx ? "bg-brand/[0.06] text-brand" : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-[10px]">→</span>
                        {a.label}
                      </a>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
        <div className="border-t border-black/[0.05] px-4 py-2 flex items-center gap-3 text-[10px] text-gray-400">
          <span><kbd className="rounded border border-black/[0.08] px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-black/[0.08] px-1 py-0.5 font-mono">↵</kbd> open</span>
          <span><kbd className="rounded border border-black/[0.08] px-1 py-0.5 font-mono">esc</kbd> close</span>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
    fetch("/api/billing/subscription")
      .then(r => r.json())
      .then(d => setIsPro(d?.subscription?.plan === "pro"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setMenuOpen(false); setPaletteOpen(false); }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPaletteOpen(v => !v); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const res = await fetch("/api/auth/sign-out", { method: "POST" });
      window.location.href = res.redirected ? res.url : "/";
    } catch {
      // Network error — fall back to client-side sign out
      try {
        await createBrowserClient().auth.signOut();
        window.location.href = "/";
      } catch {
        toast.error("Sign out failed. Please refresh and try again.");
        setSigningOut(false);
      }
    }
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
            FormLayer
          </Link>

          {/* Command palette trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 rounded-lg border border-black/[0.07] bg-gray-50 px-3 py-1.5 text-[12px] text-gray-400 transition hover:border-black/[0.12] hover:bg-gray-100"
          >
            <Search className="size-3.5" />
            <span>Search…</span>
            <kbd className="ml-2 rounded border border-black/[0.08] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>

          {/* Center nav */}
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, exact, pro }) => {
              const locked = pro && !isPro;
              return locked ? (
                <Link
                  key={href}
                  href="/dashboard/billing"
                  title="Upgrade to Pro to access Agents"
                  className="relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors rounded-md text-gray-300 cursor-not-allowed"
                >
                  {label}
                  <Lock className="size-3 text-gray-300" />
                </Link>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors rounded-md",
                    isActive(href, exact)
                      ? "text-gray-950 bg-black/[0.05]"
                      : "text-gray-500 hover:text-gray-900 hover:bg-black/[0.03]"
                  )}
                >
                  {label}
                  {pro && (
                    <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">
                      Pro
                    </span>
                  )}
                </Link>
              );
            })}
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

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
