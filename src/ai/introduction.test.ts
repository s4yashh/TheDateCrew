import { describe, expect, it, vi } from "vitest";
import { generateIntroDraft } from "@/ai/introduction";
import { createSeedStore } from "@/data/seed";
import { scoreMatch } from "@/matching/scoring";

const store = createSeedStore();
const customer = store.profiles.find((profile) => profile.assignedMatchmakerId !== null)!;
const candidate = store.profiles.find((profile) => profile.assignedMatchmakerId === null && profile.gender !== customer.gender)!;
const match = scoreMatch(customer, candidate);

const geminiResponse = (introText: string) => new Response(JSON.stringify({
  candidates: [{ content: { parts: [{ text: JSON.stringify({ introText }) }] } }],
}), { status: 200 });

async function withKey<T>(run: () => Promise<T>): Promise<T> {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "test-only-not-a-real-key";
  delete process.env.GEMINI_MODEL;
  try {
    return await run();
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = previousModel;
  }
}

describe("grounded introduction drafts", () => {
  it("continues with a deterministic template when no API key is configured", async () => {
    const previousKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const draft = await generateIntroDraft(customer, candidate, match);
      expect(draft.source).toBe("template");
      expect(draft.label).toContain("review before sending");
      expect(draft.fallbackReason).toContain("not configured");
      expect(draft.introText).toContain(candidate.firstName);
      expect(draft.introText).not.toContain(candidate.email || "not-an-email");
      expect(draft.introText).not.toContain(candidate.phone || "not-a-phone");
      expect(draft.introText).not.toContain("perfect soulmate");
    } finally {
      if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = previousKey;
    }
  });

  it("uses a validated Gemini structured response without sending private biodata", async () => {
    await withKey(async () => {
      let requestBody = "";
      globalThis.fetch = vi.fn(async (_input, init) => {
        requestBody = String(init?.body ?? "");
        return geminiResponse("A warm introduction draft for your thoughtful review.");
      }) as typeof fetch;

      const draft = await generateIntroDraft(customer, candidate, match);
      expect(draft.source).toBe("gemini");
      expect(draft.label).toBe("AI draft — review before sending");
      expect(draft.introText).toContain("thoughtful review");

      const sent = JSON.parse(requestBody) as {
        contents: Array<{ parts: Array<{ text: string }> }>;
        generationConfig: { responseMimeType: string; responseSchema: unknown };
      };
      expect(sent.generationConfig.responseMimeType).toBe("application/json");
      expect(sent.generationConfig.responseSchema).toBeTruthy();
      const promptData = sent.contents[0].parts[0].text;
      expect(promptData).not.toContain("email");
      expect(promptData).not.toContain("phone");
      expect(promptData).not.toContain("religion");
      expect(promptData).not.toContain("caste");
    });
  });

  it("falls back safely when the provider rate limits the request", async () => {
    await withKey(async () => {
      globalThis.fetch = vi.fn(async () => new Response("quota exceeded", { status: 429 })) as typeof fetch;
      const draft = await generateIntroDraft(customer, candidate, match);
      expect(draft.source).toBe("template");
      expect(draft.fallbackReason).toContain("rate limit");
      expect(draft.introText.length).toBeGreaterThan(10);
    });
  });

  it("falls back when the provider returns invalid JSON", async () => {
    await withKey(async () => {
      globalThis.fetch = vi.fn(async () => geminiResponse("short")) as typeof fetch;
      const draft = await generateIntroDraft(customer, candidate, match);
      expect(draft.source).toBe("template");
      expect(draft.fallbackReason).toContain("invalid draft");
    });
  });
});
