import { NextResponse } from "next/server";
import { getRequestSession } from "@/auth/session";
import { readStore } from "@/data/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!getRequestSession(request)) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const store = await readStore();
  return NextResponse.json(store, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
