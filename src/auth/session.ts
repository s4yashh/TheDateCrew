import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tdc_matchmaker_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const LOCAL_DEVELOPMENT_SECRET = "local-demo-secret-change-before-deployment";

interface SessionPayload {
  email: string;
  expiresAt: number;
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("Set SESSION_SECRET to a random value of at least 32 characters before production.");
  }
  return secret || LOCAL_DEVELOPMENT_SECRET;
}

function signature(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(email: string, now = Date.now()): string {
  const payload: SessionPayload = { email, expiresAt: Math.floor(now / 1000) + SESSION_TTL_SECONDS };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signature(encodedPayload)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): SessionPayload | null {
  if (!token) return null;
  const [encodedPayload, providedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !providedSignature || extra.length > 0) return null;
  if (!safeCompare(signature(encodedPayload), providedSignature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof payload.email !== "string" || typeof payload.expiresAt !== "number") return null;
    if (payload.expiresAt <= Math.floor(now / 1000)) return null;
    return { email: payload.email, expiresAt: payload.expiresAt };
  } catch {
    return null;
  }
}

export function getRequestSession(request: Request): SessionPayload | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue = cookieHeader.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));
  return verifySessionToken(cookieValue?.slice(SESSION_COOKIE.length + 1));
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieJar = await cookies();
  return verifySessionToken(cookieJar.get(SESSION_COOKIE)?.value);
}

export function getDemoCredentials() {
  return {
    email: process.env.DEMO_LOGIN_EMAIL || "matchmaker@thedatecrew.demo",
    password: process.env.DEMO_LOGIN_PASSWORD || "DemoMatch123!",
  };
}

export function verifyDemoCredentials(email: string, password: string): boolean {
  const expected = getDemoCredentials();
  return safeCompare(email.trim().toLowerCase(), expected.email.toLowerCase()) && safeCompare(password, expected.password);
}

interface LoginAttemptState {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, LoginAttemptState>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function recordLoginAttempt(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetLoginAttempts(key: string): void {
  attempts.delete(key);
}
