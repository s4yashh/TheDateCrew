import { NextResponse } from "next/server";
import { authenticateMatchmaker } from "@/auth/authenticate";
import { createSessionToken, recordLoginAttempt, resetLoginAttempts, SESSION_COOKIE } from "@/auth/session";
import { readStore } from "@/data/store";
import { loginSchema } from "@/domain/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter your demo credentials to continue." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const attemptKey = forwardedFor || "local-demo";
  const limit = recordLoginAttempt(attemptKey);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  const store = await readStore();
  const matchmaker = authenticateMatchmaker(store, parsed.data.email, parsed.data.password);
  if (!matchmaker) {
    return NextResponse.json({ error: "Those credentials don’t match a demo account." }, { status: 401 });
  }

  resetLoginAttempts(attemptKey);
  const response = NextResponse.json({ ok: true, matchmaker: { id: matchmaker.id, name: matchmaker.name } });
  response.cookies.set(SESSION_COOKIE, createSessionToken(matchmaker.id, matchmaker.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return response;
}
