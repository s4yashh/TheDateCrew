import { getAge } from "@/domain/types";
import type { Profile } from "@/domain/types";
import { weightedAverage } from "@/matching/compatibility";
import type { FitDetails } from "@/matching/types";

const SIGNAL_NOTE = "(assessment demo signal, not a customer-stated preference)";

/**
 * Gender-specific assessment signals.
 *
 * The brief asks for male-customer matching to consider a younger partner,
 * lower relative income, and shorter height. These are demo heuristics, not
 * universal truths, so they:
 *   - are a visible scoring component rather than a hidden bonus,
 *   - only fire when the customer has NOT stated an explicit preference,
 *   - never affect eligibility, and
 *   - are capped because the component is worth 10% of the total.
 *
 * Children alignment is intentionally excluded here: it is already a
 * first-class dimension for every gender in `familyScore`, and scoring it twice
 * would double-count the same fact.
 *
 * Female-customer emphasis (career, values, relocation) is handled by the
 * ordinary weighted components, which apply to every customer. No duplicate
 * bonus is added.
 */
export function assessmentSignals(customer: Profile, candidate: Profile, now: Date): FitDetails {
  if (customer.gender !== "man") {
    return { score: 50, unknowns: 0, known: 0, reasons: [], applicable: false };
  }

  const items: Array<{ value: number | null; weight: number; reason?: string }> = [];
  const hasAgePreference = customer.preferences.ageMin !== null || customer.preferences.ageMax !== null;
  const hasHeightPreference = customer.preferences.heightMinCm !== null || customer.preferences.heightMaxCm !== null;

  if (!hasAgePreference) {
    const customerAge = getAge(customer.dateOfBirth, now);
    const candidateAge = getAge(candidate.dateOfBirth, now);
    if (customerAge !== null && candidateAge !== null) {
      const younger = candidateAge < customerAge;
      items.push({
        value: younger ? 100 : candidateAge === customerAge ? 60 : 25,
        weight: 2,
        reason: younger ? `Age direction: ${candidate.firstName} is younger ${SIGNAL_NOTE}.` : undefined,
      });
    }
  }

  if (!hasHeightPreference && customer.heightCm !== null && candidate.heightCm !== null) {
    const shorter = candidate.heightCm < customer.heightCm;
    items.push({
      value: shorter ? 100 : candidate.heightCm === customer.heightCm ? 60 : 25,
      weight: 1,
      reason: shorter ? `Height direction: ${candidate.firstName} is shorter ${SIGNAL_NOTE}.` : undefined,
    });
  }

  if (customer.annualIncomeInr !== null && candidate.annualIncomeInr !== null) {
    const earnsLess = candidate.annualIncomeInr < customer.annualIncomeInr;
    items.push({
      value: earnsLess ? 100 : candidate.annualIncomeInr === customer.annualIncomeInr ? 60 : 25,
      weight: 2,
      reason: earnsLess ? `Relative income: ${candidate.firstName} earns less ${SIGNAL_NOTE}.` : undefined,
    });
  }

  return weightedAverage(items);
}
