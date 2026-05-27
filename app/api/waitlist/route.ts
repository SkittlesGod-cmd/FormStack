import { NextResponse, type NextRequest } from "next/server";
import { waitlistFormSchema, waitlistInsertSchema } from "@/lib/waitlist";
import { createClient } from "@/utils/supabase/server";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

const globalForWaitlist = globalThis as typeof globalThis & {
  __waitlistRateLimitStore?: Map<string, number[]>;
};

const rateLimitStore =
  globalForWaitlist.__waitlistRateLimitStore ??
  (globalForWaitlist.__waitlistRateLimitStore = new Map<string, number[]>());

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const fallback = request.headers.get("user-agent") ?? "unknown";
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || fallback;
  return `waitlist:${ip}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const recentAttempts = (rateLimitStore.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recentAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    rateLimitStore.set(key, recentAttempts);
    return true;
  }

  recentAttempts.push(now);
  rateLimitStore.set(key, recentAttempts);
  return false;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = waitlistFormSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { message: firstIssue?.message ?? "Invalid form submission." },
      { status: 400 }
    );
  }

  if (parsed.data.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json(
      { message: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const payload = waitlistInsertSchema.parse(parsed.data);
  const { error } = await supabase.from("waitlist").insert([payload]);

  if (error) {
    const message =
      error.code === "23505"
        ? "This email is already on the waitlist."
        : "Unable to join the waitlist right now.";

    return NextResponse.json({ message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
