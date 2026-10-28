/**
 * Minimal server-only Gemini client.
 *
 * Raw `fetch` keeps the dependency surface small and mirrors the previous
 * OpenAI implementation. The key is read from GEMINI_API_KEY and is never
 * serialised into a response. Structured output is requested with
 * responseMimeType/responseSchema and the result is still Zod-validated by the
 * callers, so a malformed generation degrades to a template instead of
 * corrupting a draft.
 */
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.1-flash-lite";

/** Free-tier models, tried in order if a model name is retired. */
const MODEL_FALLBACKS = ["gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-3.5-flash-lite"];

const REQUEST_TIMEOUT_MS = 12_000;

export interface GeminiJsonRequest {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
}

export class GeminiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "GeminiError";
  }
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string; status?: string };
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function aiProviderLabel(): string {
  return isAiConfigured() ? `Google Gemini · ${process.env.GEMINI_MODEL || DEFAULT_MODEL}` : "Not configured · template fallback";
}

function modelsToTry(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  return configured ? [configured, ...MODEL_FALLBACKS.filter((model) => model !== configured)] : MODEL_FALLBACKS;
}

async function callModel(model: string, request: GeminiJsonRequest, apiKey: string): Promise<string> {
  const response = await fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: request.system }] },
      contents: [{ role: "user", parts: [{ text: request.user }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: request.maxOutputTokens ?? 400,
        responseMimeType: "application/json",
        responseSchema: request.schema,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GeminiError(`Gemini request failed (${response.status}). ${detail.slice(0, 200)}`.trim(), response.status);
  }

  const payload = (await response.json()) as GeminiResponse;
  if (payload.error) throw new GeminiError(payload.error.message || "Gemini returned an error.");
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new GeminiError("Gemini returned an empty response.");
  return text;
}

/**
 * Generate a JSON object, falling back across model names when a model is not
 * found. Rate limits and timeouts are surfaced to the caller so the UI can say
 * why the template was used.
 */
export async function generateGeminiJson(request: GeminiJsonRequest): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY is not configured.");

  let lastError: unknown;
  for (const model of modelsToTry()) {
    try {
      return { text: await callModel(model, request, apiKey), model };
    } catch (error) {
      lastError = error;
      const status = error instanceof GeminiError ? error.status : undefined;
      // Only a missing/unsupported model is worth retrying with another name.
      if (status !== 404 && status !== 400) break;
    }
  }
  throw lastError instanceof Error ? lastError : new GeminiError("Gemini request failed.");
}

/** Turn a provider error into a short, user-safe explanation. */
export function describeAiFailure(error: unknown): string {
  if (!(error instanceof GeminiError)) return "AI request failed; using a reviewed template.";
  if (error.status === 429) return "AI rate limit reached; using a reviewed template.";
  if (error.status === 401 || error.status === 403) return "AI key was rejected; using a reviewed template.";
  if (error.status === 404) return "Configured AI model is unavailable; using a reviewed template.";
  if (error.name === "TimeoutError") return "AI request timed out; using a reviewed template.";
  return "AI request failed; using a reviewed template.";
}
