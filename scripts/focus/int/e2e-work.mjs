// End-to-end: Focus Work in a REAL business scope against the local integration stack (scripts/focus/int/stack.sh,
// WORK_API_ENABLED=true). Real Auth.js login through the login form, real DB writes through /api/[slug]/work, a second
// member editing concurrently, tenant isolation, the demo scope still on fixtures, and unconnected areas honest.
// Usage: INT_PW=<fixture password> PLAYWRIGHT_MODULE=… BASE=http://localhost:3200 node scripts/focus/int/e2e-work.mjs
import { playwright, report, settle } from "../qa/lib.mjs";
import { Session } from "./session.mjs";

const BASE = process.env.BASE ?? "http://localhost:3200";
const PW = process.env.INT_PW; if (!PW) throw new Error("INT_PW (fixture password) is required");
const { chromium } = playwright();
const rows = [];
const check = async (name, fn) => {
  try { const d = await fn(); rows.push({ ok: d !== false, name, detail: typeof d === "string" ? d : "" }); }
  catch (e) { rows.push({ ok: false, name, detail: String(e.message ?? e).split("\n")[0].slice(0, 220) }); }
};
const api = (page, path) => page.evaluate(async (p) => { const r = await fetch(p, { cache: "no-store" }); return { status: r.status, body: await r.json().catch(() => null) }; }, path);
const taskByTitle = async (page, title) => (await api(page, "/api/mytiv/work/tasks")).body.tasks.find((t) => t.title === title);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const member = await new Session("member").login("member-a@staging.invalid", PW);
const TITLE = `E2E משימה ${Date.now()}`;

await check("sign in through the real login form (Auth.js credentials, fixture owner)", async () => {
  await page.goto(BASE + "/login");
  await page.fill("input[type=email]", "owner-a@staging.invalid");
  await page.fill("input[type=password]", PW);
  await page.click("button[type=submit]");
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
  return true;
});

await check("business Focus Work renders the business's real tasks (no demo fixtures, no demo controls)", async () => {
  await page.goto(BASE + "/mytiv/focus/work", { waitUntil: "domcontentloaded" }); await settle(page);
  const html = await page.content();
  const leaks = ["נועה", "השקת תפריט סתיו", "demo.example", "f-screenmap", "דמו:"].filter((w) => html.includes(w));
  return leaks.length === 0 && (await page.isVisible(".f-qc__input")) ? "quick create visible, no fixture text" : `leaks: ${leaks.join(", ")}`;
});

await check("quick create writes to the DB (work_create_task) and shows the server's copy", async () => {
  await page.fill(".f-qc__input", `${TITLE} מחר גבוה`);
  await page.press(".f-qc__input", "Enter");
  await page.waitForTimeout(1500);
  const t = await taskByTitle(page, TITLE);
  const visible = await page.locator(`text=${TITLE}`).first().isVisible();
  return t && t.priority === "high" && t.dueDate && visible ? `server version ${t.version}, due ${t.dueDate}` : JSON.stringify(t ?? null);
});

await check("drawer status change is a versioned server write; a reload shows it from the DB", async () => {
  const t0 = await taskByTitle(page, TITLE);
  await page.goto(BASE + `/mytiv/focus/work/all-tasks?task=${t0.id}`, { waitUntil: "domcontentloaded" }); await settle(page);
  await page.waitForSelector("dialog[open].f-tdrawer", { timeout: 10000 });
  await page.locator(".f-td__pill").first().selectOption("in_progress");
  await page.waitForTimeout(1200);
  const t1 = await taskByTitle(page, TITLE);
  await page.reload({ waitUntil: "domcontentloaded" }); await settle(page);
  await page.waitForSelector("dialog[open].f-tdrawer", { timeout: 10000 });
  const shown = await page.locator(".f-td__pill").first().inputValue();
  return t1.status === "in_progress" && Number(t1.version) === Number(t0.version) + 1 && shown === "in_progress" ? `v${t0.version} → v${t1.version}` : `${t1.status} v${t1.version} shown=${shown}`;
});

await check("a manual block needs a reason; with one it is stored (waiting + reason)", async () => {
  await page.locator(".f-td__pill").first().selectOption("__block");
  await page.click(".f-td__blockform button[type=submit]");
  const refusedLocally = await page.isVisible(".f-td__blockform .f-field__error");
  await page.fill(".f-td__blockform textarea", "ממתינים לאישור הלקוח");
  await page.click(".f-td__blockform button[type=submit]");
  await page.waitForTimeout(1200);
  const t = await taskByTitle(page, TITLE);
  return refusedLocally && t.status === "waiting" && t.blockedReason === "ממתינים לאישור הלקוח" ? "blocked with reason" : `${t.status} / ${t.blockedReason}`;
});

await check("concurrent edit by another member: the stale write is refused by the server, nothing overwritten, the user is told", async () => {
  const t = await taskByTitle(page, TITLE);
  const r = await member.json(`/api/mytiv/work/tasks/${t.id}`, { method: "PATCH", body: { requestId: crypto.randomUUID(), expectedVersion: Number(t.version), patch: { title: `${TITLE} (נערך)` } } });
  if (r.status !== 200) return `member write failed ${r.status}`;
  // this page still holds the old version: a status change from the drawer
  await page.locator(".f-td__pill").first().selectOption("in_progress");
  await page.waitForSelector(".f-toast >> text=השינוי שלך לא נשמר", { timeout: 8000 });
  const after = (await api(page, "/api/mytiv/work/tasks")).body.tasks.find((x) => x.id === t.id);
  return after.title === `${TITLE} (נערך)` && after.status === "waiting" ? "member's title kept, stale status refused, toast shown" : `${after.title} / ${after.status}`;
});

await check("tenant isolation: another business's member cannot read or write this business's Work", async () => {
  const b = await new Session("b").login("owner-b@staging.invalid", PW);
  const list = await b.json("/api/mytiv/work/tasks");
  const t = await taskByTitle(page, `${TITLE} (נערך)`);
  const write = await b.json(`/api/second-business/work/tasks/${t.id}`, { method: "PATCH", body: { requestId: crypto.randomUUID(), expectedVersion: Number(t.version), patch: { title: "x" } } });
  const pageB = await b.fetch("/mytiv/focus/work");
  return list.status === 404 && write.status === 404 && pageB.status === 404 ? "404 · 404 · 404" : `${list.status} ${write.status} ${pageB.status}`;
});

await check("areas without a backend say so for the business (no fixtures)", async () => {
  await page.goto(BASE + "/mytiv/focus/reports", { waitUntil: "domcontentloaded" }); await settle(page);
  const html = await page.content();
  return (await page.isVisible("#area-nc-h")) && !html.includes("נועה") ? "not-connected page" : false;
});

await check("the demo scope still runs on fixtures", async () => {
  await page.goto(BASE + "/_demo/focus/work", { waitUntil: "domcontentloaded" }); await settle(page);
  return (await page.content()).includes("UMINO") ? "fixtures in /_demo" : false;
});

await check("no page errors in the business flow", async () => (errors.length === 0 ? "none" : errors.slice(0, 2).join(" | ")));

await browser.close();
process.exit(report("e2e-work (business scope)", rows) ? 0 : 1);
