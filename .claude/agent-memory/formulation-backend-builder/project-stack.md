---
name: project-stack
description: NutraCloud tech stack and key library choices that future code must match
metadata:
  type: project
---

NutraCloud runs on Next.js 16.2.6 with React 19 (app router only). Supabase via @supabase/ssr (^0.10.3). Tailwind v4 with @import syntax in app/globals.css. UI primitives come from @base-ui/react (button, input, etc.), not Radix. Toasts via sonner (Toaster mounted in root layout). Forms use react-hook-form + zod + @hookform/resolvers. Path alias `@/*` maps to project root (not src/).

**Why:** AGENTS.md explicitly warns this is "not the Next.js you know" — must read node_modules/next/dist/docs/ before writing code.

**How to apply:** Default to these libraries when adding features; do not introduce shadcn-radix variants. Treat all dynamic params and cookies() as Promises (Next 16 behavior).
