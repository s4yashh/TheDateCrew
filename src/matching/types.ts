import type { MatchInteraction, Profile } from "@/domain/types";

export type ComponentKey =
  | "mutualPreferenceFit"
  | "valuesAndIntentions"
  | "familyPlans"
  | "careerEducationLifestyle"
  | "locationAndRelocation"
  | "languageAndInterests"
  | "confidence"
  | "assessmentSignals";

export interface MatchOptions {
  /**
   * Enables the assessment's gender-specific demonstration signals.
   * Defaults to true; the Settings/scoring-guide toggle can turn it off.
   */
  assessmentDemoMode?: boolean;
  showPreviouslyContacted?: boolean;
  interactions?: MatchInteraction[];
  /** Injectable clock so tests can pin an age boundary. */
  now?: Date;
}

export interface MatchComponent {
  key: ComponentKey;
  label: string;
  weight: number;
  score: number;
  /** Points this component contributed after renormalising active weights. */
  contribution: number;
  /** False when the component does not apply to this pair (e.g. no signals). */
  applicable: boolean;
}

export interface MatchResult {
  candidateId: string;
  overallScore: number;
  fitLabel: "Excellent Potential" | "Strong Potential" | "Consider" | "Low Fit";
  forwardFit: number;
  reverseFit: number;
  mutual: boolean;
  components: MatchComponent[];
  positiveReasons: string[];
  tradeoffs: string[];
  eligible: boolean;
  hardFilterReasons: string[];
  algorithmVersion: string;
  /** Score (0-100) of the assessment-signal component, or null when inactive. */
  assessmentSignals: number | null;
  assessmentReasons: string[];
}

export interface FitDetails {
  score: number;
  unknowns: number;
  known: number;
  reasons: string[];
  applicable: boolean;
}

export type ProfilePair = { customer: Profile; candidate: Profile };
