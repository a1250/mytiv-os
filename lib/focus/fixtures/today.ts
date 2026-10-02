import type { Metric } from "@/lib/focus/contracts/common";
import { ready, type Loadable } from "@/lib/focus/contracts/loadable";
import type { ProjectSummary } from "@/lib/focus/contracts/projects";
import type { ActionItem, DayAgenda, ResumeItem, StuckItem, TimeColumn } from "@/lib/focus/contracts/today";
import { daysBetween, parts } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { APPROVAL_DUE } from "./approvals";
import { at, DEMO_NOW } from "./clock";
import { CLIENTS, PEOPLE } from "./people";

/** "היום שלי" (handoff D1, M1). Columns are derived from dueAt — never placed by hand. */
export const TODAY_QUEUE: ActionItem[] = [
  {
    id: "q-proposal", approvalId: "proposal-noa", title: "שלח את ההצעה \"אירוח עסקי — 8,750 ₪\"", context: "נועה כהן · אירוע חברה ל־35",
    why: "ביקשה לקבל עד יום ראשון. השיחה איתה היום ב־10:00.", waitingSince: at("2026-09-30", "08:00"), dueAt: APPROVAL_DUE["proposal-noa"], risk: "high",
    action: { label: "בדוק ושלח", href: R.approval("proposal-noa") },
  },
  {
    id: "q-story", approvalId: "content-sushi-story", title: "אשר את סטורי \"ערבי סושי של חמישי\"", context: "UMINO · מתוזמן למחר 18:00",
    waitingSince: at("2026-09-29", "16:00"), dueAt: APPROVAL_DUE["content-sushi-story"], risk: "low",
    action: { label: "בדוק ואשר", href: R.approval("content-sushi-story") },
  },
  {
    id: "q-promo", approvalId: "promo-1plus1", title: "החלט על מבצע 1+1 לקמפיין יום חמישי", context: "UMINO · הצעה של AI · משפיע על מחיר",
    waitingSince: at("2026-09-28", "09:30"), dueAt: APPROVAL_DUE["promo-1plus1"], risk: "medium",
    action: { label: "פתח החלטה", href: R.approval("promo-1plus1") },
  },
  {
    id: "q-instagram", title: "חבר מחדש את Instagram", context: "UMINO · מדדים לא מתעדכנים מ־27.9",
    waitingSince: at("2026-09-27", "03:00"), dueAt: at("2026-10-01", "18:00"), risk: "connection",
    action: { label: "התחבר מחדש", href: R.settings },
  },
  {
    id: "q-holiday", title: "ענה: שעות פתיחה בחג", context: "UMINO · בקשת מידע",
    waitingSince: at("2026-09-30", "12:00"), dueAt: at("2026-10-04", "12:00"), risk: "low",
    action: { label: "פתח", href: R.comms },
  },
  {
    id: "q-plan", approvalId: "plan-october", title: "אשר את תוכנית אוקטובר", context: "גל פילאטיס",
    waitingSince: at("2026-09-26", "10:00"), dueAt: APPROVAL_DUE["plan-october"], risk: "medium",
    action: { label: "פתח תוכנית", href: R.marketingPlan },
  },
];

/** Now = due by 12:00 today; today = later today; week = after today (handoff 6.6 "עמודות זמן"). */
export function columnFor(dueAt: string, now = DEMO_NOW): TimeColumn {
  const d = daysBetween(now, dueAt);
  if (d <= 0) return parts(dueAt).hh < 12 || d < 0 ? "now" : "today";
  return "week";
}

export const STUCK: Loadable<StuckItem[]> = ready([
  { id: "s1", text: "צילום מנת הספיישל ממתין לצלם 12 ימים, ללא אחראי.", action: { label: "הקצה", href: R.task("t-photo-shoot") } },
  { id: "s2", text: "אין נכס מאושר לפוסט 4:5 של הקמפיין." },
  { id: "s3", text: "גל פילאטיס ממתינה לחומרים 6 ימים." },
]);

export const AGENDA: Loadable<DayAgenda> = ready({
  source: { system: "google_calendar", label: "Google" },
  syncedAt: at("2026-10-01", "08:08"),
  slots: ["09:00", "10:00", "13:30", "18:00"],
  events: [
    { id: "e1", start: at("2026-10-01", "10:00"), end: at("2026-10-01", "10:30"), title: "שיחת היכרות — נועה כהן", meta: "Google Meet · 30 דק׳", kind: "meeting", join: { label: "הצטרף", href: R.lead("noa-cohen") } },
    { id: "e2", start: at("2026-10-01", "13:30"), end: at("2026-10-01", "14:15"), title: "פגישת צוות שבועית", meta: "משרד · 45 דק׳", kind: "internal" },
    { id: "e3", start: at("2026-10-01", "18:00"), title: "פרסום מתוזמן: סטורי ערבי סושי", meta: "ממתין לאישור שלך", kind: "scheduled_post", status: "pending_approval" },
  ],
});

export const RESUME: ResumeItem[] = [
  { id: "r1", label: "הצעה: אירוח עסקי", at: at("2026-09-30", "17:40"), href: R.proposal("corporate-hosting") },
  { id: "r2", label: "סטורי ערבי סושי · גרסה 2", at: at("2026-10-01", "05:10"), href: R.designEdit("thursday-sushi") },
];

export const TODAY_PROJECTS: Loadable<ProjectSummary[]> = ready([
  {
    id: "umino-autumn", name: "השקת תפריט סתיו", client: CLIENTS.umino, ownerId: PEOPLE.dana.id, dueDate: "2026-10-08",
    health: { state: "at_risk", reason: "שתי חסימות מעכבות את הפוסט המרכזי.", blockers: 2 }, hours: { spent: 34, budget: 40, certainty: "known" },
    pendingApprovals: 2, next: { text: "לתאם צילום", due: "2026-10-03" }, updated: { at: at("2026-10-01", "07:10"), source: { system: "clickup", label: "ClickUp" } }, href: R.project("umino"),
  },
  {
    id: "gal-site", name: "אתר", client: CLIENTS.gal, ownerId: PEOPLE.yoav.id, dueDate: "2026-10-15",
    health: { state: "attention", reason: "ממתינים לחומרים מהלקוחה 6 ימים." }, hours: { spent: 22, budget: 30, certainty: "known" },
    pendingApprovals: 0, next: { text: "שיחה עם הלקוחה" }, updated: { at: at("2026-09-30", "15:00") }, href: R.projects,
  },
]);

export const TODAY_METRICS: Loadable<Metric[]> = ready([
  { id: "m-leads", label: "לידים חדשים", reading: { kind: "known", value: 2 }, delta: { value: 1, tone: "good" }, source: { system: "sales", label: "מכירות" }, freshness: { state: "fresh", updatedAt: at("2026-10-01", "08:02") }, unit: "count" },
  { id: "m-proposals", label: "הצעות פתוחות", reading: { kind: "known", value: 8750 }, unit: "ils", source: { system: "sales", label: "מכירות" }, note: "1 הצעה · טרם נשלחה" },
  { id: "m-overdue", label: "משימות באיחור", reading: { kind: "known", value: 2 }, unit: "count", tone: "risk", source: { system: "clickup", label: "ClickUp" }, freshness: { state: "fresh", updatedAt: at("2026-10-01", "08:06") } },
  { id: "m-hours", label: "שעות מול תקציב", reading: { kind: "estimated", value: 56, basis: "2 ללא דיווח" }, unit: "ratio", total: 70, source: { system: "clickup", label: "ClickUp" } },
  { id: "m-content", label: "תוכן לאישור", reading: { kind: "known", value: 3 }, unit: "count", source: { system: "studio", label: "סטודיו" } },
  { id: "m-reach", label: "חשיפות Instagram", reading: { kind: "unavailable", since: at("2026-09-27", "03:00"), reason: "תקלה בחיבור" }, unit: "count", source: { system: "instagram", label: "Instagram" } },
]);
