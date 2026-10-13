import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/data/seed";
import { checkEligibility, rankMatches, scoreMatch } from "@/matching/scoring";
import type { Profile } from "@/domain/types";

const fixture = createSeedStore();
const customer = fixture.profiles.find((profile) => profile.id === "client-001")!;
const candidate = fixture.profiles.find((profile) => profile.id === "candidate-001")!;
function pair(ownerChanges: Partial<Profile["preferences"]>, targetChanges: Partial<Profile> = {}) {
  const owner = { ...customer, preferences: { ...customer.preferences, ...ownerChanges } };
  const target = { ...candidate, preferences: { ...candidate.preferences, strict: [], ...targetChanges.preferences }, ...targetChanges };
  return { owner, target };
}

describe("matching eligibility edge cases", () => {
  it("applies a strict city constraint but keeps an unknown city eligible", () => {
    const { owner, target } = pair({ cities: ["Bengaluru"], strict: ["city"] }, { city: "Mumbai" });
    expect(checkEligibility(owner, target).eligible).toBe(false);
    expect(checkEligibility(owner, { ...target, city: null }).eligible).toBe(true);
  });

  it("applies a strict height range only when height is known", () => {
    const { owner, target } = pair({ heightMinCm: 160, heightMaxCm: 180, strict: ["height"] }, { heightCm: 150 });
    expect(checkEligibility(owner, target).eligible).toBe(false);
    expect(checkEligibility(owner, { ...target, heightCm: null }).eligible).toBe(true);
  });

  it("applies a strict marital-status choice without treating missing status as a mismatch", () => {
    const { owner, target } = pair({ maritalStatuses: ["Never married"], strict: ["maritalStatus"] }, { maritalStatus: "Divorced" });
    expect(checkEligibility(owner, target).eligible).toBe(false);
    expect(checkEligibility(owner, { ...target, maritalStatus: null }).eligible).toBe(true);
  });

  it("treats an open-to-children answer as compatible with a strict children preference", () => {
    const { owner, target } = pair({ childrenPreference: "Want children", strict: ["childrenPreference"] }, { childrenPreference: "Do not want children" });
    expect(checkEligibility(owner, target).eligible).toBe(false);
    expect(checkEligibility(owner, { ...target, childrenPreference: "Open to children" }).eligible).toBe(true);
    expect(checkEligibility(owner, { ...target, childrenPreference: null }).eligible).toBe(true);
  });

  it("keeps relocation unknown distinct from an explicit strict conflict", () => {
    const { owner, target } = pair({ relocation: "Not open to relocate", strict: ["relocation"] }, { relocation: "Open to relocate" });
    expect(checkEligibility(owner, target).eligible).toBe(false);
    expect(checkEligibility(owner, { ...target, relocation: null }).eligible).toBe(true);
  });

  it("checks strict constraints in reverse as well as forward", () => {
    const { owner, target } = pair({ strict: [] }, { preferences: { ...candidate.preferences, ageMin: 60, ageMax: 70, strict: ["age"] } });
    const result = checkEligibility(owner, target);
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toContain("strict age preference");
  });

  it("rejects two distinct records with the same name and birth date", () => {
    const { owner, target } = pair({ strict: [] }, { firstName: "Shared", lastName: "Person", dateOfBirth: "1990-01-01" });
    const other = { ...owner, id: "client-999", firstName: "Shared", lastName: "Person", dateOfBirth: "1990-01-01" };
    expect(checkEligibility(other, target).reasons.join(" ")).toContain("same person");
  });

  it("does not assume two people with a shared name and missing birth dates are the same person", () => {
    const { owner, target } = pair({ strict: [] }, { firstName: "Shared", lastName: "Person", dateOfBirth: null });
    const other = { ...owner, id: "client-999", firstName: "Shared", lastName: "Person", dateOfBirth: null };
    expect(checkEligibility(other, target).eligible).toBe(true);
  });

  it("does not turn flexible preference mismatches into hard filters", () => {
    const { owner, target } = pair({ cities: ["Chennai"], maritalStatuses: ["Never married"], strict: [] }, { city: "Jaipur", maritalStatus: "Divorced" });
    expect(checkEligibility(owner, target).eligible).toBe(true);
    expect(scoreMatch(owner, target).overallScore).toBeGreaterThanOrEqual(0);
  });

  it("keeps previously dismissed pairs out of new suggestions unless history is requested", () => {
    const { owner, target } = pair({ strict: [] });
    const dismissed = { customerId: owner.id, candidateId: target.id, status: "dismissed" as const, updatedAt: "2026-10-01T00:00:00.000Z" };
    expect(checkEligibility(owner, target, { interactions: [dismissed] }).eligible).toBe(false);
    expect(checkEligibility(owner, target, { interactions: [dismissed], showPreviouslyContacted: true }).eligible).toBe(true);
  });

  it("uses candidate ID as a deterministic tie-break for equal scores", () => {
    const { owner, target } = pair({ strict: [] });
    const sameScoreA = { ...target, id: "candidate-050", firstName: "First", lastName: "Example" };
    const sameScoreB = { ...target, id: "candidate-051", firstName: "Second", lastName: "Example" };
    const ranked = rankMatches(owner, [sameScoreB, sameScoreA]);
    expect(ranked.map((result) => result.candidateId)).toEqual(["candidate-050", "candidate-051"]);
    expect(ranked[0].overallScore).toBe(ranked[1].overallScore);
  });

  it("returns the algorithm version and a bounded component breakdown", () => {
    const result = scoreMatch(customer, candidate);
    expect(result.algorithmVersion).toBe("mutual-fit-v1.0");
    expect(result.components.every((component) => component.score >= 0 && component.score <= 100)).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});
