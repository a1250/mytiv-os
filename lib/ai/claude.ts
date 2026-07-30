/**
 * Server-side Claude access. The API key lives encrypted in business_secrets
 * and is read here only — it is never sent to the browser, mirroring how the
 * Electron app kept the key in the main process (electron/services/anthropic.cjs).
 *
 * Every caller treats a failure as "fall back to the deterministic builder",
 * so this module reports errors rather than throwing: an unconfigured business,
 * a rejected key, or a refusal all come back as { ok: false }.
 */
import Anthropic from "@anthropic-ai/sdk";
import { getSecret, hasSecret } from "@/lib/db/queries/secrets";

export const AI_KEY_SECRET = "ai_api_key";

/** Opus 5 is the default; adaptive thinking and effort are set per call below. */
const MODEL = "claude-opus-5";

export type AiCompleteResult =
  | { ok: true; text: string; model: string }
  | { ok: false; error: string; code: "unconfigured" | "refused" | "auth" | "rate_limit" | "error" };

/**
 * The system prompt is built from the calling business, not hardcoded. The
 * Electron original opened with "You are the internal AI of Mytiv — a platform
 * for restaurants and hospitality", which would have described every other
 * business on this system as a restaurant agency.
 */
export function buildSystemPrompt(opts: {
  businessName: string;
  description?: string | null;
  ownerName?: string | null;
  language?: string | null;
}) {
  const lines = [
    `You are the internal AI of ${opts.businessName}, used inside its own business-management system.`,
  ];
  if (opts.description?.trim()) {
    lines.push(`About the business: ${opts.description.trim()}`);
  }
  lines.push(
    "Rules:",
    "- Be useful, specific and business-oriented. Never generic filler.",
    "- Tone: professional, sharp, concise. Not salesy, no exaggerated claims.",
    "- Support Hebrew and English; answer in the language of the request.",
    "- Outreach must read personalized and low-volume. Never suggest bulk sending or automating contact.",
    "- Never invent facts, names, prices, or email addresses. If you don't know something, leave it out.",
    "- When asked for JSON, return ONLY valid JSON, with no commentary and no code fences."
  );
  return lines.join("\n");
}

export async function isConfigured(businessId: string) {
  return hasSecret(businessId, AI_KEY_SECRET);
}

/** Models can still wrap JSON in ```json fences despite the instruction not to. */
function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function complete(
  businessId: string,
  params: { prompt: string; system: string; maxTokens?: number; json?: boolean }
): Promise<AiCompleteResult> {
  const apiKey = await getSecret(businessId, AI_KEY_SECRET);
  if (!apiKey) {
    return { ok: false, error: "No Claude API key configured for this business.", code: "unconfigured" };
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: params.maxTokens ?? 4096,
      // Adaptive thinking lets Claude decide depth per request; `effort` caps
      // the spend. No temperature/top_p — Opus 5 rejects sampling parameters.
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      // Safety classifiers can decline a request outright; the fallback re-runs
      // it on the recommended model in the same call instead of returning nothing.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: params.system,
      messages: [{ role: "user", content: params.prompt }],
    });

    // Must be checked before reading content: on a refusal `content` is empty
    // or partial, and indexing into it blindly throws.
    if (response.stop_reason === "refusal") {
      return { ok: false, error: "The request was declined by Claude's safety classifiers.", code: "refused" };
    }

    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!text) {
      return { ok: false, error: "Claude returned an empty response.", code: "error" };
    }

    return { ok: true, text: params.json ? stripCodeFences(text) : text, model: response.model };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "The stored Claude API key was rejected.", code: "auth" };
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Claude rate limit reached — try again shortly.", code: "rate_limit" };
    }
    if (err instanceof Anthropic.APIError) {
      return { ok: false, error: `Claude API error (${err.status}): ${err.message}`, code: "error" };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error", code: "error" };
  }
}
