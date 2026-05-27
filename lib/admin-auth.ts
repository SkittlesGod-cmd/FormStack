import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "enhancelabs_waitlist_admin";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

function getAdminPassword() {
  return process.env.WAITLIST_ADMIN_PASSWORD ?? "";
}

function getAdminSessionSecret() {
  return process.env.WAITLIST_ADMIN_SESSION_SECRET ?? "";
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

function signSession(payload: string) {
  return createHmac("sha256", getAdminSessionSecret()).update(payload).digest("hex");
}

function createSessionToken(expiresAt: number) {
  const payload = String(expiresAt);
  return `${payload}.${signSession(payload)}`;
}

function verifySessionToken(token: string) {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) return false;
  if (!getAdminSessionSecret()) return false;
  if (!safeCompare(signature, signSession(payload))) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function isWaitlistAdminConfigured() {
  return Boolean(getAdminPassword() && getAdminSessionSecret());
}

export function isAdminPasswordValid(password: string) {
  const expectedPassword = getAdminPassword();
  return Boolean(expectedPassword) && safeCompare(password, expectedPassword);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  return Boolean(token && verifySessionToken(token));
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;

  cookieStore.set(ADMIN_COOKIE_NAME, createSessionToken(expiresAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
