import type { ActiveTimer, Task, TimeReportData } from "@/lib/focus/contracts/work";
import { at, DEMO_NOW } from "./clock";
import { PEOPLE } from "./people";

/**
 * Mytiv Work demo tasks (handoff Desktop 6 W1–W6, M9–M10, D1 "העבודה שלי להיום", D3). One task set feeds every view —
 * My Tasks buckets, project list, Kanban, drawer — so a change in one view shows everywhere.
 * `state: "planned"` marks capabilities with no backend yet (rendered in full, labelled "מתוכנן").
 */
const P_AUTUMN = { projectId: "umino-autumn" };
const C_AUTUMN = { client: "UMINO", project: "השקת תפריט סתיו" };
const C_GAL = { client: "גל פילאטיס", project: "אתר" };

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
    id: "t-carousel-text", title: "לכתוב טקסט נלווה לקרוסלה", status: "in_progress", priority: "low", dueDate: "2026-10-01",
    assigneeId: PEOPLE.dana.id, participantIds: [PEOPLE.ron.id], links: P_AUTUMN, context: C_AUTUMN, source: "clickup", parentId: "t-content",
    estimateMinutes: 180, spentMinutes: 60, nextAction: "לכתוב וריאציה",
    subtasks: [
      { id: "s1", title: "גרסה ראשית", done: true }, { id: "s2", title: "גרסה קצרה", done: true }, { id: "s3", title: "וריאציה לסטורי", done: false },
    ],
  }),
  task({ id: "t-cover", title: "לאשר תמונת כריכה", status: "todo", priority: "low", dueDate: "2026-10-01", context: C_GAL, links: { projectId: "gal-site" } }),
  task({
    id: "t-brief", title: "לסיים בריף לקמפיין יום חמישי", status: "todo", priority: "high", dueDate: "2026-09-29",
    links: P_AUTUMN, context: C_AUTUMN, nextAction: "לאשר מול דנה",
  }),
  task({ id: "t-hours", title: "לעדכן שעות בפרויקט אתר", status: "todo", priority: "medium", dueDate: "2026-09-30", context: C_GAL, links: { projectId: "gal-site" } }),
  task({
    id: "t-photo-shoot", title: "צילום מנת הספיישל", status: "blocked", priority: "high", assigneeId: null, dueDate: "2026-10-03",
    links: P_AUTUMN, context: C_AUTUMN, waitingFor: "צלם חיצוני", estimateMinutes: 360, source: "mytiv",
    notes: "ממתין לצלם חיצוני. לא נקבע מועד.", updatedAt: at("2026-09-19", "10:00"),
  }),
  task({
    id: "t-post45", title: "לעצב פוסט 4:5 לקמפיין", status: "blocked", priority: "medium", assigneeId: PEOPLE.yoav.id,
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
      { id: "a2", at: at("2026-09-28", "09:10"), actorId: "system", text: "הפכה ל־חסומה ע״י \"צילום\"", tone: "risk" },
      { id: "a3", at: at("2026-09-27", "14:02"), actorId: PEOPLE.dana.id, text: "אחראי שונה ל־יואב" },
      { id: "a4", at: at("2026-09-25", "11:30"), actorId: PEOPLE.dana.id, text: "נוצרה מתוך הפרויקט", tone: "done" },
    ],
    evidence: [], updatedAt: at("2026-10-01", "08:06"), version: 4,
  }),
  task({ id: "t-weekly", title: "להכין סקירה שבועית ל־UMINO", status: "todo", priority: "medium", dueDate: "2026-10-05", context: C_AUTUMN, links: P_AUTUMN }),
  task({ id: "t-proposal-update", title: "לעדכן הצעת מחיר לנועה", status: "todo", priority: "low", dueDate: "2026-10-04", source: "clickup", context: { client: "מכירות" }, links: { leadId: "noa-cohen", proposalId: "corporate-hosting" } }),
  task({ id: "t-media-budget", title: "אישור תקציב מדיה", status: "waiting", priority: "medium", waitingFor: "דנה", dueDate: null, context: C_AUTUMN, links: P_AUTUMN, updatedAt: at("2026-09-28", "10:00") }),
  task({ id: "t-materials", title: "חומרים מהלקוחה", status: "waiting", priority: "medium", waitingFor: "גל פילאטיס", dueDate: null, context: C_GAL, links: { projectId: "gal-site" }, updatedAt: at("2026-09-25", "10:00") }),
  task({ id: "t-brand-guide", title: "לרענן את מדריך המותג", status: "todo", priority: "low", assigneeId: PEOPLE.yoav.id, participantIds: [PEOPLE.ron.id], context: C_AUTUMN, links: P_AUTUMN }),
  task({ id: "t-assets-folder", title: "לסדר את תיקיית הנכסים", status: "todo", priority: "low", context: { client: "Mytiv" } }),
  task({ id: "t-quote-template", title: "לעדכן תבנית הצעת מחיר", status: "todo", priority: "low", context: { client: "מכירות" } }),
  task({ id: "t-clickup-access", title: "לבדוק הרשאות ClickUp", status: "todo", priority: "low", context: { client: "Mytiv" }, source: "clickup" }),
  // project-only (not mine)
  task({
    id: "t-content", title: "הפקת תוכן לקמפיין יום חמישי", status: "in_progress", priority: "medium", assigneeId: PEOPLE.dana.id,
    dueDate: "2026-10-08", estimateMinutes: 840, spentMinutes: 360, links: P_AUTUMN, context: C_AUTUMN,
  }),
  task({ id: "t-brief-done", title: "כתיבת בריף", status: "done", priority: "medium", assigneeId: PEOPLE.dana.id, dueDate: "2026-09-29", estimateMinutes: 120, spentMinutes: 120, links: P_AUTUMN, context: C_AUTUMN, parentId: "t-content" }),
  task({ id: "t-schedule", title: "לתזמן פרסום בכל הערוצים", status: "todo", priority: "medium", dueDate: "2026-10-07", estimateMinutes: 120, links: P_AUTUMN, context: C_AUTUMN }),
  task({ id: "t-plan-done", title: "תוכנית שיווק", status: "done", priority: "medium", assigneeId: PEOPLE.dana.id, dueDate: "2026-09-22", links: P_AUTUMN, context: C_AUTUMN }),
];

/** The running timer (handoff: "00:42:18" on "לתאם צילום מנת הספיישל"). */
export const ACTIVE_TIMER: ActiveTimer = {
  taskId: "t-photo-coord", title: "לתאם צילום מנת הספיישל", context: "UMINO · השקת תפריט סתיו",
  // elapsedMs = time accumulated before startedAt; the store re-anchors startedAt to the real clock on load
  startedAt: DEMO_NOW, elapsedMs: (42 * 60 + 18) * 1000, running: true,
};

export const TIME_REPORT: TimeReportData = {
  range: { from: "2026-09-29", to: "2026-10-05" },
  groupBy: "employee",
  rows: [
    { key: PEOPLE.dana.id, label: "דנה", hours: 26, budgetHours: 30, certainty: "known" },
    { key: PEOPLE.yoav.id, label: "יואב", hours: 22.5, budgetHours: 20, certainty: "estimated", note: "2 מוערך" },
    { key: PEOPLE.ron.id, label: "רון", hours: 13, budgetHours: 30, certainty: "known" },
  ],
};
