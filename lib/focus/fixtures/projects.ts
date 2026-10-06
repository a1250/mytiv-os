import { ready } from "@/lib/focus/contracts/loadable";
import type { ProjectDetail } from "@/lib/focus/contracts/projects";
import { R } from "@/lib/focus/routes";
import { at } from "./clock";
import { CLIENTS, PEOPLE } from "./people";

/** Project environment demo (handoff D2, D3, M5): UMINO · השקת תפריט סתיו. */
export const PROJECT_UMINO: ProjectDetail = {
  id: "umino",
  name: "השקת תפריט סתיו",
  client: CLIENTS.umino,
  logo: "UMINO",
  ownerId: PEOPLE.dana.id,
  dueDate: "2026-10-08",
  health: { state: "at_risk", reason: "שתי חסימות מעכבות את הפוסט המרכזי.", blockers: 2 },
  hours: { spent: 34, budget: 40, certainty: "known" },
  pendingApprovals: 2,
  next: { text: "לתאם צילום", due: "2026-10-03" },
  updated: { at: at("2026-10-01", "07:10"), source: { system: "clickup", label: "ClickUp" } },
  href: R.project("umino"),
  statusLine: "",
  areaCounts: { execution: 2, marketing: 2 },
  milestones: ready([
    { id: "m1", title: "בריף", date: "2026-09-15", state: "done" },
    { id: "m2", title: "תוכנית שיווק", date: "2026-09-22", state: "done" },
    { id: "m3", title: "צילום", date: "2026-10-03", state: "blocked" },
    { id: "m4", title: "תוכן לאישור", date: "2026-10-06", state: "upcoming" },
    { id: "m5", title: "השקה", date: "2026-10-08", state: "upcoming" },
  ]),
  nextAction: {
    label: "הפעולה הבאה",
    title: "לתאם צילום של מנת הספיישל עד 3.10",
    detail: "חוסם את הפוסט 4:5 ואת הקרוסלה. אין אחראי כבר 12 ימים.",
    action: { label: "הקצה לי ותאם", href: R.task("t-photo-shoot") },
  },
  blockers: ready([
    { id: "b1", title: "צילום מנת הספיישל", meta: "ממתין לצלם · ללא אחראי · 12 ימים", risk: "high" },
    { id: "b2", title: "פוסט 4:5", meta: "תלוי בצילום · יואב", risk: "high" },
  ]),
  decisions: ready([
    { id: "promo-1plus1", title: "מבצע 1+1 בימי חמישי", meta: "ממתין לרון", risk: "medium", href: R.approval("promo-1plus1") },
    { id: "content-sushi-story", title: "סטורי ערבי סושי", meta: "מחר 18:00", risk: "low", href: R.approval("content-sushi-story") },
  ]),
  results: ready([
    { id: "r-bookings", label: "הזמנות בימי חמישי", reading: { kind: "estimated", value: 96, basis: "חסר יום אחד" }, unit: "count", source: { system: "bookings", label: "מערכת ההזמנות", href: R.reports }, freshness: { state: "fresh", updatedAt: at("2026-09-30", "12:00") } },
    { id: "r-reach", label: "חשיפות Instagram", reading: { kind: "unavailable", since: at("2026-09-27", "03:00"), reason: "תקלה בחיבור" }, unit: "count", source: { system: "instagram", label: "Instagram", href: R.settings } },
  ]),
};

/** Media budget is not received yet — unknown, never 0. */
export const MEDIA_BUDGET = { kind: "unknown" as const, reason: "טרם התקבל" };

/** Hours come from the work source's last sync (ClickUp, 4 minutes before the demo clock). */
export const HOURS_SYNC = { source: "ClickUp", at: at("2026-10-01", "08:06") };
