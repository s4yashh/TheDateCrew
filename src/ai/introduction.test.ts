import { describe, expect, it, vi } from "vitest";
import { generateIntroDraft } from "@/ai/introduction";
import { createSeedStore } from "@/data/seed";
import { scoreMatch } from "@/matching/scoring";

const store = createSeedStore();
const customer = store.profiles.find((profile) => profile.assigned)!;
const candidate = store.profiles.find((profile) => !profile.assigned && profile.gender !== customer.gender)!;
const match = scoreMatch(customer, candidate);

describe("grounded introduction drafts", () => {
  it("continues with a deterministic template when no API key is configured", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const draft = await generateIntroDraft(customer, candidate, match);
      expect(draft.source).toBe("template");
      expect(draft.label).toContain("review before sending");
      expect(draft.introText).toContain(candidate.firstName);
      expect(draft.introText).not.toContain(candidate.email || "not-an-email");
      expect(draft.introText).not.toContain(candidate.phone || "not-a-phone");
      expect(draft.introText).not.toContain("perfect soulmate");
    } finally {
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("uses a validated structured response without sending private biodata", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    const previousFetch = globalThis.fetch;
    process.env.OPENAI_API_KEY = "test-only-not-a-real-key";
    let requestBody = "";
    globalThis.fetch = vi.fn(async (_input, init) => {
      requestBody = String(init?.body ?? "");
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ introText: "A warm introduction draft for your thoughtful review." }) } }] }), { status: 200 });
    }) as typeof fetch;
    try {
      const draft = await generateIntroDraft(customer, candidate, match);
      expect(draft.source).toBe("openai");
      expect(draft.label).toBe("AI draft — review before sending");
      expect(draft.introText).toContain("thoughtful review");
      const sentContext = JSON.parse(requestBody) as { messages: Array<{ content: string }> };
      const promptData = sentContext.messages[1].content;
      expect(promptData).not.toContain("email");
      expect(promptData).not.toContain("phone");
      expect(promptData).not.toContain("religion");
      expect(promptData).not.toContain("community");
    } finally {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("falls back safely when the provider fails or returns an invalid structure", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    const previousFetch = globalThis.fetch;
    process.env.OPENAI_API_KEY = "test-only-not-a-real-key";
    globalThis.fetch = vi.fn(async () => new Response("unavailable", { status: 429 })) as typeof fetch;
    try {
      const draft = await generateIntroDraft(customer, candidate, match);
      expect(draft.source).toBe("template");
      expect(draft.fallbackReason).toContain("429");
      expect(draft.introText.length).toBeGreaterThan(10);
    } finally {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previousKey;
    }
  });
});
