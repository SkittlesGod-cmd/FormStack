import { NextResponse, type NextRequest } from "next/server";
import {
  isAdminPasswordValid,
  isWaitlistAdminConfigured,
  setAdminSession,
} from "@/lib/admin-auth";

function getSafeNextPath(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next");
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }

  return "/admin/waitlist";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeNextPath(request);
  const redirectUrl = new URL(nextPath, request.url);

  if (!isWaitlistAdminConfigured()) {
    redirectUrl.searchParams.set("error", "config");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (!isAdminPasswordValid(password)) {
    redirectUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  await setAdminSession();
  redirectUrl.searchParams.delete("error");

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
