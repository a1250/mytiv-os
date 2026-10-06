// End-to-end: Focus approvals in a REAL business scope, read through the canonical Marketing OS contracts Mytiv
// already consumes (MARKETING_MODULE_ENABLED=true). The owner binds a project to a marketing tenant and imports a C2a
// approval queue through the existing governed routes; Focus lists it; the owner decides with a reason (a C2b
// decision through the governed decisions route); the item then waits for the engine; a member is read-only; another
// business sees nothing.
// Usage: INT_PW=<fixture password> PLAYWRIGHT_MODULE=… BASE=http://localhost:3200 node scripts/focus/int/e2e-approvals.mjs
import { playwright, report, settle } from "../qa/lib.mjs";
import { Session } from "./session.mjs";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE ?? "http://localhost:3200";
const PW = process.env.INT_PW; if (!PW) throw new Error("INT_PW is required");
const PROJECT = "aaaaaaaa-1111-4000-8000-0000000000a1"; // business A ("mytiv"), fixture project
const TENANT = `focus-e2e-${Date.now()}`;
// read-only look at the disposable DB (the stack's local PostgreSQL), to prove what was recorded
const sql = (q) => execFileSync("psql", ["-At", "-h", process.env.PGHOST ?? "127.0.0.1", "-p", process.env.PGPORT ?? "55432", "-U", process.env.PGUSER ?? "postgres", "-d", process.env.INT_DB ?? "focus_int", "-c", q], { encoding: "utf8" }).trim();
const rows = [];
const check = async (name, fn) => { try { const d = await fn(); rows.push({ ok: d !== false, name, detail: typeof d === "string" ? d : "" }); } catch (e) { rows.push({ ok: false, name, detail: String(e.message ?? e).split("\n")[0].slice(0, 220) }); } };
const owner = await new Session("owner").login("owner-a@staging.invalid", PW);
const member = await new Session("member").login("member-a@staging.invalid", PW);
const other = await new Session("b").login("owner-b@staging.invalid", PW);
const mkt = (s, path, body) => s.json(`/api/mytiv/ops/projects/${PROJECT}/marketing/${path}`, { method: "POST", body: { confirmed: true, requestId: crypto.randomUUID(), ...body } });
const TITLE = `הפעלת קמפיין סתיו ${Date.now()}`;
const item = (i, extra = {}) => ({
  approval_id: `focus-e2e-${i}`, content_hash: String(i).repeat(64).slice(0, 64), state: "pending", title: `${TITLE} #${i}`,
  why: "למלא את אמצע השבוע", action_type: "campaign_activate", action_class: i === 1 ? "RED" : "GREEN", facts_cited: ["brain/offers.yaml#autumn"],
  qa_verdict: "PASS", rollback_note: "להשהות את הקמפיין", ...extra,
});
let bindingVersion;

await check("the owner binds the project to a marketing tenant (governed, owner-only route)", async () => {
  const m = await mkt(member, "binding", { action: "bind", marketingBusiness: TENANT });
  const r = await mkt(owner, "binding", { action: "bind", marketingBusiness: TENANT });
  bindingVersion = r.body.bindingVersion;
  return m.status === 403 && r.status === 200 && bindingVersion >= 1 ? `member ${m.status}; owner bound v${bindingVersion}` : JSON.stringify([m, r]);
});

await check("a C2a approval queue is imported through the artifact route and validated against the vendored contract", async () => {
  const payload = { schemaVersion: 1, sourceRevision: `rev-${Date.now()}`, asOf: new Date(Date.now() - 60000).toISOString(), marketingBusiness: TENANT, items: [item(1), item(2)] };
  const bad = await mkt(owner, "artifacts", { kind: "C2a", bindingVersion, payload: { ...payload, marketingBusiness: "another-tenant" } });
  const r = await mkt(owner, "artifacts", { kind: "C2a", bindingVersion, payload });
  return r.status === 200 && bad.status >= 400 && bad.status < 500 ? `imported rev ${r.body.revision}; wrong tenant refused (${bad.status} ${bad.body.error})` : JSON.stringify([bad, r]);
});

const { chromium } = playwright();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await ctx.addCookies([...owner.jar].map(([name, value]) => ({ name, value, url: BASE })));
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await check("Focus approvals lists the business's real queue (no demo fixtures)", async () => {
  await page.goto(BASE + "/mytiv/focus/approvals", { waitUntil: "domcontentloaded" }); await settle(page);
  const html = await page.content();
  const leaks = ["נועה", "demo.example", "f-screenmap", "דמו:"].filter((w) => html.includes(w));
  const cards = await page.locator(".f-mkt-appr", { hasText: TITLE }).count();
  return cards === 2 && leaks.length === 0 ? "2 items from C2a, no fixture text" : `cards=${cards} leaks=${leaks.join(",")}`;
});

const card = () => page.locator(".f-mkt-appr", { hasText: `${TITLE} #1` });
await check("a decision needs a reason (refused locally, nothing recorded)", async () => {
  await card().getByRole("button", { name: "אשר" }).click();
  return (await card().locator(".f-field__error").isVisible()) ? "reason required" : false;
});

await check("the owner approves with a reason → a C2b decision is recorded; the item waits for the engine", async () => {
  await card().locator("textarea").fill("מאושר לשבוע הבא");
  await card().getByRole("button", { name: "אשר" }).click();
  await page.waitForSelector(`.f-mkt-appr:has-text("${TITLE} #1") >> text=ממתינה להחלה במנוע`, { timeout: 15000 });
  const d = sql(`select count(*) from marketing_decisions where project_id='${PROJECT}' and approval_id='focus-e2e-1'`);
  const audit = sql(`select count(*) from ops_actions where project_id='${PROJECT}' and action='marketing_record_decision'`);
  return d === "1" && Number(audit) >= 1 ? `marketing_decisions: 1 row; audited (${audit}); item awaits the engine` : `decisions=${d} audit=${audit}`;
});

await check("the same item cannot be decided twice (no decision controls; the route refuses a second decision)", async () => {
  const controls = await card().getByRole("button", { name: "אשר" }).count();
  const art = await owner.json(`/api/mytiv/ops/projects/${PROJECT}/marketing/artifacts`);
  const c2a = (art.body.artifacts ?? []).find((a) => a.kind === "C2a");
  const again = await mkt(owner, "decisions", { bindingVersion, sourceArtifactId: c2a?.id, approvalId: "focus-e2e-1", contentHash: "1".repeat(64), decision: "rejected", note: "שוב" });
  return controls === 0 && again.status >= 400 ? `no controls; second decision ${again.status} ${again.body.error}` : JSON.stringify([controls, again]);
});

await check("a member sees the queue read-only and the decisions route refuses them", async () => {
  const mctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await mctx.addCookies([...member.jar].map(([name, value]) => ({ name, value, url: BASE })));
  const mp = await mctx.newPage();
  await mp.goto(BASE + "/mytiv/focus/approvals", { waitUntil: "domcontentloaded" }); await settle(mp);
  const readOnly = await mp.isVisible("text=צפייה בלבד");
  const buttons = await mp.locator(".f-mkt-appr", { hasText: TITLE }).getByRole("button", { name: "אשר" }).count();
  const art = await member.json(`/api/mytiv/ops/projects/${PROJECT}/marketing/artifacts`);
  const c2a = (art.body.artifacts ?? []).find((a) => a.kind === "C2a");
  const r = await mkt(member, "decisions", { bindingVersion, sourceArtifactId: c2a?.id, approvalId: "focus-e2e-2", contentHash: "2".repeat(64), decision: "approved", note: "x" });
  await mctx.close();
  return readOnly && buttons === 0 && r.status === 403 ? "read-only banner, no controls, 403" : JSON.stringify([readOnly, buttons, r.status, r.body]);
});

await check("tenant isolation: another business can neither see nor decide", async () => {
  const pageB = await other.fetch("/mytiv/focus/approvals");
  const r = await mkt(other, "decisions", { bindingVersion, sourceArtifactId: crypto.randomUUID(), approvalId: "focus-e2e-2", contentHash: "2".repeat(64), decision: "approved", note: "x" });
  const own = await other.fetch("/second-business/focus/approvals");
  const ownHtml = await own.text();
  return pageB.status === 404 && r.status === 404 && !ownHtml.includes(TITLE) ? "404 · 404 · own scope shows none of it" : `${pageB.status} ${r.status} leak=${ownHtml.includes(TITLE)}`;
});

await check("the demo approvals still run on fixtures", async () => {
  await page.goto(BASE + "/_demo/focus/approvals", { waitUntil: "domcontentloaded" }); await settle(page);
  return !(await page.content()).includes(TITLE) && (await page.locator(".f-mkt-appr").count()) === 0 ? "fixtures in /_demo" : false;
});

await check("no page errors", async () => (errors.length === 0 ? "none" : errors.slice(0, 2).join(" | ")));
await browser.close();
process.exit(report("e2e-approvals (Marketing OS C2a → Focus)", rows) ? 0 : 1);
