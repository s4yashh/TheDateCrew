import { z } from "zod";
import { describeAiFailure, generateGeminiJson, isAiConfigured } from "@/ai/gemini";
import type { Profile } from "@/domain/types";
import type { MatchResult } from "@/matching/scoring";

const aiDraftSchema = z.object({
  introText: z.string().trim().min(10).max(1500),
});

const RESPONSE_SCHEMA = {
  type: "object",
  properties: { introText: { type: "string" } },
  required: ["introText"],
};

export interface IntroDraft {
  introText: string;
  source: "gemini" | "template";
  label: "AI draft — review before sending" | "Template draft — review before sending";
  fallbackReason?: string;
}

function deterministicDraft(customer: Profile, candidate: Profile, match: MatchResult): string {
  const groundedReasons = match.positiveReasons.slice(0, 3);
  const context = groundedReasons.length
    ? `The profile review surfaced ${groundedReasons.join("; ")}`
    : "This profile is ready for your thoughtful review";
  return `Hi ${customer.firstName},\n\nI’d like to introduce ${candidate.firstName} ${candidate.lastName}. ${context}. These are conversation starters, not predictions—please review both profiles and decide whether you’d like us to make the introduction.\n\nWarmly,\nThe Date Crew`;
}

/**
 * Draft an introduction for human review.
 *
 * Only minimal, synthetic, non-sensitive fields are sent. The deterministic
 * score and its grounded reasons are supplied as facts; the model is asked not
 * to invent anything. Any failure returns the template with a visible reason
 * so the UI never pretends AI ran when it did not.
 */
export async function generateIntroDraft(
  customer: Profile,
  candidate: Profile,
  match: MatchResult,
): Promise<IntroDraft> {
  const fallback = (fallbackReason?: string): IntroDraft => ({
    introText: deterministicDraft(customer, candidate, match),
    source: "template",
    label: "Template draft — review before sending",
    ...(fallbackReason ? { fallbackReason } : {}),
  });

  if (!isAiConfigured()) return fallback("AI is not configured on this host");

  const safeContext = {
    customerFirstName: customer.firstName,
    candidateFirstName: candidate.firstName,
    candidateCity: candidate.city,
    candidateProfession: candidate.profession,
    deterministicScore: match.overallScore,
    groundedReasons: match.positiveReasons.slice(0, 4),
    tradeoffs: match.tradeoffs.slice(0, 2),
  };

  try {
    const { text } = await generateGeminiJson({
      system: "Write a warm, concise introduction draft for a human matchmaker to review. Use only supplied facts. Do not invent shared interests, values, feelings, history, or compatibility claims. Do not guarantee outcomes or call anyone a perfect match. Make clear the introduction is optional and requires review.",
      user: JSON.stringify(safeContext),
      schema: RESPONSE_SCHEMA,
      maxOutputTokens: 400,
    });
    const parsed = aiDraftSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return fallback("AI returned an invalid draft; using the reviewed template");
    return {
      introText: parsed.data.introText,
      source: "gemini",
      label: "AI draft — review before sending",
    };
  } catch (error) {
    return fallback(describeAiFailure(error));
  }
}
