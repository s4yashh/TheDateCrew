import { NextResponse } from "next/server";
import { getRequestSession } from "@/auth/session";
import { scopeStoreToMatchmaker } from "@/data/scope";
import { readStore } from "@/data/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const store = await readStore();
  return NextResponse.json(scopeStoreToMatchmaker(store, session.matchmakerId), {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
