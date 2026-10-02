/**
 * TEMPORARY demo data for the Focus redesign prototype. Mirrors the approved "Direction C — Focus" board.
 * No backend, DB or contract is involved yet — once the design is approved these shapes get replaced by the
 * real Mytiv Work / marketing / sales sources. Labels are Hebrew because the product is Hebrew-first (RTL).
 */

export type Risk = "high" | "mid" | "low" | "fault" | "info";

export const RISK_META: Record<Risk, { chip: string; label: string; glyph: string }> = {
  high: { chip: "f-chip--red", label: "סיכון גבוה", glyph: "▲" },
  mid: { chip: "f-chip--amber", label: "סיכון בינוני", glyph: "◆" },
  low: { chip: "f-chip--green", label: "סיכון נמוך", glyph: "●" },
  fault: { chip: "f-chip--neutral", label: "תקלה בחיבור", glyph: "!" },
  info: { chip: "f-chip--neutral", label: "מידע", glyph: "•" },
};

export type TodayItem = {
  id: string;
  risk: Risk;
  wait: string;
  title: string;
  sub: string;
  desc?: string;
  action: string;
};

export type TodayColumn = { id: string; title: string; items: TodayItem[]; quiet?: TodayItem[] };

export const greeting = {
  date: "יום חמישי, 1 באוקטובר 2026",
  name: "רון",
  needsAttention: 6,
  handled: 0,
};

export const todayColumns: TodayColumn[] = [
  {
    id: "now",
    title: "עכשיו",
    items: [
      {
        id: "n1",
        risk: "high",
        wait: "ממתין יום",
        title: 'שלח את ההצעה "אירוח עסקי — 8,750 ₪"',
        sub: "נועה כהן · אירוע חברה ל־35",
        desc: "ביקשה לקבל עד יום ראשון. השיחה איתה היום ב־10:00.",
        action: "בדוק ושלח",
      },
      {
        id: "n2",
        risk: "low",
        wait: "ממתין יומיים",
        title: 'אשר את סטורי "ערבי סושי של חמישי"',
        sub: "UMINO · מתוזמן למחר 18:00",
        action: "בדוק ואשר",
      },
    ],
  },
  {
    id: "today",
    title: "עד סוף היום",
    items: [
      {
        id: "t1",
        risk: "mid",
        wait: "3 ימים",
        title: "החלט על מבצע 1+1 לקמפיין יום חמישי",
        sub: "UMINO · הצעה של AI · משפיע על מחיר",
        action: "פתח החלטה",
      },
      {
        id: "t2",
        risk: "fault",
        wait: "4 ימים",
        title: "חבר מחדש את Instagram",
        sub: "UMINO · מדדים לא מתעדכנים מ־27.9",
        action: "התחבר מחדש",
      },
    ],
  },
  {
    id: "week",
    title: "השבוע",
    items: [],
    quiet: [
      { id: "w1", risk: "low", wait: "", title: "ענה: שעות פתיחה בחג", sub: "UMINO · בקשת מידע", action: "פתח" },
      { id: "w2", risk: "mid", wait: "5 ימים", title: "אשר את תוכנית אוקטובר", sub: "גל פילאטיס", action: "פתח" },
    ],
  },
];

export const stuck = [
  { id: "s1", text: "צילום מנת הספיישל ממתין לצלם 12 ימים, ללא אחראי.", action: "הקצה" },
  { id: "s2", text: "אין נכס מאושר לפוסט 4:5 של הקמפיין.", action: null },
  { id: "s3", text: "גל פילאטיס ממתינה לחומרים 6 ימים.", action: null },
];

export const calendar = {
  source: "Google · סונכרן לפני 2 דק׳",
  rows: [
    { time: "08:10", free: true },
    { time: "09:00", free: true },
    { time: "10:00", title: "שיחת היכרות — נועה כהן", sub: "Google Meet · 30 דק׳", cta: "הצטרף" },
    { time: "13:30", title: "פגישת צוות שבועית", sub: "משרד · 45 דק׳" },
    { time: "18:00", title: "פרסום מתוזמן: סטורי ערבי סושי", sub: "ממתין לאישור שלך" },
  ],
};

export const continueItems = [
  { id: "c1", t: "הצעה: אירוח עסקי", s: "אתמול" },
  { id: "c2", t: "סטורי ערבי סושי · גרסה 2", s: "לפני 3 שעות" },
];

export const projects = [
  {
    id: "umino",
    name: "UMINO",
    ctx: "השקת תפריט סתיו",
    risk: "בסיכון",
    note: "שתי חסימות מעכבות את הפוסט המרכזי.",
    owner: "דנה",
    due: "יעד 8.10",
    hours: "34/40 שעות",
    next: "הבא: לתאם צילום עד 3.10",
  },
  {
    id: "gal",
    name: "גל פילאטיס",
    ctx: "אתר",
    risk: "בסיכון",
    note: "ממתינים לחומרים מהלקוחה 6 ימים.",
    owner: "יואב",
    due: "יעד 15.10",
    hours: "22/30 שעות",
    next: "הבא: שיחה עם הלקוחה",
  },
];

export const kpis = [
  { label: "לידים חדשים", value: "2", foot: "מכירות · 08:02 · ידוע", delta: "+1" },
  { label: "הצעות פתוחות", value: "8,750 ₪", foot: "1 הצעה · טרם נשלחה" },
  { label: "משימות באיחור", value: "2", foot: "ClickUp · לפני 4 דק׳" },
  { label: "שעות מול תקציב", value: "≈ 56/70", foot: "מוערך · 2 ללא דיווח" },
  { label: "תוכן לאישור", value: "3", foot: "סטודיו · ידוע" },
  { label: "חשיפות Instagram", value: "—", foot: "לא זמין · מ־27.9", na: true },
];

export const NAV = [
  { href: "/focus", label: "היום שלי" },
  { href: "/focus/projects", label: "לקוחות ופרויקטים" },
  { href: "/focus/studio", label: "שיווק ותוכן" },
  { href: "/focus/sales", label: "מכירות" },
  { href: "/focus/work", label: "עבודה ותקשורת" },
  { href: "/focus/reports", label: "דוחות" },
];

// ---- C2: project environment (סביבת פרויקט) ----
export const projectsIndex: Record<string, string> = { umino: "UMINO", gal: "גל פילאטיס" };

export const projectDetail = {
  id: "umino",
  name: "UMINO",
  ctx: "השקת תפריט סתיו",
  owner: "דנה",
  due: "יעד 8.10.2026",
  updated: "עודכן לפני שעה",
  riskLabel: "בסיכון · 2 חסימות",
  tabs: [
    { id: "overview", label: "סקירה", count: null },
    { id: "exec", label: "ביצוע", count: 2 },
    { id: "marketing", label: "שיווק ותוכן", count: 2 },
    { id: "knowledge", label: "ידע ותוצאות", count: null },
  ],
  milestonesLead: "עוד 7 ימים להשקה",
  milestones: [
    { label: "בריף", state: "done", date: "15.9" },
    { label: "תוכנית שיווק", state: "done", date: "22.9" },
    { label: "צילום", state: "blocked", date: "3.10" },
    { label: "תוכן לאישור", state: "todo", date: "6.10" },
    { label: "השקה", state: "todo", date: "8.10" },
  ] as { label: string; state: "done" | "blocked" | "todo"; date: string }[],
  nextAction: {
    title: "לתאם צילום של מנת הספיישל עד 3.10",
    why: "חוסם את הפוסט 4:5 ואת הקרוסלה. אין אחראי כבר 12 ימים.",
    action: "הקצה לי ותאם",
  },
  hours: { pct: 85, label: "34 מתוך 40 שעות", source: "ClickUp · לפני 4 דק׳" },
  mediaBudget: "תקציב מדיה: — טרם התקבל",
  blockers: [
    { title: "צילום מנת הספיישל", meta: "ממתין לצלם · ללא אחראי · 12 ימים" },
    { title: "פוסט 4:5", meta: "תלוי בצילום · יואב" },
  ],
  approvals: [
    { title: "מבצע 1+1 בימי חמישי", risk: "mid" as Risk, meta: "ממתין לרון" },
    { title: "סטורי ערבי סושי", risk: "low" as Risk, meta: "מחר 18:00" },
  ],
  results: [
    { label: "הזמנות בימי חמישי", value: "≈ 96 מוערך", note: "מערכת ההזמנות · 30.9 · חסר יום אחד · מקור", na: false },
    { label: "חשיפות Instagram", value: "—", note: "לא זמין עקב תקלה בחיבור מ־27.9", na: true },
  ],
};

// ---- C3: approvals, focus mode (אישורים · מצב פוקוס) ----
export const approvalFlow = {
  header: { risk: "פעולה בסיכון גבוה, שלב 2 מתוך 2", pos: "אישור 3 מתוך 4" },
  handled: [
    { mark: "✓", state: "אושר · 08:12", title: "מבצע 1+1 לקמפיין יום חמישי", note: '"בתוקף עד 31.10"', undo: "בטל" },
    { mark: "↺", state: "נשלח לתיקון · 08:13", title: 'סטורי "ערבי סושי של חמישי"', note: "עבר לדנה", undo: null },
  ],
  upNext: { title: "תוכנית אוקטובר", sub: "גל פילאטיס · ◆ בינוני" },
  steps: [
    { n: "✓", label: "בדיקה", done: true },
    { n: "2", label: "סיכום סופי", done: false },
    { n: "3", label: "שליחה", done: false },
  ],
  context: "מכירות · ליד: נועה כהן · אירוע חברה ל־35",
  title: "שליחת הצעת מחיר לנועה כהן",
  riskLine: "סיכון גבוה: פעולה חיצונית שלא ניתן לבטל",
  lead: "ההצעה תגיע לתיבת הדואר של הלקוחה מיד.",
  fields: [
    { k: "נמענת", v: "נועה כהן · noa.cohen@example.co.il" },
    { k: "מה יישלח", v: "PDF · אירוח עסקי — 8,750 ₪", sub: "גרסה 1 · כולל מע״מ · בתוקף עד 15.10" },
    { k: "דרך", v: "Gmail · מהחשבון ron@mytiv.co.il" },
    { k: "אחרי השליחה", v: "גרסה 1 ננעלת לעריכה. נוצרת משימת מעקב לדנה ל־4.10." },
  ],
  checks: [
    { ok: true, text: "הסכום תואם לגרסה 1 של ההצעה" },
    { ok: true, text: "כתובת המייל תואמת לפרטי הליד" },
    { ok: "info", text: "גוף המייל נכתב בעזרת AI ונערך ע״י דנה", link: "הצג טקסט" },
  ] as { ok: boolean | "info"; text: string; link?: string }[],
  consent: "אני מאשר לשלוח לנועה כהן הצעה על סך 8,750 ₪, וידוע לי שלא ניתן לבטל את השליחה.",
  cta: "שלח עכשיו לנועה",
  back: "חזור לבדיקה",
  note: '"נשלח" יוצג רק אחרי ש־Gmail יאשר את השליחה.',
  after: [
    { icon: "✓", tone: "green", title: "ההצעה נשלחה", body: "Gmail אישר ב־08:14. משימת מעקב נוצרה ל־4.10.", link: "פתח ביומן הפעולות" },
    { icon: "⧗", tone: "neutral", title: "ממתין לאישור Gmail", body: "אם אין תשובה תוך דקה, ההצעה נשמרת כטיוטה בדואר ולא מסומנת כנשלחה." },
  ],
};
