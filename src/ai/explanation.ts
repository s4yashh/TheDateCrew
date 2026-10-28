import { z } from "zod";
import { describeAiFailure, generateGeminiJson, isAiConfigured } from "@/ai/gemini";
import { profileName } from "@/domain/types";
import type { Profile } from "@/domain/types";
import type { MatchResult } from "@/matching/scoring";

const explanationSchema = z.object({
  explanation: z.string().trim().min(20).max(1200),
});

const RESPONSE_SCHEMA = {
  type: "object",
  properties: { explanation: { type: "string" } },
  required: ["explanation"],
};

export interface MatchExplanation {
  explanation: string;
  source: "gemini" | "template";
  label: "AI explanation — verified against the score" | "Template explanation";
  fallbackReason?: string;
}

/** Grounded fallback that only restates facts the deterministic engine found. */
function deterministicExplanation(customer: Profile, candidate: Profile, match: MatchResult): string {
  const strengths = match.positiveReasons.slice(0, 3);
  const tradeoffs = match.tradeoffs.slice(0, 2);
  return [
    `${profileName(customer)} and ${profileName(candidate)} score ${match.overallScore}/100 (${match.fitLabel}).`,
    strengths.length ? `What supports the match: ${strengths.join(" ")}` : "There are no standout positive signals in the recorded profile data.",
    tradeoffs.length ? `What to discuss: ${tradeoffs.join(" ")}` : "No trade-offs were flagged from the recorded data.",
    "This is a decision-support summary for a human matchmaker, not a prediction.",
  ].join(" ");
}

/**
 * Turn the deterministic breakdown into a readable explanation.
 *
 * The score is computed server-side and passed in as fact. The model is
 * explicitly forbidden from changing it, adding new claims, or inferring
 * sensitive attributes.
 */
export async function generateMatchExplanation(
  customer: Profile,
  candidate: Profile,
  match: MatchResult,
): Promise<MatchExplanation> {
  const fallback = (fallbackReason?: string): MatchExplanation => ({
    explanation: deterministicExplanation(customer, candidate, match),
    source: "template",
    label: "Template explanation",
    ...(fallbackReason ? { fallbackReason } : {}),
  });

  if (!isAiConfigured()) return fallback("AI is not configured on this host");

  const safeContext = {
    customerFirstName: customer.firstName,
    candidateFirstName: candidate.firstName,
    overallScore: match.overallScore,
    fitLabel: match.fitLabel,
    mutual: match.mutual,
    forwardFit: match.forwardFit,
    reverseFit: match.reverseFit,
    components: match.components
      .filter((component) => component.applicable)
      .map((component) => ({ label: component.label, score: component.score })),
    groundedReasons: match.positiveReasons.slice(0, 5),
    tradeoffs: match.tradeoffs.slice(0, 3),
    assessmentReasons: match.assessmentReasons,
  };

  try {
    const { text } = await generateGeminiJson({
      system: "Explain a matchmaking score in 2-4 short sentences for an internal matchmaker. Use only the supplied component scores, grounded reasons, and trade-offs. Never change or contradict the score. Never invent shared interests or feelings. Never infer religion, caste, or family identity. Do not promise outcomes. End by noting this is decision support, not a prediction.",
      user: JSON.stringify(safeContext),
      schema: RESPONSE_SCHEMA,
      maxOutputTokens: 400,
    });
    const parsed = explanationSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return fallback("AI returned an invalid explanation; using the reviewed template");
    return {
      explanation: parsed.data.explanation,
      source: "gemini",
      label: "AI explanation — verified against the score",
    };
  } catch (error) {
    return fallback(describeAiFailure(error));
  }
}
