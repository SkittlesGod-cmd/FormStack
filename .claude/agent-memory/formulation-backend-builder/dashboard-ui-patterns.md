---
name: dashboard-ui-patterns
description: Visual conventions used across the NutraCloud dashboard
metadata:
  type: project
---

Page wrapper: `<div className="bg-gray-50 min-h-screen">` with inner `mx-auto max-w-7xl px-5 py-8`. Cards: `rounded-2xl border border-gray-200 bg-white shadow-sm`. Primary action: `bg-brand text-white hover:bg-brand-dark` rounded-xl. Brand color tokens (`brand`, `brand-dark`, `brand-50`, ...) defined in app/globals.css via Tailwind v4 @theme.

Status palette used by dashboard for formulations:
- draft → gray (`bg-gray-100 text-gray-600`, Clock icon)
- in_progress → orange (`bg-orange-100 text-orange-700`, Flame)
- review → amber (`bg-amber-100 text-amber-700`, AlertCircle)
- compliant → green (`bg-green-100 text-green-700`, CheckCircle)

Loading: centered spinner `size-10 animate-spin rounded-full border-4 border-brand border-t-transparent` with "Loading..." text. Smaller pages use `Loader2` from lucide-react.

Toasts: `toast.success/.error` from sonner — Toaster is already mounted in root layout.

**Why:** Existing dashboard/page.tsx and profile/page.tsx use these exact tokens; new pages must blend in.

**How to apply:** Reuse these class strings verbatim for any new dashboard surface so the design stays consistent.
