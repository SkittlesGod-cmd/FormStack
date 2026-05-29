import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/features",
  "/pricing",
  "/for-agencies",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/api/auth/callback",
  "/f",
  "/api/f",
  "/api/billing/webhook",
];

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

async function middlewareHandler(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response with proper headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check for Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If no Supabase credentials, skip auth and continue (for development)
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  // Create supabase client
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if current route is public
  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".");

  // Redirect unauthenticated users away from protected routes
  if (!user && !isPublicRoute && !AUTH_ROUTES.includes(pathname)) {
    // API routes must return JSON, not redirect to the sign-in page
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.includes(pathname)) {
    const nextUrl = request.nextUrl.searchParams.get("next");
    if (nextUrl && nextUrl.startsWith("/")) {
      return NextResponse.redirect(new URL(nextUrl, request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

// Export the middleware function as default
export default async function middleware(request: NextRequest) {
  return middlewareHandler(request);
}

// Keep config for matcher
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
