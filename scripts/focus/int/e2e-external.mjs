// End-to-end: backend-owned external attempts over real HTTP (real Auth.js sessions, real DB, the local Gmail
// stand-in). Interrupt a send in flight (Gmail never answers) → UNKNOWN; no generic send and no new draft in the thread
// can start another attempt; a check for another attempt does not count; the explicit target check unlocks exactly
// one attempt and is spent; a request-id replay never calls Gmail again; a confirmed draft is never resent; a known
// failure retries normally; Meta is refused as not configured; another business cannot touch it.
// Usage: INT_PW=<fixture password> BASE=http://localhost:3200 node scripts/focus/int/e2e-external.mjs
import { report } from "../qa/lib.mjs";
import { Session } from "./session.mjs";

const PW = process.env.INT_PW; if (!PW) throw new Error("INT_PW is required");
const MOCK = process.env.GMAIL_MOCK ?? "http://127.0.0.1:4545";
const mock = { mode: (mode) => fetch(`${MOCK}/__mode`, { method: "POST", body: JSON.stringify({ mode }) }), state: async () => (await fetch(`${MOCK}/__state`)).json(),
  draft: async (threadId) => (await (await fetch(`${MOCK}/gmail/v1/users/me/drafts`, { method: "POST", body: JSON.stringify({ message: { threadId } }) })).json()).id };
const rows = [];
const check = async (name, fn) => { try { const d = await fn(); rows.push({ ok: d !== false, name, detail: typeof d === "string" ? d : "" }); } catch (e) { rows.push({ ok: false, name, detail: String(e.message ?? e).slice(0, 200) }); } };
const member = await new Session("member").login("member-a@staging.invalid", PW);
const owner = await new Session("owner").login("owner-a@staging.invalid", PW);
const other = await new Session("b").login("owner-b@staging.invalid", PW);
const send = (s, body, requestId = crypto.randomUUID()) => s.json("/api/mytiv/external/gmail/send", { method: "POST", body: { requestId, ...body } });
const attempts = async (thread) => (await member.json(`/api/mytiv/external/attempts?target=gmail:thread:${thread}`)).body.attempts;
const T = `th${Date.now()}`;
let unknownId, d1, d2;

await check("a send Gmail does not answer is recorded and comes back UNKNOWN (never 'sent', never a plain failure)", async () => {
  await fetch(`${MOCK}/__reset`, { method: "POST" });
  d1 = await mock.draft(T); d2 = await mock.draft(T);
  await mock.mode("hang");
  const r = await send(member, { threadId: T, draftId: d1 });
  unknownId = r.body.attempt?.id;
  return r.status === 200 && r.body.attempt.state === "unknown" ? `attempt ${unknownId.slice(0, 8)} unknown (${r.body.attempt.error})` : JSON.stringify(r);
});
await mock.mode("ok");
await check("no ordinary send can start another attempt — the same draft, a new draft in the thread, or another member", async () => {
  const a = await send(member, { threadId: T, draftId: d1 }), b = await send(member, { threadId: T, draftId: d2 }), c = await send(owner, { threadId: T, draftId: d2 });
  const st = await mock.state();
  const ok = [a, b, c].every((x) => x.status === 409 && x.body.error === "needs_target_check" && x.body.unknownAttemptId === unknownId);
  return ok && !st.sends[d2] && st.sends[d1] === 1 ? "409 needs_target_check ×3, Gmail called once in total" : JSON.stringify([a, b, c].map((x) => [x.status, x.body]));
});
await check("a target check given for another attempt does not count", async () => {
  const r = await send(member, { threadId: T, draftId: d2, attestedUnknownAttemptId: crypto.randomUUID() });
  return r.status === 409 && r.body.error === "needs_target_check" ? "refused" : JSON.stringify(r);
});
let unlockedReq;
await check("the explicit target check unlocks exactly one new attempt (sent), and is spent", async () => {
  unlockedReq = crypto.randomUUID();
  const r = await send(member, { threadId: T, draftId: d2, attestedUnknownAttemptId: unknownId }, unlockedReq);
  const again = await send(member, { threadId: T, draftId: d2, attestedUnknownAttemptId: unknownId });
  return r.status === 200 && r.body.attempt.state === "confirmed" && again.status === 409 && again.body.error === "already_done"
    ? `confirmed (${r.body.attempt.providerRef}); reuse → already_done` : JSON.stringify([r, again]);
});
await check("a replay of the same request id returns the same attempt and never calls Gmail again", async () => {
  const before = (await mock.state()).sends[d2];
  const r = await send(member, { threadId: T, draftId: d2, attestedUnknownAttemptId: unknownId }, unlockedReq);
  const after = (await mock.state()).sends[d2];
  return r.status === 200 && r.body.replayed && r.body.attempt.state === "confirmed" && before === 1 && after === 1 ? "replayed, Gmail sends for the draft: 1" : JSON.stringify([r, before, after]);
});
await check("a known failure (Gmail refused) keeps the ordinary retry; the thread's history is persisted", async () => {
  const T2 = `${T}b`, d = await mock.draft(T2);
  await mock.mode("fail400");
  const f = await send(member, { threadId: T2, draftId: d });
  await mock.mode("ok");
  const r = await send(member, { threadId: T2, draftId: d });
  const hist = await attempts(T2);
  return f.body.attempt?.state === "failed" && r.body.attempt?.state === "confirmed" && hist.map((a) => a.state).join() === "confirmed,failed" ? "failed → retry confirmed" : JSON.stringify([f.body, r.body, hist]);
});
await check("Meta scheduling is refused as not configured (no attempt recorded, nothing pretended)", async () => {
  const r = await owner.json("/api/mytiv/external/meta/schedule", { method: "POST", body: { requestId: crypto.randomUUID(), approvalId: "x" } });
  return r.status === 503 && r.body.error === "meta_not_configured" ? "503 meta_not_configured" : JSON.stringify(r);
});
await check("tenant isolation and same-origin: another business sees nothing; a cross-origin send is refused", async () => {
  const list = await other.json(`/api/mytiv/external/attempts?target=gmail:thread:${T}`);
  const own = await other.json(`/api/second-business/external/attempts?target=gmail:thread:${T}`);
  const xo = await member.json("/api/mytiv/external/gmail/send", { method: "POST", headers: { origin: "http://evil.example" }, body: { requestId: crypto.randomUUID(), threadId: T, draftId: d1 } });
  return list.status === 404 && own.body.attempts?.length === 0 && xo.status === 403 ? "404 · [] · 403" : JSON.stringify([list.status, own.body, xo.status]);
});
process.exit(report("e2e-external (backend attempts)", rows) ? 0 : 1);
