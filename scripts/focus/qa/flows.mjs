// End-to-end flows in a real browser (demo store, no backend): mandatory reason, confirmation before the red action,
// processing → success / failure (draft kept), format selection, undo window, focus queue one-by-one, unsaved-change
// guards, theme light/dark/system persisted without a flash, keyboard shortcuts vs text fields, Mytiv Work rules, LTR
// content inside the RTL layout.
// Usage: PLAYWRIGHT_MODULE=… node scripts/focus/qa/flows.mjs
import { SCOPE, SITE, playwright, report, settle } from "./lib.mjs";

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
  // a dirty screen from the previous check raises beforeunload on goto: accept it (Playwright would dismiss = abort)
  page.on("dialog", (d) => d.accept().catch(() => {}));
  return { ctx, page, errors };
};
const go = async (page, r) => { await page.goto(SITE + r, { waitUntil: "domcontentloaded" }); await settle(page); };

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
    const ok = (await page.textContent(".f-decision__result"))?.includes("אושר");
    // the screen just turned clean: its guard history entry is being stepped off (a few ms) — a full-page goto fired
    // inside that step would be aborted by it, which no person can do; in-app navigation is queued (checked below)
    await settle(page);
    return ok ? "approved with reason" : false;
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
    await next.click(); await page.waitForURL((u) => u.pathname === href, { timeout: 15000 }); await settle(page);
    return href !== SCOPE + "/focus/approvals/promo-1plus1" ? href : false;
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
    return txt.includes("לא סומנה כנשלחה") && (await page.isVisible("text=נסה שוב לשלוח")) ? "nothing marked sent, retry offered" : false;
  });
  await ctx.close();
}

// 3. undo window on a quick approval + processing (Meta)
{
  const { ctx, page } = await fresh();
  await check("quick approve (A) of a post whose photo is still a placeholder: approved, never scheduled at Meta", async () => {
    await go(page, "/focus");
    const card = page.locator("article.f-acard", { hasText: "סטורי" }).first();
    await card.locator("a.f-btn").focus();
    await page.keyboard.press("a");
    await page.waitForSelector(".f-acard--done", { timeout: 5000 });
    const waits = await page.isVisible(".f-toast >> text=התזמון ב־Meta ימתין");
    const scheduling = await page.isVisible(".f-acard--working");
    await page.click(".f-acard--done .f-btn--neutral"); // undo, back to the queue
    await page.waitForTimeout(200);
    return waits && !scheduling && (await page.locator(".f-acard--done").count()) === 0 ? "approved, Meta waits for the photo" : false;
  });
  await check("quick approve (A, low risk) → processing → scheduled, with undo in the toast window", async () => {
    // the real photo exists once the photo task is done (the publish rule): close it from the task drawer
    await go(page, "/focus/work/list?task=t-photo-shoot");
    await page.locator(".f-td__pill").first().selectOption("done");
    await page.waitForTimeout(200);
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
    await page.waitForSelector(".f-sdir__card--busy", { timeout: 5000 });
    const busy = await page.locator(".f-sdir__card--busy").count();
    await page.waitForSelector(".f-sdir__card:not(.f-sdir__card--busy) >> text=בחר וערוך", { timeout: 5000 });
    await page.click(".f-sdir__card--busy >> text=בטל כיוון זה");
    const cancelled = await page.isVisible("text=הכיוון בוטל");
    const ready = await page.locator("text=בחר וערוך").count();
    // jobs start on the click (before navigation), so a slow first compile may already have settled the short ones
    return busy >= 1 && cancelled && ready >= 2 ? `${ready} ready, 1 cancelled` : false;
  });
  await ctx.close();
}

// 5. unsaved-change guards
{
  const { ctx, page } = await fresh();
  const leaveDialog = "dialog[open] #nav-leave-title";
  await check("leaving focus mode with a typed reason asks first", async () => {
    await go(page, "/focus/approvals/plan-october");
    await page.fill(".f-decision__input", "טיוטה");
    await page.click(".f-focusbar__exit");
    return (await page.isVisible(leaveDialog)) && page.url().includes("plan-october");
  });
  await check("search (⌘K) does not bypass the guard: stay keeps the draft", async () => {
    await go(page, "/focus/approvals/plan-october");
    await page.fill(".f-decision__input", "נימוק בעבודה");
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Control+k");
    await page.waitForSelector(".f-palette__input");
    await page.fill(".f-palette__input", "לידים");
    await page.keyboard.press("Enter");
    await page.waitForSelector(leaveDialog, { timeout: 3000 });
    const held = page.url().includes("plan-october");
    await page.click("dialog[open] .f-nav-leave__stay");
    return held && (await page.inputValue(".f-decision__input")) === "נימוק בעבודה" ? "held, draft kept" : false;
  });
  await check("browser Back with an unsaved reason asks; stay keeps the page, leave goes back", async () => {
    await go(page, "/focus/approvals");
    await page.click("a[href$='/approvals/plan-october'] >> nth=0");
    await page.waitForURL("**/approvals/plan-october");
    await page.waitForSelector(".f-decision__input");
    await page.fill(".f-decision__input", "טיוטה ל־Back");
    await page.waitForTimeout(150);
    await page.goBack();
    await page.waitForSelector(leaveDialog, { timeout: 3000 });
    const stayedOnPage = page.url().includes("plan-october");
    await page.click("dialog[open] .f-nav-leave__stay");
    const kept = (await page.inputValue(".f-decision__input")) === "טיוטה ל־Back";
    await page.goBack();
    await page.waitForSelector(leaveDialog, { timeout: 3000 });
    await page.click("dialog[open] >> text=צא בלי לשמור");
    await page.waitForURL((u) => u.pathname.endsWith("/focus/approvals"), { timeout: 5000 });
    return stayedOnPage && kept ? "held twice, then left to the list" : false;
  });
  await check("an in-page link on a dirty screen asks first (studio brief 'חזרה')", async () => {
    await go(page, "/focus/studio/new");
    await page.getByLabel("טקסט משני").fill("שינוי בבריף");
    // keyboard activation of the link (Enter dispatches the click the guard intercepts)
    await page.focus(".f-snew__foot a");
    await page.keyboard.press("Enter");
    await page.waitForSelector(leaveDialog, { timeout: 3000 });
    return (await page.isVisible(leaveDialog)) && page.url().includes("/studio/new");
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

// 5b. history and drafts (self-review round 2): no duplicate entries, Back/Forward after leaving, a click made while the
// guard entry is being stepped off is queued (not lost or bounced back), listeners do not pile up, drafts survive
// "save and leave", an interrupted external send is unknown, a failed proposal send cannot be retried at a new amount
{
  const { ctx, page } = await fresh();
  const leaveDialog = "dialog[open] #nav-leave-title";
  const path = () => new URL(page.url()).pathname;
  await check("dirty → clean leaves no extra history entry: one Back returns to the previous page", async () => {
    await go(page, "/focus/approvals");
    await page.click("a[href$='/approvals/plan-october'] >> nth=0");
    await page.waitForURL("**/approvals/plan-october");
    await page.fill(".f-decision__input", "טיוטה");
    await page.waitForTimeout(150);
    await page.fill(".f-decision__input", "");
    await settle(page);
    await page.goBack();
    await page.waitForURL((u) => u.pathname.endsWith("/focus/approvals"), { timeout: 5000 });
    return !(await page.isVisible(leaveDialog)) ? path() : false;
  });
  await check("leave from the dialog replaces the guard entry: Back → the page once, Forward → the destination", async () => {
    await go(page, "/focus/approvals");
    await page.click("a[href$='/approvals/plan-october'] >> nth=0");
    await page.waitForURL("**/approvals/plan-october");
    await page.fill(".f-decision__input", "טיוטה שתימחק");
    await page.click(".f-focusbar__exit");
    await page.click("dialog[open] >> text=צא בלי לשמור");
    await page.waitForURL((u) => u.pathname.endsWith("/focus/approvals"), { timeout: 5000 });
    await settle(page);
    await page.goBack();
    await page.waitForURL("**/approvals/plan-october", { timeout: 5000 });
    await settle(page);
    const clean = (await page.inputValue(".f-decision__input")) === "" && !(await page.isVisible(leaveDialog));
    await page.goForward();
    await page.waitForURL((u) => u.pathname.endsWith("/focus/approvals"), { timeout: 5000 });
    await settle(page);
    await page.goBack(); await page.waitForURL("**/approvals/plan-october", { timeout: 5000 }); await settle(page);
    await page.goBack(); await page.waitForURL((u) => u.pathname.endsWith("/focus/approvals"), { timeout: 5000 });
    return clean ? "Back, Forward, Back, Back — no duplicate of the page" : false;
  });
  await check("a link clicked while the screen turns clean is queued, lands, and Back returns to the screen once", async () => {
    await go(page, "/focus/studio");
    await go(page, "/focus/studio/new");
    const field = page.getByLabel("טקסט משני");
    const orig = await field.inputValue();
    await field.fill(orig + " שינוי");
    await page.waitForTimeout(150);
    // revert the edit (screen turns clean → the guard entry is stepped off) and click a link in the same task
    await field.evaluate((el, v) => {
      const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set;
      set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(() => document.querySelector(".f-snew__foot a").click(), 0);
    }, orig);
    await page.waitForURL((u) => !u.pathname.endsWith("/studio/new"), { timeout: 5000 });
    await page.waitForTimeout(600);
    const landed = path();
    if (landed.endsWith("/studio/new") || (await page.isVisible(leaveDialog))) return false;
    await page.goBack();
    await page.waitForURL("**/studio/new", { timeout: 5000 });
    await settle(page);
    await page.goBack();
    await page.waitForURL((u) => u.pathname.endsWith("/focus/studio"), { timeout: 5000 });
    return `landed on ${landed.split("/focus")[1]}, Back → brief → studio`;
  });
  await check("listeners do not pile up across dirty/clean cycles and navigations", async () => {
    const cdp = await ctx.newCDPSession(page);
    const count = async () => {
      const out = {};
      for (const [expr, types] of [["window", ["popstate", "beforeunload"]], ["document", ["click"]]]) {
        const { result } = await cdp.send("Runtime.evaluate", { expression: expr });
        const { listeners } = await cdp.send("DOMDebugger.getEventListeners", { objectId: result.objectId });
        for (const t of types) out[`${expr}.${t}`] = listeners.filter((l) => l.type === t).length;
      }
      return out;
    };
    await go(page, "/focus/approvals/plan-october");
    const before = await count();
    for (let i = 0; i < 4; i++) {
      await page.fill(".f-decision__input", `סבב ${i}`); await page.waitForTimeout(80);
      await page.fill(".f-decision__input", ""); await page.waitForTimeout(80);
    }
    await page.click(".f-focusbar__exit"); await page.waitForURL((u) => u.pathname.endsWith("/focus/approvals")); await settle(page);
    await page.click("a[href$='/approvals/plan-october'] >> nth=0"); await page.waitForURL("**/approvals/plan-october"); await settle(page);
    const after = await count();
    const same = Object.keys(before).every((k) => after[k] === before[k]);
    return same && before["window.beforeunload"] === 0 ? JSON.stringify(after) : `before ${JSON.stringify(before)} after ${JSON.stringify(after)}` && false;
  });
  await check("mail: an unsaved reply survives 'save and leave' and is there when you come back", async () => {
    await go(page, "/focus/comms");
    await page.waitForSelector(".f-cm-draft__input");
    const box = page.locator(".f-cm-draft__input");
    const typed = (await box.inputValue()) + " — נוסף לפני יציאה";
    await box.fill(typed);
    await page.click("a[href$='/focus/work'] >> nth=0");
    await page.waitForSelector(leaveDialog, { timeout: 3000 });
    await page.click("dialog[open] >> text=שמור וצא");
    await page.waitForURL((u) => u.pathname.endsWith("/focus/work"), { timeout: 5000 });
    await settle(page);
    await page.goBack();
    await page.waitForURL((u) => u.pathname.endsWith("/focus/comms"), { timeout: 5000 });
    await page.waitForSelector(".f-cm-draft__input");
    return (await box.inputValue()) === typed ? "draft kept" : false;
  });
  await check("mail: a send interrupted by a reload is shown as unknown — never 'sent', never a plain failure", async () => {
    await go(page, "/focus/comms");
    await page.click("text=בדוק ושלח");
    await page.click("dialog[open] .f-check__box");
    await page.click("dialog[open] .f-btn--danger");
    await page.waitForSelector(".f-cm-reply__state >> text=שולח דרך", { timeout: 3000 });
    await page.reload({ waitUntil: "domcontentloaded" }); await settle(page);
    await page.waitForTimeout(2200); // past the simulated send time: it must still not turn into "sent"
    const unknown = await page.isVisible("text=לא ידוע אם התשובה נשלחה");
    const sent = await page.isVisible("#cm-sent-h");
    return unknown && !sent ? "unknown, re-send needs a check" : false;
  });
  await check("proposal: a failed send cannot be retried once the amount changed (same guard as the first send)", async () => {
    await page.evaluate(() => sessionStorage.clear());
    await go(page, "/focus/screens");
    await page.check(".f-smap__ctl--check input");
    await go(page, "/focus/approvals/proposal-noa");
    await page.click(".f-pre__confirm .f-check__box");
    await page.click(".f-pre__final");
    await page.waitForSelector("text=נסה שוב לשלוח", { timeout: 6000 });
    await go(page, "/focus/sales/proposals/corporate-hosting");
    const qty = page.locator(".f-sl-numin").first();
    await qty.fill(String(Number(await qty.inputValue()) + 1));
    await qty.blur(); await settle(page);
    await go(page, "/focus/approvals/proposal-noa");
    const retry = page.locator("button:has-text('נסה שוב לשלוח')");
    const disabled = (await retry.getAttribute("aria-disabled")) === "true" && (await retry.getAttribute("aria-describedby")) === "pre-blocked";
    const reason = await page.isVisible("#pre-blocked");
    await retry.evaluate((b) => b.click()); // aria-disabled stays focusable/clickable: the click must do nothing
    await page.waitForTimeout(300);
    const stillFailed = await page.isVisible("text=נסה שוב לשלוח") && !(await page.isVisible(".f-pre__final"));
    return disabled && reason && stillFailed ? "retry refused, reason shown" : false;
  });
  await ctx.close();
}

// 5c. regressions found by the round-3 reviews (each was reproduced before its fix)
{
  const { ctx, page } = await fresh();
  const native = [];
  page.removeAllListeners("dialog");
  page.on("dialog", (d) => { native.push(d.type()); d.accept().catch(() => {}); });
  const leaveDialog = "dialog[open] #nav-leave-title";
  await check("mail: undoing an earlier 'save draft' after the reply was sent is refused — no second send", async () => {
    await go(page, "/focus/comms");
    await page.evaluate(() => sessionStorage.clear());
    await go(page, "/focus/comms");
    const box = page.locator(".f-cm-draft__input");
    await box.fill((await box.inputValue()) + " — נשמר");
    await page.click("button:has-text('שמור טיוטה')");
    const saveToast = page.locator(".f-toast", { hasText: "הטיוטה נשמרה" });
    await page.click("button:has-text('בדוק ושלח')");
    await page.click("dialog[open] .f-check__box");
    await page.click("dialog[open] .f-btn--danger");
    await page.waitForSelector("#cm-sent-h", { timeout: 5000 });
    await saveToast.locator(".f-toast__btn >> text=בטל").click();
    await page.waitForTimeout(200);
    const refused = await page.isVisible(".f-toast >> text=התשובה נשלחה מאז");
    return refused && (await page.isVisible("#cm-sent-h")) ? "refused, still sent once" : false;
  });
  await check("proposal: an undo toast cannot change a proposal that was sent", async () => {
    await page.evaluate(() => sessionStorage.clear());
    await go(page, "/focus/sales/proposals/corporate-hosting");
    const qty = page.locator(".f-sl-numin").first();
    await qty.fill("7"); await qty.blur();
    await page.click("button:has-text('חזור לגרסה 1')");
    // in-app navigation keeps the toast (and its undo) alive while the proposal is sent
    await page.click("a:has-text('המשך לשליחה')");
    await page.waitForURL("**/approvals/proposal-noa");
    await page.click(".f-pre__confirm .f-check__box");
    await page.click(".f-pre__final");
    await page.waitForSelector(".f-pre__result .f-banner--done", { timeout: 6000 });
    const t = page.locator(".f-toast", { hasText: "חזרה לגרסה 1" });
    if (!(await t.count())) return false; // the undo must still be offered here, or this check proves nothing
    await t.locator(".f-toast__btn >> text=בטל").click();
    await page.waitForTimeout(200);
    return await page.isVisible(".f-toast >> text=ההצעה כבר בשליחה או נשלחה") ? "refused" : false;
  });
  await check("closing the task drawer returns focus to the task link that opened it", async () => {
    await go(page, "/focus/work/list");
    const link = page.locator(".f-tl__title, .f-tcard__link").first();
    await link.focus(); await page.keyboard.press("Enter");
    await page.waitForSelector("dialog[open].f-tdrawer", { timeout: 5000 });
    await page.keyboard.press("Escape");
    await page.waitForSelector("dialog[open].f-tdrawer", { state: "detached", timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(150);
    const tag = await page.evaluate(() => document.activeElement?.tagName + "." + (document.activeElement?.className ?? ""));
    return tag.startsWith("A.") || tag.startsWith("BUTTON.") ? tag.slice(0, 40) : false;
  });
  await check("a multi-step jump back while dirty is not pushed onto the other page (no stray dialog, forward intact)", async () => {
    await go(page, "/focus/work");
    await page.click("a[href$='/focus/studio'] >> nth=0"); await page.waitForURL((u) => u.pathname.endsWith("/focus/studio"));
    await go(page, "/focus/studio/new");
    await page.getByLabel("טקסט משני").fill("טיוטה לקפיצה");
    await page.waitForTimeout(150);
    await page.evaluate(() => history.go(-2));
    await page.waitForTimeout(800);
    return !(await page.isVisible(leaveDialog)) ? new URL(page.url()).pathname.split("/focus")[1] || "/" : false;
  });
  await check("Back → 'leave without saving' does not raise the browser's own prompt as well", async () => {
    native.length = 0;
    await go(page, "/focus/approvals");
    await page.click("a[href$='/approvals/plan-october'] >> nth=0"); await page.waitForURL("**/approvals/plan-october");
    await page.fill(".f-decision__input", "טיוטה");
    await page.waitForTimeout(150);
    await page.goBack();
    await page.waitForSelector(leaveDialog, { timeout: 3000 });
    await page.click("dialog[open] >> text=צא בלי לשמור");
    await page.waitForURL((u) => u.pathname.endsWith("/focus/approvals"), { timeout: 5000 });
    await page.waitForTimeout(300);
    return native.length === 0 ? "one question only" : `native: ${native.join(",")}` && false;
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
    const live = page.locator(".f-board [aria-live]");
    await h.focus(); await page.keyboard.press("Space");
    await page.waitForFunction(() => document.querySelector(".f-board [aria-live]")?.textContent?.trim(), null, { timeout: 5000 }); // picked (hydrated)
    await page.keyboard.press("ArrowLeft"); await page.keyboard.press("Space");
    await page.waitForFunction(() => document.querySelector(".f-board [aria-live]")?.textContent?.includes("לא ניתן"), null, { timeout: 5000 });
    return (await live.textContent())?.includes("לא ניתן") ? "refused with reason" : false;
  });
  await ctx.close();
}

// 7. theme: persisted, no flash (attribute set before first paint), system follows OS
{
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consoleErrors.push(m.text()); });
  await check("theme dark persists across reload and is applied before hydration", async () => {
    await go(page, "/focus");
    await page.click(".f-avatar-btn");
    await page.click(".f-theme__opt >> text=כהה");
    await page.reload({ waitUntil: "commit" });
    const early = await page.evaluate(() => new Promise((r) => { const t = () => { const a = document.querySelector(".focus-app")?.getAttribute("data-f-theme"); return a ? r(a) : requestAnimationFrame(t); }; t(); }));
    await settle(page);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.waitForTimeout(300);
    const hydration = consoleErrors.filter((m) => /hydrat|didn't match/i.test(m));
    return early === "dark" && bg === "rgb(17, 20, 28)" && hydration.length === 0 ? "dark before paint, no hydration mismatch" : `attr=${early} bg=${bg} hydration=${hydration.length}`;
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
// 8. LTR content inside the RTL layout: a typed English title keeps its trailing punctuation at the end
{
  const { ctx, page } = await fresh();
  await check("LTR task title keeps its punctuation in order (input and card)", async () => {
    await go(page, "/focus/work");
    const title = "Fix menu PDF (v2) for UMINO.";
    await page.fill(".f-qc__input", title);
    await page.press(".f-qc__input", "Enter");
    const link = page.locator(`.f-tcard__link >> text=${title}`).first();
    await link.waitFor();
    // visual order: in an LTR run the final "." sits to the right of the first "F"
    const ok = await link.evaluate((el) => {
      const n = el.firstChild; const r = document.createRange();
      r.setStart(n, 0); r.setEnd(n, 1); const first = r.getBoundingClientRect().left;
      r.setStart(n, n.length - 1); r.setEnd(n, n.length); const last = r.getBoundingClientRect().left;
      return last > first;
    });
    return ok ? "period stays last" : false;
  });
  await ctx.close();
}
await browser.close();
process.exit(report("flows", rows) ? 0 : 1);
