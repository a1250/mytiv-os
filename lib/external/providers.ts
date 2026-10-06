import "server-only";
import { sendDraft } from "@/lib/google/gmail";

/**
 * What a provider call ended in. `unknown` whenever the provider may have acted without us seeing the answer (a
 * timeout, a dropped connection, a 5xx): the attempt then stays UNKNOWN and a new one needs the target check.
 */
export type ProviderOutcome = { state: "confirmed"; ref: string } | { state: "failed"; error: string } | { state: "unknown"; error: string };

const TIMEOUT_MS = Number(process.env.EXTERNAL_PROVIDER_TIMEOUT_MS ?? 15000);

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error("provider_timeout"), { timeout: true })), TIMEOUT_MS);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/** Gmail: send an existing draft (drafts.send). A draft is sent at most once by Gmail itself; we add the gate. */
export async function gmailSendDraft(businessId: string, googleDraftId: string): Promise<ProviderOutcome> {
  try {
    const r = await withTimeout(sendDraft(businessId, googleDraftId));
    return { state: "confirmed", ref: r.googleMessageId };
  } catch (e) {
    const err = e as { status?: number; message?: string; timeout?: boolean };
    if (err.message === "not_connected" || err.message === "token_expired") return { state: "failed", error: "gmail_not_connected" };
    if (typeof err.status === "number" && err.status >= 400 && err.status < 500) return { state: "failed", error: `gmail_refused_${err.status}` };
    return { state: "unknown", error: err.timeout ? "provider_timeout" : typeof err.status === "number" ? `gmail_${err.status}` : "network" };
  }
}

/**
 * Meta: there is no Meta integration in Mytiv (no app, no Page token, no API code). A schedule is refused BEFORE any
 * attempt is recorded — never pretended. Connecting Meta is an owner decision (Meta app + review, Page access).
 */
export const META_CONFIGURED = false;
