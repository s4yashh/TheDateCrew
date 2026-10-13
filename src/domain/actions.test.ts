import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/data/seed";
import { applyAction } from "@/domain/actions";
import type { DemoStore } from "@/domain/types";
import { actionSchema } from "@/domain/validation";

function eligiblePair(): { store: DemoStore; customerId: string; candidateId: string } {
  const store = createSeedStore();
  const customer = store.profiles.find((profile) => profile.assigned)!;
  const candidate = store.profiles.find((profile) => !profile.assigned && profile.gender !== customer.gender
    && !store.interactions.some((item) => item.customerId === customer.id && item.candidateId === profile.id))!;
  customer.preferences.strict = [];
  candidate.preferences.strict = [];
  return { store, customerId: customer.id, candidateId: candidate.id };
}

describe("matchmaker action service", () => {
  it("records journey stage changes and ignores duplicate stage updates", () => {
    const { store, customerId } = eligiblePair();
    const customer = store.profiles.find((profile) => profile.id === customerId)!;
    customer.stage = "Onboarding";
    const before = store.activities.length;
    applyAction(store, { action: "stage", profileId: customerId, stage: "Matchmaking" });
    expect(customer.stage).toBe("Matchmaking");
    expect(store.activities).toHaveLength(before + 1);
    expect(store.activities[0].description).toContain("Matchmaking");
    applyAction(store, { action: "stage", profileId: customerId, stage: "Matchmaking" });
    expect(store.activities).toHaveLength(before + 1);
  });

  it("adds an authored, dated note and a timeline event", () => {
    const { store, customerId } = eligiblePair();
    const before = store.notes.length;
    applyAction(store, { action: "note", profileId: customerId, type: "Call", text: "Discussed next steps." }, "Maya Shah");
    expect(store.notes).toHaveLength(before + 1);
    expect(store.notes[0]).toMatchObject({ profileId: customerId, author: "Maya Shah", type: "Call", text: "Discussed next steps." });
    expect(Number.isNaN(Date.parse(store.notes[0].createdAt))).toBe(false);
    expect(store.activities[0].type).toBe("note");
  });

  it("toggles a shortlist without creating duplicate pairs", () => {
    const { store, customerId, candidateId } = eligiblePair();
    const action = { action: "shortlist" as const, customerId, candidateId };
    applyAction(store, action);
    expect(store.interactions.filter((item) => item.customerId === customerId && item.candidateId === candidateId)).toHaveLength(1);
    expect(store.interactions.find((item) => item.customerId === customerId && item.candidateId === candidateId)?.status).toBe("shortlisted");
    applyAction(store, action);
    expect(store.interactions.some((item) => item.customerId === customerId && item.candidateId === candidateId)).toBe(false);
  });

  it("allows a dismissed candidate to be restored", () => {
    const { store, customerId, candidateId } = eligiblePair();
    applyAction(store, { action: "dismiss", customerId, candidateId });
    expect(store.interactions.find((item) => item.customerId === customerId && item.candidateId === candidateId)?.status).toBe("dismissed");
    applyAction(store, { action: "restore", customerId, candidateId });
    expect(store.interactions.some((item) => item.customerId === customerId && item.candidateId === candidateId)).toBe(false);
  });

  it("creates one local introduction and prevents duplicate sends", () => {
    const { store, customerId, candidateId } = eligiblePair();
    const customer = store.profiles.find((profile) => profile.id === customerId)!;
    const previousCount = store.introductions.length;
    applyAction(store, { action: "send", customerId, candidateId, introText: "A thoughtful introduction draft for review." });
    expect(store.introductions).toHaveLength(previousCount + 1);
    expect(store.introductions[0]).toMatchObject({ customerId, candidateId, recipient: customer.email, status: "Sent (Demo)" });
    expect(store.interactions.find((item) => item.customerId === customerId && item.candidateId === candidateId)?.status).toBe("sent");
    expect(customer.stage).toBe("Introduction Sent");
    expect(store.activities[0].type).toBe("stage");
    expect(store.activities[1].type).toBe("introduction");
    expect(() => applyAction(store, { action: "send", customerId, candidateId, introText: "A second introduction draft for review." })).toThrow(/already been sent/);
  });

  it("blocks actions against unassigned customer records", () => {
    const { store, candidateId } = eligiblePair();
    expect(() => applyAction(store, { action: "note", profileId: candidateId, type: "General", text: "Should not save." })).toThrow(/assigned accounts/);
  });

  it("validates notes and profile identifiers at the API boundary", () => {
    expect(actionSchema.safeParse({ action: "note", profileId: "client-001", type: "Call", text: "   " }).success).toBe(false);
    expect(actionSchema.safeParse({ action: "stage", profileId: "candidate-001", stage: "Not a stage" }).success).toBe(false);
    const parsed = actionSchema.parse({ action: "note", profileId: "client-001", type: "General", text: "  Please follow up.  " });
    expect(parsed.action === "note" ? parsed.text : "").toBe("Please follow up.");
  });
});
