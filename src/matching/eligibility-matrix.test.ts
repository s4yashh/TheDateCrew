import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/data/seed";
import type { MatchInteraction, PartnerPreferences, Profile } from "@/domain/types";
import { checkEligibility } from "@/matching/scoring";
import scenariosJson from "@/matching/eligibility-matrix.json";

interface EligibilityScenario {
  name: string;
  expected: boolean;
  customerPreferences?: Partial<PartnerPreferences>;
  candidatePreferences?: Partial<PartnerPreferences>;
  customerChanges?: Partial<Profile>;
  candidateChanges?: Partial<Profile>;
  sameId?: boolean;
  samePerson?: boolean;
  sameName?: boolean;
  interactionStatus?: MatchInteraction["status"];
  showPreviouslyContacted?: boolean;
}

const scenarios = scenariosJson as EligibilityScenario[];
const fixture = createSeedStore();
const baseCustomer = fixture.profiles.find((profile) => profile.id === "client-001")!;
const baseCandidate = fixture.profiles.find((profile) => profile.id === "candidate-001")!;
const fixedNow = new Date("2026-10-13T12:00:00.000Z");

describe("eligibility requirement matrix", () => {
  it.each(scenarios)("$name", (scenario) => {
    const customer: Profile = {
      ...baseCustomer,
      ...scenario.customerChanges,
      preferences: { ...baseCustomer.preferences, ...scenario.customerPreferences, strict: scenario.customerPreferences?.strict ?? [] },
    };
    const candidate: Profile = {
      ...baseCandidate,
      ...scenario.candidateChanges,
      preferences: { ...baseCandidate.preferences, ...scenario.candidatePreferences, strict: scenario.candidatePreferences?.strict ?? [] },
    };
    if (scenario.sameId) candidate.id = customer.id;
    if (scenario.samePerson) {
      candidate.firstName = customer.firstName;
      candidate.lastName = customer.lastName;
      candidate.dateOfBirth = customer.dateOfBirth;
    }
    if (scenario.sameName) {
      candidate.firstName = customer.firstName;
      candidate.lastName = customer.lastName;
    }
    const interactions: MatchInteraction[] = scenario.interactionStatus ? [{
      customerId: customer.id,
      candidateId: candidate.id,
      status: scenario.interactionStatus,
      updatedAt: "2026-10-01T00:00:00.000Z",
    }] : [];
    const result = checkEligibility(customer, candidate, {
      interactions,
      showPreviouslyContacted: scenario.showPreviouslyContacted,
      now: fixedNow,
    });
    expect(result.eligible, result.reasons.join(" ")).toBe(scenario.expected);
  });
});
