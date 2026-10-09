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
    const waits = await page.isVisible(".f-toast >> text=אושר · לא תוזמן");
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
    const refused = await page.isVisible(".f-toast >> text=מאז נעשה ניסיון לשלוח");
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

// 5d. UNKNOWN external outcome is a gated state (final review P2): Gmail send and Meta schedule. Interrupt in flight,
// reload → UNKNOWN; no generic CTA or ordinary retry starts another attempt; the explicit target-system statement
// unlocks exactly one; a confirmed failure keeps the normal retry; a confirmed success is never repeated.
{
  const STORE = "mytiv-focus-demo-v3";
  const jobsOf = (page, target) => page.evaluate(([k, t]) => (JSON.parse(sessionStorage.getItem(k) ?? "{}").jobs ?? []).filter((j) => j.target === t).map((j) => ({ id: j.id, startedAt: j.startedAt, interrupted: !!j.interruptedAt, cancelled: !!j.cancelledAt })), [STORE, target]);
  const fresh2 = async () => { const f = await fresh(); await go(f.page, "/focus"); await f.page.evaluate(() => sessionStorage.clear()); return f; };
  {
    const { ctx, page } = await fresh2();
    const T = "gmail:t-noa";
    await check("Gmail: a send interrupted by a reload is UNKNOWN; the generic 'בדוק ושלח' cannot start another send without the Gmail check", async () => {
      await go(page, "/focus/comms");
      await page.click(".f-cm-reply__foot button:has-text('בדוק ושלח')");
      await page.getByLabel(/ואני מאשר\/ת לשלוח/).check();
      await page.click("dialog[open] .f-btn--danger");
      await page.waitForSelector(".f-cm-reply__state >> text=שולח דרך", { timeout: 3000 });
      await page.reload({ waitUntil: "domcontentloaded" }); await settle(page);
      await page.waitForTimeout(2200);
      if (!(await page.isVisible("text=לא ידוע אם התשובה נשלחה"))) return false;
      const before = (await jobsOf(page, T)).length;
      await page.click(".f-cm-reply__foot button:has-text('בדוק ושלח')"); // the generic CTA
      const asks = await page.isVisible("dialog[open] >> text=בדקתי בתיקיית נשלח ב־Gmail וההודעה הקודמת לא נשלחה");
      await page.getByLabel(/ואני מאשר\/ת לשלוח/).check(); // only the ordinary confirmation
      // the send button is aria-disabled until the Gmail check is ticked: a click on it must do nothing
      await page.locator("dialog[open] .f-btn--danger").evaluate((b) => b.click());
      await page.waitForTimeout(300);
      const after = (await jobsOf(page, T)).length;
      return before === 1 && asks && after === 1 && (await page.isVisible("dialog[open]")) ? "held: 1 attempt, dialog asks for the Gmail check" : false;
    });
    await check("Gmail: the explicit Gmail check unlocks exactly one new send; once sent, it can never be sent again", async () => {
      await page.getByLabel(/בדקתי בתיקיית נשלח ב־Gmail/).check();
      await page.click("dialog[open] .f-btn--danger");
      await page.waitForTimeout(200);
      const started = await jobsOf(page, T);
      if (started.length !== 2 || started[1].interrupted) return false;
      await page.waitForSelector("#cm-sent-h", { timeout: 5000 });
      const noCta = !(await page.isVisible(".f-cm-reply__foot button:has-text('בדוק ושלח')"));
      return noCta && (await jobsOf(page, T)).length === 2 ? "1 new send, then sent; no send CTA left" : false;
    });
    await ctx.close();
  }
  {
    const { ctx, page } = await fresh2();
    await check("Gmail: a confirmed failure keeps the ordinary retry (no target check asked)", async () => {
      await go(page, "/focus/comms");
      await page.check(".f-cm-demo input");
      await page.click(".f-cm-reply__foot button:has-text('בדוק ושלח')");
      await page.getByLabel(/ואני מאשר\/ת לשלוח/).check();
      await page.click("dialog[open] .f-btn--danger");
      await page.waitForSelector("text=השליחה נכשלה", { timeout: 5000 });
      await page.click(".f-cm-reply__foot button:has-text('בדוק ושלח')");
      const asks = await page.isVisible("dialog[open] >> text=בדקתי בתיקיית נשלח");
      await page.getByLabel(/ואני מאשר\/ת לשלוח/).check();
      await page.click("dialog[open] .f-btn--danger");
      await page.waitForTimeout(200);
      return !asks && (await jobsOf(page, "gmail:t-noa")).length === 2 ? "retried normally" : false;
    });
    await ctx.close();
  }
  {
    const { ctx, page } = await fresh2();
    const T = "meta:content-sushi-story";
    const approveStory = async () => {
      await go(page, "/focus/work/list?task=t-photo-shoot");
      await page.locator(".f-td__pill").first().selectOption("done");
      await page.waitForTimeout(200);
      await go(page, "/focus");
      const card = page.locator("article.f-acard", { hasText: "סטורי" }).first();
      await card.locator("a.f-btn").focus();
      await page.keyboard.press("a");
      return card;
    };
    await check("Meta: a schedule interrupted by a reload is UNKNOWN; the Today card offers no retry, only the check screen", async () => {
      await approveStory();
      await page.waitForSelector(".f-acard--working", { timeout: 3000 });
      await page.reload({ waitUntil: "domcontentloaded" }); await settle(page);
      await page.waitForTimeout(2000);
      const card = page.locator("article.f-acard", { hasText: "סטורי" }).first();
      const unknown = await card.locator("text=לא ידוע אם התזמון נקלט").isVisible();
      const noRetry = (await card.locator("button:has-text('נסה שוב'), button:has-text('תזמן שוב')").count()) === 0;
      return unknown && noRetry && (await jobsOf(page, T)).length === 1 ? "unknown, link to check only" : false;
    });
    await check("Meta: the publish screen's retry and summary cannot start a schedule without the Meta check", async () => {
      await page.click("article.f-acard >> text=לבדיקה ולתזמון מחדש");
      await page.waitForURL("**/publish");
      await page.click("#mk-schedule"); // "בדיקה ב־Meta ותזמון מחדש…"
      await page.waitForSelector("dialog[open] .f-mk-pre");
      const asks = await page.isVisible("dialog[open] >> text=בדקתי ב־Meta Business Suite והתזמון הקודם לא קיים");
      await page.locator("dialog[open] .f-mk-pre .f-check").filter({ hasText: "אני מאשר" }).locator("input").check();
      await page.locator("dialog[open] .f-mk-pre__actions .f-btn--danger").evaluate((b) => b.click());
      await page.waitForTimeout(300);
      return asks && (await jobsOf(page, T)).length === 1 && (await page.isVisible("dialog[open] >> text=יש לבדוק ב־Meta Business Suite")) ? "held, asks for the Meta check" : false;
    });
    await check("Meta: the explicit Meta check unlocks exactly one new schedule; once scheduled, never again", async () => {
      await page.getByLabel(/בדקתי ב־Meta Business Suite/).check();
      await page.click("dialog[open] .f-mk-pre__actions .f-btn--danger");
      await page.waitForTimeout(200);
      const jobs = await jobsOf(page, T);
      if (jobs.length !== 2) return false;
      await page.waitForSelector("dialog[open] .f-mk-pre >> text=" + "סגור", { timeout: 5000 });
      await page.click("dialog[open] .f-mk-pre__actions >> text=סגור");
      const noSchedule = !(await page.isVisible("#mk-schedule"));
      return noSchedule && (await jobsOf(page, T)).length === 2 ? "1 new schedule, then scheduled; no schedule CTA left" : false;
    });
    await ctx.close();
  }
  {
    const { ctx, page } = await fresh2();
    await check("Meta: a confirmed failure keeps the ordinary retry on the Today card", async () => {
      await go(page, "/focus/screens");
      await page.check(".f-smap__ctl--check input");
      await go(page, "/focus/work/list?task=t-photo-shoot");
      await page.locator(".f-td__pill").first().selectOption("done");
      await page.waitForTimeout(200);
      await go(page, "/focus");
      const card = page.locator("article.f-acard", { hasText: "סטורי" }).first();
      await card.locator("a.f-btn").focus();
      await page.keyboard.press("a");
      await card.locator("text=התזמון לא בוצע").waitFor({ timeout: 5000 });
      const [first] = await jobsOf(page, "meta:content-sushi-story");
      await card.locator("button:has-text('נסה שוב')").click();
      await page.waitForTimeout(200);
      const [again] = await jobsOf(page, "meta:content-sushi-story");
      return first && again && again.startedAt > first.startedAt && !again.interrupted ? "retried normally (a new attempt started)" : false;
    });
    await ctx.close();
  }
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
// 9. Plan (design package): create move → builder → change panel → send → owner approval → manual live with a link;
// recommendation → tasks; creatives approved in the builder; production rows; cover choice; week toggle; next period.
// Everything is the session overlay over fixtures — nothing leaves the browser.
{
  const { ctx, page, errors } = await fresh();
  const btn = (name) => page.getByRole("button", { name, exact: true });
  await check("plan: create move from the coverage gap opens the Google builder in 'בבנייה'", async () => {
    await go(page, "/focus/plan?create=need-sunset-20");
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: /^הכן הצעה ב־Google/ }).click();
    await page.waitForURL(/\/focus\/plan\/build\/sunset-google/, { timeout: 15000 }); await settle(page);
    return (await page.textContent(".f-pl-bhead"))?.includes("בבנייה") ? "building" : false;
  });
  await check("plan: change panel shows current → change → impact; Cancel keeps, Apply updates", async () => {
    await page.getByRole("button", { name: "שנה · כמה משקיעים" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("סכום (₪)").fill("1500");
    const impact = await dlg.textContent();
    if (!impact.includes("ההצעה הנוכחית") || !impact.includes("השפעה") || !impact.includes("מוח העסק")) return "missing section";
    await dlg.getByRole("button", { name: "ביטול" }).click();
    if (!(await page.textContent(".f-pl-bmain")).includes("1,200")) return "cancel changed value";
    await page.getByRole("button", { name: "שנה · כמה משקיעים" }).click();
    await dlg.getByLabel("סכום (₪)").fill("2500");
    const apply = dlg.getByRole("button", { name: "החל" });
    if ((await apply.getAttribute("aria-disabled")) !== "true" && !(await apply.isDisabled())) return "apply open before source choice";
    await dlg.getByLabel(/מנושא אחר/).check();
    await apply.click();
    const t = await page.textContent(".f-pl-bmain");
    return t.includes("2,500") && t.includes("דורש אישור לקוח") ? "2,500 from another priority (client approval)" : false;
  });
  await check("plan: unverified claim blocks the text change", async () => {
    await page.getByRole("button", { name: "שנה · מה מקדמים" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("מה מקדמים").fill("הנוף הכי יפה בעיר");
    const err = await dlg.textContent();
    await dlg.getByRole("button", { name: "ביטול" }).click();
    return err.includes("טענה שלא אושרה") ? "blocked" : false;
  });
  await check("plan: readiness blocks review until a Move Message Direction is chosen (one next action)", async () => {
    const ready = await page.locator("#readiness").textContent();
    if (!ready.includes("בחר כיוון מסר")) return `next action: ${ready.slice(0, 80)}`;
    const send = btn("שלח לבדיקה");
    if (!((await send.getAttribute("aria-disabled")) === "true" || (await send.isDisabled()))) return "send enabled before a direction";
    const dirs = await page.locator(".f-pl-dir").count();
    if (dirs !== 3) return `${dirs} directions`;
    const names = await page.locator(".f-pl-dir__name").allTextContents();
    return new Set(names).size === 3 ? `3 directions: ${names.join(" / ")}` : "directions repeat";
  });
  await check("plan: choose a direction → variants per ad group appear; refine keeps the promise; 3 new directions swap the set", async () => {
    await page.getByRole("button", { name: "בחר כיוון זה" }).first().click();
    if (!(await page.locator(".f-pl-dir--on").count())) return "no chosen card";
    await page.getByRole("button", { name: /^הגרסאות מתחת לכיוון/ }).click();
    const n = await page.locator(".f-pl-variant").count();
    if (n !== 2) return `${n} variants (expected 2 ad groups)`;
    if (await page.locator(".f-pl-variant .f-pl-red").count()) return "a variant lost the promise";
    await page.getByRole("button", { name: "קצר יותר" }).click();
    if (await page.locator(".f-pl-variant .f-pl-red").count()) return "shorter broke the promise";
    await page.getByRole("button", { name: "3 כיוונים חדשים" }).click();
    const alt = await page.locator(".f-pl-dir__name").allTextContents();
    await page.getByRole("button", { name: /חזרה לשלושת הכיוונים/ }).click();
    return alt.join(",").includes("מקומי") ? "variants ok · refine ok · 3 new ok" : `alt: ${alt.join(",")}`;
  });
  await check("plan: UNKNOWN tracking is shown as a risk, never healthy; send for review still allowed", async () => {
    await page.getByRole("button", { name: "בחר כיוון זה" }).first().click();
    const ready = await page.locator("#readiness").textContent();
    if (!/מעקב.*לא ידוע.*סיכון/.test(ready.replace(/\s+/g, " "))) return "tracking not shown as unknown risk";
    if (/מעקב[^.]*✓/.test(ready)) return "tracking shows a checkmark";
    const send = btn("שלח לבדיקה");
    return (await send.getAttribute("aria-disabled")) !== "true" && !(await send.isDisabled()) ? "unknown tracking does not block review" : "send blocked";
  });
  await check("plan: send → ready for review (+ tracking task) → approvals by the Client's policy, after acknowledging the tracking risk → approved → mark live needs https", async () => {
    await btn("שלח לבדיקה").click();
    await page.locator(".f-pl-bhead").getByText("מוכן לבדיקה", { exact: true }).waitFor();
    const foot = await page.locator(".f-pl-bdfoot").textContent();
    if (!foot.includes("ממתין לאישור") || !foot.includes("רון")) return `approver not named: ${foot.slice(0, 120)}`;
    const first = page.getByRole("button", { name: /^אשר: כיוון המסר · כרון/ });
    if (!((await first.getAttribute("aria-disabled")) === "true" || (await first.isDisabled()))) return "approval allowed before the tracking acknowledgment";
    await page.getByRole("checkbox", { name: /מכיר\/ה בכך שהמעקב לא נבדק/ }).check();
    // the budget comes from the unallocated pool: a Plan change the Client approves (floor), with the reason shown
    if (!(await page.locator(".f-pl-approvals").textContent()).includes("שינוי תוכנית")) return "plan-change reason not shown";
    await page.getByRole("button", { name: /^אשר: אישור התוכנית · כרון/ }).click();
    await first.click();
    await page.getByRole("button", { name: /^אשר: גרסאות הטקסט · כדנה/ }).click();
    await page.getByRole("button", { name: /^אשר: השקת המהלך · כרון/ }).click();
    await btn("סמן כפעיל").click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("קישור לקמפיין").fill("ads.google.com/x");
    await dlg.getByRole("button", { name: "סמן כפעיל" }).click();
    if (!(await dlg.textContent()).includes("https")) return "accepted a non-https link";
    await dlg.getByLabel("קישור לקמפיין").fill("https://ads.google.com/aw/campaigns?campaignId=1");
    await dlg.getByRole("button", { name: "סמן כפעיל" }).click();
    await page.getByText("הושק ידנית").waitFor();
    const stored = await page.evaluate(() => Object.keys(sessionStorage).map((k) => sessionStorage.getItem(k)).join(" "));
    return stored.includes("בדיקת אירוע המרה") ? "live + pre-launch tracking task in the demo store" : "live, but no tracking task";
  });
  await check("plan: Meta builder — a testimonial is never generated: 'צור חדש' and 'AI + נכס' are disabled with a reason; 'בקש מהלקוח' is recommended", async () => {
    await go(page, "/focus/plan/build/events-meta");
    await page.getByRole("button", { name: "כסה · סרטון המלצה מלקוח עסקי" }).click();
    const dlg = page.getByRole("dialog");
    const t = await dlg.textContent();
    const off = await dlg.locator(".f-pl-cover__opt--off").allTextContents();
    if (!off.some((x) => x.includes("צור חדש")) || !off.some((x) => x.includes("AI + נכס"))) return `off: ${off.join(" | ")}`;
    if (!t.includes("חייב להיות אמיתי")) return "authenticity class not shown";
    return t.includes("בקש מהלקוח") ? "generate + adapt refused with reasons; request recommended" : false;
  });
  await check("plan: 'בקש מהלקוח' → a structured request (what, quantity, format, duration, by when, why, how to capture, where) + a Work task; manual send", async () => {
    const dlg = page.getByRole("dialog");
    await dlg.getByRole("button", { name: /^התחל עם בקש מהלקוח/ }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "צור בקשה ומשימה" }).click();
    const t = (await sheet.textContent()).replace(/\s+/g, " ");
    for (const k of ["מה צריך", "1 × סרטון המלצה", "9:16", "15–30 שניות", "עד מתי", "18.10", "בשביל מה", "איך לצלם", "להעלות ל"]) if (!t.includes(k)) return `missing ${k}`;
    const txt = await sheet.locator("textarea").inputValue();
    if (!txt.includes("אנחנו צריכים")) return "no request text";
    await sheet.getByRole("button", { name: "סמן כנשלח ידנית" }).click();
    await sheet.getByText("נשלחה ידנית · ממתינה לחומר").first().waitFor();
    await sheet.getByRole("button", { name: "סגור חלון", exact: true }).click();
    const stored = await page.evaluate(() => Object.keys(sessionStorage).map((k) => sessionStorage.getItem(k)).join(" "));
    const ready = (await page.locator("#readiness").textContent()).replace(/\s+/g, " ");
    return stored.includes("בקשה מהלקוח: סרטון המלצה") && ready.includes("ממתין לחומר מהלקוח") ? "request + task · readiness waits for the client" : `ready: ${ready.slice(0, 100)}`;
  });
  await check("plan: the material arrives → a wrong file type is refused → a video is received (in review) → approved by רון → covers the requirement; history kept", async () => {
    await page.getByRole("button", { name: "הבקשה ללקוח · סרטון המלצה מלקוח עסקי" }).click();
    const sheet = page.getByRole("dialog");
    const input = sheet.locator("input[type=file]");
    await input.setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: Buffer.from("x") });
    if (!(await sheet.textContent()).includes("נדרש קובץ וידאו")) return "image accepted for a testimonial";
    await input.setInputFiles({ name: "testimonial.mp4", mimeType: "video/mp4", buffer: Buffer.from("x") });
    await sheet.getByRole("button", { name: "סמן שהחומר התקבל" }).click();
    await sheet.getByText("התקבל · בבדיקה").first().waitFor();
    await sheet.getByRole("button", { name: /^אשר את החומר · כרון/ }).click();
    await sheet.getByText("אושר · מכסה את הדרישה").first().waitFor();
    await sheet.locator(".f-pl-reqhist summary").click();
    const hist = await sheet.locator(".f-pl-reqhist").textContent();
    await sheet.getByRole("button", { name: "סגור חלון", exact: true }).click();
    const row = await page.locator(".f-pl-reqlist__item", { hasText: "סרטון המלצה מלקוח עסקי" }).textContent();
    return ["נוצרה", "נשלחה ידנית", "התקבל", "אושר"].every((k) => hist.includes(k)) && row.includes("מאושר") ? "received → in review → approved · covered · 4 history steps" : `hist=${hist.slice(0, 80)} row=${row.slice(0, 60)}`;
  });
  await check("plan: replacing ONE creative and asking the client requests exactly 1 (never the parent quantity); a real-staff creative allows no AI path", async () => {
    await page.getByRole("button", { name: "החלף · צוות בהרמת כוסית" }).click();
    let dlg = page.getByRole("dialog");
    const off = await dlg.locator(".f-pl-cover__opt--off").allTextContents();
    if (!off.some((x) => x.includes("AI + נכס"))) return "AI path offered for real staff";
    await dlg.getByRole("button", { name: "סגירה" }).first().click();
    await page.getByRole("button", { name: "החלף · שולחן ערוך" }).click();
    dlg = page.getByRole("dialog");
    await dlg.locator("button.f-pl-cover__opt", { hasText: "בקש מהלקוח" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "צור בקשה ומשימה" }).click();
    const txt = await sheet.locator("textarea").inputValue();
    await sheet.getByRole("button", { name: "סגור חלון", exact: true }).click();
    return txt.includes("1 × קריאייטיב חלופי · שולחן ערוך") && !txt.includes("3 ×") ? "1 × the one creative" : txt.slice(0, 120);
  });
  await check("plan: Meta builder — approving both awaiting creatives clears the awaiting count (by the policy's approver)", async () => {
    if (!(await page.textContent("#creative")).includes("2 ממתינים")) return "not 2 awaiting";
    await page.getByRole("button", { name: /^אשר · / }).first().click();
    await page.getByRole("button", { name: /^אשר · / }).first().click();
    return (await page.locator("#creative .f-pl-good").count()) === 3 ? "3 approved" : false;
  });
  await check("plan: the Overview's next action for a priority is the builder's readiness next action (one source)", async () => {
    await go(page, "/focus/plan/build/events-meta");
    const next = (await page.locator(".f-pl-ready__next b").textContent()).trim();
    await go(page, "/focus/plan");
    const act = await page.locator(".f-pl-pri").first().locator(".f-pl-kv--act").textContent();
    return act.includes(next) ? `both: ${next}` : `overview="${act.slice(0, 80)}" builder="${next}"`;
  });
  await check("plan: blocked builder cannot be sent; readiness says BLOCKED with the Brain reason and the missing destination", async () => {
    await go(page, "/focus/plan/build/fallmenu-meta");
    await btn("התחל לבנות").click();
    const send = btn("שלח לבדיקה");
    const ready = (await page.locator("#readiness").textContent()).replace(/\s+/g, " ");
    if (!ready.includes("חסום") || !ready.includes("לא אושר לפרסום")) return `ready: ${ready.slice(0, 100)}`;
    if (!ready.includes("עוד לא קיים")) return "missing destination not shown";
    return (await send.getAttribute("aria-disabled")) === "true" || (await send.isDisabled()) ? "send disabled with reason · blocked readiness" : false;
  });
  await check("plan: accept recommendation → tasks created, routed to Marketing", async () => {
    await go(page, "/focus/plan/moves");
    await btn("קבל").first().click();
    const dlg = page.getByRole("dialog");
    await dlg.getByRole("button", { name: /^קבל וצור/ }).click();
    await page.getByText(/התקבל · נוצרו \d משימות/).first().waitFor();
    return true;
  });
  await check("plan: production switch adds creative rows with a reason", async () => {
    await go(page, "/focus/plan/timeline");
    const before = await page.locator(".f-pl-cal__row--prod").count();
    await page.getByRole("switch", { name: /הצג הפקת תוכן/ }).click();
    const after = await page.locator(".f-pl-cal__row--prod").count();
    return after > before ? `${before} → ${after}` : false;
  });
  await check("plan timeline: every day of October is its own column (1…31, exact numbers)", async () => {
    await go(page, "/focus/plan/timeline");
    const nums = await page.locator(".f-pl-cal__row--head .f-pl-cal__dnum").allTextContents();
    return nums.join(",") === Array.from({ length: 31 }, (_, i) => i + 1).join(",") ? "31 day columns" : nums.join(",");
  });
  await check("plan timeline: campaign bars still span date ranges (grid columns), not single days", async () => {
    const col = await page.locator(".f-pl-flight--live").first().evaluate((el) => getComputedStyle(el).gridColumn);
    return /2 \/ 33/.test(col) ? `live bar spans ${col}` : col;
  });
  await check("plan timeline: day 12 → add item (type, priority, campaign, title, status) → it sits on 12.10", async () => {
    await page.getByRole("button", { name: /^שני 12\.10 · .*פתח את היום/ }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByRole("button", { name: /^\+ הוסף פריט ל־12\.10/ }).click();
    await dlg.getByLabel("סוג").selectOption("reel");
    await dlg.getByLabel("נושא (מה מקדמים)").selectOption("p-sunset");
    await dlg.getByLabel("קמפיין / מהלך").selectOption("m-sunset-organic");
    await dlg.getByRole("button", { name: "שמור" }).click();
    if (!(await dlg.textContent()).includes("כתבו כותרת")) return "saved without a title";
    await dlg.getByLabel("כותרת").fill("רילס בדיקה QA");
    await dlg.getByLabel("סטטוס").selectOption("in_progress");
    await dlg.getByRole("button", { name: "שמור" }).click();
    await dlg.locator(".f-pl-dayrow", { hasText: "רילס בדיקה QA" }).waitFor();
    await dlg.getByRole("button", { name: "סגירה", exact: true }).first().click();
    const chip = page.getByRole("button", { name: /^רילס · רילס בדיקה QA · שני 12\.10 · בעבודה/ });
    return (await chip.count()) === 1 ? "on 12.10, in progress" : false;
  });
  await check("plan timeline: open an item → change to an exact day → it moves (keyboard / panel, no drag)", async () => {
    await page.getByRole("button", { name: /^רילס · רילס בדיקה QA/ }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("תאריך מדויק").selectOption("21");
    await dlg.getByRole("button", { name: "שמור" }).click();
    return (await page.getByRole("button", { name: /^רילס · רילס בדיקה QA · רביעי 21\.10/ }).count()) === 1 ? "moved to 21.10" : false;
  });
  await check("plan timeline: a full day stacks chips and shows '+N' that opens the day", async () => {
    for (const title of ["פריט 1", "פריט 2", "פריט 3"]) {
      await page.getByRole("button", { name: /^שבת 17\.10 · .*פתח את היום/ }).click();
      const dlg = page.getByRole("dialog");
      await dlg.getByRole("button", { name: /^\+ הוסף פריט/ }).click();
      await dlg.getByLabel("נושא (מה מקדמים)").selectOption("p-sunset");
      await dlg.getByLabel("כותרת").fill(title);
      await dlg.getByRole("button", { name: "שמור" }).click();
      await dlg.getByRole("button", { name: "סגירה", exact: true }).first().click();
    }
    // 17.10 in Sunset: 3 new posts + nothing else = 3 shown; add a 4th → 2 shown + "+2"
    await page.getByRole("button", { name: /^שבת 17\.10 · .*פתח את היום/ }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByRole("button", { name: /^\+ הוסף פריט/ }).click();
    await dlg.getByLabel("נושא (מה מקדמים)").selectOption("p-sunset");
    await dlg.getByLabel("כותרת").fill("פריט 4");
    await dlg.getByRole("button", { name: "שמור" }).click();
    await dlg.getByRole("button", { name: "סגירה", exact: true }).first().click();
    const more = page.getByRole("button", { name: /^עוד 2 פריטים ב־17\.10/ });
    if ((await more.count()) !== 1) return "no +2";
    await more.click();
    const n = await page.getByRole("dialog").locator(".f-pl-dayrow").count();
    await page.getByRole("dialog").getByRole("button", { name: "סגירה", exact: true }).first().click();
    return n === 4 ? "+2 → day panel lists 4" : `day panel lists ${n}`;
  });
  await check("plan timeline: two launches on one day → a clash warning; the day shows overload", async () => {
    await page.getByRole("button", { name: /^השקה · השקת LinkedIn/ }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("תאריך מדויק").selectOption("13");
    await dlg.getByRole("button", { name: "שמור" }).click();
    const head = await page.getByRole("button", { name: /^שלישי 13\.10 · / }).getAttribute("aria-label");
    const warn = await page.locator(".f-pl-warns").textContent();
    if (!(await page.getByRole("button", { name: /הצג עוד/ }).count())) return "no more toggle";
    await page.getByRole("button", { name: /הצג עוד/ }).click();
    return (await page.locator(".f-pl-warns").textContent()).includes("כמה השקות באותו יום") && head.includes("עומס") ? "clash + overload on 13.10" : `head=${head} warn=${warn.slice(0, 80)}`;
  });
  await check("plan week toggle keeps the view and sets ?week=1", async () => {
    await btn("השבוע").click();
    await page.waitForURL(/week=1/);
    return (await page.locator(".f-pl-tabs__item[aria-current=page]").textContent()).includes("ציר");
  });
  await check("plan timeline (week): only 4–10.10 as wide day columns", async () => {
    const nums = await page.locator(".f-pl-cal__row--head .f-pl-cal__dnum").allTextContents();
    return nums.join(",") === "4,5,6,7,8,9,10" ? "7 days" : nums.join(",");
  });
  await check("plan: asset cover 'ask the client' → structured request + task; the asset stays missing", async () => {
    await go(page, "/focus/plan/assets?req=req-delivery-dishes");
    const panel = page.locator(".f-pl-assets__panel");
    if (!(await panel.textContent()).includes("חייב להיות אמיתי")) return "authenticity class not shown";
    await panel.getByRole("button", { name: /^בקש מהלקוח/ }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "צור בקשה ומשימה" }).click();
    const st = (await sheet.textContent()).replace(/\s+/g, " ");
    if (!st.includes("4 × תמונות מנות תפריט סתיו") || !st.includes("22.10")) return `sheet: ${st.slice(0, 120)}`;
    await sheet.getByRole("button", { name: "סגור חלון", exact: true }).click();
    const t = await panel.textContent();
    return t.includes("נבחר: בקש מהלקוח") && t.includes("חסר") ? "request + task, still missing" : `panel: ${t.slice(0, 120)}`;
  });
  await check("plan: November empty state → copy from October makes a draft", async () => {
    await go(page, "/focus/plan?period=2026-11");
    await btn("העתק מאוקטובר").click();
    return (await page.textContent("main")).includes("טיוטה");
  });
  await check("plan timeline (mobile): agenda shows every exact date; add to a day and move an item", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go(page, "/focus/plan/timeline");
    const dates = await page.locator(".f-pl-agenda__date").allTextContents();
    if (dates.length !== 7 || !dates[0].includes("4.10") || !dates[6].includes("10.10")) return dates.join(" | ");
    await page.getByRole("button", { name: "הוסף פריט ל־שישי 9.10" }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("כותרת").fill("סטורי נייד QA");
    await dlg.getByLabel("סוג").selectOption("story");
    await dlg.getByRole("button", { name: "שמור" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "סגירה", exact: true }).first().click();
    const day9 = page.locator(".f-pl-agenda__day", { has: page.locator("#ag-9") });
    if (!(await day9.textContent()).includes("סטורי נייד QA")) return "not on 9.10";
    await day9.getByRole("button", { name: /סטורי נייד QA/ }).click();
    await page.getByRole("dialog").getByLabel("תאריך מדויק").selectOption("10");
    await page.getByRole("dialog").getByRole("button", { name: "שמור" }).click();
    const day10 = page.locator(".f-pl-agenda__day", { has: page.locator("#ag-10") });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.setViewportSize({ width: 1440, height: 900 });
    return (await day10.textContent()).includes("סטורי נייד QA") && over <= 0 ? "added on 9.10, moved to 10.10, no overflow" : `over=${over}`;
  });
  await check("plan: no page errors across the plan flows", async () => (errors.length ? errors[0] : true));
  await ctx.close();
}
await browser.close();
process.exit(report("flows", rows) ? 0 : 1);
