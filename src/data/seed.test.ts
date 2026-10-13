import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/data/seed";
import { scoreMatch } from "@/matching/scoring";

describe("fictional seed dataset", () => {
  it("creates a reproducible pool with assigned customers and 120 candidates", () => {
    const first = createSeedStore();
    const second = createSeedStore();
    expect(first).toEqual(second);
    expect(first.profiles.filter((profile) => profile.assigned)).toHaveLength(12);
    expect(first.profiles.filter((profile) => !profile.assigned)).toHaveLength(120);
  });

  it("keeps the demo candidate pool balanced across the assessment genders", () => {
    const candidates = createSeedStore().profiles.filter((profile) => !profile.assigned);
    expect(candidates.filter((profile) => profile.gender === "woman")).toHaveLength(60);
    expect(candidates.filter((profile) => profile.gender === "man")).toHaveLength(60);
  });

  it("uses synthetic contact details and allows optional profile facts to be missing", () => {
    const profiles = createSeedStore().profiles;
    expect(profiles.every((profile) => !profile.email || profile.email.endsWith("@example.test"))).toBe(true);
    expect(profiles.every((profile) => !profile.phone || /^\+91-00000-\d{5}$/.test(profile.phone))).toBe(true);
    expect(profiles.some((profile) => profile.dateOfBirth === null || profile.city === null || profile.degree === null)).toBe(true);
    expect(profiles.every((profile) => profile.profileCompleteness >= 0 && profile.profileCompleteness <= 100)).toBe(true);
  });

  it("includes both strong and low decision-support signals", () => {
    const store = createSeedStore();
    const customer = store.profiles.find((profile) => profile.assigned)!;
    const candidates = store.profiles.filter((profile) => !profile.assigned && profile.gender !== customer.gender)
      .map((profile) => ({ ...profile, preferences: { ...profile.preferences, strict: [] } }));
    const scores = candidates.map((profile) => scoreMatch({ ...customer, preferences: { ...customer.preferences, strict: [] } }, profile).overallScore);
    expect(Math.max(...scores)).toBeGreaterThanOrEqual(60);
    expect(Math.min(...scores)).toBeLessThan(60);
  });

  it("does not use religion or community as scoring inputs", () => {
    const store = createSeedStore();
    const customer = store.profiles.find((profile) => profile.assigned)!;
    const candidate = store.profiles.find((profile) => !profile.assigned && profile.gender !== customer.gender)!;
    const baseline = scoreMatch(customer, candidate);
    const changedSensitiveFields = scoreMatch({ ...customer, religion: "Hindu", community: "Community A" }, { ...candidate, religion: "Muslim", community: "Community B" });
    expect(changedSensitiveFields.overallScore).toBe(baseline.overallScore);
    expect(changedSensitiveFields.components).toEqual(baseline.components);
  });
});
