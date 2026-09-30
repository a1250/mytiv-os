/**
 * T-12.1 — real HTTP matrix for the MARKETING routes (binding, artifacts, decisions, evidence, record
 * export) against a running app seeded with scripts/staging/seed-staging.mjs. Logs in through Auth.js
 * exactly as the browser does and walks every route as four sessions — anonymous, owner of A, member of A,
 * owner of B only — plus replay, cross-tenant, not-connected, revoke → stale binding and rebind.
 * Prints a markdown table; exits 1 on any mismatch. Only fixture data (tenant "demo-biz", the vendored
 * contract vectors) is written, and only to the database the app is pointed at.
 *
 *   BASE=http://localhost:3100 STAGING_PASSWORD=… node scripts/staging/marketing-http-matrix.mjs
 *   MODULE_DISABLED=1 …  → the app runs with MARKETING_MODULE_ENABLED unset/false: every route must be 404
 *
 * Requires migrations 0008–0010 on that database. NEVER point it at production.
 */
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const PW = process.env.STAGING_PASSWORD; if (!PW) throw new Error("STAGING_PASSWORD required");
const A1 = "aaaaaaaa-1111-4000-8000-0000000000a1", A3 = "aaaaaaaa-1111-4000-8000-0000000000a3", B1 = "bbbbbbbb-1111-4000-8000-0000000000b1";
const TENANT = "demo-biz";
const uuid = () => crypto.randomUUID();
const vec = (k) => JSON.parse(readFileSync(new URL(`../../lib/marketing/contracts/${k}.vectors.json`, import.meta.url), "utf8")).valid[0];
const now = (offsetMs = 0) => new Date(Date.now() - 60_000 + offsetMs).toISOString();

class Session {
  constructor(name) { this.name = name; this.jar = new Map(); }
  cookieHeader() { return [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "); }
  absorb(res) { for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); this.jar.set(kv.slice(0, i), kv.slice(i + 1)); } }
  async fetch(path, init = {}) {
    const headers = { ...(init.headers ?? {}), cookie: this.cookieHeader() };
    if (init.method && init.method !== "GET" && !init.crossOrigin) headers.origin = BASE;
    if (init.crossOrigin) headers.origin = "https://evil.example";
    const res = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
    this.absorb(res); return res;
  }
  async login(email) {
    const csrf = await this.fetch("/api/auth/csrf"); const { csrfToken } = await csrf.json();
    const res = await this.fetch("/api/auth/callback/credentials", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken, email, password: PW, redirect: "false" }) });
    if (![200, 302].includes(res.status) || ![...this.jar.keys()].some((k) => k.includes("session-token"))) throw new Error(`login failed for ${email}: ${res.status}`);
    return this;
  }
}
const anon = new Session("anon"), ownerA = await new Session("owner-a").login("owner-a@staging.invalid"), memberA = await new Session("member-a").login("member-a@staging.invalid"), ownerB = await new Session("owner-b").login("owner-b@staging.invalid");

const rows = []; let failures = 0;
async function check(session, method, path, expect, body, note = "", opts = {}) {
  const res = await session.fetch(path, { method, crossOrigin: opts.crossOrigin, ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = null; }
  const got = { status: res.status, error: json?.error ?? null };
  const want = typeof expect === "number" ? { status: expect } : expect;
  const ok = Object.entries(want).every(([k, v]) => v instanceof RegExp ? v.test(String(got[k])) : got[k] === v);
  if (!ok) failures++;
  rows.push({ session: session.name, method, path: path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, (m) => m === A1 ? "A1" : m === A3 ? "A3" : m === B1 ? "B1" : "<id>"), expected: JSON.stringify(want, (_k, v) => (v instanceof RegExp ? String(v) : v)), got: `${got.status}${got.error ? " " + got.error : ""}`, ok, note });
  return { res, json, text };
}
const fact = (label, ok, got = ok ? "yes" : "no") => { if (!ok) failures++; rows.push({ session: "fact", method: "-", path: label, expected: "true", got, ok, note: "" }); };

const M = (slug, project, rest = "") => `/api/${slug}/ops/projects/${project}/marketing${rest}`;
const A = (rest) => M("mytiv", A1, rest);
const write = (extra) => ({ confirmed: true, requestId: uuid(), ...extra });

if (process.env.MODULE_DISABLED === "1") {
  // ── Module flag off: the marketing surface does not exist (404), for every role ─────────────────
  for (const s of [ownerA, memberA]) {
    await check(s, "GET", A("/artifacts"), 404, null, "module off");
    await check(s, "POST", A("/artifacts"), 404, write({ bindingVersion: 1, kind: "C2a", payload: {} }), "module off");
    await check(s, "POST", A("/decisions"), 404, write({ bindingVersion: 1 }), "module off");
    await check(s, "GET", A(`/decisions/${uuid()}`), 404, null, "module off");
  }
} else {
  // ── 1. Anonymous: nothing readable or writable ───────────────────────────────────────────────────
  await check(anon, "GET", A("/artifacts"), 401, null, "unauthenticated");
  for (const r of ["/artifacts", "/decisions", "/proposals", "/evidence", "/outcomes", "/receipts", "/binding"]) await check(anon, "POST", A(r), 401, write({ bindingVersion: 1 }), "unauthenticated");
  await check(anon, "GET", A(`/decisions/${uuid()}`), 401, null, "unauthenticated export");

  // ── 2. Not connected: explicit, never an empty "zero" ────────────────────────────────────────────
  const nc = await check(ownerA, "GET", A("/artifacts"), 200, null, "no binding yet");
  fact("list says connected:false with no artifacts", nc.json?.connected === false && nc.json?.artifacts?.length === 0, JSON.stringify(nc.json));
  await check(ownerA, "POST", A("/artifacts"), { status: 409, error: "marketing_not_connected" }, write({ bindingVersion: 1, kind: "C2a", payload: vec("C2a") }), "write without binding");

  // ── 3. Binding editor: owner-only, same-origin, confirmed, audited, replay-safe ─────────────────
  await check(memberA, "POST", A("/binding"), 403, write({ action: "bind", marketingBusiness: TENANT }), "member cannot bind");
  await check(ownerB, "POST", A("/binding"), 404, write({ action: "bind", marketingBusiness: TENANT }), "cross-business → 404");
  await check(ownerB, "POST", M("second-business", A1, "/binding"), 404, write({ action: "bind", marketingBusiness: TENANT }), "A's project through B's slug → 404");
  await check(ownerA, "POST", A("/binding"), { status: 400, error: "explicit_confirmation_required" }, { requestId: uuid(), action: "bind", marketingBusiness: TENANT });
  await check(ownerA, "POST", A("/binding"), { status: 403, error: "same_origin_required" }, write({ action: "bind", marketingBusiness: TENANT }), "cross-origin", { crossOrigin: true });
  await check(ownerA, "POST", A("/binding"), { status: 400, error: "invalid_marketing_business" }, write({ action: "bind", marketingBusiness: "Not A Slug!" }));
  const bindReq = uuid();
  await check(ownerA, "POST", A("/binding"), 200, { confirmed: true, requestId: bindReq, action: "bind", marketingBusiness: TENANT }, "owner binds A1 → demo-biz (v1)");
  await check(ownerA, "POST", A("/binding"), { status: 409, error: "request_already_claimed_check_audit_before_retry" }, { confirmed: true, requestId: bindReq, action: "bind", marketingBusiness: TENANT }, "replayed bind request");
  const listed = await check(memberA, "GET", A("/artifacts"), 200, null, "member reads (connected)");
  const v1 = listed.json?.bindingVersion;
  fact("member sees connected, binding version 1", listed.json?.connected === true && v1 === 1, JSON.stringify({ connected: listed.json?.connected, v: v1 }));
  await check(ownerB, "GET", A("/artifacts"), 404, null, "owner-b cannot read A's marketing");
  await check(ownerB, "GET", M("second-business", A1, "/artifacts"), 404, null, "A's project through B's slug → 404");

  // ── 4. Artifact import (engine → app) ────────────────────────────────────────────────────────────
  const c2a = { ...vec("C2a"), marketingBusiness: TENANT, asOf: now() };
  const c7 = { ...vec("C7"), marketingBusiness: TENANT, asOf: now(), as_of: now() };
  await check(memberA, "POST", A("/artifacts"), 403, write({ bindingVersion: v1, kind: "C2a", payload: c2a }), "member cannot import");
  await check(ownerB, "POST", A("/artifacts"), 404, write({ bindingVersion: v1, kind: "C2a", payload: c2a }), "cross-business import → 404");
  await check(ownerA, "POST", A("/artifacts"), { status: 409, error: "stale_binding_version" }, write({ bindingVersion: v1 + 1, kind: "C2a", payload: c2a }), "confirmed against another binding version");
  await check(ownerA, "POST", A("/artifacts"), { status: 400, error: "unsupported_artifact_kind" }, write({ bindingVersion: v1, kind: "C1", payload: c2a }), "C1 goes through the plan import, not here");
  await check(ownerA, "POST", A("/artifacts"), { status: 400, error: /contract_scope_or_version_mismatch/ }, write({ bindingVersion: v1, kind: "C2a", payload: { ...c2a, marketingBusiness: "other-biz" } }), "another tenant's artifact");
  await check(ownerA, "POST", A("/artifacts"), { status: 400, error: /contract_structure_invalid/ }, write({ bindingVersion: v1, kind: "C2a", payload: { ...c2a, token: "x" } }), "unknown field (strict contract)");
  const impReq = uuid();
  await check(ownerA, "POST", A("/artifacts"), 200, { confirmed: true, requestId: impReq, bindingVersion: v1, kind: "C2a", payload: c2a }, "owner imports C2a");
  const replay = await check(ownerA, "POST", A("/artifacts"), 200, { confirmed: true, requestId: impReq, bindingVersion: v1, kind: "C2a", payload: c2a }, "exact replay of the import converges (readback, P1-1)");
  fact("exact replay returns the same artifact (replayed, revision 1), never a second one", replay.json?.replayed === true && replay.json?.revision === 1, JSON.stringify(replay.json));
  await check(ownerA, "POST", A("/artifacts"), { status: 409, error: "request_already_claimed_check_audit_before_retry" }, { confirmed: true, requestId: impReq, bindingVersion: v1, kind: "C2a", payload: { ...c2a, asOf: now(500) } }, "same request id, different payload → refused");
  await check(ownerA, "POST", A("/artifacts"), 200, write({ bindingVersion: v1, kind: "C7", payload: c7 }), "owner imports C7");
  const arts = (await check(memberA, "GET", A("/artifacts"), 200, null, "member lists latest artifacts")).json?.artifacts ?? [];
  const idOf = (kind) => arts.find((a) => a.kind === kind)?.id;
  fact("latest C2a and C7 listed", Boolean(idOf("C2a") && idOf("C7")), arts.map((a) => `${a.kind}:${a.revision}`).join(","));

  // ── 5. Decisions (C2b) + export ──────────────────────────────────────────────────────────────────
  const item = c2a.items[0];
  const decision = (extra = {}) => write({ bindingVersion: v1, sourceArtifactId: idOf("C2a"), approvalId: item.approval_id, contentHash: item.content_hash, decision: "approved", note: "fits the brief", ...extra });
  await check(memberA, "POST", A("/decisions"), 403, decision(), "member cannot decide");
  await check(ownerB, "POST", A("/decisions"), 404, decision(), "cross-business decision → 404");
  await check(ownerA, "POST", A("/decisions"), { status: 400, error: "invalid_note" }, decision({ note: "  " }), "a note is mandatory (RED never auto)");
  await check(ownerA, "POST", A("/decisions"), { status: 409, error: "stale_content_hash" }, decision({ contentHash: "b".repeat(64) }), "decided against other content");
  const decReq = uuid();
  const dec = await check(ownerA, "POST", A("/decisions"), 200, { ...decision(), requestId: decReq }, "owner decides");
  await check(ownerA, "POST", A("/decisions"), { status: 409, error: "request_already_claimed_check_audit_before_retry" }, { ...decision(), requestId: decReq }, "replayed decision request");
  await check(ownerA, "POST", A("/decisions"), { status: 409, error: "already_recorded" }, decision({ decision: "rejected" }), "one decision per item");
  const decId = dec.json?.id;
  if (decId) {
    await check(memberA, "GET", A(`/decisions/${decId}`), 403, null, "member cannot export (hands the record to the engine)");
    await check(ownerB, "GET", A(`/decisions/${decId}`), 404, null, "cross-business export → 404");
    const ex = await check(ownerA, "GET", A(`/decisions/${decId}`), 200, null, "owner downloads the C2b file");
    fact("exported C2b names the tenant, item, hash and binding version", ex.json?.marketingBusiness === TENANT && ex.json?.approval_id === item.approval_id && ex.json?.content_hash === item.content_hash && ex.json?.binding_version === v1, JSON.stringify(ex.json).slice(0, 120));
  } else fact("decision id returned", false);
  await check(ownerA, "GET", A(`/decisions/${uuid()}`), 404, null, "unknown record");
  await check(ownerA, "GET", A("/decisions/not-a-uuid"), 404, null, "malformed record id");

  // ── 6. Publication evidence (C6): attested, audited ─────────────────────────────────────────────
  const evidence = (extra = {}) => write({ bindingVersion: v1, sourceArtifactId: idOf("C7"), taskId: c7.tasks[0].task_id, channel: "instagram", evidence: { url: "https://example.com/p/matrix" }, publishedAt: now(), by: "operator", reviewed: true, ...extra });
  await check(memberA, "POST", A("/evidence"), 403, evidence(), "member cannot record evidence");
  await check(ownerA, "POST", A("/evidence"), { status: 400, error: "review_attestation_required" }, evidence({ reviewed: false }), "\"I reviewed this evidence\" is mandatory");
  const ev = await check(ownerA, "POST", A("/evidence"), 200, evidence(), "owner records reviewed evidence");
  if (ev.json?.id) await check(ownerA, "GET", A(`/evidence/${ev.json.id}`), 200, null, "owner downloads the C6 file");

  // ── 7. Revoke → not connected; rebind → new version; stale confirmations refused ───────────────
  await check(memberA, "POST", A("/binding"), 403, write({ action: "revoke" }), "member cannot revoke");
  await check(ownerA, "POST", A("/binding"), 200, write({ action: "revoke" }), "owner revokes");
  const revoked = await check(memberA, "GET", A("/artifacts"), 200, null, "after revoke");
  fact("after revoke: connected:false, nothing listed", revoked.json?.connected === false && revoked.json?.artifacts?.length === 0, JSON.stringify(revoked.json));
  await check(ownerA, "POST", A("/decisions"), { status: 409, error: "marketing_not_connected" }, decision(), "write after revoke");
  await check(ownerA, "POST", A("/binding"), 200, write({ action: "bind", marketingBusiness: TENANT }), "owner rebinds (v2)");
  const rebound = await check(memberA, "GET", A("/artifacts"), 200, null, "after rebind");
  fact("after rebind: version 2, previous artifacts not shown as current", rebound.json?.bindingVersion === 2 && rebound.json?.artifacts?.length === 0, JSON.stringify({ v: rebound.json?.bindingVersion, n: rebound.json?.artifacts?.length }));
  await check(ownerA, "POST", A("/decisions"), { status: 409, error: "stale_binding_version" }, decision(), "confirmation made under v1");
  await check(ownerA, "POST", A("/artifacts"), 200, write({ bindingVersion: 2, kind: "C2a", payload: { ...c2a, asOf: now(1000) } }), "import under v2");

  // ── 8. Other projects / unlinked ─────────────────────────────────────────────────────────────────
  await check(ownerA, "POST", M("mytiv", A3, "/artifacts"), { status: 409, error: "marketing_not_connected" }, write({ bindingVersion: 1, kind: "C2a", payload: c2a }), "an unbound project");
  await check(ownerA, "GET", M("mytiv", B1, "/artifacts"), 404, null, "B's project through A's slug");
  await check(ownerB, "GET", M("second-business", B1, "/artifacts"), 200, null, "B reads its own (not connected) project");
}

console.log("| session | method | path | expected | got | ok | note |\n|---|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.session} | ${r.method} | ${r.path} | ${r.expected} | ${r.got} | ${r.ok ? "✅" : "❌"} | ${r.note ?? ""} |`);
console.log(`\n${rows.filter((r) => r.ok).length}/${rows.length} checks passed`);
process.exit(failures ? 1 : 0);
