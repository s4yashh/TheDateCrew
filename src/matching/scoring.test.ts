import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/data/seed";
import { SCORE_WEIGHTS, checkEligibility, rankMatches, scoreMatch } from "@/matching/scoring";
import { getAge } from "@/domain/types";
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
    expect(result.components).toHaveLength(8);
    expect(result.positiveReasons.every((reason) => reason.length > 0)).toBe(true);
  });

  it("keeps scores and labels within defined boundaries", () => {
    const result = scoreMatch(client, candidate);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["Excellent Potential", "Strong Potential", "Consider", "Low Fit"]).toContain(result.fitLabel);
    expect(result.components.reduce((sum, part) => sum + part.weight, 0)).toBe(100);
  });

  it("applies assessment signals by default and exposes them as a real component", () => {
    const heuristicClient: Profile = {
      ...client,
      gender: "man",
      dateOfBirth: "1990-01-01",
      heightCm: 180,
      annualIncomeInr: 4_000_000,
      preferences: { ...client.preferences, ageMin: null, ageMax: null, heightMinCm: null, heightMaxCm: null },
    };
    const heuristicCandidate: Profile = {
      ...candidate,
      gender: "woman",
      dateOfBirth: "1995-01-01",
      heightCm: 160,
      annualIncomeInr: 1_000_000,
    };
    const result = scoreMatch(heuristicClient, heuristicCandidate);
    expect(result.assessmentSignals).not.toBeNull();
    expect(result.assessmentSignals!).toBeGreaterThan(50);
    expect(result.assessmentReasons.length).toBeGreaterThan(0);
    expect(result.assessmentReasons.join(" ")).toContain("not a customer-stated preference");
    expect(result.components.find((component) => component.key === "assessmentSignals")?.applicable).toBe(true);
  });

  it("lets an explicit preference suppress the matching assessment signal", () => {
    const heuristicClient: Profile = {
      ...client,
      gender: "man",
      dateOfBirth: "1990-01-01",
      heightCm: 180,
      annualIncomeInr: 4_000_000,
      preferences: { ...client.preferences, ageMin: 24, ageMax: 34, heightMinCm: 150, heightMaxCm: 175 },
    };
    const result = scoreMatch(heuristicClient, { ...candidate, gender: "woman", dateOfBirth: "1995-01-01", heightCm: 160, annualIncomeInr: 1_000_000 });
    expect(result.assessmentReasons.join(" ")).not.toContain("Age direction");
    expect(result.assessmentReasons.join(" ")).not.toContain("Height direction");
  });

  it("can disable the assessment signals, which then drop out of the score", () => {
    const withSignals = scoreMatch(client, candidate);
    const withoutSignals = scoreMatch(client, candidate, { assessmentDemoMode: false });
    expect(withSignals.assessmentSignals).not.toBeNull();
    expect(withoutSignals.assessmentSignals).toBeNull();
    expect(withoutSignals.components.find((component) => component.key === "assessmentSignals")?.applicable).toBe(false);
    expect(withoutSignals.components.filter((component) => component.applicable)).toHaveLength(7);
  });

  it("keeps the brief's relative weights for customers without assessment signals", () => {
    const womanClient: Profile = { ...client, gender: "woman" };
    const manCandidate: Profile = { ...candidate, gender: "man" };
    const result = scoreMatch(womanClient, manCandidate);
    expect(result.assessmentSignals).toBeNull();
    const active = result.components.filter((component) => component.applicable);
    expect(active).toHaveLength(7);
    expect(active.reduce((sum, component) => sum + component.weight, 0)).toBe(90);
    // Renormalised shares reproduce 30/20/15/10/10/10/5.
    expect((active.find((component) => component.key === "mutualPreferenceFit")!.weight / 90) * 100).toBeCloseTo(30);
    expect((active.find((component) => component.key === "valuesAndIntentions")!.weight / 90) * 100).toBeCloseTo(20);
  });

  it("uses the full 100-point weight table", () => {
    expect(Object.values(SCORE_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  });

  it("handles missing, malformed, impossible, future, and valid dates of birth safely", () => {
    expect(getAge(null)).toBeNull();
    expect(getAge("not-a-date")).toBeNull();
    expect(getAge("2000-02-31")).toBeNull();
    expect(getAge("2099-01-01", new Date("2026-10-13T12:00:00.000Z"))).toBeNull();
    expect(getAge("1990-10-13", new Date("2026-10-13T12:00:00.000Z"))).toBe(36);
  });

  it("ranks eligible candidates by score and excludes sent or dismissed pairs", () => {
    const permissiveClient = withPrefs(client, { strict: [] });
    const permissiveCandidate = withPrefs(candidate, { strict: [] });
    const sent = { customerId: client.id, candidateId: candidate.id, status: "sent" as const, updatedAt: "2026-10-01T00:00:00.000Z" };
    expect(checkEligibility(permissiveClient, permissiveCandidate, { interactions: [sent] }).eligible).toBe(false);
    expect(checkEligibility(permissiveClient, permissiveCandidate, { interactions: [sent], showPreviouslyContacted: true }).eligible).toBe(true);
    const ranked = rankMatches(permissiveClient, seeded.profiles.filter((profile) => profile.assignedMatchmakerId === null).map((profile) => withPrefs(profile, { strict: [] })), { interactions: [sent] });
    expect(ranked.some((match) => match.candidateId === candidate.id)).toBe(false);
    expect(ranked.map((match) => match.overallScore)).toEqual([...ranked.map((match) => match.overallScore)].sort((a, b) => b - a));
  });
});
