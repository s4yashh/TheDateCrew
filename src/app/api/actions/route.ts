import { NextResponse } from "next/server";
import { getRequestSession } from "@/auth/session";
import { scopeStoreToMatchmaker } from "@/data/scope";
import { updateStore } from "@/data/store";
import { applyAction } from "@/domain/actions";
import { actionSchema } from "@/domain/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the submitted details." }, { status: 400 });
  }

  try {
    const { store } = await updateStore((current) => {
      const actor = current.matchmakers.find((matchmaker) => matchmaker.id === session.matchmakerId);
      if (!actor) throw new Error("Your matchmaker account was not found.");
      applyAction(current, parsed.data, { id: actor.id, name: actor.name });
    });
    return NextResponse.json(scopeStoreToMatchmaker(store, session.matchmakerId), {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The action could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
