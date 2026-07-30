/**
 * Client-side counterpart to the Electron renderer's `askClaude`
 * (src/services/aiServices.js): builds a prompt, sends it through
 * /ai/complete, and returns null on any failure so the caller keeps its
 * deterministic result. The API key never leaves the server — only the prompt
 * crosses the wire.
 *
 * Every caller follows the same shape:
 *   const local = buildItLocally(...);
 *   const ai = await askClaude(api, { prompt, ... });
 *   return ai ? { ...local, ...merged, source: "claude" } : { ...local, source: "local" };
 */
import type { ApiClient } from "@/lib/api-client";

type AiResponse = { ok: true; text: string; model: string } | { ok: false; error: string };

export type AskOptions = {
  prompt: string;
  maxTokens?: number;
  /** false returns the raw text instead of parsing JSON. */
  json?: boolean;
  /** Set when the caller wants to show why the AI pass didn't run. */
  onError?: (message: string) => void;
};

/**
 * Cached per session: /ai/status is a cheap DB lookup, but calling it before
 * every generation adds a round trip to a path that usually answers "no".
 */
let configuredCache: { value: boolean; at: number } | null = null;
const STATUS_TTL_MS = 60_000;

export async function isAiConfigured(api: ApiClient): Promise<boolean> {
  if (configuredCache && Date.now() - configuredCache.at < STATUS_TTL_MS) {
    return configuredCache.value;
  }
  try {
    const status = (await api.ai.status()) as { configured: boolean };
    configuredCache = { value: !!status.configured, at: Date.now() };
    return configuredCache.value;
  } catch {
    return false;
  }
}

/** Call after saving or clearing a key so the next generation re-checks. */
export function resetAiStatusCache() {
  configuredCache = null;
}

export async function askClaude<T = unknown>(api: ApiClient, opts: AskOptions): Promise<T | null> {
  try {
    if (!(await isAiConfigured(api))) return null;

    const res = (await api.ai.complete({
      prompt: opts.prompt,
      maxTokens: opts.maxTokens,
      json: opts.json !== false,
    })) as AiResponse;

    if (!res.ok) {
      opts.onError?.(res.error);
      return null;
    }
    if (opts.json === false) return res.text as T;
    return JSON.parse(res.text) as T;
  } catch (err) {
    opts.onError?.(err instanceof Error ? err.message : "AI request failed");
    return null;
  }
}
