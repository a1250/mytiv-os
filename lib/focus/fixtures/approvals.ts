import type { Approval } from "@/lib/focus/contracts/approvals";
import { R } from "@/lib/focus/routes";
import { at } from "./clock";
import { CLIENTS, PEOPLE } from "./people";

/**
 * Approvals waiting for the owner (handoff D4–D7, M2–M4, M8). Demo data on the UMINO story; behaviour (mandatory
 * reason, pre-execution summary, simulated target system) is driven by `risk` / `execution` / `simulate`.
 */
export const APPROVALS: Approval[] = [
  {
    id: "proposal-noa",
    kind: "proposal_send",
    title: "שליחת הצעת מחיר לנועה כהן",
    context: "מכירות · ליד: נועה כהן · אירוע חברה ל־35",
    client: null,
    summary: "מכירות · שליחה חיצונית · 8,750 ₪",
    risk: "high",
    riskNote: "פעולה חיצונית שלא ניתן לבטל",
    status: "pending",
    version: 1,
    origin: "original",
    requestedAt: at("2026-09-30", "08:00"),
    assigneeId: PEOPLE.dana.id,
    changes: [],
    why: "נועה ביקשה לקבל הצעה עד יום ראשון. השיחה איתה היום ב־10:00.",
    facts: [],
    impact: { effect: "ההצעה תגיע לתיבת הדואר של הלקוחה מיד.", whyRisk: "פעולה חיצונית שלא ניתן לבטל.", reversibility: { kind: "none", label: "לא ניתן לבטל" } },
    history: [],
    execution: {
      target: { system: "gmail", label: "Gmail" },
      from: "ron@demo.example",
      recipient: { name: "נועה כהן", address: "noa.cohen@example.co.il" },
      payload: { title: "אירוח עסקי — 8,750 ₪", detail: "גרסה 1 · כולל מע״מ · בתוקף עד 15.10", amount: { amount: 8750, currency: "ILS" }, attachment: "pdf" },
      after: "גרסה 1 ננעלת לעריכה. נוצרת משימת מעקב לדנה ל־4.10.",
      checks: [
        { id: "amount", text: "הסכום תואם לגרסה 1 של ההצעה", tone: "ok" },
        { id: "email", text: "כתובת המייל תואמת לפרטי הליד", tone: "ok" },
        { id: "body", text: "גוף המייל נכתב בעזרת AI ונערך ע״י דנה", tone: "warning", link: R.proposal("corporate-hosting") },
      ],
      confirmText: "אני מאשר לשלוח לנועה כהן הצעה על סך 8,750 ₪, וידוע לי שלא ניתן לבטל את השליחה.",
      finalLabel: "שלח עכשיו לנועה",
      pendingLabel: "ממתין ל־Gmail…",
      pendingNote: "\"נשלח\" יוצג רק אחרי ש־Gmail יאשר את השליחה.",
      successTitle: "ההצעה נשלחה",
      successDetail: "Gmail אישר את השליחה. משימת מעקב נוצרה לדנה ל־4.10.",
      failureTitle: "Gmail לא אישר את השליחה",
      failureDetail: "ההצעה לא סומנה כנשלחה ונשארה כאן כפי שאושרה. דבר לא נשלח ללקוחה.",
      followUpTask: { title: "מעקב: הצעת מחיר לנועה כהן", dueDate: "2026-10-04", assigneeId: PEOPLE.dana.id },
    },
    simulate: { latencyMs: 2200, outcome: "success" },
  },
  {
    id: "promo-1plus1",
    kind: "campaign_change",
    title: "הוספת מבצע 1+1 לקמפיין יום חמישי",
    context: "UMINO · ערבי סושי של חמישי · שינוי בקמפיין",
    client: CLIENTS.umino,
    summary: "UMINO · שינוי בקמפיין · משפיע על מחיר",
    risk: "medium",
    riskNote: "דורש בדיקה",
    status: "pending",
    origin: "ai_suggested",
    originLabel: "הוצע ע״י מנוע השיווק",
    requestedAt: at("2026-09-28", "09:30"),
    trigger: "בעקבות הבריף מ־20.9",
    assigneeId: PEOPLE.ron.id,
    changes: [
      { what: "מבצע בקמפיין", before: null, after: "1+1 על סטים נבחרים", emphasis: "changed" },
      { what: "תכנים", before: "סטורי, פוסט 4:5, קרוסלה", after: "אותם תכנים, יחזרו לאישור שלך" },
      { what: "מחיר לסועד", before: "לפי התפריט", after: "מוזל בחמישי, בסטים נבחרים", emphasis: "warning" },
      { what: "פרסום", before: null, after: "אין שינוי. דבר לא יפורסם." },
    ],
    why: "מטרת הקמפיין היא יותר הזמנות בין 19:00 ל־22:00. מבצע לזוגות וקבוצות מתאים לקהל היעד ולמסר \"ערב חמישי עם חברים\".",
    facts: [
      { id: "f1", text: "הסטים הנבחרים ומחיריהם", verification: "verified", basis: "תפריט UMINO, עודכן ב־28.9.2026", source: { system: "menu", label: "מקור", href: R.clientBrain("umino") } },
      { id: "f2", text: "שעות פעילות בחמישי: 18:00–23:30", verification: "verified", basis: "מוח העסק · אומת ע״י בעל העסק" },
      { id: "f3", text: "תוקף המבצע", verification: "unverified", basis: "טרם אומת. נדרש לפני כל פרסום." },
      { id: "f4", text: "המבצע יגדיל הזמנות של קבוצות", verification: "unverified", basis: "הערכה של AI, אין נתון תומך" },
    ],
    impact: {
      effect: "על הלקוח: מחיר מוזל. מערכות חיצוניות: אין.",
      whyRisk: "משפיע על מחיר, ולכן דורש אישור בעלים.",
      reversibility: { kind: "instant", label: "ביטול מיידי עד לפרסום" },
    },
    history: [
      { at: at("2026-09-28", "09:30"), text: "מנוע השיווק הציע את השינוי" },
      { at: at("2026-09-29", "11:05"), text: "דנה: \"לבדוק תוקף מול רון\"" },
    ],
    short: { what: "יתווסף מבצע 1+1 לשלושה תכנים. דבר לא יפורסם.", why: "יותר הזמנות 19:00–22:00 מזוגות וקבוצות." },
    aiNote: "המנוע השתמש בבריף, בתפריט ובמטרות הקמפיין. הוא לא בדק זמינות מטבח או רווחיות.",
    reasonHint: "התוקף שתכתוב יישמר כעובדה מאומתת במוח העסק של UMINO.",
    managerNote: "רק בעלים יכול לאשר שינוי מחיר.",
  },
  {
    id: "content-sushi-story",
    kind: "content",
    title: "סטורי ופוסט \"ערבי סושי של חמישי\"",
    context: "UMINO · ערבי סושי של חמישי · Instagram",
    client: CLIENTS.umino,
    summary: "UMINO · מתוזמן למחר 18:00",
    risk: "low",
    riskNote: "",
    status: "pending",
    version: 2,
    origin: "ai_concept",
    originLabel: "קונספט AI · נערך ע״י דנה",
    requestedAt: at("2026-09-29", "16:00"),
    assigneeId: PEOPLE.dana.id,
    changes: [{ what: "מה השתנה מגרסה 1", before: null, after: "הכותרת הוזזה, המחיר הוסר" }],
    why: "",
    facts: [
      { id: "c1", text: "19:00–22:00", verification: "verified", basis: "מוח העסק" },
      { id: "c2", text: "מבצע 1+1", verification: "unverified", basis: "תוקף לא אומת" },
    ],
    impact: { effect: "הסטורי יעלה ב־Instagram במועד המתוכנן.", whyRisk: "", reversibility: { kind: "until", until: at("2026-10-02", "18:00"), label: "אפשר לבטל עד 18:00 ביום הפרסום" } },
    history: [],
    reasonHint: "הפריט יעבור לדנה כ\"נדרש תיקון\". גרסה 2 נשמרת.",
    content: {
      designId: "thursday-sushi",
      formats: [{ key: "story", label: "סטורי", where: "Instagram" }, { key: "post", label: "פוסט אנכי", where: "פיד" }],
      channel: "Instagram · @umino",
      scheduledAt: at("2026-10-02", "18:00"),
      createdBy: "דנה",
      editedBy: "דנה",
      caption: { before: "חמישי בערב ב־UMINO. סושי, קוקטיילים וחברים, מ־19:00 ועד 22:00. ", flagged: "1+1 על סטים נבחרים.", after: " הזמנת שולחן בקישור." },
      annotations: [
        { id: "n1", n: 1, target: "כותרת הסטורי", text: "הכותרת נוגעת בשם החשבון. להוריד קצת.", format: "story" },
        { id: "n2", n: 2, target: "טקסט נלווה", text: "לא לכתוב 1+1 עד שהתוקף מאומת." },
      ],
      draftReason: "שני תיקונים קטנים, אחר כך אפשר לתזמן.",
    },
    simulate: { latencyMs: 1600, outcome: "success" },
  },
  {
    id: "plan-october",
    kind: "plan",
    title: "תוכנית שיווק לאוקטובר",
    context: "גל פילאטיס · תוכנית · 3 מהלכים",
    client: CLIENTS.gal,
    summary: "גל פילאטיס · תוכנית · 3 מהלכים",
    risk: "medium",
    riskNote: "דורש בדיקה",
    status: "pending",
    origin: "original",
    requestedAt: at("2026-09-26", "10:00"),
    assigneeId: PEOPLE.yoav.id,
    changes: [],
    why: "",
    facts: [],
    impact: { effect: "", whyRisk: "משפיע על תקציב.", reversibility: { kind: "instant", label: "אפשר לשנות עד תחילת הביצוע" } },
    history: [],
  },
];

/** Approvals waiting on others (D4 "ממתין לאחרים"). */
export const WAITING_ON_OTHERS = [
  { id: "w1", title: "פוסט 4:5 · ערבי סושי", meta: "UMINO · ממתין לבעל העסק אצל הלקוח", by: PEOPLE.yoav.id, risk: "low" as const, since: at("2026-09-27", "10:00"), action: "שלח תזכורת" },
  { id: "w2", title: "באנר לאתר · תפריט סתיו", meta: "UMINO · ממתין לדנה", by: PEOPLE.yoav.id, risk: "low" as const, since: at("2026-09-30", "09:00"), action: null },
];

/** Decided lately (D4 side panel) — each with its reversibility. */
export const RECENTLY_DECIDED = [
  { id: "r1", glyph: "✓", text: "באנר תפריט קיץ", when: "אתמול", undoable: true },
  { id: "r2", glyph: "↺", text: "קרוסלה \"מאחורי הקלעים\"", when: "נשלח לתיקון", undoable: false },
  { id: "r3", glyph: "✕", text: "מבצע \"שתייה חינם\"", when: "נדחה 27.9", undoable: false },
];

/** dueAt for queue ordering (risk first, then by when it must be decided). */
export const APPROVAL_DUE: Record<string, string> = {
  "proposal-noa": at("2026-10-01", "10:00"),
  "promo-1plus1": at("2026-10-01", "17:00"),
  "content-sushi-story": at("2026-10-01", "11:00"),
  "plan-october": at("2026-10-06", "12:00"),
};
