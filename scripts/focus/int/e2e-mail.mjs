// End-to-end: Focus business mail in a real browser against the local stack (EXTERNAL_ACTIONS_ENABLED=true, the
// local Gmail stand-in). The business's own inbox is listed; a reply is confirmed in the review dialog and sent ONLY
// through the backend attempt ("נשלח" after Gmail confirmed); when Gmail does not answer the thread shows UNKNOWN and a
// new send needs the target check — enforced by the server, not by the page (a fresh page, a reload, a second
// member are all held); with the check exactly one new send goes out; a known failure retries; another business
// sees none of it.
// Usage: INT_PW=<fixture password> PLAYWRIGHT_MODULE=… BASE=http://localhost:3200 node scripts/focus/int/e2e-mail.mjs
import { playwright, report, settle } from "../qa/lib.mjs";
import { Session } from "./session.mjs";

const BASE = process.env.BASE ?? "http://localhost:3200";
const MOCK = process.env.GMAIL_MOCK ?? "http://127.0.0.1:4545";
const PW = process.env.INT_PW; if (!PW) throw new Error("INT_PW is required");
const rows = [];
const check = async (name, fn) => { try { const d = await fn(); rows.push({ ok: d !== false, name, detail: typeof d === "string" ? d : "" }); } catch (e) { rows.push({ ok: false, name, detail: String(e.message ?? e).split("\n")[0].slice(0, 220) }); } };
const mock = { mode: (mode) => fetch(`${MOCK}/__mode`, { method: "POST", body: JSON.stringify({ mode }) }), state: async () => (await fetch(`${MOCK}/__state`)).json(), reset: () => fetch(`${MOCK}/__reset`, { method: "POST" }) };
const sendsTotal = async () => Object.values((await mock.state()).sends).reduce((a, b) => a + b, 0);
await mock.reset();
const [T1] = (await mock.state()).threads;

const owner = await new Session("owner").login("owner-a@staging.invalid", PW);
const member = await new Session("member").login("member-a@staging.invalid", PW);
const other = await new Session("b").login("owner-b@staging.invalid", PW);
const { chromium } = playwright();
const browser = await chromium.launch();
const open = async (s) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await ctx.addCookies([...s.jar].map(([name, value]) => ({ name, value, url: BASE })));
  const page = await ctx.newPage();
  page.errors = []; page.on("pageerror", (e) => page.errors.push(e.message));
  await page.goto(BASE + "/mytiv/focus/comms", { waitUntil: "domcontentloaded" }); await settle(page);
  return page;
};
const confirmSend = async (page, { targetCheck = false } = {}) => {
  await page.click(".f-bmail__actions button:has-text('שלח')");
  await page.waitForSelector("dialog[open] .f-cm-dlg", { timeout: 8000 });
  const checks = page.locator("dialog[open] .f-check input");
  if (targetCheck) await checks.nth(0).check();
  await checks.last().check();
  await page.click("dialog[open] .f-cm-dlg__actions button:has-text('שלח דרך')");
};
const status = (page) => page.locator("[data-send-status]").getAttribute("data-send-status", { timeout: 15000 });

const page = await open(owner);
await check("the business's own inbox is listed (no demo fixtures)", async () => {
  const html = await page.content();
  const leaks = ["נועה", "demo.example", "f-screenmap", "דמו:"].filter((w) => html.includes(w));
  const items = await page.locator(".f-bmail__item").count();
  return items === 2 && leaks.length === 0 && (await page.isVisible("text=שאלה על ההזמנה לשבוע הבא")) ? "2 threads from Gmail, no fixture text" : `items=${items} leaks=${leaks}`;
});

await check("a reply needs the review dialog's confirmation; then it is sent through the backend attempt and shows 'sent' only after Gmail confirmed", async () => {
  await page.fill(".f-bmail__reply textarea", "כן, יום רביעי מתאים.");
  await page.click(".f-bmail__actions button:has-text('שלח')");
  await page.waitForSelector("dialog[open] .f-cm-dlg");
  await page.click("dialog[open] .f-cm-dlg__actions button:has-text('שלח דרך')", { force: true }); // not confirmed (aria-disabled) → refused locally
  const refused = await page.isVisible("#cm-send-err");
  const before = await sendsTotal();
  await page.locator("dialog[open] .f-check input").last().check();
  await page.click("dialog[open] .f-cm-dlg__actions button:has-text('שלח דרך')");
  await page.waitForSelector(".f-toast >> text=נשלח", { timeout: 15000 });
  const st = await status(page);
  const shown = await page.locator(".f-bmail__msg--sent", { hasText: "יום רביעי מתאים" }).count();
  return refused && before === 0 && (await sendsTotal()) === 1 && st === "sent" && shown === 1 ? "unconfirmed refused; Gmail send ×1; status sent; message in thread" : `${refused} ${before} ${st} ${shown}`;
});

let unknownId;
await check("Gmail does not answer → the thread shows UNKNOWN (never 'sent', never a plain failure)", async () => {
  await mock.mode("hang");
  await page.fill(".f-bmail__reply textarea", "תשובה שנייה");
  await confirmSend(page);
  await page.waitForSelector("[data-send-status=unknown]", { timeout: 20000 });
  await mock.mode("ok");
  const list = await owner.json(`/api/mytiv/external/attempts?target=gmail:thread:${T1}`);
  unknownId = list.body.attempts[0].id;
  return list.body.attempts[0].state === "unknown" && (await page.isVisible(".f-bmail__reply .f-field__error")) ? `attempt ${unknownId.slice(0, 8)} unknown; user told to check Gmail` : JSON.stringify(list.body.attempts[0]);
});

await check("after UNKNOWN the server holds every new send without the check — a reload, and another member's fresh page", async () => {
  await page.reload({ waitUntil: "domcontentloaded" }); await settle(page);
  const st = await status(page);
  const n0 = await sendsTotal();
  // the page now asks for the target check; bypass it at the API: refused by the server
  const direct = await member.json("/api/mytiv/external/gmail/send", { method: "POST", body: { requestId: crypto.randomUUID(), threadId: T1, draftId: "d999" } });
  const mpage = await open(member);
  await mpage.fill(".f-bmail__reply textarea", "ניסיון של חבר צוות");
  await mpage.click(".f-bmail__actions button:has-text('שלח')");
  await mpage.waitForSelector("dialog[open] .f-cm-dlg");
  const memberAsked = await mpage.isVisible("dialog[open] #cm-send-unknown");
  await mpage.context().close();
  return st === "unknown" && direct.status === 409 && direct.body.error === "needs_target_check" && memberAsked && (await sendsTotal()) === n0
    ? "reload: unknown · API 409 needs_target_check · member's dialog asks for the check · Gmail not called" : JSON.stringify([st, direct, memberAsked]);
});

await check("with the explicit target check exactly one new send goes out, recorded against the UNKNOWN attempt it names", async () => {
  const n0 = await sendsTotal();
  await page.fill(".f-bmail__reply textarea", "תשובה שנייה (אחרי בדיקה)");
  await confirmSend(page, { targetCheck: true });
  await page.waitForSelector(".f-toast >> text=נשלח", { timeout: 15000 });
  const [latest] = (await owner.json(`/api/mytiv/external/attempts?target=gmail:thread:${T1}`)).body.attempts;
  return (await sendsTotal()) === n0 + 1 && (await status(page)) === "sent" && latest.state === "confirmed" && latest.attestedUnknownAttemptId === unknownId
    ? "Gmail send +1; confirmed attempt carries the target check" : JSON.stringify([await sendsTotal(), n0, latest]);
});

await check("a known failure (Gmail refused) is shown as failed and the ordinary retry works", async () => {
  await page.click(".f-bmail__item:has-text('חשבונית אוקטובר')");
  await page.waitForSelector(".f-bmail__title:has-text('חשבונית אוקטובר')");
  await mock.mode("fail400");
  await page.fill(".f-bmail__reply textarea", "תודה, התקבל.");
  await confirmSend(page);
  await page.waitForSelector("[data-send-status=failed]", { timeout: 15000 });
  await mock.mode("ok");
  await confirmSend(page);
  await page.waitForSelector("[data-send-status=sent]", { timeout: 15000 });
  return "failed → retry → sent";
});

await check("tenant isolation: another business sees neither the mail nor the attempts", async () => {
  const p = await other.fetch("/mytiv/focus/comms");
  const a = await other.json(`/api/mytiv/external/attempts?target=gmail:thread:${T1}`);
  const own = await other.json(`/api/second-business/external/attempts?target=gmail:thread:${T1}`);
  const ownPage = await (await other.fetch("/second-business/focus/comms")).text();
  return p.status === 404 && a.status === 404 && own.body.attempts?.length === 0 && ownPage.includes("אין חיבור ל־Gmail") ? "404 · 404 · [] · own scope: Gmail not connected" : JSON.stringify([p.status, a.status, own.body]);
});

await check("the demo mailbox still runs on fixtures", async () => {
  await page.goto(BASE + "/_demo/focus/comms", { waitUntil: "domcontentloaded" }); await settle(page);
  return (await page.locator(".f-bmail").count()) === 0 && !(await page.content()).includes("שאלה על ההזמנה לשבוע הבא") ? "fixtures in /_demo" : false;
});

await check("no page errors", async () => (page.errors.length === 0 ? "none" : page.errors.slice(0, 2).join(" | ")));
await browser.close();
process.exit(report("e2e-mail (Gmail via backend attempts)", rows) ? 0 : 1);
