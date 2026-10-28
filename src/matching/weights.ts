import type { ComponentKey, MatchComponent, MatchOptions, MatchResult } from "@/matching/types";

export type { MatchComponent, MatchOptions, MatchResult };

/**
 * Component weights for the deterministic score.
 *
 * The seven original assessment weights are preserved as relative proportions.
 * `assessmentSignals` is carved out as its own tenth of the score so the
 * gender-specific demo rules are a real, visible dimension instead of a hidden
 * bonus. When a customer has no applicable assessment signals (for example a
 * female customer in this demo), that component is excluded and the remaining
 * weights renormalise back to the brief's 30/20/15/10/10/10/5.
 */
export const SCORE_WEIGHTS = {
  mutualPreferenceFit: 27,
  valuesAndIntentions: 18,
  familyPlans: 14,
  careerEducationLifestyle: 9,
  locationAndRelocation: 9,
  languageAndInterests: 9,
  confidence: 4,
  assessmentSignals: 10,
} as const;

export const COMPONENT_LABELS: Record<ComponentKey, string> = {
  mutualPreferenceFit: "Mutual preference fit",
  valuesAndIntentions: "Values & intentions",
  familyPlans: "Family plans",
  careerEducationLifestyle: "Career & lifestyle",
  locationAndRelocation: "Location & flexibility",
  languageAndInterests: "Languages & interests",
  confidence: "Profile confidence",
  assessmentSignals: "Assessment signals",
};

/** Fit thresholds live in one place so UI copy and tests cannot drift. */
export const FIT_THRESHOLDS = {
  excellent: 82,
  strong: 68,
  consider: 50,
} as const;

export type FitLabel = "Excellent Potential" | "Strong Potential" | "Consider" | "Low Fit";

export function fitLabelFor(score: number): FitLabel {
  if (score >= FIT_THRESHOLDS.excellent) return "Excellent Potential";
  if (score >= FIT_THRESHOLDS.strong) return "Strong Potential";
  if (score >= FIT_THRESHOLDS.consider) return "Consider";
  return "Low Fit";
}

export const ALGORITHM_VERSION = "mutual-fit-v2.0";

/** Clamp a numeric value into an inclusive range. */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number): number {
  return Math.round(value);
}
