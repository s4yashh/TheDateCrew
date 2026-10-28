import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/data/seed";
import { scoreMatch } from "@/matching/scoring";

describe("fictional seed dataset", () => {
  it("creates a reproducible pool with assigned customers and 200 candidates", () => {
    const first = createSeedStore();
    const second = createSeedStore();
    expect(first).toEqual(second);
    expect(first.profiles.filter((profile) => profile.assignedMatchmakerId !== null)).toHaveLength(12);
    expect(first.profiles.filter((profile) => profile.assignedMatchmakerId === null)).toHaveLength(200);
  });

  it("keeps 100 opposite-gender candidates for every assigned customer", () => {
    const store = createSeedStore();
    const candidates = store.profiles.filter((profile) => profile.assignedMatchmakerId === null);
    expect(candidates.filter((profile) => profile.gender === "woman")).toHaveLength(100);
    expect(candidates.filter((profile) => profile.gender === "man")).toHaveLength(100);
    for (const client of store.profiles.filter((profile) => profile.assignedMatchmakerId !== null)) {
      const opposite = candidates.filter((profile) => profile.gender !== client.gender);
      expect(opposite.length).toBeGreaterThanOrEqual(100);
    }
  });

  it("assigns six customers to each demo matchmaker", () => {
    const store = createSeedStore();
    expect(store.matchmakers).toHaveLength(2);
    for (const matchmaker of store.matchmakers) {
      const clients = store.profiles.filter((profile) => profile.assignedMatchmakerId === matchmaker.id);
      expect(clients).toHaveLength(6);
      expect(matchmaker.passwordHash).not.toBe(matchmaker.passwordSalt);
    }
  });

  it("provides exact income figures and optional tri-state answers", () => {
    const profiles = createSeedStore().profiles;
    const withIncome = profiles.filter((profile) => profile.annualIncomeInr !== null);
    expect(withIncome.length).toBeGreaterThan(150);
    expect(withIncome.every((profile) => typeof profile.annualIncomeInr === "number" && profile.annualIncomeInr > 0)).toBe(true);

    const triStates = new Set(["Yes", "Maybe", "No"]);
    for (const profile of profiles) {
      expect([null, ...triStates]).toContain(profile.childrenPreference);
      expect([null, ...triStates]).toContain(profile.relocation);
      expect([null, ...triStates]).toContain(profile.petsPreference);
    }
    // "Maybe" must actually appear, otherwise the three-state model is cosmetic.
    expect(profiles.some((profile) => profile.relocation === "Maybe")).toBe(true);
    expect(profiles.some((profile) => profile.petsPreference === "Maybe")).toBe(true);
    expect(profiles.some((profile) => profile.childrenPreference === "Maybe")).toBe(true);
  });

  it("records optional religion and caste for most, but not all, profiles", () => {
    const profiles = createSeedStore().profiles;
    const religion = profiles.filter((profile) => profile.religion !== null).length;
    const caste = profiles.filter((profile) => profile.caste !== null).length;
    expect(religion / profiles.length).toBeGreaterThan(0.55);
    expect(caste / profiles.length).toBeGreaterThan(0.5);
    expect(profiles.some((profile) => profile.religion === null)).toBe(true);
    expect(profiles.some((profile) => profile.caste === null)).toBe(true);
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
    const customer = store.profiles.find((profile) => profile.assignedMatchmakerId !== null)!;
    const candidates = store.profiles.filter((profile) => profile.assignedMatchmakerId === null && profile.gender !== customer.gender)
      .map((profile) => ({ ...profile, preferences: { ...profile.preferences, strict: [] } }));
    const scores = candidates.map((profile) => scoreMatch({ ...customer, preferences: { ...customer.preferences, strict: [] } }, profile).overallScore);
    expect(Math.max(...scores)).toBeGreaterThanOrEqual(60);
    expect(Math.min(...scores)).toBeLessThan(60);
  });

  it("does not use religion or caste as scoring inputs", () => {
    const store = createSeedStore();
    const customer = store.profiles.find((profile) => profile.assignedMatchmakerId !== null)!;
    const candidate = store.profiles.find((profile) => profile.assignedMatchmakerId === null && profile.gender !== customer.gender)!;
    const baseline = scoreMatch(customer, candidate);
    const changedSensitiveFields = scoreMatch({ ...customer, religion: "Hindu", caste: "Brahmin" }, { ...candidate, religion: "Muslim", caste: "Nair" });
    expect(changedSensitiveFields.overallScore).toBe(baseline.overallScore);
    expect(changedSensitiveFields.components).toEqual(baseline.components);
  });
});
