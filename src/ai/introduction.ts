import { z } from "zod";
import type { Profile } from "@/domain/types";
import type { MatchResult } from "@/matching/scoring";

const aiDraftSchema = z.object({
  introText: z.string().trim().min(10).max(1500),
});

export interface IntroDraft {
  introText: string;
  source: "openai" | "template";
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

export async function generateIntroDraft(customer: Profile, candidate: Profile, match: MatchResult): Promise<IntroDraft> {
  const fallback = (fallbackReason?: string): IntroDraft => ({
    introText: deterministicDraft(customer, candidate, match),
    source: "template",
    label: "Template draft — review before sending",
    ...(fallbackReason ? { fallbackReason } : {}),
  });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback();

  const safeContext = {
    customerFirstName: customer.firstName,
    candidateFirstName: candidate.firstName,
    candidateCity: candidate.city,
    candidateProfession: candidate.profession,
    deterministicScore: match.overallScore,
    groundedReasons: match.positiveReasons.slice(0, 4),
  };
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        temperature: 0.2,
        max_tokens: 220,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "matchmaker_introduction",
            strict: true,
            schema: {
              type: "object",
              properties: { introText: { type: "string" } },
              required: ["introText"],
              additionalProperties: false,
            },
          },
        },
        messages: [
          {
            role: "system",
            content: "Write a warm, concise introduction draft for a human matchmaker to review. Use only supplied facts. Do not invent shared interests, values, feelings, history, or compatibility claims. Do not guarantee outcomes or call anyone a perfect match. Make clear the introduction is optional and requires review.",
          },
          { role: "user", content: JSON.stringify(safeContext) },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) return fallback(`AI provider returned ${response.status}; a safe template was used.`);
    const payload: unknown = await response.json();
    const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message?.content;
    if (typeof content !== "string") return fallback("AI response was not in the expected format; a safe template was used.");
    const parsed = aiDraftSchema.safeParse(JSON.parse(content));
    if (!parsed.success) return fallback("AI response did not pass validation; a safe template was used.");
    return { introText: parsed.data.introText, source: "openai", label: "AI draft — review before sending" };
  } catch {
    return fallback("AI provider could not be reached; a safe template was used.");
  }
}
