import { ready } from "@/lib/focus/contracts/loadable";
import type {
  ActivityEntry, BrainFact, BrainSection, Connection, GoalsReport, ProfitReport, ReportPeriod, SourceDetail, WeeklyReview,
} from "@/lib/focus/contracts/reports";
import { R } from "@/lib/focus/routes";
import { at } from "./clock";
import { CLIENTS, PEOPLE } from "./people";
import { HOURS_SYNC } from "./projects";

/**
 * Reports & control demo data (handoff G1–G6). Every number carries its source, freshness and certainty; unknown and
 * unavailable values have no number at all. Timestamps are absolute and formatted relative to the demo clock.
 */

/* ---------- G1 goals & performance ---------- */

export const REPORT_PERIODS: ReportPeriod[] = [
  { id: "2026-09", label: "ספטמבר 2026" },
  { id: "2026-08", label: "אוגוסט 2026" },
];

const IG_SINCE = at("2026-09-27", "03:00");

const BOOKINGS_SOURCE = { system: "bookings", label: "מערכת ההזמנות" } as const;
const IG_DETAIL: SourceDetail = {
  source: "Instagram · UMINO (@umino) · קריאת מדדים",
  updated: { at: at("2026-09-26", "03:00"), how: "סנכרון אוטומטי אחרון שהצליח" },
  calculation: "סך החשיפות של פוסטים וסטוריז בחודש",
  missing: "אין נתונים מ־27.9: פג תוקף ההרשאה של החיבור.",
  consequence: "הערך לא מוצג כדי שמספר חסר לא ייראה כמו האמת. אחרי חיבור מחדש הנתונים יסונכרנו מ־27.9.",
  verification: "unverified",
  usedIn: [{ label: "היום שלי", href: R.today }, { label: "פרויקט UMINO", href: R.project("umino") }],
  fix: { label: "לתיקון החיבור", href: R.settings },
  history: [
    { at: IG_SINCE, text: "הסנכרון נכשל · פג תוקף ההרשאה" },
    { at: at("2026-09-26", "03:00"), text: "סנכרון אוטומטי הצליח" },
  ],
  canRequest: false,
};

export const GOALS: Record<string, GoalsReport> = {
  "2026-09": {
    periodId: "2026-09",
    periodLabel: "ספטמבר 2026",
    client: CLIENTS.umino,
    rows: [
      {
        id: "g-bookings", label: "הזמנות 19:00–22:00 בימי חמישי", target: 120, unit: "count",
        reading: { kind: "estimated", value: 96, basis: "חסר יום אחד" }, delta: { value: 14, tone: "good" },
        source: BOOKINGS_SOURCE, sourceState: "partial", freshness: { state: "fresh", updatedAt: at("2026-09-30", "09:12") },
        detail: {
          source: "מערכת ההזמנות של UMINO · ייצוא קובץ",
          updated: { at: at("2026-09-30", "09:12"), how: `ידנית ע״י ${PEOPLE.dana.name}` },
          calculation: "הזמנות שנפתחו בין 19:00 ל־22:00, בארבעה ימי חמישי",
          missing: "חמישי 24.9 לא נכלל בקובץ. הושלם לפי ממוצע שלושת הימים האחרים.",
          consequence: "בגלל היום החסר הערך מוערך ולא ידוע. הוא לא נכנס לסיכום הרבעוני כנתון סופי.",
          verification: "partial",
          usedIn: [
            { label: "סקירה שבועית 39", href: R.reportWeekly },
            { label: "קמפיין ערבי סושי", href: R.campaign("thursday-sushi") },
            { label: "היום שלי", href: R.today },
          ],
          history: [
            { at: at("2026-09-30", "09:12"), text: `${PEOPLE.dana.name} העלתה ייצוא של 3 מתוך 4 ימי חמישי` },
            { at: at("2026-09-25", "10:00"), text: "הייצוא השבועי של 24.9 לא התקבל מהלקוח" },
            { at: at("2026-09-18", "10:00"), text: "ייצוא שבועי התקבל (17.9)" },
          ],
          canRequest: true,
        },
      },
      {
        id: "g-leads", label: "לידים לאירועים", target: 4, unit: "count",
        reading: { kind: "known", value: 5 }, delta: { value: 2, tone: "good" },
        source: { system: "sales", label: "מכירות" }, sourceState: "verified", freshness: { state: "fresh", updatedAt: at("2026-10-01", "08:02") },
        detail: {
          source: "מכירות · לידים מסוג אירוע",
          updated: { at: at("2026-10-01", "08:02"), how: "סנכרון אוטומטי" },
          calculation: "לידים חדשים מסוג אירוע שנפתחו בחודש",
          missing: null,
          verification: "verified",
          usedIn: [{ label: "סקירה שבועית 39", href: R.reportWeekly }, { label: "מכירות", href: R.sales }],
          history: [{ at: at("2026-10-01", "08:02"), text: "סנכרון אוטומטי · 5 לידים" }],
          canRequest: false,
        },
      },
      {
        id: "g-content", label: "תכנים שפורסמו", target: 12, unit: "count",
        reading: { kind: "known", value: 14 }, delta: { value: 3, tone: "good" },
        source: { system: "studio", label: "סטודיו" }, sourceState: "verified", freshness: { state: "fresh", updatedAt: at("2026-10-01", "07:40") },
        detail: {
          source: "סטודיו · תכנים שאושרו ופורסמו דרך Meta",
          updated: { at: at("2026-10-01", "07:40"), how: "אישור פרסום מ־Meta" },
          calculation: "תכנים שסומנו ״פורסם״ רק אחרי ש־Meta אישרה את הפרסום",
          missing: null,
          verification: "verified",
          usedIn: [{ label: "סקירה שבועית 39", href: R.reportWeekly }, { label: "סטודיו", href: R.studio }],
          history: [{ at: at("2026-10-01", "07:40"), text: "Meta אישרה פרסום · 14 תכנים" }],
          canRequest: false,
        },
      },
      {
        id: "g-reach", label: "חשיפות Instagram", target: 20000, unit: "count",
        reading: { kind: "unavailable", since: IG_SINCE, reason: "תקלה בחיבור" },
        source: { system: "instagram", label: "Instagram", href: R.settings }, sourceState: "failed",
        freshness: { state: "unavailable", since: IG_SINCE, reason: "פג תוקף ההרשאה" },
        detail: IG_DETAIL,
      },
    ],
    chart: {
      title: "הזמנות בימי חמישי · 19:00–22:00",
      caption: "4 ימי חמישי בספטמבר",
      metricId: "g-bookings",
      bars: [
        { id: "b1", date: "2026-09-03", reading: { kind: "known", value: 22 } },
        { id: "b2", date: "2026-09-10", reading: { kind: "known", value: 25 } },
        { id: "b3", date: "2026-09-17", reading: { kind: "known", value: 25 } },
        { id: "b4", date: "2026-09-24", reading: { kind: "estimated", value: 24, basis: "ממוצע שלושת הימים האחרים" } },
      ],
    },
  },
  "2026-08": {
    periodId: "2026-08",
    periodLabel: "אוגוסט 2026",
    client: CLIENTS.umino,
    rows: [
      {
        id: "g-bookings", label: "הזמנות 19:00–22:00 בימי חמישי", target: 120, unit: "count",
        reading: { kind: "known", value: 106 }, delta: { value: -4, tone: "bad" },
        source: BOOKINGS_SOURCE, sourceState: "verified", freshness: { state: "fresh", updatedAt: at("2026-09-01", "09:30") },
        detail: {
          source: "מערכת ההזמנות של UMINO · ייצוא קובץ",
          updated: { at: at("2026-09-01", "09:30"), how: `ידנית ע״י ${PEOPLE.dana.name}` },
          calculation: "הזמנות שנפתחו בין 19:00 ל־22:00, בארבעה ימי חמישי",
          missing: null,
          verification: "verified",
          usedIn: [{ label: "סקירה חודשית · אוגוסט", href: R.reports }],
          history: [{ at: at("2026-09-01", "09:30"), text: "ייצוא חודשי מלא התקבל" }],
          canRequest: false,
        },
      },
      {
        id: "g-leads", label: "לידים לאירועים", target: 4, unit: "count",
        reading: { kind: "known", value: 3 }, delta: { value: -1, tone: "bad" },
        source: { system: "sales", label: "מכירות" }, sourceState: "verified", freshness: { state: "fresh", updatedAt: at("2026-09-01", "03:00") },
        detail: {
          source: "מכירות · לידים מסוג אירוע", updated: { at: at("2026-09-01", "03:00"), how: "סנכרון אוטומטי" },
          calculation: "לידים חדשים מסוג אירוע שנפתחו בחודש", missing: null, verification: "verified",
          usedIn: [{ label: "מכירות", href: R.sales }], history: [{ at: at("2026-09-01", "03:00"), text: "סגירת חודש · 3 לידים" }], canRequest: false,
        },
      },
      {
        id: "g-content", label: "תכנים שפורסמו", target: 12, unit: "count",
        reading: { kind: "known", value: 11 }, delta: { value: -1, tone: "bad" },
        source: { system: "studio", label: "סטודיו" }, sourceState: "verified", freshness: { state: "fresh", updatedAt: at("2026-09-01", "03:00") },
        detail: {
          source: "סטודיו · תכנים שאושרו ופורסמו דרך Meta", updated: { at: at("2026-09-01", "03:00"), how: "סגירת חודש" },
          calculation: "תכנים שסומנו ״פורסם״ רק אחרי ש־Meta אישרה את הפרסום", missing: null, verification: "verified",
          usedIn: [{ label: "סטודיו", href: R.studio }], history: [{ at: at("2026-09-01", "03:00"), text: "סגירת חודש · 11 תכנים" }], canRequest: false,
        },
      },
      {
        id: "g-reach", label: "חשיפות Instagram", target: 20000, unit: "count",
        reading: { kind: "known", value: 18400 }, delta: { value: 1200, tone: "good" },
        source: { system: "instagram", label: "Instagram" }, sourceState: "verified", freshness: { state: "fresh", updatedAt: at("2026-09-01", "03:00") },
        detail: {
          source: "Instagram · UMINO (@umino) · קריאת מדדים", updated: { at: at("2026-09-01", "03:00"), how: "סנכרון אוטומטי" },
          calculation: "סך החשיפות של פוסטים וסטוריז בחודש", missing: null, verification: "verified",
          usedIn: [{ label: "פרויקט UMINO", href: R.project("umino") }], history: [{ at: at("2026-09-01", "03:00"), text: "סגירת חודש · סנכרון מלא" }], canRequest: false,
        },
      },
    ],
    chart: {
      title: "הזמנות בימי חמישי · 19:00–22:00",
      caption: "4 ימי חמישי באוגוסט",
      metricId: "g-bookings",
      bars: [
        { id: "b1", date: "2026-08-06", reading: { kind: "known", value: 24 } },
        { id: "b2", date: "2026-08-13", reading: { kind: "known", value: 27 } },
        { id: "b3", date: "2026-08-20", reading: { kind: "known", value: 28 } },
        { id: "b4", date: "2026-08-27", reading: { kind: "known", value: 27 } },
      ],
    },
  },
};

/* ---------- G2 hours & profitability ---------- */

export const PROFIT: ProfitReport = {
  periodLabel: "ספטמבר 2026",
  rows: ready([
    {
      id: "p-autumn", project: "השקת תפריט סתיו", client: CLIENTS.umino, href: R.project("umino"),
      hours: { kind: "known", value: 34 }, budgetHours: 40,
      revenue: { kind: "known", value: 9800 },
      cost: { kind: "estimated", value: 5950, basis: "כולל הערכה לפרילנסר" },
      gross: { kind: "estimated", value: 3850, basis: "לפי עלות מוערכת" },
      overrun: { level: "medium", label: "85% מהמכסה", reason: "נוצלו 85% מהשעות ועוד שבוע להשקה. אם הצילום יידחה שוב, הפרויקט יחרוג." },
    },
    {
      id: "p-gal", project: "אתר", client: CLIENTS.gal,
      hours: { kind: "estimated", value: 22, basis: "2 משימות בלי דיווח שעות" }, budgetHours: 30,
      revenue: { kind: "known", value: 6200 },
      cost: { kind: "estimated", value: 3000, basis: "לפי שעות מוערכות" },
      gross: { kind: "estimated", value: 3200, basis: "לפי עלות מוערכת" },
      overrun: null,
    },
    {
      id: "p-shalosh", project: "ריטיינר תוכן", client: CLIENTS.shalosh,
      hours: { kind: "estimated", value: 6, basis: "לפי ממוצע חודשי" }, budgetHours: null,
      revenue: { kind: "known", value: 2400 },
      cost: { kind: "estimated", value: 1000, basis: "לפי שעות מוערכות" },
      gross: { kind: "estimated", value: 1400, basis: "לפי עלות מוערכת" },
      overrun: { level: "high", label: "אין תקציב שעות", reason: "בחוזה אין מכסת שעות, ולכן אי אפשר לדעת אם יש חריגה. כדאי להגדיר מכסה." },
    },
  ], HOURS_SYNC.at),
  estimateNote: {
    title: "נתונים מוערכים.",
    detail: "2 משימות בלי דיווח שעות, ועלות השעה של פרילנסר אחד מבוססת על הערכה. אלה אינם סכומים חשבונאיים סופיים.",
    missing: [
      "2 משימות באתר של גל פילאטיס בלי דיווח שעות",
      "עלות השעה של הצלם (פרילנסר) מוערכת לפי התעריף הקודם",
      "שעות הריטיינר של בית קפה שלוש מוערכות לפי ממוצע חודשי",
    ],
  },
  details: {
    hours: {
      source: "דיווחי שעות מ־ClickUp ומהטיימר של Mytiv", updated: { at: HOURS_SYNC.at, how: "סנכרון אוטומטי" },
      calculation: "סך השעות שדווחו בפרויקטים שיש להם מכסה, מול סך המכסות", missing: "2 משימות בלי דיווח שעות",
      consequence: "עד שהדיווח יושלם הסכום מוערך.", verification: "partial",
      usedIn: [{ label: "היום שלי", href: R.today }, { label: "דוח שעות", href: R.workTime }],
      history: [{ at: HOURS_SYNC.at, text: "סנכרון שעות מ־ClickUp" }], canRequest: false,
    },
    revenue: {
      source: "חשבוניות שהופקו בספטמבר", updated: { at: at("2026-09-30", "17:00"), how: `הופקו ע״י ${PEOPLE.ron.name}` },
      calculation: "סך החשבוניות שהופקו בחודש לכל פרויקט", missing: null, verification: "verified",
      usedIn: [{ label: "סקירה שבועית", href: R.reportWeekly }], history: [{ at: at("2026-09-30", "17:00"), text: "חשבונית אחרונה לחודש הופקה" }], canRequest: false,
    },
    cost: {
      source: "שעות × עלות שעה לכל אדם", updated: { at: HOURS_SYNC.at, how: "חישוב אוטומטי" },
      calculation: "שעות שדווחו כפול עלות השעה של כל עובד או פרילנסר", missing: "עלות השעה של הצלם (פרילנסר) לא אושרה",
      consequence: "העלות מוערכת ואינה סכום חשבונאי סופי.", verification: "partial",
      usedIn: [{ label: "דוח שעות", href: R.workTime }], history: [{ at: HOURS_SYNC.at, text: "חושב מחדש אחרי סנכרון שעות" }], canRequest: false,
    },
    gross: {
      source: "הכנסה פחות עלות עבודה", updated: { at: HOURS_SYNC.at, how: "חישוב אוטומטי" },
      calculation: "הכנסה שנחתמה פחות עלות העבודה המוערכת", missing: "העלות מוערכת, ולכן גם הרווח",
      consequence: "הרווח מוערך עד שהשעות והתעריפים יושלמו.", verification: "partial",
      usedIn: [], history: [{ at: HOURS_SYNC.at, text: "חושב מחדש אחרי סנכרון שעות" }], canRequest: false,
    },
  },
};

/* ---------- G3 weekly review ---------- */

export const WEEKLY_REVIEW: WeeklyReview = {
  week: 40,
  range: { from: "2026-09-27", to: "2026-10-03" },
  createdAt: at("2026-10-01", "07:00"),
  summary: {
    origin: "ai_suggested",
    basis: "נוסח ב־AI מהנתונים שלמטה",
    text: "שבוע של השקה ב־UMINO. הקמפיין \"ערבי סושי של חמישי\" יצא לדרך עם מבצע 1+1 שאושר עד 31.10, אבל הצילום עדיין מעכב שני תכנים. במכירות נכנסו 2 לידים, והצעה של 8,750 ₪ נשלחה לנועה כהן. נתוני Instagram חסרים מאז 27.9.",
  },
  sections: [
    {
      id: "wins", title: "הישגים", basis: "data", verification: "verified",
      items: [
        { id: "w1", kind: "done", text: "תוכנית אוקטובר של UMINO אושרה", source: { label: "תוכנית", href: R.marketingPlan } },
        { id: "w2", kind: "done", text: "14 תכנים פורסמו בספטמבר", source: { label: "מקור", href: R.reports } },
        { id: "w3", kind: "done", text: "ההצעה לנועה כהן נשלחה", source: { label: "הצעה", href: R.proposal("corporate-hosting") } },
      ],
    },
    {
      id: "blocks", title: "חסימות", basis: "data", verification: "verified",
      items: [
        { id: "b1", kind: "blocked", text: "צילום מנת הספיישל · 12 ימים", source: { label: "משימה", href: R.task("t-photo-shoot") } },
        { id: "b2", kind: "blocked", text: "חומרים לאתר גל פילאטיס · 6 ימים", source: { label: "משימות", href: R.allTasks } },
        { id: "b3", kind: "unavailable", text: "Instagram לא מחובר מ־27.9", source: { label: "חיבורים", href: R.settings } },
      ],
    },
    {
      id: "sales", title: "לידים והצעות", basis: "data", verification: "verified",
      items: [
        { id: "s1", kind: "info", text: "2 לידים חדשים · 1 ללא פעולה הבאה", source: { label: "מכירות", href: R.sales } },
        { id: "s2", kind: "info", text: "הצעות פתוחות: 2 · 14,950 ₪", source: { label: "הצעות", href: R.proposals } },
      ],
    },
    {
      id: "chances", title: "הזדמנויות", basis: "ai", verification: "unverified",
      items: [
        { id: "o1", kind: "info", text: "חגי תשרי: תוכן על שעות פתיחה בחג ל־UMINO", source: { label: "טרנדים", href: R.trends } },
        { id: "o2", kind: "info", text: "מגמה: קרוסלות \"מאחורי הקלעים\" במסעדות", source: { label: "השראה", href: R.inspiration } },
      ],
    },
  ],
  goals: [
    { id: "n1", kind: "info", text: "לצלם את מנת הספיישל ולתזמן את הפוסט עד 4.10", source: { label: "משימה", href: R.task("t-photo-shoot") } },
    { id: "n2", kind: "info", text: "לחבר מחדש את Instagram", source: { label: "חיבורים", href: R.settings } },
    { id: "n3", kind: "info", text: "מעקב מול נועה כהן ב־4.10", source: { label: "ליד", href: R.lead("noa-cohen") } },
  ],
  method: [
    { badge: "data", text: "הישגים, חסימות, לידים, הצעות, יעדים. כל שורה מקושרת לפריט המקור." },
    { badge: "ai", text: "תקציר המנהלים וההזדמנויות. לא הוסיף מספרים שלא מופיעים בנתונים." },
  ],
  missing: [
    { id: "x1", kind: "unavailable", text: "מדדי Instagram לשבוע · תקלה בחיבור", source: { label: "חיבורים", href: R.settings } },
    { id: "x2", kind: "estimated", text: "הזמנות בחמישי 24.9 · מוערך", source: { label: "מקור הנתון", href: R.reports } },
  ],
  previous: [
    { week: 39, savedBy: PEOPLE.ron.id, savedAt: at("2026-09-24", "18:20") },
    { week: 38, savedBy: PEOPLE.ron.id, savedAt: at("2026-09-17", "17:45") },
  ],
};

/* ---------- G4 activity log ---------- */

/** Role words as shown in the log ("רון · בעלים"). */
export const ROLE_LABEL: Record<string, string> = { [PEOPLE.ron.id]: "בעלים", [PEOPLE.dana.id]: "מנהלת", [PEOPLE.yoav.id]: "צוות", [PEOPLE.shira.id]: "צפייה" };

export const ACTIVITY: ActivityEntry[] = [
  {
    id: "ev-story", at: at("2026-10-01", "08:08"), actor: { kind: "person", personId: PEOPLE.ron.id }, categories: ["decision"],
    text: "אישר את הסטורי והפוסט \"ערבי סושי של חמישי\"", context: "UMINO · גרסה 3",
    before: "ממתין לאישור", after: "אושר", result: "done",
    reversal: { kind: "undo", label: "בטל אישור", undoneText: "האישור בוטל. הפריט חזר לתור האישורים." },
    tech: "approval content-sushi-story · v3 · decided_by u-ron", href: R.approval("content-sushi-story"),
  },
  {
    id: "ev-assign", at: at("2026-10-01", "08:05"), actor: { kind: "person", personId: PEOPLE.dana.id }, categories: ["external"],
    text: "סימנה את \"צילום מנת הספיישל\" כחסומה והקצתה לעצמה", context: "UMINO · סונכרן ל־ClickUp",
    before: "ללא אחראי", after: PEOPLE.dana.name, result: "done",
    reversal: { kind: "undo", label: "בטל", undoneText: "האחראי הוחזר ל״ללא אחראי״ גם ב־ClickUp." },
    tech: "task t-photo-shoot · clickup sync ok", href: R.task("t-photo-shoot"),
  },
  {
    id: "ev-promo", at: at("2026-10-01", "08:02"), actor: { kind: "person", personId: PEOPLE.ron.id }, categories: ["decision"],
    text: "אישר הוספת מבצע 1+1 לקמפיין", context: "נימוק: \"בתוקף עד 31.10. לא בערבי חג.\"",
    before: "אין מבצע", after: "1+1 על סטים נבחרים", result: "done",
    reversal: { kind: "undo", label: "בטל פעולה", undoneText: "המבצע הוסר מהקמפיין. שום דבר לא פורסם." },
    tech: "approval promo-1plus1 · plan v7", href: R.approval("promo-1plus1"),
  },
  {
    id: "ev-proposal", at: at("2026-10-01", "07:58"), actor: { kind: "person", personId: PEOPLE.ron.id }, categories: ["external", "decision"],
    text: "שלח הצעת מחיר לנועה כהן", context: "אירוח עסקי — 8,750 ₪ · דרך Gmail",
    before: "טיוטה", after: "נשלחה · גרסה 1 ננעלה", result: "done",
    reversal: { kind: "none", why: "המייל כבר נמסר דרך Gmail. אפשר לשלוח הצעה מעודכנת כגרסה 2." },
    tech: "proposal corporate-hosting · v1 · gmail message accepted", href: R.proposal("corporate-hosting"),
  },
  {
    id: "ev-ig", at: IG_SINCE, actor: { kind: "system", label: "סנכרון אוטומטי" }, categories: ["sync", "external"],
    text: "ניסיון לקרוא מדדי Instagram", context: "UMINO · פג תוקף ההרשאה",
    before: null, after: null, result: "failed", failure: "פג תוקף ההרשאה",
    reversal: { kind: "retry", label: "נסה שוב" },
    tech: "connector instagram · OAuthException 190 · token expired",
  },
  {
    id: "ev-ai", at: at("2026-09-28", "16:40"), actor: { kind: "ai", label: "מנוע השיווק" }, categories: ["ai"],
    text: "הציע מבצע 1+1 לקמפיין יום חמישי", context: "הועבר לתור האישורים",
    before: null, after: null, result: "done",
    reversal: { kind: "open", label: "פתח הצעה", href: R.approval("promo-1plus1") },
    tech: "marketing-engine suggestion s-1plus1 · plan v6",
  },
];

/* ---------- G5 business brain ---------- */

export const BRAIN_CLIENT = CLIENTS.umino;

export const BRAIN_SECTIONS: BrainSection[] = [
  { id: "business", label: "העסק" },
  { id: "products", label: "מוצרים ושירותים" },
  { id: "audiences", label: "קהלים" },
  { id: "diff", label: "בידול" },
  { id: "value", label: "הצעות ערך" },
  { id: "prices", label: "מחירים" },
  { id: "tone", label: "טון ושפה" },
  { id: "proof", label: "הוכחות ואסמכתאות" },
  { id: "limits", label: "מגבלות" },
  { id: "competitors", label: "מתחרים" },
  { id: "goals", label: "יעדים" },
];

const ownerCheck = (when: string) => ({ personId: PEOPLE.ron.id, label: `${PEOPLE.ron.name} · בעל העסק אישר`, at: when });

export const BRAIN_FACTS: BrainFact[] = [
  { id: "f-name", sectionId: "business", title: "שם העסק ותחום", value: "UMINO · מסעדת סושי ובר קוקטיילים", contentState: "ok", verification: "verified", verificationLabel: "אומת ע״י בעל העסק", source: "שאלון פתיחה", verifiedBy: ownerCheck(at("2026-08-02", "11:00")), recheck: { date: "2027-02-01" }, usedIn: [] },
  { id: "f-hours", sectionId: "business", title: "שעות פעילות בחמישי", value: "18:00–23:30", contentState: "ok", verification: "verified", verificationLabel: "אומת ע״י בעל העסק", source: "שיחה עם בעל העסק", verifiedBy: ownerCheck(at("2026-09-20", "12:00")), recheck: { date: "2026-12-01" }, usedIn: [{ label: "סטורי ערבי סושי", href: R.approval("content-sushi-story") }] },
  { id: "f-sets", sectionId: "products", title: "סטים לשניים", value: "4 סטים קבועים בתפריט", contentState: "ok", verification: "verified", verificationLabel: "אומת מול מקור", source: "תפריט UMINO (PDF)", verifiedBy: { personId: PEOPLE.dana.id, label: `${PEOPLE.dana.name} · מול התפריט`, at: at("2026-09-28", "10:00") }, recheck: { date: "2026-10-28" }, usedIn: [] },
  { id: "f-aud", sectionId: "audiences", title: "קהל עיקרי", value: "זוגות וחברים בגילאי 25–40 בערבי חמישי", contentState: "ok", verification: "verified", verificationLabel: "אומת ע״י בעל העסק", source: "שאלון פתיחה", verifiedBy: ownerCheck(at("2026-08-02", "11:00")), recheck: { date: "2027-02-01" }, usedIn: [{ label: "קמפיין ערבי סושי", href: R.campaign("thursday-sushi") }] },
  { id: "f-diff", sectionId: "diff", title: "מה מבדיל את UMINO", value: "דגים טריים שמגיעים כל בוקר", contentState: "ok", verification: "partial", verificationLabel: "אומת חלקית", source: "ראיון עם השף", verifiedBy: null, recheck: { date: "2026-10-15" }, usedIn: [] },
  { id: "f-diff-2", sectionId: "diff", title: "שף שהתמחה ביפן", value: "הוזכר בראיון, אין מסמך תומך", contentState: "ok", verification: "unverified", source: "ראיון עם השף", verifiedBy: null, recheck: null, usedIn: [] },
  { id: "f-value", sectionId: "value", title: "הצעת ערך מרכזית", value: "ערב סושי מלא בלי להזמין שבועות מראש", contentState: "ok", verification: "verified", verificationLabel: "אומת ע״י בעל העסק", source: "סדנת מיתוג", verifiedBy: ownerCheck(at("2026-08-10", "15:00")), recheck: { date: "2027-02-01" }, usedIn: [] },
  { id: "f-promo", sectionId: "prices", title: "מבצע 1+1 על סטים נבחרים", value: "בתוקף עד 31.10.2026, לא בערבי חג", contentState: "ok", verification: "verified", verificationLabel: "אומת ע״י בעל העסק", source: "החלטה של רון בתור האישורים", verifiedBy: { personId: PEOPLE.ron.id, label: PEOPLE.ron.name, at: at("2026-10-01", "08:02") }, recheck: { date: "2026-10-31", why: "כשהמבצע מסתיים" }, usedIn: [{ label: "קמפיין ערבי סושי", href: R.campaign("thursday-sushi") }, { label: "סטורי", href: R.approval("content-sushi-story") }, { label: "פוסט אנכי", href: R.task("t-post45") }, { label: "קרוסלה", href: R.task("t-carousel") }] },
  { id: "f-menu", sectionId: "prices", title: "תפריט מלא ומחירים", value: "קובץ PDF · עודכן ב־28.9.2026", contentState: "ok", verification: "verified", verificationLabel: "אומת מול מקור", source: "תפריט UMINO (PDF)", verifiedBy: { personId: PEOPLE.dana.id, label: `${PEOPLE.dana.name} · מול הקובץ`, at: at("2026-09-28", "10:00") }, recheck: { date: "2026-10-28" }, usedIn: [{ label: "עדכון תפריט PDF", href: R.task("t-menu-pdf") }] },
  { id: "f-hosting", sectionId: "prices", title: "תפריט אירוח עסקי לאדם", value: "250 ₪ כולל מע״מ ושתייה קלה", contentState: "ok", verification: "partial", verificationLabel: "אומת חלקית", source: "שיחה עם בעל העסק · 24.9", verifiedBy: null, recheck: { date: "2026-10-01", why: "לפני שליחת ההצעה לנועה כהן" }, usedIn: [{ label: "הצעת אירוח עסקי", href: R.proposal("corporate-hosting") }] },
  { id: "f-cocktails", sectionId: "prices", title: "מחירי קוקטיילים", value: "מתוך תפריט הקיץ", contentState: "stale", verification: "verified", verificationLabel: "אומת ביוני", source: "תפריט הקיץ (PDF)", verifiedBy: { personId: PEOPLE.dana.id, label: PEOPLE.dana.name, at: at("2026-06-14", "10:00") }, recheck: { date: "2026-09-15", why: "התפריט הוחלף לתפריט סתיו" }, usedIn: [] },
  { id: "f-veggie", sectionId: "prices", title: "מנה צמחונית באירוח עסקי", value: null, contentState: "missing", verification: "unverified", source: null, verifiedBy: null, recheck: null, usedIn: [{ label: "הצעת אירוח עסקי", href: R.proposal("corporate-hosting") }] },
  { id: "f-tone", sectionId: "tone", title: "טון", value: "חם, קליל, בלי סלנג", contentState: "ok", verification: "verified", verificationLabel: "אומת ע״י בעל העסק", source: "סדנת מיתוג", verifiedBy: ownerCheck(at("2026-08-10", "15:00")), recheck: { date: "2027-02-01" }, usedIn: [] },
  { id: "f-reviews", sectionId: "proof", title: "ביקורות לקוחות לציטוט", value: null, contentState: "missing", verification: "unverified", source: null, verifiedBy: null, recheck: null, usedIn: [] },
  { id: "f-limits", sectionId: "limits", title: "מה אסור לכתוב", value: "לא להבטיח שולחן פנוי בערבי חג", contentState: "ok", verification: "verified", verificationLabel: "אומת ע״י בעל העסק", source: "שיחה עם בעל העסק", verifiedBy: ownerCheck(at("2026-09-20", "12:00")), recheck: { date: "2027-01-01" }, usedIn: [] },
  { id: "f-comp", sectionId: "competitors", title: "מתחרים ישירים", value: "2 מסעדות סושי באותו רחוב", contentState: "ok", verification: "partial", verificationLabel: "אומת חלקית", source: "מחקר של דנה", verifiedBy: null, recheck: { date: "2026-11-01" }, usedIn: [] },
  { id: "f-goal", sectionId: "goals", title: "יעד אוקטובר", value: "120 הזמנות בערבי חמישי", contentState: "ok", verification: "verified", verificationLabel: "אומת ע״י בעל העסק", source: "פגישת יעדים", verifiedBy: ownerCheck(at("2026-09-25", "09:00")), recheck: { date: "2026-11-01" }, usedIn: [{ label: "יעדים וביצועים", href: R.reports }] },
];

/* ---------- G6 connections ---------- */

export const SETTINGS_NAV: { id: string; label: string; href?: string }[] = [
  { id: "business", label: "העסק והסטודיו", href: R.settingsBusiness },
  { id: "brand", label: "Brand Kits" },
  { id: "users", label: "משתמשים והרשאות", href: R.settingsUsers },
  { id: "ai", label: "AI" },
  { id: "connections", label: "חיבורים", href: R.settings },
];

export const CONNECTIONS: Connection[] = [
  {
    id: "instagram", name: "Instagram · UMINO", account: "קריאת מדדים", handle: "@umino", scope: "קריאת מדדים", state: "failed",
    lastSync: at("2026-09-26", "03:00"), permissions: "קריאת מדדים בלבד. אין הרשאת פרסום.",
    failure: {
      since: IG_SINCE, reason: "פג תוקף ההרשאה", detail: "ניסיונות הסנכרון האוטומטיים נכשלו.",
      affected: "מדדי חשיפה ומעורבות בהיום שלי, בפרויקט UMINO, בקמפיין ובדוחות. בכל המקומות מוצג \"—\" עם הסבר.",
      kept: "כל הנתונים עד 27.9. דבר לא נמחק.",
      affectedLinks: [{ label: "היום שלי", href: R.today }, { label: "פרויקט UMINO", href: R.project("umino") }, { label: "דוחות", href: R.reports }],
    },
    afterReconnect: ["בדיקת חיבור", "סנכרון הנתונים מ־27.9", "ההתראה עוברת ל״טופל״"],
  },
  { id: "google", name: "Google · Gmail ויומן", account: "קריאה ויצירת טיוטות", handle: PEOPLE.ron.email, scope: "קריאה ויצירת טיוטות", state: "connected", lastSync: at("2026-10-01", "08:08"), permissions: "קריאת דואר ויומן, יצירת טיוטות. שליחה רק אחרי אישור." },
  { id: "clickup", name: "ClickUp", account: "סביבת Mytiv · משימות ותיקיות", scope: "משימות ותיקיות", state: "connected", lastSync: HOURS_SYNC.at, permissions: "קריאה ועדכון של משימות בסביבת Mytiv." },
  { id: "engine", name: "מנוע השיווק", account: "תוכניות, אישורים והחלטות", scope: "תוכניות, אישורים והחלטות", state: "connected", lastSync: at("2026-10-01", "07:10"), permissions: "קריאה וכתיבה של תוכניות, אישורים והחלטות." },
  { id: "meta", name: "Meta · פרסום", account: "UMINO · תזמון ופרסום אחרי אישור", scope: "תזמון ופרסום אחרי אישור", state: "connected", lastSync: at("2026-10-01", "07:50"), permissions: "תזמון ופרסום — רק אחרי אישור בתור." },
  { id: "images", name: "יצירת תמונות", account: "ספק מחובר · קונספטים בלבד", scope: "קונספטים בלבד", state: "connected", lastSync: null, permissions: "יצירת קונספטים בלבד. לא מפרסם." },
  { id: "ads", name: "מערכות פרסום ממומן", account: "בשלב עתידי", scope: "בשלב עתידי", state: "not_connected", lastSync: null, planned: true, permissions: "אין הרשאות." },
];
