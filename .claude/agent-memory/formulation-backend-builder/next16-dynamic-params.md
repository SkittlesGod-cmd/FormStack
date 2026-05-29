---
name: next16-dynamic-params
description: Next.js 16 made route/page params and cookies async — must await
metadata:
  type: project
---

In Next 16 (this project is 16.2.6), `params` and `searchParams` passed to pages, layouts, and route handlers are `Promise`-wrapped. `cookies()` and `headers()` from `next/headers` also return promises. Client components must use React `use()` to unwrap params.

Route handler signature:
```ts
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

There is also a globally-available `RouteContext<'/api/foo/[id]'>` helper after typegen, but the inline `{ params: Promise<...> }` shape is safer for first-write code.

**Why:** Older Next.js snippets in training data destructure `params` synchronously and will throw at runtime in v15+/v16.

**How to apply:** Always `await params` in async server contexts; in client components wrap with `use(params)`.
