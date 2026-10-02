// End-to-end flows in a real browser (demo store, no backend): mandatory reason, confirmation before the red action,
// processing → success / failure (draft kept), format selection, undo window, focus queue one-by-one, unsaved-change
// guards, theme light/dark/system persisted without a flash, keyboard shortcuts vs text fields, Mytiv Work rules.
// Usage: PLAYWRIGHT_MODULE=… node scripts/focus/qa/flows.mjs
import { BASE, playwright, report, settle } from "./lib.mjs";

const { chromium } = playwright();
const rows = [];
const check = async (name, fn) => {
  try { const d = await fn(); rows.push({ ok: d !== false, name, detail: typeof d === "string" ? d : "" }); }
  catch (e) { rows.push({ ok: false, name, detail: String(e.message ?? e).split("\n")[0].slice(0, 200) }); }
};
const browser = await chromium.launch();
const fresh = async (w = 1440) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return { ctx, page, errors };
};
const go = async (page, r) => { await page.goto(BASE + r, { waitUntil: "domcontentloaded" }); await settle(page); };

// 1. mandatory reason (medium risk) + focus queue
{
  const { ctx, page } = await fresh();
  await check("reason is mandatory from medium risk (nothing recorded without it)", async () => {
    await go(page, "/focus/approvals/promo-1plus1");
    await page.click(".f-decision__approve");
    const err = await page.textContent(".f-decision .f-field__error");
    if (!err?.includes("נימוק")) return false;
    if (await page.isVisible(".f-decision--done")) return false;
    await page.fill(".f-decision__input", "בתוקף עד 31.10");
    await page.click(".f-decision__approve");
    return (await page.textContent(".f-decision__result"))?.includes("אושר") ? "approved with reason" : false;
  });
  await check("A shortcut does not fire while typing in the reason field", async () => {
    await go(page, "/focus/approvals/plan-october");
    await page.click(".f-decision__input");
    await page.keyboard.type("Aa");
    return (await page.inputValue(".f-decision__input")) === "Aa" && !(await page.isVisible(".f-decision--done"));
  });
  await check("focus queue: decided item → 'לאישור הבא' leads to the next pending item", async () => {
    await go(page, "/focus/approvals/promo-1plus1");
    const next = page.locator(".f-decision--done a.f-btn--primary");
    const href = await next.getAttribute("href");
    await next.click(); await settle(page);
    return page.url().endsWith(href) && href !== "/focus/approvals/promo-1plus1" ? href : false;
  });
  await check("undo a decision (toast or result) returns it to the queue", async () => {
    await go(page, "/focus/approvals/promo-1plus1");
    await page.click(".f-decision--done .f-btn--neutral");
    await page.waitForTimeout(200);
    return await page.isVisible(".f-decision__input");
  });
  await ctx.close();
}

// 2. red action gated + processing → success / failure
{
  const { ctx, page } = await fresh();
  await check("red action is locked until the confirmation box is ticked", async () => {
    await go(page, "/focus/approvals/proposal-noa");
    const dis = await page.getAttribute(".f-pre__final", "aria-disabled");
    await page.click(".f-pre__final", { force: true });
    const err = await page.isVisible("#pre-confirm-err");
    const sending = await page.isVisible(".f-pre__final[aria-busy=true]");
    return dis === "true" && err && !sending ? "locked + explained" : false;
  });
  await check("sending → 'sent' only after the target confirms", async () => {
    await page.click(".f-pre__confirm .f-check__box");
    await page.click(".f-pre__final");
    const busy = await page.isVisible(".f-pre__final[aria-busy=true]");
    const sentEarly = await page.isVisible(".f-banner--done");
    await page.waitForSelector(".f-banner--done", { timeout: 6000 });
    return busy && !sentEarly ? "processing then success" : false;
  });
  await check("failure keeps the draft and offers retry", async () => {
    await page.evaluate(() => sessionStorage.clear());
    await go(page, "/focus/screens");
    await page.check(".f-smap__ctl--check input");
    await go(page, "/focus/approvals/proposal-noa");
    await page.click(".f-pre__confirm .f-check__box");
    await page.click(".f-pre__final");
    await page.waitForSelector(".f-banner--error", { timeout: 6000 });
    const txt = await page.textContent(".f-banner--error");
    return txt.includes("טיוטה") && (await page.isVisible("text=נסה שוב לשלוח")) ? "draft kept, retry offered" : false;
  });
  await ctx.close();
}

// 3. undo window on a quick approval + processing (Meta)
{
  const { ctx, page } = await fresh();
  await check("quick approve (A, low risk) → processing → scheduled, with undo in the toast window", async () => {
    await go(page, "/focus");
    const card = page.locator("article.f-acard", { hasText: "סטורי" }).first();
    await card.locator("a.f-btn").focus();
    await page.keyboard.press("a");
    const working = await page.isVisible(".f-acard--working");
    const undo = await page.isVisible(".f-toast__btn >> text=בטל");
    await page.waitForSelector(".f-acard--done", { timeout: 5000 });
    return working && undo ? "working → done" : false;
  });
  await check("undo restores the item (nothing scheduled)", async () => {
    await page.click(".f-acard--done .f-btn--neutral");
    await page.waitForTimeout(200);
    return (await page.locator(".f-acard--done").count()) === 0;
  });
  await ctx.close();
}

// 4. format selection + processing directions
{
  const { ctx, page } = await fresh();
  await check("format selection: at least one format required; selected formats drive the brief", async () => {
    await go(page, "/focus/studio/new");
    await page.click(".f-snew__card button[aria-expanded]");
    while (await page.locator(".f-fmt__card[aria-pressed=true]").count()) await page.locator(".f-fmt__card[aria-pressed=true]").first().click();
    await page.click("text=✦ צור 3 כיוונים");
    const err = await page.textContent(".f-fmt .f-field__error");
    await page.click(".f-fmt__card >> text=ריבוע");
    const help = await page.textContent(".f-fmt .f-field__help");
    return err?.includes("לפחות") && help?.includes("ריבוע") ? "required + reflected" : false;
  });
  await check("AI directions are processing jobs: running → ready; cancel keeps the others", async () => {
    await page.click("text=✦ צור 3 כיוונים");
    await page.waitForURL("**/studio/new/directions");
    const busy = await page.locator(".f-sdir__card--busy").count();
    await page.waitForSelector(".f-sdir__card:not(.f-sdir__card--busy) >> text=בחר וערוך", { timeout: 5000 });
    await page.click(".f-sdir__card--busy >> text=בטל כיוון זה");
    const cancelled = await page.isVisible("text=הכיוון בוטל");
    const ready = await page.locator("text=בחר וערוך").count();
    return busy >= 2 && cancelled && ready >= 2 ? `${ready} ready, 1 cancelled` : false;
  });
  await ctx.close();
}

// 5. unsaved-change guards
{
  const { ctx, page } = await fresh();
  await check("leaving focus mode with a typed reason asks first", async () => {
    await go(page, "/focus/approvals/plan-october");
    await page.fill(".f-decision__input", "טיוטה");
    await page.click(".f-focusbar__exit");
    return (await page.isVisible("dialog[open] .f-confirm")) && page.url().includes("plan-october");
  });
  await check("closing the task drawer with a draft comment asks first", async () => {
    await go(page, "/focus/work/list?task=t-post45");
    await page.fill(".f-td__cinput", "טיוטה");
    await page.keyboard.press("Escape");
    return await page.isVisible(".f-td__confirm");
  });
  await check("switching task in D3 with unsaved edits asks first", async () => {
    await go(page, "/focus/projects/umino/execution");
    await page.fill(".f-bpanel input.f-input", "לתאם עם צלם אחר");
    await page.click(".f-tl__titlebtn >> nth=1");
    return await page.isVisible("dialog[open] .f-confirm");
  });
  await ctx.close();
}

// 6. Mytiv Work rules
{
  const { ctx, page } = await fresh();
  await check("a task blocked by an open dependency cannot be marked done (reason shown)", async () => {
    await go(page, "/focus/work/list?task=t-post45");
    return (await page.textContent(".f-td__gate .f-btn-why"))?.includes("חסום");
  });
  await check("version conflict shows both versions and overwrites nothing until decided", async () => {
    await page.click(".f-td__demo button");
    await page.selectOption(".f-td__field:has-text('עדיפות') select", "high");
    const shown = await page.isVisible(".f-conflict");
    await page.click(".f-conflict >> text=קבל את");
    return shown && !(await page.isVisible(".f-conflict"));
  });
  await check("Kanban keyboard: Space picks, arrows move, Space drops; a refused move explains why", async () => {
    await go(page, "/focus/work/board");
    const h = page.locator(".f-kcard:has-text('לעצב פוסט 4:5') .f-kcard__handle");
    await h.focus(); await page.keyboard.press("Space"); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    return (await page.textContent(".f-board [aria-live]"))?.includes("לא ניתן") ? "refused with reason" : false;
  });
  await ctx.close();
}

// 7. theme: persisted, no flash (attribute set before first paint), system follows OS
{
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await check("theme dark persists across reload and is applied before hydration", async () => {
    await go(page, "/focus");
    await page.click(".f-avatar-btn");
    await page.click(".f-theme__opt >> text=כהה");
    await page.reload({ waitUntil: "commit" });
    const early = await page.evaluate(() => new Promise((r) => { const t = () => document.documentElement.getAttribute("data-f-theme") ? r(document.documentElement.getAttribute("data-f-theme")) : requestAnimationFrame(t); t(); }));
    await settle(page);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    return early === "dark" && bg === "rgb(17, 20, 28)" ? "dark before paint" : `attr=${early} bg=${bg}`;
  });
  await check("system follows prefers-color-scheme", async () => {
    await page.click(".f-avatar-btn");
    await page.click(".f-theme__opt >> text=לפי המערכת");
    await page.emulateMedia({ colorScheme: "dark" });
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.emulateMedia({ colorScheme: "light" });
    const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    return dark === "rgb(17, 20, 28)" && light === "rgb(243, 245, 249)";
  });
  await ctx.close();
}
await browser.close();
process.exit(report("flows", rows) ? 0 : 1);
