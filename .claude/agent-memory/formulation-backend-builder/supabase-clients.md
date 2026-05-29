---
name: supabase-clients
description: Where the Supabase SSR/browser clients live and how to call them
metadata:
  type: project
---

Server: `@/utils/supabase/server` exports an async `createClient()` that awaits `cookies()` from next/headers and wires up getAll/setAll. Always `await createClient()`.

Browser: `@/utils/supabase/client` exports `createBrowserClient()` (and `createClient` alias) — synchronous.

Both fall back from `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Middleware (`middleware.ts`) gates everything except PUBLIC_ROUTES and redirects unauthenticated users to `/sign-in?next=...`. `/dashboard/*` and `/api/*` are protected by default.

**Why:** All existing auth/routes use this exact pattern — duplicating createServerClient inline drifts from the project.

**How to apply:** In API routes use `const supabase = await createClient()` from `@/utils/supabase/server`, then `await supabase.auth.getUser()` and return 401 if no user. In client components use `createBrowserClient()` from `@/utils/supabase/client`.
