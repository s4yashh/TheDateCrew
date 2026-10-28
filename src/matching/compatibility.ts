import { getAge } from "@/domain/types";
import type { Profile } from "@/domain/types";
import { pairTriStateFit, triStateFit } from "@/matching/tri-state";
import type { FitDetails } from "@/matching/types";
import { clamp } from "@/matching/weights";

const overlap = (left: string[], right: string[]) => left.filter((value) => right.includes(value));

/**
 * Weighted mean that ignores unknown values and reports whether it had enough
 * data to be meaningful. Callers use `applicable` to renormalise the overall
 * score instead of awarding a neutral 50 to a dimension nobody answered.
 */
export function weightedAverage(items: Array<{ value: number | null; weight: number; reason?: string }>): FitDetails {
  const available = items.filter((item) => item.value !== null);
  if (available.length === 0) {
    return { score: 50, unknowns: items.length, known: 0, reasons: [], applicable: false };
  }
  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
  const score = available.reduce((sum, item) => sum + (item.value ?? 0) * item.weight, 0) / totalWeight;
  return {
    score,
    unknowns: items.length - available.length,
    known: available.length,
    reasons: available.flatMap((item) => item.value !== null && item.value >= 75 && item.reason ? [item.reason] : []),
    applicable: true,
  };
}

/** Stage B: how well one profile's stated preferences are met by the other. */
export function preferenceFit(owner: Profile, target: Profile, now: Date): FitDetails {
  const prefs = owner.preferences;
  const age = getAge(target.dateOfBirth, now);
  const items: Array<{ value: number | null; weight: number; reason?: string }> = [];

  if (prefs.ageMin !== null || prefs.ageMax !== null) {
    const ageFit = age === null ? null : age >= (prefs.ageMin ?? 18) && age <= (prefs.ageMax ?? 110) ? 100 : 20;
    items.push({
      value: ageFit,
      weight: 2,
      reason: ageFit === 100 ? `Age ${age} is within the stated ${prefs.ageMin ?? "any"}–${prefs.ageMax ?? "any"} range.` : undefined,
    });
  }
  if (prefs.heightMinCm !== null || prefs.heightMaxCm !== null) {
    const fits = target.heightCm === null
      ? null
      : target.heightCm >= (prefs.heightMinCm ?? 0) && target.heightCm <= (prefs.heightMaxCm ?? 260);
    items.push({ value: fits === null ? null : fits ? 100 : 20, weight: 1 });
  }
  if (prefs.cities.length) {
    const fits = target.city === null ? null : prefs.cities.includes(target.city);
    items.push({
      value: fits === null ? null : fits ? 100 : 35,
      weight: 2,
      reason: fits ? `Location ${target.city} is among the stated preferences.` : undefined,
    });
  }
  if (prefs.maritalStatuses.length) {
    const fits = target.maritalStatus === null ? null : prefs.maritalStatuses.includes(target.maritalStatus);
    items.push({
      value: fits === null ? null : fits ? 100 : 25,
      weight: 2,
      reason: fits ? `Marital status (${target.maritalStatus}) matches a stated preference.` : undefined,
    });
  }
  if (prefs.professions.length) {
    const fits = target.profession === null ? null : prefs.professions.includes(target.profession);
    items.push({
      value: fits === null ? null : fits ? 100 : 55,
      weight: 1,
      reason: fits ? `Profession (${target.profession}) is on the preference list.` : undefined,
    });
  }
  if (prefs.education.length) {
    const fits = target.degree === null ? null : prefs.education.includes(target.degree);
    items.push({ value: fits === null ? null : fits ? 100 : 55, weight: 1 });
  }
  if (prefs.languages.length) {
    const shared = overlap(prefs.languages, target.languages);
    items.push({
      value: target.languages.length ? (shared.length ? 75 + shared.length * 10 : 30) : null,
      weight: 1,
      reason: shared.length ? `Both value ${shared.join(", ")}.` : undefined,
    });
  }
  if (prefs.childrenPreference) {
    const value = triStateFit(prefs.childrenPreference, target.childrenPreference);
    items.push({
      value,
      weight: 2,
      reason: value !== null && value >= 75 ? `Family plans align with the stated preference (${prefs.childrenPreference}).` : undefined,
    });
  }
  if (prefs.relocation) {
    const value = triStateFit(prefs.relocation, target.relocation);
    items.push({
      value,
      weight: 1,
      reason: value === 100 ? "Relocation expectations are compatible." : undefined,
    });
  }
  if (prefs.petsPreference) {
    const value = triStateFit(prefs.petsPreference, target.petsPreference);
    items.push({
      value,
      weight: 1,
      reason: value === 100 ? `Pets preference matches (${prefs.petsPreference}).` : undefined,
    });
  }
  if (prefs.values.length) {
    const shared = overlap(prefs.values, target.values);
    items.push({
      value: target.values.length ? (shared.length ? Math.min(100, 65 + shared.length * 15) : 35) : null,
      weight: 2,
      reason: shared.length ? `Shared values include ${shared.join(", ")}.` : undefined,
    });
  }
  if (prefs.interests.length) {
    const shared = overlap(prefs.interests, target.hobbies);
    items.push({
      value: target.hobbies.length ? (shared.length ? Math.min(100, 65 + shared.length * 15) : 40) : null,
      weight: 1,
      reason: shared.length ? `Shared interests include ${shared.join(", ")}.` : undefined,
    });
  }
  return weightedAverage(items);
}

export function overlapScore(left: string[] | null, right: string[] | null, reasonLabel: string): FitDetails {
  if (!left?.length || !right?.length) return { score: 50, unknowns: 1, known: 0, reasons: [], applicable: false };
  const shared = overlap(left, right);
  const score = shared.length ? Math.min(100, 58 + shared.length * 18) : 38;
  return {
    score,
    unknowns: 0,
    known: 1,
    reasons: shared.length ? [`${reasonLabel}: ${shared.join(", ")}.`] : [],
    applicable: true,
  };
}

export function familyScore(customer: Profile, candidate: Profile): FitDetails {
  const childAlignment = triStateFit(customer.childrenPreference, candidate.childrenPreference);
  const familyAlignment = customer.familyValues && candidate.familyValues
    ? customer.familyValues === candidate.familyValues ? 90 : 50
    : null;
  return weightedAverage([
    {
      value: childAlignment,
      weight: 3,
      reason: childAlignment !== null && childAlignment >= 75 ? "Family plans are aligned." : undefined,
    },
    {
      value: familyAlignment,
      weight: 1,
      reason: familyAlignment && familyAlignment >= 75 ? `Family values are similar (${customer.familyValues}).` : undefined,
    },
  ]);
}

export function careerScore(customer: Profile, candidate: Profile): FitDetails {
  const sameProfession = customer.profession && candidate.profession ? customer.profession === candidate.profession : null;
  const sameEducation = customer.degree && candidate.degree ? customer.degree === candidate.degree : null;
  const bothLifestyle = customer.lifestyle.length > 0 && candidate.lifestyle.length > 0;
  const sharedLifestyle = bothLifestyle ? overlap(customer.lifestyle, candidate.lifestyle) : [];
  const lifestyleFit = bothLifestyle ? (sharedLifestyle.length ? 75 + sharedLifestyle.length * 8 : 45) : null;
  return weightedAverage([
    {
      value: sameProfession === null ? null : sameProfession ? 80 : 60,
      weight: 2,
      reason: sameProfession ? `Both work as ${customer.profession}.` : undefined,
    },
    { value: sameEducation === null ? null : sameEducation ? 85 : 65, weight: 1 },
    {
      value: lifestyleFit,
      weight: 2,
      reason: sharedLifestyle.length ? `Lifestyle overlap: ${sharedLifestyle.join(", ")}.` : undefined,
    },
    {
      value: pairTriStateFit(customer.petsPreference, candidate.petsPreference),
      weight: 1,
      reason: "Pets expectations are compatible.",
    },
  ]);
}

export function locationScore(customer: Profile, candidate: Profile): FitDetails {
  const sameCity = customer.city && candidate.city ? customer.city === candidate.city : null;
  const relocationFit = pairTriStateFit(customer.relocation, candidate.relocation);
  return weightedAverage([
    {
      value: sameCity === null ? null : sameCity ? 100 : 55,
      weight: 2,
      reason: sameCity ? `Both are based in ${customer.city}.` : undefined,
    },
    {
      value: relocationFit,
      weight: 2,
      reason: relocationFit !== null && relocationFit >= 85 ? "Relocation expectations leave room to plan together." : undefined,
    },
  ]);
}

export function confidenceScore(customer: Profile, candidate: Profile): FitDetails {
  const complete = (customer.profileCompleteness + candidate.profileCompleteness) / 2;
  const verifiedBonus = Number(customer.verification === "Verified") + Number(candidate.verification === "Verified");
  return {
    score: clamp(complete * 0.8 + verifiedBonus * 10),
    unknowns: 0,
    known: 1,
    reasons: [],
    applicable: true,
  };
}
