import { getAge, profileName } from "@/domain/types";
import type { MatchInteraction, PartnerPreferences, Profile } from "@/domain/types";

export const SCORE_WEIGHTS = {
  mutualPreferenceFit: 30,
  valuesAndIntentions: 20,
  familyPlans: 15,
  careerEducationLifestyle: 10,
  locationAndRelocation: 10,
  languageAndInterests: 10,
  confidence: 5,
} as const;

export const ALGORITHM_VERSION = "mutual-fit-v1.0";
export type FitLabel = "Excellent Potential" | "Strong Potential" | "Consider" | "Low Fit";

export interface MatchComponent {
  key: keyof typeof SCORE_WEIGHTS;
  label: string;
  weight: number;
  score: number;
  contribution: number;
}

export interface MatchResult {
  candidateId: string;
  overallScore: number;
  fitLabel: FitLabel;
  forwardFit: number;
  reverseFit: number;
  mutual: boolean;
  components: MatchComponent[];
  positiveReasons: string[];
  tradeoffs: string[];
  eligible: boolean;
  hardFilterReasons: string[];
  algorithmVersion: string;
  assessmentBonus: number;
  assessmentReasons: string[];
}

export interface MatchOptions {
  assessmentDemoMode?: boolean;
  showPreviouslyContacted?: boolean;
  interactions?: MatchInteraction[];
  now?: Date;
}

const LABELS: Record<keyof typeof SCORE_WEIGHTS, string> = {
  mutualPreferenceFit: "Mutual preference fit",
  valuesAndIntentions: "Values & intentions",
  familyPlans: "Family plans",
  careerEducationLifestyle: "Career & lifestyle",
  locationAndRelocation: "Location & flexibility",
  languageAndInterests: "Languages & interests",
  confidence: "Profile confidence",
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value);
const overlap = (left: string[], right: string[]) => left.filter((value) => right.includes(value));

function ageAt(profile: Profile, now: Date): number | null {
  return getAge(profile.dateOfBirth, now);
}

function isChildrenCompatible(preference: string | null, target: string | null): boolean | null {
  if (!preference || !target) return null;
  if (preference === "Open to children" || target === "Open to children") return true;
  return preference === target;
}

function checkStrictPreference(owner: Profile, target: Profile, field: PartnerPreferences["strict"][number], now: Date): string | null {
  const preference = owner.preferences;
  switch (field) {
    case "age": {
      const age = ageAt(target, now);
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
      const aligned = isChildrenCompatible(preference.childrenPreference, target.childrenPreference);
      return aligned === false ? `${profileName(owner)}'s strict family-plan preference is not met.` : null;
    }
    case "relocation":
      return preference.relocation === "Not open to relocate" && target.relocation === "Open to relocate"
        ? `${profileName(owner)}'s strict relocation preference is not met.`
        : null;
  }
}

export function checkEligibility(customer: Profile, candidate: Profile, options: MatchOptions = {}): { eligible: boolean; reasons: string[] } {
  const now = options.now ?? new Date("2026-10-13T12:00:00.000Z");
  const reasons: string[] = [];
  if (customer.id === candidate.id) reasons.push("A profile cannot be matched with itself.");
  if (customer.firstName === candidate.firstName && customer.lastName === candidate.lastName && customer.dateOfBirth === candidate.dateOfBirth) {
    reasons.push("These records describe the same person.");
  }
  if (customer.gender === candidate.gender || customer.gender === "nonbinary" || candidate.gender === "nonbinary") {
    reasons.push("The assessment demo pool requires an opposite-gender pairing.");
  }
  const interaction = options.interactions?.find((item) => item.customerId === customer.id && item.candidateId === candidate.id);
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

interface FitDetails {
  score: number;
  unknowns: number;
  known: number;
  reasons: string[];
}

function weightedAverage(items: Array<{ value: number | null; weight: number; reason?: string }>): FitDetails {
  const available = items.filter((item) => item.value !== null);
  if (available.length === 0) return { score: 50, unknowns: items.length, known: 0, reasons: [] };
  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
  const score = available.reduce((sum, item) => sum + (item.value ?? 0) * item.weight, 0) / totalWeight;
  return {
    score,
    unknowns: items.length - available.length,
    known: available.length,
    reasons: available.flatMap((item) => item.value !== null && item.value >= 75 && item.reason ? [item.reason] : []),
  };
}

function preferenceFit(owner: Profile, target: Profile, now: Date): FitDetails {
  const prefs = owner.preferences;
  const items: Array<{ value: number | null; weight: number; reason?: string }> = [];
  const age = ageAt(target, now);
  if (prefs.ageMin !== null || prefs.ageMax !== null) {
    const ageFit = age === null ? null : age >= (prefs.ageMin ?? 18) && age <= (prefs.ageMax ?? 110) ? 100 : 20;
    items.push({ value: ageFit, weight: 2, reason: ageFit === 100 ? `Age ${age} is within the stated ${prefs.ageMin ?? "any"}–${prefs.ageMax ?? "any"} range.` : undefined });
  }
  if (prefs.heightMinCm !== null || prefs.heightMaxCm !== null) {
    const fits = target.heightCm === null ? null : target.heightCm >= (prefs.heightMinCm ?? 0) && target.heightCm <= (prefs.heightMaxCm ?? 260);
    items.push({ value: fits === null ? null : fits ? 100 : 20, weight: 1 });
  }
  if (prefs.cities.length) {
    const fits = target.city === null ? null : prefs.cities.includes(target.city);
    items.push({ value: fits === null ? null : fits ? 100 : 35, weight: 2, reason: fits ? `Location ${target.city} is among the stated preferences.` : undefined });
  }
  if (prefs.maritalStatuses.length) {
    const fits = target.maritalStatus === null ? null : prefs.maritalStatuses.includes(target.maritalStatus);
    items.push({ value: fits === null ? null : fits ? 100 : 25, weight: 2, reason: fits ? `Marital status (${target.maritalStatus}) matches a stated preference.` : undefined });
  }
  if (prefs.professions.length) {
    const fits = target.profession === null ? null : prefs.professions.includes(target.profession);
    items.push({ value: fits === null ? null : fits ? 100 : 55, weight: 1, reason: fits ? `Profession (${target.profession}) is on the preference list.` : undefined });
  }
  if (prefs.education.length) {
    const fits = target.degree === null ? null : prefs.education.includes(target.degree);
    items.push({ value: fits === null ? null : fits ? 100 : 55, weight: 1 });
  }
  if (prefs.languages.length) {
    const shared = overlap(prefs.languages, target.languages);
    items.push({ value: target.languages.length ? (shared.length ? 75 + shared.length * 10 : 30) : null, weight: 1, reason: shared.length ? `Both value ${shared.join(", ")}.` : undefined });
  }
  if (prefs.childrenPreference) {
    const aligned = isChildrenCompatible(prefs.childrenPreference, target.childrenPreference);
    items.push({ value: aligned === null ? null : aligned ? 100 : 20, weight: 2, reason: aligned ? `Family plans align with the stated preference (${prefs.childrenPreference}).` : undefined });
  }
  if (prefs.relocation) {
    const aligns = target.relocation === null ? null : prefs.relocation === "Open to relocate" || target.relocation === "Not open to relocate";
    items.push({ value: aligns === null ? null : aligns ? 90 : 35, weight: 1, reason: aligns ? "Relocation expectations are compatible." : undefined });
  }
  if (prefs.values.length) {
    const shared = overlap(prefs.values, target.values);
    items.push({ value: target.values.length ? (shared.length ? Math.min(100, 65 + shared.length * 15) : 35) : null, weight: 2, reason: shared.length ? `Shared values include ${shared.join(", ")}.` : undefined });
  }
  if (prefs.interests.length) {
    const shared = overlap(prefs.interests, target.hobbies);
    items.push({ value: target.hobbies.length ? (shared.length ? Math.min(100, 65 + shared.length * 15) : 40) : null, weight: 1, reason: shared.length ? `Shared interests include ${shared.join(", ")}.` : undefined });
  }
  return weightedAverage(items);
}

function overlapScore(left: string[] | null, right: string[] | null, reasonLabel: string): FitDetails {
  if (!left?.length || !right?.length) return { score: 50, unknowns: 1, known: 0, reasons: [] };
  const shared = overlap(left, right);
  const score = shared.length ? Math.min(100, 58 + shared.length * 18) : 38;
  return { score, unknowns: 0, known: 1, reasons: shared.length ? [`${reasonLabel}: ${shared.join(", ")}.`] : [] };
}

function familyScore(customer: Profile, candidate: Profile): FitDetails {
  const childAlignment = isChildrenCompatible(customer.childrenPreference, candidate.childrenPreference);
  const familyAlignment = customer.familyValues && candidate.familyValues
    ? customer.familyValues === candidate.familyValues ? 90 : 50
    : null;
  return weightedAverage([
    { value: childAlignment === null ? null : childAlignment ? 100 : 25, weight: 3, reason: childAlignment ? "Family plans are aligned." : undefined },
    { value: familyAlignment, weight: 1, reason: familyAlignment && familyAlignment >= 75 ? `Family values are similar (${customer.familyValues}).` : undefined },
  ]);
}

function careerScore(customer: Profile, candidate: Profile): FitDetails {
  const sameProfession = customer.profession && candidate.profession ? customer.profession === candidate.profession : null;
  const sameEducation = customer.degree && candidate.degree ? customer.degree === candidate.degree : null;
  const bothLifestyle = customer.lifestyle.length && candidate.lifestyle.length;
  const sharedLifestyle = bothLifestyle ? overlap(customer.lifestyle, candidate.lifestyle) : [];
  const lifestyleFit = bothLifestyle ? (sharedLifestyle.length ? 75 + sharedLifestyle.length * 8 : 45) : null;
  return weightedAverage([
    { value: sameProfession === null ? null : sameProfession ? 80 : 60, weight: 2, reason: sameProfession ? `Both work as ${customer.profession}.` : undefined },
    { value: sameEducation === null ? null : sameEducation ? 85 : 65, weight: 1 },
    { value: lifestyleFit, weight: 2, reason: sharedLifestyle.length ? `Lifestyle overlap: ${sharedLifestyle.join(", ")}.` : undefined },
  ]);
}

function locationScore(customer: Profile, candidate: Profile): FitDetails {
  const sameCity = customer.city && candidate.city ? customer.city === candidate.city : null;
  let relocationFit: number | null = null;
  if (customer.relocation && candidate.relocation) {
    relocationFit = customer.relocation === "Open to relocate" || candidate.relocation === "Open to relocate" ? 90 : sameCity ? 100 : 45;
  }
  return weightedAverage([
    { value: sameCity === null ? null : sameCity ? 100 : 55, weight: 2, reason: sameCity ? `Both are based in ${customer.city}.` : undefined },
    { value: relocationFit, weight: 2, reason: relocationFit && relocationFit >= 85 ? "Relocation preferences leave room to plan together." : undefined },
  ]);
}

function confidenceScore(customer: Profile, candidate: Profile): FitDetails {
  const complete = (customer.profileCompleteness + candidate.profileCompleteness) / 2;
  const verifiedBonus = Number(customer.verification === "Verified") + Number(candidate.verification === "Verified");
  return {
    score: clamp(complete * 0.8 + verifiedBonus * 10),
    unknowns: 0,
    known: 1,
    reasons: [],
  };
}

function demoHeuristicBonus(customer: Profile, candidate: Profile, now: Date, compatibility: { career: number; values: number; location: number }): { bonus: number; reasons: string[] } {
  const reasons: string[] = [];
  if (customer.gender === "man") {
    const clientAge = ageAt(customer, now);
    const candidateAge = ageAt(candidate, now);
    if (clientAge !== null && candidateAge !== null && candidateAge < clientAge && customer.preferences.ageMin === null && customer.preferences.ageMax === null) {
      reasons.push("Assessment demo heuristic: small age-direction signal (not a user preference).");
    }
    if (customer.heightCm !== null && candidate.heightCm !== null && candidate.heightCm < customer.heightCm && customer.preferences.heightMinCm === null && customer.preferences.heightMaxCm === null) {
      reasons.push("Assessment demo heuristic: small height-direction signal (not a user preference).");
    }
    const clientIncome = incomeNumber(customer.incomeBand);
    const candidateIncome = incomeNumber(candidate.incomeBand);
    if (clientIncome !== null && candidateIncome !== null && candidateIncome < clientIncome) {
      reasons.push("Assessment demo heuristic: small relative-income signal (not a user preference).");
    }
  } else if (customer.gender === "woman") {
    if (customer.profession && candidate.profession && compatibility.career >= 70) reasons.push("Assessment demo mode: a small career-compatibility emphasis.");
    if (customer.values.length && candidate.values.length && compatibility.values >= 70) reasons.push("Assessment demo mode: a small shared-values emphasis.");
    if (customer.relocation && candidate.relocation && compatibility.location >= 70) reasons.push("Assessment demo mode: a small relocation-compatibility emphasis.");
  }
  return { bonus: Math.min(customer.gender === "man" ? 6 : 4, reasons.length * (customer.gender === "man" ? 2 : 1.25)), reasons };
}

function incomeNumber(band: string | null): number | null {
  if (!band || band === "Prefer not to say") return null;
  const match = band.match(/₹(\d+)/);
  return match ? Number(match[1]) : null;
}

function fitLabel(score: number): FitLabel {
  if (score >= 82) return "Excellent Potential";
  if (score >= 68) return "Strong Potential";
  if (score >= 50) return "Consider";
  return "Low Fit";
}

export function scoreMatch(customer: Profile, candidate: Profile, options: MatchOptions = {}): MatchResult {
  const now = options.now ?? new Date("2026-10-13T12:00:00.000Z");
  const eligibility = checkEligibility(customer, candidate, { ...options, now });
  const forward = preferenceFit(customer, candidate, now);
  const reverse = preferenceFit(candidate, customer, now);
  const bothPreferencesExist = customer.preferences.strict.length > 0 || candidate.preferences.strict.length > 0
    || customer.preferences.ageMin !== null || customer.preferences.ageMax !== null
    || candidate.preferences.ageMin !== null || candidate.preferences.ageMax !== null;
  const preferenceComponent = bothPreferencesExist ? (forward.score + reverse.score) / 2 : 50;
  const values = overlapScore(customer.values, candidate.values, "Shared values");
  const family = familyScore(customer, candidate);
  const career = careerScore(customer, candidate);
  const location = locationScore(customer, candidate);
  const languages = overlapScore(customer.languages, candidate.languages, "Shared languages");
  const interests = overlapScore(customer.hobbies, candidate.hobbies, "Shared interests");
  const confidence = confidenceScore(customer, candidate);
  const categoryValues: Record<keyof typeof SCORE_WEIGHTS, FitDetails> = {
    mutualPreferenceFit: { ...weightedAverage([{ value: forward.score, weight: 1 }, { value: reverse.score, weight: 1 }]), score: preferenceComponent, unknowns: forward.unknowns + reverse.unknowns, known: forward.known + reverse.known },
    valuesAndIntentions: weightedAverage([
      { value: values.known ? values.score : null, weight: 2, reason: values.reasons[0] },
      { value: customer.relationshipTimeline && candidate.relationshipTimeline ? customer.relationshipTimeline === candidate.relationshipTimeline ? 90 : 60 : null, weight: 1 },
    ]),
    familyPlans: family,
    careerEducationLifestyle: career,
    locationAndRelocation: location,
    languageAndInterests: weightedAverage([
      { value: languages.known ? languages.score : null, weight: 1, reason: languages.reasons[0] },
      { value: interests.known ? interests.score : null, weight: 1, reason: interests.reasons[0] },
    ]),
    confidence,
  };
  const components = (Object.keys(SCORE_WEIGHTS) as Array<keyof typeof SCORE_WEIGHTS>).map((key) => ({
    key,
    label: LABELS[key],
    weight: SCORE_WEIGHTS[key],
    score: round(categoryValues[key].score),
    contribution: round(categoryValues[key].score * SCORE_WEIGHTS[key] / 100),
  }));
  const rawScore = components.reduce((sum, component) => sum + component.contribution, 0);
  const unknownCount = Object.values(categoryValues).reduce((sum, component) => sum + component.unknowns, 0);
  const uncertaintyPenalty = Math.min(10, unknownCount * 0.45);
  const demoHeuristic = options.assessmentDemoMode
    ? demoHeuristicBonus(customer, candidate, now, {
      career: categoryValues.careerEducationLifestyle.score,
      values: categoryValues.valuesAndIntentions.score,
      location: categoryValues.locationAndRelocation.score,
    })
    : { bonus: 0, reasons: [] };
  const overallScore = round(clamp(rawScore - uncertaintyPenalty + demoHeuristic.bonus));
  const positiveReasons = [
    ...forward.reasons,
    ...reverse.reasons,
    ...values.reasons,
    ...family.reasons,
    ...career.reasons,
    ...location.reasons,
    ...languages.reasons,
    ...interests.reasons,
  ].filter((reason, index, all) => all.indexOf(reason) === index).slice(0, 5);
  const tradeoffs = [
    ...(unknownCount > 0 ? [`${unknownCount} compatibility detail${unknownCount === 1 ? " is" : "s are"} not provided; treat this score as a conversation aid.`] : []),
    ...(customer.city && candidate.city && customer.city !== candidate.city ? [`Different home cities (${customer.city} and ${candidate.city}); discuss relocation plans.`] : []),
    ...(customer.preferences.strict.length === 0 && candidate.preferences.strict.length === 0 ? ["No strict partner-preference rules are recorded for this pair."] : []),
  ].slice(0, 4);
  return {
    candidateId: candidate.id,
    overallScore,
    fitLabel: fitLabel(overallScore),
    forwardFit: round(forward.score),
    reverseFit: round(reverse.score),
    mutual: forward.score >= 65 && reverse.score >= 65,
    components,
    positiveReasons,
    tradeoffs,
    eligible: eligibility.eligible,
    hardFilterReasons: eligibility.reasons,
    algorithmVersion: ALGORITHM_VERSION,
    assessmentBonus: demoHeuristic.bonus,
    assessmentReasons: demoHeuristic.reasons,
  };
}

export function rankMatches(customer: Profile, candidates: Profile[], options: MatchOptions = {}): MatchResult[] {
  return candidates
    .map((candidate) => scoreMatch(customer, candidate, options))
    .filter((match) => match.eligible)
    .sort((left, right) => right.overallScore - left.overallScore || left.candidateId.localeCompare(right.candidateId));
}
