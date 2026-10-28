import { describe, expect, it, vi } from "vitest";
import { generateMatchExplanation } from "@/ai/explanation";
import { createSeedStore } from "@/data/seed";
import { scoreMatch } from "@/matching/scoring";

const store = createSeedStore();
const customer = store.profiles.find((profile) => profile.assignedMatchmakerId !== null)!;
const candidate = store.profiles.find((profile) => profile.assignedMatchmakerId === null && profile.gender !== customer.gender)!;
const match = scoreMatch(customer, candidate);

const geminiResponse = (explanation: string) => new Response(JSON.stringify({
  candidates: [{ content: { parts: [{ text: JSON.stringify({ explanation }) }] } }],
}), { status: 200 });

describe("grounded match explanations", () => {
  it("uses a template that restates the deterministic score when AI is unconfigured", async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const result = await generateMatchExplanation(customer, candidate, match);
      expect(result.source).toBe("template");
      expect(result.label).toBe("Template explanation");
      expect(result.explanation).toContain(String(match.overallScore));
      expect(result.explanation).toContain("decision-support");
      expect(result.fallbackReason).toContain("not configured");
    } finally {
      if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = previousKey;
    }
  });

  it("passes only grounded facts and returns the model explanation", async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    const previousModel = process.env.GEMINI_MODEL;
    const previousFetch = globalThis.fetch;
    process.env.GEMINI_API_KEY = "test-only-not-a-real-key";
    delete process.env.GEMINI_MODEL;
    let requestBody = "";
    globalThis.fetch = vi.fn(async (_input, init) => {
      requestBody = String(init?.body ?? "");
      return geminiResponse("They share stated values and a similar timeline, with location as a topic to discuss.");
    }) as typeof fetch;
    try {
      const result = await generateMatchExplanation(customer, candidate, match);
      expect(result.source).toBe("gemini");
      expect(result.explanation).toContain("location");

      const sent = JSON.parse(requestBody) as {
        contents: Array<{ parts: Array<{ text: string }> }>;
        systemInstruction: { parts: Array<{ text: string }> };
      };
      const context = JSON.parse(sent.contents[0].parts[0].text);
      expect(context.overallScore).toBe(match.overallScore);
      expect(context.groundedReasons).toEqual(match.positiveReasons.slice(0, 5));
      expect(JSON.stringify(context)).not.toContain("email");
      expect(JSON.stringify(context)).not.toContain("caste");
      expect(sent.systemInstruction.parts[0].text).toContain("Never change or contradict the score");
    } finally {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = previousKey;
      if (previousModel === undefined) delete process.env.GEMINI_MODEL;
      else process.env.GEMINI_MODEL = previousModel;
    }
  });

  it("falls back when the model returns an unusable explanation", async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    const previousModel = process.env.GEMINI_MODEL;
    const previousFetch = globalThis.fetch;
    process.env.GEMINI_API_KEY = "test-only-not-a-real-key";
    delete process.env.GEMINI_MODEL;
    globalThis.fetch = vi.fn(async () => geminiResponse("too short")) as typeof fetch;
    try {
      const result = await generateMatchExplanation(customer, candidate, match);
      expect(result.source).toBe("template");
      expect(result.fallbackReason).toContain("invalid explanation");
    } finally {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = previousKey;
      if (previousModel === undefined) delete process.env.GEMINI_MODEL;
      else process.env.GEMINI_MODEL = previousModel;
    }
  });
});
