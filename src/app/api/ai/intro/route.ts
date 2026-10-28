import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { generateIntroDraft } from "@/ai/introduction";
import { getRequestSession } from "@/auth/session";
import { readStore, updateStore } from "@/data/store";
import { introDraftSchema } from "@/domain/validation";
import { checkEligibility, scoreMatch } from "@/matching/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  const session = getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = introDraftSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Choose a customer and profile." }, { status: 400 });

  const store = await readStore();
  const customer = store.profiles.find(
    (profile) => profile.id === parsed.data.customerId && profile.assignedMatchmakerId === session.matchmakerId,
  );
  const candidate = store.profiles.find(
    (profile) => profile.id === parsed.data.candidateId && profile.assignedMatchmakerId === null,
  );
  if (!customer || !candidate) return NextResponse.json({ error: "Customer or candidate profile was not found." }, { status: 404 });

  const eligibility = checkEligibility(customer, candidate, { interactions: store.interactions });
  if (!eligibility.eligible) return NextResponse.json({ error: eligibility.reasons[0] }, { status: 409 });

  const match = scoreMatch(customer, candidate);
  const draft = await generateIntroDraft(customer, candidate, match);

  await updateStore((current) => {
    if (!current.profiles.some((profile) => profile.id === customer.id && profile.assignedMatchmakerId === session.matchmakerId)) return;
    current.activities.unshift({
      id: randomUUID(),
      profileId: customer.id,
      type: "draft",
      description: draft.source === "gemini" ? "An AI introduction draft was generated for review." : "A template introduction draft was generated for review.",
      createdAt: new Date().toISOString(),
      relatedProfileId: candidate.id,
    });
  });

  return NextResponse.json(
    { ...draft, algorithmVersion: match.algorithmVersion },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
