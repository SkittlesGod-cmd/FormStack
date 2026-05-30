# FormLayer

AI-powered supplement formulation platform for brands and agencies. Evidence-backed formulations in minutes — RAG-powered ingredient research, FDA compliance checking, and direct manufacturer connections.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/formlayer&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_SITE_URL)

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Tailwind CSS v4**
- **shadcn/ui** (via `@base-ui/react`)
- **Supabase** (waitlist storage)
- **Framer Motion** (scroll animations)
- **next-sitemap** (sitemap + robots.txt)

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/formlayer.git
cd formlayer
npm install

# 2. Environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

Run the following SQL in your Supabase project's SQL editor (Dashboard → SQL Editor):

```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  company     TEXT        NOT NULL,
  role        TEXT        NOT NULL,
  brand_count TEXT        NOT NULL,
  source      TEXT        NOT NULL
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert on waitlist"
  ON waitlist
  FOR INSERT
  WITH CHECK (true);
```

Then copy your **Project URL** and **anon public key** from Dashboard → Project Settings → API into `.env.local`.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (e.g. `https://formlayer.co`) |

## Build & Deploy

```bash
npm run build    # builds Next.js + generates sitemap.xml + robots.txt via postbuild
npm run start    # serves production build locally
```

### Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com/new](https://vercel.com/new)
3. Add the three environment variables in the Vercel dashboard
4. Vercel will auto-detect Next.js and deploy

The `vercel.json` targets region `iad1` (US East) for lowest latency.

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, features, how it works, testimonials, pricing preview, CTA |
| `/features` | Full feature breakdown |
| `/pricing` | Pricing tiers |
| `/for-agencies` | Agency-focused landing |
| `/get-access` | Waitlist signup (noindex) |

## Known Issue

`app/(auth)/get-access/page.tsx` is a stub that conflicts with `app/get-access/page.tsx`. Delete it to silence the Turbopack warning:

```bash
rm 'app/(auth)/get-access/page.tsx'
```
