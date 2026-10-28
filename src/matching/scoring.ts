import { assessmentSignals } from "@/matching/assessment";
import type { Profile } from "@/domain/types";
import {
  careerScore,
  confidenceScore,
  familyScore,
  locationScore,
  overlapScore,
  preferenceFit,
  weightedAverage,
} from "@/matching/compatibility";
import { checkEligibility } from "@/matching/eligibility";
import type { ComponentKey, FitDetails, MatchOptions, MatchResult } from "@/matching/types";
import {
  ALGORITHM_VERSION,
  COMPONENT_LABELS,
  SCORE_WEIGHTS,
  clamp,
  fitLabelFor,
  round,
} from "@/matching/weights";

export { checkEligibility } from "@/matching/eligibility";
export { ALGORITHM_VERSION, SCORE_WEIGHTS, FIT_THRESHOLDS } from "@/matching/weights";
export type { FitLabel } from "@/matching/weights";
export type { MatchComponent, MatchOptions, MatchResult } from "@/matching/types";

/**
 * Deterministic two-stage scorer.
 *
 * Stage A (eligibility) runs first and can remove a pair entirely. Stage B
 * computes seven compatibility dimensions plus the assessment-signal
 * dimension, then renormalises over the components that actually have data.
 * Missing facts lower confidence through the uncertainty penalty; they are
 * never converted into a negative answer.
 */
export function scoreMatch(customer: Profile, candidate: Profile, options: MatchOptions = {}): MatchResult {
  const now = options.now ?? new Date();
  const eligibility = checkEligibility(customer, candidate, { ...options, now });

  const forward = preferenceFit(customer, candidate, now);
  const reverse = preferenceFit(candidate, customer, now);
  const bothPreferencesExist =
    customer.preferences.strict.length > 0
    || candidate.preferences.strict.length > 0
    || customer.preferences.ageMin !== null
    || customer.preferences.ageMax !== null
    || candidate.preferences.ageMin !== null
    || candidate.preferences.ageMax !== null;
  const preferenceComponent = bothPreferencesExist ? (forward.score + reverse.score) / 2 : 50;

  const values = overlapScore(customer.values, candidate.values, "Shared values");
  const family = familyScore(customer, candidate);
  const career = careerScore(customer, candidate);
  const location = locationScore(customer, candidate);
  const languages = overlapScore(customer.languages, candidate.languages, "Shared languages");
  const interests = overlapScore(customer.hobbies, candidate.hobbies, "Shared interests");
  const confidence = confidenceScore(customer, candidate);

  // Assessment signals are on by default; the toggle can disable them, in
  // which case the component drops out and the other weights renormalise.
  const assessment = options.assessmentDemoMode === false
    ? { score: 50, unknowns: 0, known: 0, reasons: [], applicable: false }
    : assessmentSignals(customer, candidate, now);

  const categoryValues: Record<ComponentKey, FitDetails> = {
    mutualPreferenceFit: {
      ...weightedAverage([{ value: forward.score, weight: 1 }, { value: reverse.score, weight: 1 }]),
      score: preferenceComponent,
      unknowns: forward.unknowns + reverse.unknowns,
      known: forward.known + reverse.known,
      applicable: true,
    },
    valuesAndIntentions: weightedAverage([
      { value: values.applicable ? values.score : null, weight: 2, reason: values.reasons[0] },
      {
        value: customer.relationshipTimeline && candidate.relationshipTimeline
          ? customer.relationshipTimeline === candidate.relationshipTimeline ? 90 : 60
          : null,
        weight: 1,
      },
    ]),
    familyPlans: family,
    careerEducationLifestyle: career,
    locationAndRelocation: location,
    languageAndInterests: weightedAverage([
      { value: languages.applicable ? languages.score : null, weight: 1, reason: languages.reasons[0] },
      { value: interests.applicable ? interests.score : null, weight: 1, reason: interests.reasons[0] },
    ]),
    confidence,
    assessmentSignals: assessment,
  };

  const componentKeys = Object.keys(SCORE_WEIGHTS) as ComponentKey[];
  const prepared = componentKeys.map((key) => ({
    key,
    label: COMPONENT_LABELS[key],
    weight: SCORE_WEIGHTS[key],
    score: round(categoryValues[key].score),
    applicable: categoryValues[key].applicable,
  }));
  const activeWeight = prepared
    .filter((component) => component.applicable)
    .reduce((sum, component) => sum + component.weight, 0);

  const components = prepared.map((component) => ({
    ...component,
    contribution: component.applicable && activeWeight > 0
      ? round((component.score * component.weight) / activeWeight)
      : 0,
  }));

  const rawScore = activeWeight > 0
    ? components
      .filter((component) => component.applicable)
      .reduce((sum, component) => sum + (component.score * component.weight) / activeWeight, 0)
    : 50;

  const unknownCount = componentKeys.reduce(
    (sum, key) => sum + (categoryValues[key].applicable ? categoryValues[key].unknowns : 0),
    0,
  );
  const uncertaintyPenalty = Math.min(10, unknownCount * 0.45);
  const overallScore = round(clamp(rawScore - uncertaintyPenalty));

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
    ...(unknownCount > 0
      ? [`${unknownCount} compatibility detail${unknownCount === 1 ? " is" : "s are"} not provided; treat this score as a conversation aid.`]
      : []),
    ...(customer.city && candidate.city && customer.city !== candidate.city
      ? [`Different home cities (${customer.city} and ${candidate.city}); discuss relocation plans.`]
      : []),
    ...(assessment.applicable
      ? ["Assessment demo signals are enabled for this male customer; they are capped and never override stated preferences."]
      : []),
    ...(customer.preferences.strict.length === 0 && candidate.preferences.strict.length === 0
      ? ["No strict partner-preference rules are recorded for this pair."]
      : []),
  ].slice(0, 4);

  return {
    candidateId: candidate.id,
    overallScore,
    fitLabel: fitLabelFor(overallScore),
    forwardFit: round(forward.score),
    reverseFit: round(reverse.score),
    mutual: forward.score >= 65 && reverse.score >= 65,
    components,
    positiveReasons,
    tradeoffs,
    eligible: eligibility.eligible,
    hardFilterReasons: eligibility.reasons,
    algorithmVersion: ALGORITHM_VERSION,
    assessmentSignals: assessment.applicable ? round(assessment.score) : null,
    assessmentReasons: assessment.reasons,
  };
}

export function rankMatches(
  customer: Profile,
  candidates: Profile[],
  options: MatchOptions = {},
): MatchResult[] {
  return candidates
    .map((candidate) => scoreMatch(customer, candidate, options))
    .filter((match) => match.eligible)
    .sort((left, right) => right.overallScore - left.overallScore || left.candidateId.localeCompare(right.candidateId));
}
