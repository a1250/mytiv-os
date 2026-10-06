// End-to-end: campaigns and execution state of a REAL business in Focus (MARKETING_MODULE_ENABLED=true), through the
// canonical Marketing OS contracts already consumed by Mytiv. The owner binds a project and imports the engine's C12
// campaigns, C7 workboard and a C2a queue whose item the engine already reports as approved; an execution receipt is
// recorded for it through the governed receipts route (C16 linkage). Focus shows campaigns, the engine's completion
// state and the receipt — on the marketing page and on the approval card; a member reads it; another business sees none.
// Usage: INT_PW=<fixture password> PLAYWRIGHT_MODULE=… BASE=http://localhost:3200 node scripts/focus/int/e2e-marketing.mjs
import { playwright, report, settle } from "../qa/lib.mjs";
import { Session } from "./session.mjs";

const BASE = process.env.BASE ?? "http://localhost:3200";
const PW = process.env.INT_PW; if (!PW) throw new Error("INT_PW is required");
const PROJECT = "aaaaaaaa-1111-4000-8000-0000000000a3"; // business A ("mytiv"), fixture project "Unlinked"
const TENANT = `focus-mkt-${Date.now()}`;
const REV = `rev-${Date.now()}`, AS_OF = new Date(Date.now() - 60000).toISOString();
const rows = [];
const check = async (name, fn) => { try { const d = await fn(); rows.push({ ok: d !== false, name, detail: typeof d === "string" ? d : "" }); } catch (e) { rows.push({ ok: false, name, detail: String(e.message ?? e).split("\n")[0].slice(0, 220) }); } };
const owner = await new Session("owner").login("owner-a@staging.invalid", PW);
const member = await new Session("member").login("member-a@staging.invalid", PW);
const other = await new Session("b").login("owner-b@staging.invalid", PW);
const mkt = (s, path, body) => s.json(`/api/mytiv/ops/projects/${PROJECT}/marketing/${path}`, { method: "POST", body: { confirmed: true, requestId: crypto.randomUUID(), ...body } });
const env = { schemaVersion: 1, sourceRevision: REV, asOf: AS_OF, marketingBusiness: TENANT };
const CAMPAIGN = `autumn-${Date.now()}`, HASH = "b".repeat(64);
let bindingVersion, c2aId;

await check("the owner binds the project and imports C12, C7 and an engine-approved C2a through the governed routes", async () => {
  const b = await mkt(owner, "binding", { action: "bind", marketingBusiness: TENANT });
  bindingVersion = b.body.bindingVersion;
  const c12 = await mkt(owner, "artifacts", { kind: "C12", bindingVersion, payload: { ...env, campaigns: [{ id: CAMPAIGN, objective: "מילוי אמצע השבוע", audiences: ["corporate"], creative_matrix: ["v1"], budget_envelope: 5000, kpis: ["cpl"], tracking_spec: "utm-v1", build_state: "active" }], content_calendar: [{ id: "cc1", date: "2026-10-20", channel: "instagram", status: "planned" }], manual_publish_packs: [], asset_refs: [] } });
  const c7 = await mkt(owner, "artifacts", { kind: "C7", bindingVersion, payload: { ...env, as_of: AS_OF, tasks: [{ task_id: "launch-ads", task_hash: "c".repeat(64), status: "scheduled", owner: "operator", due: "2026-10-20", dod: ["ads live"], blockers: [], stale: false, completion_evidence: false, completion: "status_changed", evidence_state: "none", updated_at: AS_OF }] } });
  const c2a = await mkt(owner, "artifacts", { kind: "C2a", bindingVersion, payload: { ...env, items: [{ approval_id: "act-1", content_hash: HASH, state: "approved", title: "הפעלת קמפיין הסתיו", why: "אושר", action_type: "campaign_activate", action_class: "RED", facts_cited: ["brain/offers.yaml#autumn"], qa_verdict: "PASS", rollback_note: "להשהות" }] } });
  const art = await owner.json(`/api/mytiv/ops/projects/${PROJECT}/marketing/artifacts`);
  c2aId = (art.body.artifacts ?? []).find((a) => a.kind === "C2a")?.id;
  return [b, c12, c7, c2a].every((r) => r.status === 200) && c2aId ? `bound v${bindingVersion}; C12, C7, C2a imported` : JSON.stringify([b, c12, c7, c2a].map((r) => [r.status, r.body.error]));
});

await check("an execution receipt is recorded only with the reviewer's attestation, linked to the approved item (C16)", async () => {
  const body = { bindingVersion, sourceArtifactId: c2aId, approvalId: "act-1", contentHash: HASH, actionType: "campaign_activation", executedBy: "operator", executedAt: AS_OF, evidence: { pack_ref: "packs/autumn.json", url: "https://ads.example.invalid/receipt" } };
  const unattested = await mkt(owner, "receipts", body);
  const r = await mkt(owner, "receipts", { ...body, reviewed: true });
  return unattested.status === 400 && unattested.body.error === "review_attestation_required" && r.status === 200 ? "unattested refused; receipt recorded" : JSON.stringify([unattested, r]);
});

const { chromium } = playwright();
const browser = await chromium.launch();
const open = async (s, path) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await ctx.addCookies([...s.jar].map(([name, value]) => ({ name, value, url: BASE })));
  const page = await ctx.newPage();
  page.errors = []; page.on("pageerror", (e) => page.errors.push(e.message));
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" }); await settle(page);
  return page;
};

const page = await open(owner, "/mytiv/focus/marketing/board");
await check("Focus marketing shows the business's campaigns, the engine's completion state and the receipt (no fixtures)", async () => {
  const proj = page.locator(".f-bmkt__proj", { hasText: TENANT });
  const html = await page.content();
  const leaks = ["נועה", "demo.example", "f-screenmap", "דמו:"].filter((w) => html.includes(w));
  const campaign = await proj.locator("tr", { hasText: CAMPAIGN }).locator("[data-build=active]").count();
  const task = await proj.locator("tr", { hasText: "launch-ads" }).textContent();
  const receipt = await proj.locator(".f-bmkt__records li", { hasText: "קבלת ביצוע" }).count();
  return campaign === 1 && task.includes("מתוזמן") && task.includes("רק שינוי סטטוס") && receipt === 1 && leaks.length === 0
    ? "active campaign · scheduled / status-only completion · 1 receipt" : JSON.stringify({ campaign, task, receipt, leaks });
});

await check("the approval card shows the receipt linked to it", async () => {
  await page.goto(BASE + "/mytiv/focus/approvals", { waitUntil: "domcontentloaded" }); await settle(page);
  const card = page.locator(".f-mkt-appr", { hasText: "הפעלת קמפיין הסתיו" });
  return (await card.locator("[data-receipt]").count()) === 1 && (await card.getByRole("button", { name: "אשר" }).count()) === 0 ? "receipt on the card; no decision controls (engine: approved)" : false;
});

await check("a member reads the same execution state", async () => {
  const mp = await open(member, "/mytiv/focus/marketing/board");
  const n = await mp.locator(".f-bmkt__proj", { hasText: TENANT }).locator("tr", { hasText: CAMPAIGN }).count();
  await mp.context().close();
  return n === 1 ? "visible to member" : false;
});

await check("tenant isolation: another business can neither see this page nor record a receipt here", async () => {
  const p = await other.fetch("/mytiv/focus/marketing/board");
  const r = await mkt(other, "receipts", { bindingVersion, sourceArtifactId: c2aId, approvalId: "act-1", contentHash: HASH, actionType: "campaign_activation", executedBy: "x", executedAt: AS_OF, evidence: {}, reviewed: true });
  const own = await (await other.fetch("/second-business/focus/marketing/board")).text();
  return p.status === 404 && r.status === 404 && !own.includes(TENANT) ? "404 · 404 · own scope shows none of it" : `${p.status} ${r.status} leak=${own.includes(TENANT)}`;
});

await check("the demo board still runs on fixtures", async () => {
  await page.goto(BASE + "/_demo/focus/marketing/board", { waitUntil: "domcontentloaded" }); await settle(page);
  return (await page.locator(".f-bmkt").count()) === 0 && !(await page.content()).includes(TENANT) ? "fixtures in /_demo" : false;
});

await check("no page errors", async () => (page.errors.length === 0 ? "none" : page.errors.slice(0, 2).join(" | ")));
await browser.close();
process.exit(report("e2e-marketing (C12 / C7 / receipts → Focus)", rows) ? 0 : 1);
