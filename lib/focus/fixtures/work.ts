import type { ActiveTimer, CapabilityState, Task, TaskSource, TimeEntry, TimeReportData, WorkCapabilities } from "@/lib/focus/contracts/work";
import { at, DEMO_NOW } from "./clock";
import { PEOPLE } from "./people";

/**
 * Mytiv Work demo tasks (handoff Desktop 6 W1–W6, M9–M10, D1 "העבודה שלי להיום", D3, F5/M6). ONE task set feeds every
 * view — My Tasks buckets, project list, Kanban, drawer, all-tasks — so a change in one view shows everywhere.
 */
const P_AUTUMN = { projectId: "umino-autumn" };
const C_AUTUMN = { client: "UMINO", project: "השקת תפריט סתיו" };
const C_GAL = { client: "גל פילאטיס", project: "אתר" };
const C_SALES = { client: "מכירות" };

type Seed = Partial<Task> & Pick<Task, "id" | "title" | "status" | "priority">;
const task = (s: Seed): Task => ({
  notes: "", assigneeId: PEOPLE.ron.id, participantIds: [], startDate: null, dueDate: null, estimateMinutes: null, spentMinutes: 0,
  subtasks: [], checklist: [], dependsOn: [], links: {}, context: {}, comments: [], evidence: [], activity: [], source: "mytiv",
  state: "live", version: 1, updatedAt: at("2026-09-30", "17:00"), parentId: null, ...s,
});

export const TASKS: Task[] = [
  task({
    id: "t-photo-coord", title: "לתאם צילום מנת הספיישל", status: "in_progress", priority: "medium", dueDate: "2026-10-01",
    links: P_AUTUMN, context: C_AUTUMN, nextAction: "להתקשר לצלם", estimateMinutes: 120, spentMinutes: 42,
  }),
  task({
    id: "t-content", title: "הפקת תוכן לקמפיין יום חמישי", status: "in_progress", priority: "medium", assigneeId: PEOPLE.dana.id,
    dueDate: "2026-10-08", estimateMinutes: 840, spentMinutes: 360, links: P_AUTUMN, context: C_AUTUMN,
  }),
  task({ id: "t-brief-done", title: "כתיבת בריף", status: "done", priority: "medium", assigneeId: PEOPLE.dana.id, dueDate: "2026-09-29", estimateMinutes: 120, spentMinutes: 120, links: P_AUTUMN, context: C_AUTUMN, parentId: "t-content" }),
  task({
    // blocked by its open dependency on t-photo-shoot (derived) — canonical status stays "todo", no manual reason
    id: "t-post45", title: "לעצב פוסט 4:5 לקמפיין", status: "todo", priority: "medium", assigneeId: PEOPLE.yoav.id,
    participantIds: [PEOPLE.dana.id, PEOPLE.ron.id], startDate: "2026-10-03", dueDate: "2026-10-06", estimateMinutes: 240, spentMinutes: 0,
    links: { ...P_AUTUMN, campaignId: "thursday-sushi" }, context: { ...C_AUTUMN }, parentId: "t-content",
    notes: "גרסה אנכית לפיד לפי מדריך המותג של UMINO. להשתמש בצילום מנת הספיישל ברגע שיאושר. טקסט ראשי + הנעה לפעולה \"הזמינו שולחן\".",
    dependsOn: [{ id: "t-photo-shoot", title: "צילום מנת הספיישל", status: "blocked" }],
    subtasks: [{ id: "p1", title: "גרסת טקסט ראשית", done: false }, { id: "p2", title: "התאמת צבעי מותג", done: false }],
    checklist: [
      { id: "k1", label: "טקסט בתוך אזור בטוח", checked: true }, { id: "k2", label: "ניגודיות תקינה", checked: true },
      { id: "k3", label: "הנעה לפעולה קיימת", checked: false }, { id: "k4", label: "מחיר לא מופיע ללא אישור", checked: false },
    ],
    comments: [{ id: "cm1", authorId: PEOPLE.dana.id, at: at("2026-09-30", "16:20"), text: "@יואב נתחיל ברגע שהצילום מאושר. שים דגש על הקריאוּת בפיד." }],
    activity: [
      { id: "a1", at: at("2026-09-30", "16:20"), actorId: PEOPLE.dana.id, text: "דנה אזכרה את @יואב" },
      { id: "a2", at: at("2026-09-28", "09:10"), actorId: "system", text: "הפכה לחסומה ע״י \"צילום\"", tone: "risk" },
      { id: "a3", at: at("2026-09-27", "14:02"), actorId: PEOPLE.dana.id, text: "אחראי שונה ליואב" },
      { id: "a4", at: at("2026-09-25", "11:30"), actorId: PEOPLE.dana.id, text: "נוצרה מתוך הפרויקט", tone: "done" },
    ],
    updatedAt: at("2026-10-01", "08:06"), version: 4,
  }),
  task({
    id: "t-carousel-text", title: "לכתוב טקסט נלווה לקרוסלה", status: "in_progress", priority: "low", dueDate: "2026-10-01",
    assigneeId: PEOPLE.dana.id, participantIds: [PEOPLE.ron.id], links: P_AUTUMN, context: C_AUTUMN, source: "clickup", parentId: "t-content",
    estimateMinutes: 180, spentMinutes: 60, nextAction: "לכתוב וריאציה",
    subtasks: [{ id: "s1", title: "גרסה ראשית", done: true }, { id: "s2", title: "גרסה קצרה", done: true }, { id: "s3", title: "וריאציה לסטורי", done: false }],
  }),
  task({
    // a manual block: canonical "waiting" + the written reason (pkg1: business key "blocked" under category waiting)
    id: "t-photo-shoot", title: "צילום מנת הספיישל", status: "waiting", priority: "high", assigneeId: null, dueDate: "2026-10-03",
    links: P_AUTUMN, context: C_AUTUMN, waitingFor: "צלם חיצוני", estimateMinutes: 360, spentMinutes: null, source: "clickup",
    blockedReason: "ממתין לצלם חיצוני. לא נקבע מועד.", nextAction: "לתאם צילום עם הצלם עד 3.10", followUp: null,
    notes: "ממתין לצלם חיצוני. לא נקבע מועד.", updatedAt: at("2026-09-19", "10:00"),
    activity: [
      { id: "b1", at: at("2026-09-19", "09:00"), actorId: PEOPLE.dana.id, text: "דנה יצרה את המשימה", tone: "done" },
      { id: "b2", at: at("2026-09-19", "10:00"), actorId: PEOPLE.dana.id, text: "סומנה כחסומה: \"ממתין לצלם\"", tone: "risk" },
    ],
  }),
  task({ id: "t-story-v3", title: "סטורי ערבי סושי · גרסה 3", status: "waiting", priority: "medium", assigneeId: PEOPLE.dana.id, dueDate: "2026-10-02", waitingFor: "אישור רון", links: { ...P_AUTUMN, campaignId: "thursday-sushi" }, context: C_AUTUMN, updatedAt: at("2026-09-30", "18:00") }),
  task({ id: "t-carousel", title: "קרוסלה \"חמש מנות לסתיו\"", status: "in_progress", priority: "medium", assigneeId: PEOPLE.yoav.id, dueDate: "2026-10-06", links: P_AUTUMN, context: C_AUTUMN, source: "clickup", spentMinutes: null }),
  task({ id: "t-menu-pdf", title: "עדכון תפריט PDF", status: "in_progress", priority: "medium", assigneeId: PEOPLE.yoav.id, participantIds: [PEOPLE.ron.id], dueDate: "2026-09-29", links: P_AUTUMN, context: C_AUTUMN, source: "clickup", nextAction: "שנה תאריך", spentMinutes: null }),
  task({ id: "t-newsletter", title: "דיוור ללקוחות קבועים", status: "todo", priority: "low", assigneeId: PEOPLE.dana.id, dueDate: "2026-10-07", waitingFor: "החלטת 1+1", links: P_AUTUMN, context: C_AUTUMN }),
  task({ id: "t-schedule", title: "לתזמן פרסום בכל הערוצים", status: "todo", priority: "medium", dueDate: "2026-10-07", estimateMinutes: 120, links: P_AUTUMN, context: C_AUTUMN }),
  task({ id: "t-plan-done", title: "תוכנית שיווק", status: "done", priority: "medium", assigneeId: PEOPLE.dana.id, dueDate: "2026-09-22", links: P_AUTUMN, context: C_AUTUMN }),
  task({ id: "t-brand-guide", title: "לרענן את מדריך המותג", status: "todo", priority: "low", assigneeId: PEOPLE.yoav.id, participantIds: [PEOPLE.ron.id], context: C_AUTUMN, links: P_AUTUMN }),
  task({ id: "t-fix-story", title: "תקני את סטורי \"ערבי סושי\"", status: "in_progress", priority: "medium", assigneeId: PEOPLE.dana.id, dueDate: "2026-10-01", nextAction: "רון ביקש 2 תיקונים", links: { ...P_AUTUMN, campaignId: "thursday-sushi" }, context: C_AUTUMN }),
  // mine — other projects
  task({ id: "t-cover", title: "לאשר תמונת כריכה", status: "todo", priority: "low", dueDate: "2026-10-01", context: C_GAL, links: { projectId: "gal-site" } }),
  task({ id: "t-brief", title: "לסיים בריף לקמפיין יום חמישי", status: "todo", priority: "high", dueDate: "2026-09-29", links: P_AUTUMN, context: C_AUTUMN, nextAction: "לאשר מול דנה" }),
  task({ id: "t-hours", title: "לעדכן שעות בפרויקט אתר", status: "todo", priority: "medium", dueDate: "2026-09-30", context: C_GAL, links: { projectId: "gal-site" } }),
  task({ id: "t-weekly", title: "להכין סקירה שבועית ל־UMINO", status: "todo", priority: "medium", dueDate: "2026-10-05", context: C_AUTUMN, links: P_AUTUMN }),
  task({ id: "t-proposal-update", title: "לעדכן הצעת מחיר לנועה", status: "todo", priority: "low", dueDate: "2026-10-04", source: "clickup", context: C_SALES, links: { leadId: "noa-cohen", proposalId: "corporate-hosting" } }),
  task({ id: "t-room", title: "לבדוק זמינות חדר ל־15.10", status: "todo", priority: "low", dueDate: "2026-10-01", context: { client: "מכירות", project: "נועה כהן" }, links: { leadId: "noa-cohen" } }),
  task({ id: "t-media-budget", title: "אישור תקציב מדיה", status: "waiting", priority: "medium", waitingFor: "דנה", dueDate: null, context: C_AUTUMN, links: P_AUTUMN, updatedAt: at("2026-09-28", "10:00") }),
  task({ id: "t-materials", title: "חומרים מהלקוחה", status: "waiting", priority: "medium", waitingFor: "גל פילאטיס", dueDate: "2026-10-08", context: C_GAL, links: { projectId: "gal-site" }, source: "clickup", updatedAt: at("2026-09-25", "10:00") }),
  task({ id: "t-assets-folder", title: "לסדר את תיקיית הנכסים", status: "todo", priority: "low", context: { client: "Mytiv" } }),
  task({ id: "t-quote-template", title: "לעדכן תבנית הצעת מחיר", status: "todo", priority: "low", context: C_SALES }),
  task({ id: "t-clickup-access", title: "לבדוק הרשאות ClickUp", status: "unknown", priority: "low", context: { client: "Mytiv" }, source: "clickup", spentMinutes: null }),
];

/** The running timer (handoff: "00:42:18" on "לתאם צילום מנת הספיישל"). */
export const ACTIVE_TIMER: ActiveTimer = {
  taskId: "t-photo-coord", title: "לתאם צילום מנת הספיישל", context: "UMINO · השקת תפריט סתיו",
  // elapsedMs = time accumulated before startedAt; the store re-anchors startedAt to the real clock on load
  startedAt: DEMO_NOW, elapsedMs: (42 * 60 + 18) * 1000, running: true,
};

export const TIME_ENTRIES: TimeEntry[] = [
  { id: "te1", taskId: "t-photo-coord", personId: PEOPLE.ron.id, start: at("2026-09-30", "10:00"), minutes: 42, source: "timer", certainty: "known" },
  { id: "te2", taskId: "t-content", personId: PEOPLE.dana.id, start: at("2026-09-29", "09:00"), minutes: 360, source: "manual", certainty: "known" },
];

export const TIME_REPORT: TimeReportData = {
  range: { from: "2026-09-29", to: "2026-10-05" },
  groupBy: "employee",
  rows: [
    { key: PEOPLE.dana.id, label: "דנה", initial: "ד", hours: 26, budgetHours: 30, certainty: "known" },
    { key: PEOPLE.yoav.id, label: "יואב", initial: "י", hours: 22.5, budgetHours: 20, certainty: "estimated", note: "2 מוערך" },
    { key: PEOPLE.ron.id, label: "רון", initial: "ר", hours: 13, budgetHours: 30, certainty: "known" },
  ],
  totals: { hours: 61.5, unreported: 4, budgetHours: 80, overBudgetProjects: { count: 1, label: "גל פילאטיס · אתר" } },
  basis: "מבוסס על טיימרים ורישום ידני · מקור: Mytiv Work · ClickUp מסומן בנפרד",
};

export const TIME_REPORT_BY: Record<"project" | "client" | "task", TimeReportData["rows"]> = {
  project: [
    { key: "umino-autumn", label: "השקת תפריט סתיו", hours: 34, budgetHours: 40, certainty: "known" },
    { key: "gal-site", label: "גל פילאטיס · אתר", hours: 22, budgetHours: 30, certainty: "estimated", note: "2 ללא דיווח" },
    { key: "sales", label: "מכירות", hours: 5.5, budgetHours: null, certainty: "known" },
  ],
  client: [
    { key: "c-umino", label: "UMINO", hours: 34, budgetHours: 40, certainty: "known" },
    { key: "c-gal", label: "גל פילאטיס", hours: 22, budgetHours: 30, certainty: "estimated" },
    { key: "c-sales", label: "ללא לקוח", hours: 5.5, budgetHours: null, certainty: "known" },
  ],
  task: [
    { key: "t-content", label: "הפקת תוכן לקמפיין יום חמישי", hours: 6, budgetHours: 14, certainty: "known" },
    { key: "t-photo-coord", label: "לתאם צילום מנת הספיישל", hours: 0.7, budgetHours: 2, certainty: "known" },
    { key: "t-carousel", label: "קרוסלה \"חמש מנות לסתיו\"", hours: 0, budgetHours: null, certainty: "estimated", note: "ClickUp לא מדווח זמן" },
  ],
};

/**
 * Capabilities per source, as `auto/work-pkg1` implements them today (see docs/focus/mytiv-work-contract.md):
 * live = an endpoint exists; planned = rendered and working in the demo, labelled "מתוכנן", no backend yet.
 */
export const CAPABILITIES: Record<TaskSource, Record<keyof WorkCapabilities, CapabilityState>> = {
  mytiv: { changeStatus: "live", assign: "planned", create: "live", comment: "planned", setDueDate: "live", trackTime: "planned", depend: "planned", checklist: "planned", nest: "planned" },
  clickup: { changeStatus: "live", assign: "live", create: "planned", comment: "planned", setDueDate: "planned", trackTime: "planned", depend: "planned", checklist: "planned", nest: "planned" },
};
