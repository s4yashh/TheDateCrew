import { getAge, profileName } from "@/domain/types";
import type { PartnerPreferences, Profile } from "@/domain/types";
import { triStateCompatible } from "@/matching/tri-state";
import type { MatchOptions } from "@/matching/types";

/**
 * Stage A: eligibility and hard constraints.
 *
 * This function is deliberately isolated from scoring so the opposite-gender
 * demo policy, previously-contacted rules, and strict preferences can be
 * replaced or extended without touching the weighted model.
 */
function checkStrictPreference(
  owner: Profile,
  target: Profile,
  field: PartnerPreferences["strict"][number],
  now: Date,
): string | null {
  const preference = owner.preferences;
  switch (field) {
    case "age": {
      const age = getAge(target.dateOfBirth, now);
      if (age === null || (preference.ageMin === null && preference.ageMax === null)) return null;
      return (preference.ageMin !== null && age < preference.ageMin) || (preference.ageMax !== null && age > preference.ageMax)
        ? `${profileName(owner)}'s strict age preference is ${preference.ageMin ?? "any"}–${preference.ageMax ?? "any"}; ${profileName(target)} is ${age}.`
        : null;
    }
    case "height": {
      if (target.heightCm === null) return null;
      return (preference.heightMinCm !== null && target.heightCm < preference.heightMinCm) || (preference.heightMaxCm !== null && target.heightCm > preference.heightMaxCm)
        ? `${profileName(owner)}'s strict height range is not met.`
        : null;
    }
    case "city":
      return target.city && preference.cities.length > 0 && !preference.cities.includes(target.city)
        ? `${profileName(owner)}'s strict location preference does not include ${target.city}.`
        : null;
    case "maritalStatus":
      return target.maritalStatus && preference.maritalStatuses.length > 0 && !preference.maritalStatuses.includes(target.maritalStatus)
        ? `${profileName(owner)}'s strict marital-status preference is not met.`
        : null;
    case "childrenPreference": {
      const aligned = triStateCompatible(preference.childrenPreference, target.childrenPreference);
      return aligned === false ? `${profileName(owner)}'s strict family-plan preference is not met.` : null;
    }
    case "relocation":
      // "Yes" means the partner must be open to relocating. Maybe/No on the
      // owner side are not treated as hard requirements.
      return preference.relocation === "Yes" && target.relocation === "No"
        ? `${profileName(owner)}'s strict relocation preference is not met.`
        : null;
  }
}

export function checkEligibility(
  customer: Profile,
  candidate: Profile,
  options: MatchOptions = {},
): { eligible: boolean; reasons: string[] } {
  const now = options.now ?? new Date();
  const reasons: string[] = [];

  if (customer.id === candidate.id) reasons.push("A profile cannot be matched with itself.");
  if (
    customer.firstName === candidate.firstName
    && customer.lastName === candidate.lastName
    && customer.dateOfBirth !== null
    && customer.dateOfBirth === candidate.dateOfBirth
  ) {
    reasons.push("These records describe the same person.");
  }
  if (customer.gender === candidate.gender || customer.gender === "nonbinary" || candidate.gender === "nonbinary") {
    reasons.push("The assessment demo pool requires an opposite-gender pairing.");
  }

  const interaction = options.interactions?.find(
    (item) => item.customerId === customer.id && item.candidateId === candidate.id,
  );
  if (interaction && !options.showPreviouslyContacted) {
    if (interaction.status === "dismissed") reasons.push("This profile was dismissed for this customer.");
    if (interaction.status === "sent") reasons.push("An introduction has already been sent for this pair.");
  }

  for (const field of customer.preferences.strict) {
    const reason = checkStrictPreference(customer, candidate, field, now);
    if (reason) reasons.push(reason);
  }
  for (const field of candidate.preferences.strict) {
    const reason = checkStrictPreference(candidate, customer, field, now);
    if (reason) reasons.push(reason);
  }

  return { eligible: reasons.length === 0, reasons };
}
