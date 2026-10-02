// Visual regression vs the handoff: every product screen against its reference frame (/focus/reference/<ID>), light
// and dark at 1440, and the mobile frames (M1–M10: the phone screen inside the reference vs the product at 390×794).
// Pixel diff with a ±1px shift tolerance, computed in the browser (no image libraries needed).
// Usage: PLAYWRIGHT_MODULE=… node scripts/focus/qa/visual.mjs [--json out.json] [--out dir] [--ids D1,W1]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASE, ROOT, playwright, settle } from "./lib.mjs";

const { chromium } = playwright();
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const outDir = arg("--out"); if (outDir) mkdirSync(outDir, { recursive: true });
const reg = readFileSync(join(ROOT, "lib/focus/screens.ts"), "utf8");
const screens = [...reg.matchAll(/"id": "(\w+)"[\s\S]*?"route": "([^"]+)"[\s\S]*?"mode": "(\w+)"/g)].map((m) => ({ id: m[1], route: m[2], mode: m[3] }));
// the object literal from lib/focus/screens.ts (trusted repo source)
const mobileTargets = new Function(`return ${reg.match(/MOBILE_TARGETS: Record<string, string\[\]> = (\{[\s\S]*?\});/)[1]}`)();
const only = arg("--ids")?.split(",");
const HIDE = "nextjs-portal,.f-screenmap{display:none!important} .f-focusbar,.f-topbar{position:relative!important} *{caret-color:transparent!important}";
const ROUTE_FIX = { W4: "/focus/work/list?task=t-post45" };

const browser = await chromium.launch();
const diffPage = await (await browser.newContext()).newPage();
async function diff(a, b) {
  return diffPage.evaluate(async ([a, b]) => {
    const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + src; });
    const [A, B] = await Promise.all([load(a), load(b)]);
    const W = Math.max(A.width, B.width), H = Math.max(A.height, B.height);
    const px = (img) => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0); return x.getImageData(0, 0, W, H).data; };
    const da = px(A), db = px(B);
    const d = (p, i, q, j) => Math.max(Math.abs(p[i] - q[j]), Math.abs(p[i + 1] - q[j + 1]), Math.abs(p[i + 2] - q[j + 2]));
    let bad = 0, strict = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d(da, i, db, i) <= 24) continue;
      strict++;
      let best = 999, best2 = 999;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = (yy * W + xx) * 4; best = Math.min(best, d(da, i, db, j)); best2 = Math.min(best2, d(db, i, da, j));
      }
      if (Math.max(best, best2) > 24) bad++;
    }
    return { strict: +(strict / (W * H) * 100).toFixed(2), tolerant: +(bad / (W * H) * 100).toFixed(2), size: [A.width, A.height, B.width, B.height] };
  }, [a.toString("base64"), b.toString("base64")]);
}

const results = [];
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const s of screens.filter((x) => x.mode !== "mobile" && (!only || only.includes(x.id)))) {
    await page.goto(`${BASE}/focus/reference/${s.id}`, { waitUntil: "domcontentloaded" }); await settle(page); await page.addStyleTag({ content: HIDE });
    const ref = await page.screenshot({ fullPage: true });
    await page.evaluate(() => { try { sessionStorage.clear(); localStorage.removeItem("mytiv-focus-timer-v1"); } catch {} });
    await page.goto(BASE + (ROUTE_FIX[s.id] ?? s.route), { waitUntil: "domcontentloaded" }); await settle(page); await page.addStyleTag({ content: HIDE });
    const now = await page.screenshot({ fullPage: true });
    const r = await diff(ref, now);
    if (outDir) { writeFileSync(join(outDir, `${s.id}-${theme}-ref.png`), ref); writeFileSync(join(outDir, `${s.id}-${theme}.png`), now); }
    results.push({ id: s.id, route: ROUTE_FIX[s.id] ?? s.route, theme, view: "desktop", ...r });
    console.log(s.id, theme, "desktop", r.tolerant + "%");
  }
  await ctx.close();
}
// mobile frames
for (const theme of ["light", "dark"]) {
  const refCtx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: theme, reducedMotion: "reduce" });
  const ref = await refCtx.newPage();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 794 }, colorScheme: theme, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const [id, targets] of Object.entries(mobileTargets)) {
    if (only && !only.includes(id)) continue;
    await ref.goto(`${BASE}/focus/reference/${id}`, { waitUntil: "domcontentloaded" }); await settle(ref);
    const boxes = await ref.evaluate(() => [...document.querySelectorAll("div")].filter((d) => { const r = d.getBoundingClientRect(); return Math.round(r.width) === 390 && Math.round(r.height) === 844; }).map((d) => { const r = d.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY }; }));
    for (let k = 0; k < targets.length && k < boxes.length; k++) {
      const a = await ref.screenshot({ clip: { x: boxes[k].x, y: boxes[k].y + 50, width: 390, height: 794 }, fullPage: true });
      await page.goto(BASE + targets[k], { waitUntil: "domcontentloaded" }); await settle(page); await page.addStyleTag({ content: HIDE });
      const b = await page.screenshot();
      const r = await diff(a, b);
      if (outDir) { writeFileSync(join(outDir, `${id}${k ? "b" : ""}-${theme}-ref.png`), a); writeFileSync(join(outDir, `${id}${k ? "b" : ""}-${theme}.png`), b); }
      results.push({ id: `${id}${k ? "b" : ""}`, route: targets[k], theme, view: "mobile", ...r });
      console.log(id, theme, "mobile", r.tolerant + "%");
    }
  }
  await refCtx.close(); await ctx.close();
}
await browser.close();
const j = arg("--json"); if (j) writeFileSync(j, JSON.stringify(results, null, 1));
