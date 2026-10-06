import type { Metric } from "@/lib/focus/contracts/common";
import type { CalendarEvent, CalendarSync, Mailbox, ManagerToday, NotificationItem } from "@/lib/focus/contracts/comms";
import { dataOf, ready } from "@/lib/focus/contracts/loadable";
import { R } from "@/lib/focus/routes";
import { at } from "./clock";
import { CLIENTS, PEOPLE } from "./people";
import { TODAY_METRICS } from "./today";

/**
 * Communication demo data (handoff F6 mail + AI reply draft, H10 calendar, H15 notifications, D8 the manager's day).
 * Absolute timestamps on the demo clock; screens format them relative to DEMO_NOW.
 */

/* ---------- F6 · mail ---------- */

export const MAILBOX: Mailbox = {
  source: { system: "gmail", label: "Gmail" },
  account: { name: PEOPLE.dana.name, address: PEOPLE.dana.email },
  syncedAt: at("2026-10-01", "08:08"),
  threads: ready([
    {
      id: "t-noa",
      from: { name: "נועה כהן", address: "noa.cohen@example.co.il" },
      subject: "שאלה על המחיר לפני השיחה",
      receivedAt: at("2026-10-01", "07:41"),
      unread: true,
      link: { kind: "lead", label: "ליד · אירוע חברה ל־35", href: R.lead("noa-cohen") },
      body: ["היי דנה,", "לפני השיחה ב־10:00, אפשר לקבל מושג על מחיר לאדם? ויש אפשרות לתפריט צמחוני לחלק מהמשתתפים?", "תודה, נועה"],
      context: { title: "נועה כהן · ליד", meta: "שלב: פגישה · היום 10:00 · אחראית: דנה", link: { label: "פתח ליד", href: R.lead("noa-cohen") } },
      draft: {
        id: "d-noa-1",
        generatedAt: at("2026-10-01", "07:42"),
        text: "היי נועה,\nתודה על השאלה. תפריט האירוח העסקי עולה 250 ₪ לאדם כולל מע״מ, כולל שתייה קלה. יש אפשרות לגרסה צמחונית. נעבור על הכול בשיחה ב־10:00.\nדנה",
        claims: [
          { id: "c-price", phrase: "250 ₪ לאדם כולל מע״מ", label: "250 ₪ לאדם", verification: "verified", basis: "טיוטת ההצעה: 8,750 ₪ ל־35 משתתפים", source: { system: "sales", label: "הצעת מחיר", href: R.proposal("corporate-hosting") } },
          { id: "c-veg", phrase: "יש אפשרות לגרסה צמחונית", label: "\"גרסה צמחונית\"", verification: "unverified", basis: "לא נמצא בתפריט UMINO. כדאי לאמת מול השף." },
        ],
      },
      alternates: [
        {
          id: "d-noa-2",
          generatedAt: at("2026-10-01", "08:10"),
          text: "היי נועה,\nבשמחה. המחיר לאירוח עסקי הוא 250 ₪ לאדם כולל מע״מ ושתייה קלה. לגבי מנות צמחוניות, אני בודקת מול השף ואחזור אלייך עד השיחה ב־10:00.\nדנה",
          claims: [
            { id: "c-price", phrase: "250 ₪ לאדם כולל מע״מ", label: "250 ₪ לאדם", verification: "verified", basis: "טיוטת ההצעה: 8,750 ₪ ל־35 משתתפים", source: { system: "sales", label: "הצעת מחיר", href: R.proposal("corporate-hosting") } },
          ],
        },
      ],
    },
    {
      id: "t-umino-holiday",
      from: { name: "שף UMINO", address: "chef@umino.example" },
      subject: "שעות פתיחה בחג",
      receivedAt: at("2026-09-30", "12:00"),
      unread: true,
      link: { kind: "client", client: CLIENTS.umino, label: "UMINO · תפריט סתיו", href: R.client("umino") },
      body: ["היי,", "לקוחות שואלים אם אנחנו פתוחים בחג. אפשר לעדכן בסטורי ובפרופיל בגוגל?", "תודה"],
      context: { title: "UMINO · השקת תפריט סתיו", meta: "פרויקט פעיל · אחראית: דנה · יעד 8.10", link: { label: "פתח פרויקט", href: R.project("umino") } },
      draft: null,
      alternates: [
        {
          id: "d-umino-1",
          generatedAt: at("2026-10-01", "08:10"),
          text: "היי,\nנעדכן היום. שעות הפעילות בחג: 12:00–17:00. אשלח לאישורך סטורי ועדכון לפרופיל בגוגל לפני פרסום.\nדנה",
          claims: [
            { id: "c-hours", phrase: "שעות הפעילות בחג: 12:00–17:00", label: "שעות החג 12:00–17:00", verification: "partial", basis: "מוח העסק · שעות החג הקודם. לאשר שלא השתנו." },
          ],
        },
      ],
    },
    {
      id: "t-gal",
      from: { name: "גל פילאטיס", address: "gal@example.co.il" },
      subject: "החומרים לאתר בדרך",
      receivedAt: at("2026-09-29", "15:20"),
      unread: true,
      link: { kind: "client", client: CLIENTS.gal, label: "גל פילאטיס · אתר", href: R.projects },
      body: ["היי,", "התמונות והטקסטים יגיעו עד יום ראשון. מצטערת על העיכוב!", "גל"],
      context: { title: "גל פילאטיס · אתר", meta: "ממתינים לחומרים 6 ימים · אחראי: יואב", link: { label: "פתח משימה", href: R.task("t-materials") } },
      draft: null,
      alternates: [
        { id: "d-gal-1", generatedAt: at("2026-10-01", "08:10"), text: "היי גל,\nתודה על העדכון. נקבע את העלייה לאוויר לפי מועד קבלת החומרים.\nדנה", claims: [] },
      ],
    },
    {
      id: "t-vendor",
      from: { name: "ניוזלטר ספק", address: "news@supplier.example" },
      subject: "עדכון מחירון",
      receivedAt: at("2026-09-28", "09:00"),
      unread: false,
      muted: true,
      link: { kind: "none" },
      body: ["מחירון הסתיו של הספק מצורף. המחירים בתוקף מ־1.10."],
      context: null,
      draft: null,
      alternates: [],
    },
  ]),
};

/* ---------- H10 · calendar ---------- */

export const CALENDAR_SYNC: CalendarSync = {
  state: "synced",
  source: { system: "google_calendar", label: "Google Calendar" },
  syncedAt: at("2026-10-01", "08:08"),
  note: "משימות עם תאריך ומועדי פרסום מוצגים מ־Mytiv",
};

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "ev-plan", title: "תוכנית שיווק", meta: "יעד · דנה", start: at("2026-09-22", "09:00"), kind: "deadline", source: "mytiv", taskId: "t-plan-done", href: R.task("t-plan-done") },
  { id: "ev-menu-pdf", title: "תפריט PDF", meta: "יעד", start: at("2026-09-28", "09:00"), kind: "deadline", source: "mytiv", taskId: "t-menu-pdf", href: R.task("t-menu-pdf") },
  { id: "ev-gal", title: "גל פילאטיס", meta: "שיחת בריף", start: at("2026-09-29", "16:00"), end: at("2026-09-29", "16:45"), kind: "meeting", source: "google_calendar" },
  { id: "ev-noa", title: "שיחה · נועה כהן", meta: "Meet · ליד", start: at("2026-10-01", "10:00"), end: at("2026-10-01", "10:30"), kind: "meeting", source: "google_meet", href: R.lead("noa-cohen") },
  { id: "ev-team", title: "פגישת צוות", meta: "משרד", start: at("2026-10-01", "13:30"), end: at("2026-10-01", "14:15"), kind: "internal", source: "google_calendar" },
  { id: "ev-story", title: "סטורי ערבי סושי", meta: "ממתין לאישור", start: at("2026-10-02", "18:00"), kind: "scheduled_post", source: "mytiv", approvalId: "content-sushi-story", approval: "pending", href: R.approval("content-sushi-story") },
  { id: "ev-photo", title: "צילום מנה", meta: "יעד", start: at("2026-10-03", "18:00"), kind: "deadline", source: "clickup", taskId: "t-photo-shoot", href: R.task("t-photo-shoot") },
  { id: "ev-weekly", title: "סקירה שבועית ל־UMINO", meta: "יעד", start: at("2026-10-05", "09:00"), kind: "deadline", source: "mytiv", taskId: "t-weekly", href: R.task("t-weekly") },
  { id: "ev-carousel", title: "קרוסלה \"חמש מנות לסתיו\"", meta: "יעד", start: at("2026-10-06", "12:00"), kind: "deadline", source: "mytiv", taskId: "t-carousel", href: R.task("t-carousel") },
  { id: "ev-newsletter", title: "דיוור ללקוחות קבועים", meta: "טיוטה", start: at("2026-10-07", "10:00"), kind: "scheduled_post", source: "mytiv", approval: "draft", taskId: "t-newsletter", href: R.task("t-newsletter") },
  { id: "ev-launch", title: "השקת תפריט סתיו", meta: "UMINO", start: at("2026-10-08", "10:00"), end: at("2026-10-08", "11:00"), kind: "meeting", source: "google_calendar", href: R.project("umino") },
];

/* ---------- H15 · notifications ---------- */

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n-proposal", group: "action", title: "הצעה לנועה כהן ממתינה לשליחה", area: "מכירות", risk: "high", at: at("2026-10-01", "07:10"), timing: "ago", href: R.approval("proposal-noa"), cta: "בדוק", read: false },
  { id: "n-promo", group: "action", title: "מבצע 1+1 ממתין להחלטה שלך", area: "UMINO", risk: "medium", at: at("2026-09-28", "09:30"), timing: "waiting", href: R.approval("promo-1plus1"), cta: "פתח", read: false },
  { id: "n-story-v2", group: "update", title: "דנה העלתה גרסה 2 של סטורי ערבי סושי", area: "סטודיו · UMINO", at: at("2026-10-01", "05:10"), timing: "ago", href: R.design("thursday-sushi"), cta: "פתח", read: true },
  { id: "n-leads", group: "update", title: "2 לידים חדשים מהאתר", area: "מכירות", at: at("2026-10-01", "08:02"), timing: "ago", href: R.sales, cta: "פתח", read: true },
  { id: "n-gal-mail", group: "update", title: "גל פילאטיס: החומרים לאתר בדרך", area: "דואר", at: at("2026-09-29", "15:20"), timing: "ago", href: `${R.comms}?thread=t-gal`, cta: "פתח", read: true },
  { id: "n-plan", group: "update", title: "תוכנית אוקטובר של גל פילאטיס מוכנה לאישור", area: "שיווק", at: at("2026-09-26", "10:00"), timing: "ago", href: R.marketingPlan, cta: "פתח", read: true },
  { id: "n-instagram", group: "connection", title: "Instagram לא מחובר · המדדים לא מתעדכנים", area: "UMINO", risk: "connection", at: at("2026-09-27", "03:00"), timing: "ago", href: R.settings, cta: "בדוק", read: false },
];

export const NOTIFICATION_NOTE = "תקלות בחיבורים בלשונית נפרדת, כדי שלא ייבלעו בין עדכונים רגילים.";

/* ---------- D8 · the manager's day (Dana) ---------- */

const baseMetrics = dataOf(TODAY_METRICS) ?? [];
const metric = (id: string) => baseMetrics.find((m) => m.id === id)!;
const overdueFull = metric("m-overdue");
const overduePartial: Metric = { ...overdueFull, reading: { kind: "unknown", reason: "קריאה חלקית" }, freshness: undefined };

export const MANAGER_TODAY: ManagerToday = {
  person: PEOPLE.dana,
  partial: {
    source: { system: "clickup", label: "ClickUp" },
    title: "התקבלה רק חלק מהמשימות מ־ClickUp.",
    detail: "\"מה תקוע\" ומספר המשימות באיחור מוסתרים עד שהקריאה תושלם, כדי לא להציג מספר חסר.",
    retryMs: 1600,
  },
  items: ready([
    {
      id: "mi-fix-story", column: "today", taskId: "t-fix-story", title: "תקני את סטורי \"ערבי סושי\"", context: "רון ביקש 2 תיקונים · מתוזמן מחר",
      tag: { family: "approval", status: "changes_requested" }, waitingSince: at("2026-10-01", "07:50"),
      action: { kind: "link", label: "פתח בעורך", href: R.designEdit("thursday-sushi") }, primary: true,
    },
    {
      id: "mi-photo", column: "today", taskId: "t-photo-shoot", title: "צילום מנת הספיישל", context: "UMINO",
      tag: { family: "work", status: "blocked" }, waitingSince: at("2026-09-19", "10:00"),
      action: { kind: "assign_me", label: "הקצה לי" },
    },
    {
      id: "mi-promo", column: "others", approvalId: "promo-1plus1", title: "מבצע 1+1 לקמפיין יום חמישי", context: "UMINO · משפיע על מחיר",
      tag: { family: "risk", level: "medium" }, waitingSince: at("2026-09-28", "09:30"),
      note: "שינוי מחיר דורש אישור בעלים. ההחלטה אצל רון.",
      action: { kind: "remind", label: "שלח תזכורת לרון", personId: PEOPLE.ron.id },
    },
  ]),
  metrics: ready([overduePartial, metric("m-content"), metric("m-reach"), metric("m-leads")]),
  fullRead: { metricId: "m-overdue", metric: overdueFull },
  connection: { title: "Instagram לא מחובר", detail: "רק בעלים יכול לחבר מחדש. ביקשת מרון אתמול.", href: R.settings, linkLabel: "פרטי התקלה" },
  viewerPreview: { title: "צופה · איך המסך נראה לרואת החשבון", who: PEOPLE.ron.name, detail: "אין עמודות \"עכשיו\" ו\"היום\". מוצגים רק מדדים, פרויקטים ודוחות, בלי כפתורי פעולה." },
  allDonePreview: { title: "כשהכול טופל", headline: "טיפלת בכל 6 הפריטים של היום.", detail: "הבא בתור: פגישת צוות ב־13:30. אין פריטים חדשים מאז 08:04." },
};
