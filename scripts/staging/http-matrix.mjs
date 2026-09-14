/**
 * Real HTTP verification against the staging app (scripts/staging/dev.sh) with the ClickUp mock.
 * Logs in through Auth.js exactly as the browser does, then walks every Ops route as four
 * sessions — anonymous, owner of A, member of A, owner of B only — and runs the O1 audit/rollback
 * flow through the real routes. Prints a markdown table; exits 1 on any mismatch.
 *
 *   BASE=http://localhost:3100 MOCK=http://127.0.0.1:4545 STAGING_PASSWORD=… node scripts/staging/http-matrix.mjs
 */
const BASE = process.env.BASE ?? "http://localhost:3100";
const MOCK = process.env.MOCK ?? "http://127.0.0.1:4545";
const PW = process.env.STAGING_PASSWORD; if (!PW) throw new Error("STAGING_PASSWORD required");
const A1 = "aaaaaaaa-1111-4000-8000-0000000000a1", A2 = "aaaaaaaa-1111-4000-8000-0000000000a2", A3 = "aaaaaaaa-1111-4000-8000-0000000000a3", B1 = "bbbbbbbb-1111-4000-8000-0000000000b1";
const uuid = () => crypto.randomUUID();

class Session {
  constructor(name) { this.name = name; this.jar = new Map(); }
  cookieHeader() { return [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "); }
  absorb(res) { for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); this.jar.set(kv.slice(0, i), kv.slice(i + 1)); } }
  async fetch(path, init = {}) {
    const headers = { ...(init.headers ?? {}), cookie: this.cookieHeader() };
    if (init.method && init.method !== "GET") headers.origin = BASE;
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
async function check(session, method, path, expect, body, note = "") {
  const res = await session.fetch(path, { method, ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = null; }
  const got = { status: res.status, error: json?.error ?? null, location: res.headers.get("location") };
  const want = typeof expect === "number" ? { status: expect } : expect;
  const ok = Object.entries(want).every(([k, v]) => v instanceof RegExp ? v.test(String(got[k])) : got[k] === v);
  if (!ok) failures++;
  rows.push({ session: session.name, method, path, expected: JSON.stringify(want), got: `${got.status}${got.error ? " " + got.error : ""}${got.location ? " → " + got.location : ""}`, ok, note });
  return { res, json, text };
}
const mockState = async () => (await fetch(`${MOCK}/__state`)).json();
const taskUpdatedAt = async (id) => new Date(Number((await mockState()).tasks[id].date_updated)).toISOString();
await fetch(`${MOCK}/__reset`, { method: "POST" });

// ── 1. Auth matrix: pages and reads ───────────────────────────────────────────
for (const p of ["/mytiv/ops", "/mytiv/ops/projects", `/mytiv/ops/projects/${A1}`, "/mytiv/ops/money"]) await check(anon, "GET", p, { status: 307, location: /\/login/ }, null, "unauthenticated → login");
for (const p of ["/api/mytiv/ops/projects", `/api/mytiv/ops/projects/${A1}`, "/api/mytiv/ops/members"]) await check(anon, "GET", p, 401, null, "unauthenticated API");
await check(anon, "PATCH", "/api/mytiv/ops/tasks/STG-1", 401, { projectId: A1, confirmed: true, requestId: uuid(), status: "review" });
await check(anon, "POST", `/api/mytiv/ops/actions/${uuid()}/rollback`, 401, { projectId: A1, confirmed: true, requestId: uuid() });

for (const s of [ownerA, memberA]) {
  for (const p of ["/mytiv/ops", "/mytiv/ops/projects", `/mytiv/ops/projects/${A1}`, `/mytiv/ops/projects/${A2}`, "/mytiv/ops/money"]) await check(s, "GET", p, 200, null, "member of A reads pages");
  for (const p of ["/api/mytiv/ops/projects", `/api/mytiv/ops/projects/${A1}`, "/api/mytiv/ops/members"]) await check(s, "GET", p, 200);
}
// cross-business: owner of B against A's slug → 404 everywhere (no disclosure), and B's own objects unreachable through A
for (const p of ["/mytiv/ops", "/mytiv/ops/projects", `/mytiv/ops/projects/${A1}`]) await check(ownerB, "GET", p, 404, null, "owner-b on A's pages");
for (const p of ["/api/mytiv/ops/projects", `/api/mytiv/ops/projects/${A1}`, "/api/mytiv/ops/members"]) await check(ownerB, "GET", p, 404, null, "owner-b on A's API");
await check(ownerA, "GET", `/api/mytiv/ops/projects/${B1}`, 404, null, "A cannot see B's project through A");
await check(ownerB, "GET", `/api/second-business/ops/projects/${B1}`, 200, null, "B sees its own project");
await check(ownerB, "GET", `/api/second-business/ops/members`, 503, null, "B has no ClickUp allowlist → not configured, not empty");
await check(ownerA, "GET", `/second-business/ops`, 404, null, "owner-a on B's pages");

// ── 2. Role matrix: writes ────────────────────────────────────────────────────
const stale = new Date(1000).toISOString();
await check(memberA, "PATCH", "/api/mytiv/ops/tasks/STG-1", { status: 403, error: "approval_role_required" }, { projectId: A1, confirmed: true, requestId: uuid(), status: "review" }, "member cannot write");
await check(memberA, "POST", "/api/mytiv/ops/chat/confirm", 403, { projectId: A1, confirmed: true, requestId: uuid(), tool: "add_comment", input: { task_id: "STG-1", text: "x" } });
await check(memberA, "POST", "/api/mytiv/ops/projects", 403, { name: "nope" });
await check(memberA, "PATCH", `/api/mytiv/ops/projects/${A1}`, 403, { brief: "nope" });
await check(memberA, "POST", `/api/mytiv/ops/projects/${A1}/marketing`, 403, { confirmed: true, requestId: uuid(), plan: {} });
await check(ownerB, "PATCH", "/api/mytiv/ops/tasks/STG-1", 404, { projectId: A1, confirmed: true, requestId: uuid(), status: "review" }, "cross-business write → 404");
await check(ownerB, "PATCH", "/api/second-business/ops/tasks/STG-1", 404, { projectId: B1, confirmed: true, requestId: uuid(), status: "review" }, "B's project folder is unauthorized → task not found, nothing read");
await check(ownerA, "PATCH", "/api/mytiv/ops/tasks/STG-1", { status: 400, error: "explicit_confirmation_required" }, { projectId: A1, requestId: uuid(), status: "review" });
await check(ownerA, "PATCH", "/api/mytiv/ops/tasks/X-1", 404, { projectId: A2, confirmed: true, requestId: uuid(), status: "working" }, "unauthorized-folder project: task never looked up");
await check(ownerA, "PATCH", "/api/mytiv/ops/tasks/STG-1", { status: 409 }, { projectId: A1, confirmed: true, requestId: uuid(), status: "done" }, "closing without reviewed evidence refused");
await check(ownerA, "PATCH", `/api/mytiv/ops/projects/${A1}`, { status: 403, error: "folder_not_authorized" }, { clickupFolderId: "999000111" }, "owner cannot point a project outside the allowlist");
await check(ownerA, "POST", `/api/mytiv/ops/projects/${A3}/marketing`, { status: 409, error: "marketing_not_connected" }, { confirmed: true, requestId: uuid(), plan: {} }, "no binding → not connected (not zero)");

// ── 3. O1 through real routes ─────────────────────────────────────────────────
const before = (await mockState()).tasks["STG-1"];
await check(ownerA, "PATCH", "/api/mytiv/ops/tasks/STG-1", 409, { projectId: A1, confirmed: true, requestId: uuid(), status: "review", expectedUpdatedAt: stale }, "stale row refused before any write");
if ((await mockState()).tasks["STG-1"].status !== before.status) { failures++; rows.push({ session: "mock", method: "-", path: "STG-1", expected: "unchanged", got: "CHANGED", ok: false }); }
const req1 = uuid();
const upd = await check(ownerA, "PATCH", "/api/mytiv/ops/tasks/STG-1", 200, { projectId: A1, confirmed: true, requestId: req1, status: "review", assignee: { add: [1002] }, expectedUpdatedAt: await taskUpdatedAt("STG-1") }, "governed write");
const after = (await mockState()).tasks["STG-1"];
rows.push({ session: "mock", method: "state", path: "STG-1 after write", expected: "review / [1001,1002]", got: `${after.status} / [${after.assignees}]`, ok: after.status === "review" && after.assignees.join() === "1001,1002" });
await check(ownerA, "PATCH", "/api/mytiv/ops/tasks/STG-1", { status: 409, error: "request_already_claimed_check_audit_before_retry" }, { projectId: A1, confirmed: true, requestId: req1, status: "review" }, "duplicate request id");
// copilot path: comment (non-reversible) and a confirm of a tool the model may not propose
await check(ownerA, "POST", "/api/mytiv/ops/chat/confirm", 200, { projectId: A1, confirmed: true, requestId: uuid(), tool: "add_comment", input: { task_id: "STG-B1", text: "staging comment" } }, "copilot write, confirmed (on a different task: a comment bumps date_updated and would, correctly, block rollback of STG-1)");
await check(ownerA, "POST", "/api/mytiv/ops/chat/confirm", { status: 400, error: "invalid_action" }, { projectId: A1, confirmed: true, requestId: uuid(), tool: "rollback_task", input: {} }, "rollback is not a copilot tool");
await check(ownerA, "POST", "/api/mytiv/ops/chat/confirm", { status: 400, error: "invalid_action" }, { projectId: A1, confirmed: true, requestId: uuid(), tool: "delete_task", input: { task_id: "STG-1" } }, "no delete tool exists");

// the action id comes from the audit log page (owner sees it); here we take it from the DB via the page HTML
const page = await (await ownerA.fetch(`/mytiv/ops/projects/${A1}`)).text();
// The audit log streams inside Suspense, so it arrives as RSC flight data (JSON-escaped) as well as HTML.
const updateActions = (html) => [...new Set([
  ...[...html.matchAll(/data-action-id="([0-9a-f-]{36})"[^>]*>\s*<p>update_task · succeeded/g)].map((m) => m[1]),
  ...[...html.matchAll(/\\"data-action-id\\":\\"([0-9a-f-]{36})\\"[\s\S]{0,200}?\\"children\\":\[\\"update_task\\",\\" · \\",\\"succeeded\\"/g)].map((m) => m[1]),
])];
const actionIds = updateActions(page);
const ACTION = process.env.ACTION_ID ?? actionIds[0];
rows.push({ session: "page", method: "GET", path: "audit log lists the succeeded update_task (rollback-eligible)", expected: "1 eligible action", got: ACTION ? `action ${ACTION}` : "none found", ok: Boolean(ACTION) });
if (ACTION) {
  await check(memberA, "POST", `/api/mytiv/ops/actions/${ACTION}/rollback`, 403, { projectId: A1, confirmed: true, requestId: uuid() }, "member cannot roll back");
  await check(ownerB, "POST", `/api/mytiv/ops/actions/${ACTION}/rollback`, 404, { projectId: A1, confirmed: true, requestId: uuid() }, "cross-tenant rollback → 404");
  await check(ownerB, "POST", `/api/second-business/ops/actions/${ACTION}/rollback`, 404, { projectId: B1, confirmed: true, requestId: uuid() }, "A's action is invisible from B");
  await check(ownerA, "POST", `/api/mytiv/ops/actions/${ACTION}/rollback`, 404, { projectId: A3, confirmed: true, requestId: uuid() }, "wrong project in A → 404");
  await check(ownerA, "POST", `/api/mytiv/ops/actions/${ACTION}/rollback`, 400, { projectId: A1, requestId: uuid() }, "rollback needs explicit confirmation");
  const rb = uuid();
  await check(ownerA, "POST", `/api/mytiv/ops/actions/${ACTION}/rollback`, 200, { projectId: A1, confirmed: true, requestId: rb }, "rollback restores pre_state");
  const restored = (await mockState()).tasks["STG-1"];
  rows.push({ session: "mock", method: "state", path: "STG-1 after rollback", expected: `${before.status} / [${before.assignees}]`, got: `${restored.status} / [${restored.assignees}]`, ok: restored.status === before.status && restored.assignees.join() === before.assignees.join() });
  await check(ownerA, "POST", `/api/mytiv/ops/actions/${ACTION}/rollback`, { status: 409, error: "request_already_claimed_check_audit_before_retry" }, { projectId: A1, confirmed: true, requestId: rb }, "same rollback request replayed");
  await check(ownerA, "POST", `/api/mytiv/ops/actions/${ACTION}/rollback`, { status: 409, error: "already_rolled_back" }, { projectId: A1, confirmed: true, requestId: uuid() }, "second rollback refused");
  // state drift: write again, edit the task "in ClickUp", then try to roll back the new action
  const req2 = uuid();
  await check(ownerA, "PATCH", "/api/mytiv/ops/tasks/STG-2", 200, { projectId: A1, confirmed: true, requestId: req2, status: "working", expectedUpdatedAt: await taskUpdatedAt("STG-2") }, "second governed write (STG-2)");
  await fetch(`${MOCK}/task/STG-2`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "review" }) }); // someone else, directly in ClickUp
  const page2 = await (await ownerA.fetch(`/mytiv/ops/projects/${A1}`)).text();
  const ids2 = updateActions(page2).filter((id) => id !== ACTION);
  if (ids2[0]) await check(ownerA, "POST", `/api/mytiv/ops/actions/${ids2[0]}/rollback`, { status: 409, error: "task_changed_since_action" }, { projectId: A1, confirmed: true, requestId: uuid() }, "task changed after write → rollback refused");
  else { failures++; rows.push({ session: "page", method: "-", path: "second action id", expected: "found", got: "missing", ok: false }); }
}
// the unauthorized folder was never read by the app
const log = (await mockState()).log;
const touchedX = log.filter((l) => l.path.includes("999000111") || l.path.includes("X-1") || l.path.includes("L-X-T"));
rows.push({ session: "mock", method: "log", path: "requests touching the unauthorized folder", expected: "0", got: String(touchedX.length), ok: touchedX.length === 0 });

console.log("| session | method | path | expected | got | ok | note |\n|---|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.session} | ${r.method} | ${r.path} | ${r.expected} | ${r.got} | ${r.ok ? "✅" : "❌"} | ${r.note ?? ""} |`);
console.log(`\n${rows.filter((r) => r.ok).length}/${rows.length} checks passed`);
process.exit(failures ? 1 : 0);
