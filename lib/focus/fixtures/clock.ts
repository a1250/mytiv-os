/**
 * Demo clock. Every fixture timestamp is absolute ISO; screens format them relative to DEMO_NOW
 * (lib/focus/format) instead of hard-coding "ממתין יום" or "לפני 4 דק׳" in markup.
 * The handoff's story happens on Thursday 1.10.2026 at 08:10 (Asia/Jerusalem).
 */
export const DEMO_NOW = "2026-10-01T08:10:00+03:00";
/** Build an ISO timestamp on the demo timeline: at("2026-09-29", "16:20"). */
export const at = (date: string, time = "12:00") => `${date}T${time}:00+03:00`;

/**
 * Demo time for things the user does now: DEMO_NOW + the real time elapsed since the session started, so a decision
 * taken in the prototype reads "08:12" on Thursday 1.10, not the machine's clock. Client-side only (event handlers).
 */
const ANCHOR_KEY = "mytiv-focus-anchor";
function anchor(): number {
  try {
    const v = sessionStorage.getItem(ANCHOR_KEY);
    if (v) return Number(v);
    const now = Date.now();
    sessionStorage.setItem(ANCHOR_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}
export const demoIso = (realMs: number = Date.now()) => new Date(Date.parse(DEMO_NOW) + Math.max(0, realMs - anchor())).toISOString();
