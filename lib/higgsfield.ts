/**
 * Higgsfield image generation for Carousel Studio — ported from
 * electron/services/higgsfieldApi.cjs. Same tolerant response parsing and the
 * same no-credit path probing; `https` swapped for fetch, and the API key read
 * from business_secrets instead of Electron's keychain.
 *
 * ONE BEHAVIOURAL DIFFERENCE from the desktop app: the Electron version polled
 * for up to 3 minutes because a desktop process can wait as long as it likes.
 * A serverless function cannot — it is killed at maxDuration. Polling is
 * therefore capped below that, and a job still running when the budget runs out
 * comes back as `pending` with its request id rather than being reported as a
 * failure: the generation is still running on Higgsfield's side and finishing
 * it is a matter of asking again, not of regenerating (which would cost a
 * second set of credits).
 *
 * The CLI-driven provider (electron/services/higgsfieldCli.cjs) is NOT ported —
 * it shelled out to a locally-installed binary, which has no serverless
 * equivalent. See VISUAL_CLI_GAP_NOTE, which is surfaced in Settings.
 */
import { getSecret, hasSecret } from "@/lib/db/queries/secrets";

export const HIGGSFIELD_KEY_SECRET = "higgsfield_api_key";

const BASE = "https://platform.higgsfield.ai";
export const DEFAULT_MODEL = "higgsfield-ai/soul/standard";

/** Kept well under the route's maxDuration so the reply isn't cut off mid-poll. */
const POLL_BUDGET_MS = 95_000;
const POLL_INTERVAL_MS = 2_500;

export const VISUAL_CLI_GAP_NOTE =
  "The desktop app could also drive a locally-installed Higgsfield CLI. That path is not available on the web — it ran a binary on your own machine, which a hosted server has no equivalent for. Everything here goes through the HTTPS platform API instead, which covers text-to-image generation.";

export type GenerateResult =
  | { ok: true; url: string }
  | { ok: false; pending: true; requestId: string; error: string }
  | { ok: false; pending?: false; error: string };

export async function isConfigured(businessId: string) {
  return hasSecret(businessId, HIGGSFIELD_KEY_SECRET);
}

async function credentials(businessId: string) {
  const raw = (await getSecret(businessId, HIGGSFIELD_KEY_SECRET))?.trim() ?? "";
  // The platform expects "KEY_ID:KEY_SECRET" — a half-pasted key otherwise
  // fails as a confusing 401 rather than an obvious formatting problem.
  return /.+:.+/.test(raw) ? raw : null;
}

async function call(key: string, method: "GET" | "POST", path: string, body?: unknown) {
  const res = await fetch(`${BASE}/${path.replace(/^\/+/, "")}`, {
    method,
    headers: {
      authorization: `Key ${key}`,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

/** Response shapes differ across their SDK generations — hunt tolerantly. */
function findImageUrl(obj: any): string {
  if (!obj || typeof obj !== "object") return "";
  if (Array.isArray(obj.images) && obj.images[0]) {
    const im = obj.images[0];
    if (typeof im === "string") return im;
    if (im.url) return im.url;
  }
  if (Array.isArray(obj.jobs)) {
    for (const j of obj.jobs) {
      const u = j?.results?.raw?.url || j?.results?.min?.url || (Array.isArray(j?.results) && j.results[0]?.url);
      if (u) return u;
    }
  }
  if (obj.results) return findImageUrl(obj.results) || obj.results?.raw?.url || "";
  if (obj.output) return findImageUrl(obj.output);
  return "";
}

const normalizeStatus = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z]/g, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateImage(
  businessId: string,
  opts: { prompt: string; aspect?: string; modelPath?: string; extraParams?: Record<string, unknown> }
): Promise<GenerateResult> {
  const key = await credentials(businessId);
  if (!key) {
    return { ok: false, error: "No Higgsfield key configured, or it is not in KEY_ID:KEY_SECRET form." };
  }
  const modelPath = (opts.modelPath || DEFAULT_MODEL).trim().replace(/^\/+/, "");

  try {
    const submit = await call(key, "POST", modelPath, {
      prompt: opts.prompt,
      aspect_ratio: opts.aspect ?? "4:5",
      ...(opts.extraParams ?? {}),
    });

    if (submit.status === 401 || submit.status === 403) {
      return { ok: false, error: "Higgsfield rejected the key — re-check it at cloud.higgsfield.ai (format KEY_ID:KEY_SECRET)." };
    }
    if (submit.status === 404) {
      return { ok: false, error: `Model path "${modelPath}" not found — check it in Settings.` };
    }
    if (submit.status >= 400) {
      return { ok: false, error: `Higgsfield API error ${submit.status}: ${JSON.stringify(submit.json).slice(0, 180)}` };
    }

    // Some models answer synchronously.
    const direct = findImageUrl(submit.json);
    if (direct) return { ok: true, url: direct };

    const requestId = submit.json.request_id || submit.json.id || submit.json.job_set_id;
    if (!requestId) {
      return { ok: false, error: `No request id in response: ${JSON.stringify(submit.json).slice(0, 180)}` };
    }

    return await pollForResult(key, requestId);
  } catch (err) {
    return { ok: false, error: `Could not reach Higgsfield: ${err instanceof Error ? err.message : "unknown"}` };
  }
}

/** Resumes a generation already submitted — used when a poll ran out of budget. */
export async function pollExisting(businessId: string, requestId: string): Promise<GenerateResult> {
  const key = await credentials(businessId);
  if (!key) return { ok: false, error: "No Higgsfield key configured." };
  return pollForResult(key, requestId);
}

async function pollForResult(key: string, requestId: string): Promise<GenerateResult> {
  const deadline = Date.now() + POLL_BUDGET_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const poll = await call(key, "GET", `requests/${requestId}/status`);
    const status = normalizeStatus(poll.json.status);

    if (status === "completed") {
      const url = findImageUrl(poll.json);
      return url ? { ok: true, url } : { ok: false, error: "Completed, but no image URL was in the response." };
    }
    if (["failed", "nsfw", "cancelled", "canceled"].includes(status)) {
      return { ok: false, error: `Generation ${status}${poll.json.error ? `: ${poll.json.error}` : ""}` };
    }
    // queued / in progress → keep waiting
  }
  return {
    ok: false,
    pending: true,
    requestId,
    error: "Still generating when the request budget ran out — the job is running on Higgsfield. Check back rather than regenerating, which would spend credits again.",
  };
}

/**
 * Probe a model path with an empty body: a real path answers with a validation
 * error, a wrong one with 404. Nothing is generated and no credits are spent.
 */
export async function checkModelPath(businessId: string, modelPath: string) {
  const key = await credentials(businessId);
  if (!key) return { ok: false as const, error: "not_configured" };
  try {
    const res = await call(key, "POST", modelPath.trim(), {});
    if (res.status === 401 || res.status === 403) return { ok: false as const, error: "auth" };
    if (res.status === 404) return { ok: false as const, error: "not_found" };
    return { ok: true as const, status: res.status };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "unknown" };
  }
}
