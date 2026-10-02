/**
 * Demo clock. Every fixture timestamp is absolute ISO; screens format them relative to DEMO_NOW
 * (lib/focus/format) instead of hard-coding "ממתין יום" or "לפני 4 דק׳" in markup.
 * The handoff's story happens on Thursday 1.10.2026 at 08:10 (Asia/Jerusalem).
 */
export const DEMO_NOW = "2026-10-01T08:10:00+03:00";
/** Build an ISO timestamp on the demo timeline: at("2026-09-29", "16:20"). */
export const at = (date: string, time = "12:00") => `${date}T${time}:00+03:00`;
