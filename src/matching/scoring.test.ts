import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/data/seed";
import { checkEligibility, rankMatches, scoreMatch } from "@/matching/scoring";
import type { Profile } from "@/domain/types";

const seeded = createSeedStore();
const client = seeded.profiles.find((profile) => profile.id === "client-001")!;
const candidate = seeded.profiles.find((profile) => profile.id === "candidate-001")!;
const withPrefs = (profile: Profile, changes: Partial<Profile["preferences"]>): Profile => ({
  ...profile,
  preferences: { ...profile.preferences, ...changes },
});

describe("deterministic matching engine", () => {
  it("rejects a strict age preference violation but accepts unknown age as unknown", () => {
    const customer = withPrefs(client, { ageMin: 50, ageMax: 55, strict: ["age"] });
    const candidateWithoutOtherHardRules = withPrefs(candidate, { strict: [] });
    const tooYoung = { ...candidateWithoutOtherHardRules, dateOfBirth: "2000-01-01" };
    expect(checkEligibility(customer, tooYoung).eligible).toBe(false);

    const unknownAge = { ...candidateWithoutOtherHardRules, dateOfBirth: null };
    expect(checkEligibility(customer, unknownAge).eligible).toBe(true);
    expect(scoreMatch(customer, unknownAge).tradeoffs.join(" ")).toContain("not provided");
  });

  it("enforces opposite-gender demo eligibility and rejects self-matches", () => {
    expect(checkEligibility(client, { ...candidate, id: client.id }).eligible).toBe(false);
    expect(checkEligibility(client, { ...candidate, gender: "man" }).reasons.join(" ")).toContain("opposite-gender");
  });

  it("checks strict preferences in both directions", () => {
    const clientStrict = withPrefs(client, { cities: ["Bengaluru"], strict: ["city"] });
    const candidateStrict = withPrefs(candidate, { ageMin: 60, ageMax: 65, strict: ["age"] });
    const result = checkEligibility(clientStrict, candidateStrict);
    expect(result.eligible).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("computes directional and mutual fit without fabricating unknown matches", () => {
    const oneSided = withPrefs(candidate, { ageMin: 65, ageMax: 70, cities: ["Delhi"], strict: [] });
    const result = scoreMatch(client, oneSided);
    expect(result.forwardFit).toBeGreaterThan(0);
    expect(result.reverseFit).toBeLessThan(result.forwardFit);
    expect(result.components).toHaveLength(7);
    expect(result.positiveReasons.every((reason) => reason.length > 0)).toBe(true);
  });

  it("keeps scores and labels within defined boundaries", () => {
    const result = scoreMatch(client, candidate);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["Excellent Potential", "Strong Potential", "Consider", "Low Fit"]).toContain(result.fitLabel);
    expect(result.components.reduce((sum, part) => sum + part.weight, 0)).toBe(100);
  });

  it("makes the assessment gender heuristics opt-in and visible", () => {
    const heuristicClient = {
      ...client,
      dateOfBirth: "1990-01-01",
      heightCm: 180,
      incomeBand: "₹40–60 LPA",
      preferences: { ...client.preferences, ageMin: null, ageMax: null, heightMinCm: null, heightMaxCm: null },
    };
    const heuristicCandidate = { ...candidate, dateOfBirth: "1995-01-01", heightCm: 160, incomeBand: "₹10–15 LPA" };
    expect(scoreMatch(heuristicClient, heuristicCandidate).assessmentBonus).toBe(0);
    const demoResult = scoreMatch(heuristicClient, heuristicCandidate, { assessmentDemoMode: true });
    expect(demoResult.assessmentBonus).toBeGreaterThan(0);
    expect(demoResult.assessmentBonus).toBeLessThanOrEqual(6);
  });

  it("ranks eligible candidates by score and excludes sent or dismissed pairs", () => {
    const permissiveClient = withPrefs(client, { strict: [] });
    const permissiveCandidate = withPrefs(candidate, { strict: [] });
    const sent = { customerId: client.id, candidateId: candidate.id, status: "sent" as const, updatedAt: "2026-10-01T00:00:00.000Z" };
    expect(checkEligibility(permissiveClient, permissiveCandidate, { interactions: [sent] }).eligible).toBe(false);
    expect(checkEligibility(permissiveClient, permissiveCandidate, { interactions: [sent], showPreviouslyContacted: true }).eligible).toBe(true);
    const ranked = rankMatches(permissiveClient, seeded.profiles.filter((profile) => !profile.assigned).map((profile) => withPrefs(profile, { strict: [] })), { interactions: [sent] });
    expect(ranked.some((match) => match.candidateId === candidate.id)).toBe(false);
    expect(ranked.map((match) => match.overallScore)).toEqual([...ranked.map((match) => match.overallScore)].sort((a, b) => b - a));
  });
});
