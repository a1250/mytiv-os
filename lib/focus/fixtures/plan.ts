import type {
  AssetSummary, BuilderProposal, Client, ContentRequirement, CreateMoveNeed, DayItem, Goal, Move, Plan, Priority, ProductionRow, Recommendation, TimelineItem,
} from "@/lib/focus/contracts/plan";
import { CLIENTS, PEOPLE } from "./people";

/**
 * Plan demo data (Plan design package → "Demo data"): client UMINO, October 2026. The numbers add up and are checked
 * in tests/focus-plan.vitest.ts: total ₪14,000 = ₪6,000 + ₪5,000 + ₪1,800 + ₪1,200 unallocated; committed ₪8,500;
 * spent ₪4,250 + unknown; expected 40 / 40 leads, 300 / 320 bookings, ₪45K / ₪45K revenue.
 *
 * The Plan snapshot is taken on 7.10 (PLAN_TODAY) — the package's "today". Days are days of October.
 */
export const PLAN_TODAY = 7;
export const PLAN_MONTH_DAYS = 31;
/** the current week of the month (the "השבוע" filter and the tinted timeline column) */
export const PLAN_WEEK = { from: 4, to: 10 } as const;
export const PLAN_WEEKS = [
  { from: 1, to: 3 }, { from: 4, to: 10 }, { from: 11, to: 17 }, { from: 18, to: 24 }, { from: 25, to: 31 },
] as const;

export const PLAN_CLIENT: Client = { ...CLIENTS.umino, slug: "umino" };

/* ---------- priorities + goals ---------- */

export const PRIORITIES: Priority[] = [
  {
    id: "p-events", clientId: PLAN_CLIENT.id, name: "אירועים עסקיים", shortName: "אירועים", description: "אירוח פרטי לחברות, 20–120 אורחים",
    offer: { label: "תפריט אירועים", publishable: true }, ownerId: PEOPLE.dana.id,
    whyNow: "עונת אירועי סוף השנה נפתחת ב־13.10; פער של ₪24K מול יעד ההכנסות מאירועים (Revenue Brief, הערכה)",
    channels: ["google", "meta", "linkedin"],
  },
  {
    id: "p-sunset", clientId: PLAN_CLIENT.id, name: "הזמנות שקיעה", shortName: "שקיעה", description: "ארוחת ערב מוקדמת מול הים, 18:00–19:30",
    offer: { label: "ארוחת שקיעה", publishable: true }, ownerId: PEOPLE.yoav.id,
    whyNow: "40 מקומות בשקיעה ליום בתפוסה ממוצעת של 70% (מוח העסק, אומת)",
    channels: ["meta", "instagram", "whatsapp"],
  },
  {
    id: "p-delivery", clientId: PLAN_CLIENT.id, name: "משלוחים", shortName: "משלוחים", description: "הזמנה מהאתר, רדיוס 5 ק״מ",
    offer: { label: "תפריט משלוחים", publishable: true }, ownerId: PEOPLE.dana.id,
    whyNow: "השקת תפריט הסתיו ב־22.10 (לוח השנה במוח העסק)",
    channels: ["google", "meta"],
  },
];

export const GOALS: Goal[] = [
  {
    id: "g-events", priorityId: "p-events", metricLabel: "לידים מוסמכים", unit: "qualified_leads", target: 40,
    actual: { kind: "known", value: 11 }, source: { label: "מכירות · לידים שסומנו מוסמכים", directness: "direct" },
  },
  {
    id: "g-sunset", priorityId: "p-sunset", metricLabel: "הזמנות", unit: "bookings", target: 320,
    actual: { kind: "estimated", value: 142, basis: "שיוך לפי שעת ההזמנה במערכת ההזמנות" },
    source: { label: "מערכת ההזמנות · שיוך לפי שעה", directness: "estimated" },
  },
  {
    id: "g-delivery", priorityId: "p-delivery", metricLabel: "הכנסה", unit: "ils", target: 45000,
    actual: { kind: "unknown", reason: "אין מקור מדידה ליעד: מערכת ההזמנות לא מחוברת" }, source: null,
  },
];
const goal = (id: string) => GOALS.find((g) => g.id === id)!;

/* ---------- moves ---------- */

export const MOVES: Move[] = [
  {
    id: "m-events-google", priorityId: "p-events", goalId: "g-events", name: "Google Search", longName: "Google Search",
    typeLabel: "קמפיין ממומן", sub: "קמפיין ממומן", type: "paid_search", channel: "google", channelLabel: "Google",
    state: "live", attention: "העלות לליד עלתה 22%", optimizing: null, health: "attention", healthScore: 58,
    expected: 18, actual: { kind: "known", value: 11 },
    budget: { planned: 2500, committed: 2500, spent: { kind: "known", value: 1850 } },
    mainIssue: "העלות לליד עלתה 22%; 4 ביטויי חיפוש מבזבזים תקציב", recommendationId: "r-events-negatives", ownerId: PEOPLE.dana.id,
  },
  {
    id: "m-events-meta", priorityId: "p-events", goalId: "g-events", name: "Meta לידים", longName: "Meta לידים",
    typeLabel: "קמפיין ממומן", sub: "קמפיין ממומן", type: "paid_social", channel: "meta", channelLabel: "Meta",
    state: "building", attention: null, optimizing: null, health: "unknown", healthScore: null,
    expected: 15, actual: null, budget: { planned: 2500, committed: null, spent: null }, startDay: 13,
    mainIssue: "2 קריאייטיבים אנכיים ממתינים לאישור; ההשקה ב־13.10", recommendationId: null, builderId: "events-meta",
    overviewNote: "2 קריאייטיבים ממתינים לאישור", ownerId: PEOPLE.dana.id,
  },
  {
    id: "m-events-linkedin", priorityId: "p-events", goalId: "g-events", name: "LinkedIn", longName: "פנייה יזומה · LinkedIn",
    typeLabel: "פנייה יזומה", sub: "פנייה יזומה", type: "outreach", channel: "linkedin", channelLabel: "LinkedIn",
    state: "planned", attention: null, optimizing: null, health: "unknown", healthScore: null,
    expected: 7, actual: null, budget: { planned: 1000, committed: null, spent: null }, buildStartDay: 12, startDay: 19,
    mainIssue: "טרם נבנה · הבנייה מתחילה 12.10", recommendationId: null, overviewNote: "טרם נבנה", ownerId: PEOPLE.yoav.id,
  },
  {
    id: "m-sunset-meta", priorityId: "p-sunset", goalId: "g-sunset", name: "Meta חשיפה", longName: "Meta חשיפה · Instagram",
    typeLabel: "קמפיין ממומן", sub: "Instagram", type: "paid_social", channel: "meta", channelLabel: "Meta",
    state: "live", attention: "קריאייטיב מעייף", optimizing: null, health: "attention", healthScore: 61,
    expected: 180, actual: { kind: "estimated", value: 82, basis: "שיוך לפי שעת ההזמנה" },
    budget: { planned: 3500, committed: 3500, spent: { kind: "known", value: 2100 } },
    mainIssue: "אותו קריאייטיב 6 שבועות ברצף; התגובה ירדה 27% בשבועיים", recommendationId: "r-sunset-refresh",
    overviewNote: "רענון קריאייטיב", ownerId: PEOPLE.dana.id,
  },
  {
    id: "m-sunset-organic", priorityId: "p-sunset", goalId: "g-sunset", name: "סדרת תוכן", longName: "סדרת תוכן אורגנית",
    typeLabel: "סדרת תוכן", sub: "אורגני · Instagram", type: "organic_series", channel: "instagram", channelLabel: "Instagram",
    state: "live", attention: null, optimizing: null, health: "good", healthScore: 82,
    expected: 90, actual: { kind: "estimated", value: 48, basis: "שיוך לפי שעת ההזמנה" },
    budget: { planned: 1200, committed: 1200, spent: { kind: "known", value: 300 }, manualAt: "2026-10-05" },
    mainIssue: null, recommendationId: null, ownerId: PEOPLE.yoav.id,
  },
  {
    id: "m-sunset-crm", priorityId: "p-sunset", goalId: "g-sunset", name: "רצף CRM", longName: "רצף CRM · WhatsApp",
    typeLabel: "רצף CRM", sub: "WhatsApp", type: "crm_sequence", channel: "whatsapp", channelLabel: "WhatsApp",
    state: "planned", attention: null, optimizing: null, health: "unknown", healthScore: null,
    expected: 30, actual: null, budget: { planned: 300, committed: null, spent: null }, buildStartDay: 9, startDay: 16,
    mainIssue: "טרם נבנה", recommendationId: null, overviewNote: "טרם נבנה", ownerId: PEOPLE.yoav.id,
  },
  {
    id: "m-delivery-google", priorityId: "p-delivery", goalId: "g-delivery", name: "Google Search · משלוחים", longName: "Google Search · משלוחים",
    typeLabel: "קמפיין ממומן", sub: "קמפיין ממומן", type: "paid_search", channel: "google", channelLabel: "Google",
    state: "live", attention: null, optimizing: null, health: "unknown", healthScore: null,
    expected: 30000, actual: null,
    budget: { planned: 1300, committed: 1300, spent: { kind: "unknown", reason: "Google לא מחובר" } },
    mainIssue: null, recommendationId: null, ownerId: PEOPLE.dana.id,
  },
  {
    id: "m-delivery-meta", priorityId: "p-delivery", goalId: "g-delivery", name: "Meta · תפריט סתיו", longName: "Meta · תפריט סתיו",
    typeLabel: "קמפיין ממומן", sub: "קמפיין ממומן", type: "paid_social", channel: "meta", channelLabel: "Meta",
    state: "planned", attention: null, optimizing: null, health: "unknown", healthScore: null,
    expected: 15000, actual: null, budget: { planned: 500, committed: null, spent: null }, buildStartDay: 15, startDay: 22,
    mainIssue: "תמונות מנות סתיו חסרות לפני 22.10", recommendationId: null, builderId: "fallmenu-meta",
    overviewNote: "תמונות מנות", ownerId: PEOPLE.dana.id,
  },
];

/**
 * The move the Create Move panel proposes for the Sunset coverage gap. It is not in the Plan until someone saves it
 * as planned or starts building it (state comes from the Plan demo state).
 */
export const PROPOSED_MOVES: Move[] = [
  {
    id: "m-sunset-google", priorityId: "p-sunset", goalId: "g-sunset", name: "Google Search", longName: "Google Search · שקיעה",
    typeLabel: "קמפיין ממומן", sub: "קמפיין ממומן", type: "paid_search", channel: "google", channelLabel: "Google",
    state: "idea", attention: null, optimizing: null, health: "unknown", healthScore: null,
    expected: 20, actual: null, budget: { planned: 1200, committed: null, spent: null }, startDay: 9,
    mainIssue: null, recommendationId: null, builderId: "sunset-google", ownerId: PEOPLE.dana.id,
  },
  {
    id: "m-sunset-meta-boost", priorityId: "p-sunset", goalId: "g-sunset", name: "הגדלת Meta חשיפה", longName: "הגדלת Meta חשיפה · שקיעה",
    typeLabel: "קמפיין ממומן", sub: "Instagram", type: "paid_social", channel: "meta", channelLabel: "Meta",
    state: "idea", attention: null, optimizing: null, health: "unknown", healthScore: null,
    expected: 14, actual: null, budget: { planned: 1200, committed: null, spent: null }, startDay: 14,
    mainIssue: "כדאי רק אחרי רענון הקריאייטיב ב־14.10", recommendationId: null, ownerId: PEOPLE.dana.id,
  },
  {
    id: "m-sunset-whatsapp", priorityId: "p-sunset", goalId: "g-sunset", name: "הודעת WhatsApp", longName: "הודעת WhatsApp ללקוחות חוזרים",
    typeLabel: "רצף CRM", sub: "WhatsApp", type: "crm_sequence", channel: "whatsapp", channelLabel: "WhatsApp",
    state: "idea", attention: null, optimizing: null, health: "unknown", healthScore: null,
    expected: 8, actual: null, budget: { planned: 0, committed: null, spent: null }, startDay: 12,
    mainIssue: null, recommendationId: null, ownerId: PEOPLE.yoav.id,
  },
];

/** Create Move: the channel options for a plan need, with the context the builder inherits. */
export const CREATE_MOVE_NEEDS: CreateMoveNeed[] = [
  {
    needId: "need-sunset-20", title: "מהלך חדש ל־20 הזמנות",
    lead: "המהלכים הקיימים מכסים 300 מתוך 320. איפה הכי סביר להשיג את ה־20 הנותרות?",
    options: [
      { moveId: "m-sunset-google", label: "Google Search", why: "אנשים כבר מחפשים \"מסעדה עם שקיעה\" באזור. השקיעה עוד לא מקודמת ב־Google.", expected: 20, cost: 1200, recommended: true, builderId: "sunset-google", channelWord: "Google" },
      { moveId: "m-sunset-meta-boost", label: "הגדלת Meta חשיפה", why: "הקריאייטיב הנוכחי מעייף; כדאי רק אחרי הרענון ב־14.10.", expected: 14, cost: 1200 },
      { moveId: "m-sunset-whatsapp", label: "הודעת WhatsApp ללקוחות חוזרים", why: "זול, אבל הרשימה קטנה (380 אנשי קשר עם הסכמה).", expected: 8, cost: 0 },
    ],
    others: ["סדרת תוכן", "אירוע", "שיתוף פעולה"],
    inherited: {
      plan: "הזמנות שקיעה · יעד 320 הזמנות · אוקטובר · תרומה צפויה 20",
      brain: "ארוחת שקיעה 18:00–19:30 · נמל תל אביב · דף umino.co.il/sunset · אסור: \"הנוף הכי יפה בעיר\"",
      assets: "6 תמונות מאושרות לפרסום ממומן, 4 מתאימות ל־Google",
      earlier: "Google Search · משלוחים: עלות להמרה ₪58, ביטויים עם \"ים\" הביאו 61%",
    },
    autoFilled: { type: "קמפיין ממומן", purpose: "הזמנות", dates: "9–31.10", owner: "דנה" },
    approvalNote: "התקציב יגיע מ־₪1,200 הלא מוקצים. זה שינוי בחלוקת התוכנית ולכן יעבור לאישור בעלים.",
  },
];

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "r-events-negatives", moveId: "m-events-google", text: "הוסף 12 מילים שליליות", route: "marketing",
    evidence: "4 ביטויי חיפוש (\"אולם חתונות\", \"עבודה במסעדה\", \"מסעדה זולה\", \"משלוחים\") הוציאו ₪310 בשבועיים בלי ליד",
    tasks: [{ title: "הוספת 12 מילים שליליות ל־Google Search · אירועים", ownerId: PEOPLE.dana.id, dueDay: 9 }],
  },
  {
    id: "r-sunset-refresh", moveId: "m-sunset-meta", text: "החלף קריאייטיב עד 14.10", route: "marketing",
    evidence: "אותו קריאייטיב 6 שבועות ברצף; התגובה ירדה 27% בשבועיים; תדירות 4.3",
    tasks: [
      { title: "הפקת 2 קריאייטיבים רעננים 4:5 · שקיעה", ownerId: PEOPLE.yoav.id, dueDay: 12 },
      { title: "החלפת הקריאייטיב ב־Meta חשיפה · שקיעה", ownerId: PEOPLE.dana.id, dueDay: 14 },
    ],
  },
];

/* ---------- the plan ---------- */

export const PLAN_OCTOBER: Plan = {
  id: "plan-umino-2026-10",
  client: PLAN_CLIENT,
  period: { kind: "month", month: "2026-10" },
  state: "in_progress",
  total: 14000,
  priorities: [
    {
      priorityId: "p-events", rank: 1, goal: goal("g-events"), secondaryGoals: ["8 הצעות מחיר שנשלחו"], allocation: 6000,
      status: "at_risk", statusReason: "Meta עוד לא עלה; Google לבדו מביא כ־1.6 ליד ביום, נדרשים 1.3 נוספים",
      statusReasonShort: "Meta עוד לא עלה; Google לבדו לא מספיק",
      moveIds: ["m-events-google", "m-events-meta", "m-events-linkedin"], needs: [],
      changeLog: [{ at: "2026-10-01", text: "התוכנית אושרה ע״י רון" }, { at: "2026-10-04", text: "Meta לידים עבר לבנייה" }],
    },
    {
      priorityId: "p-sunset", rank: 2, goal: goal("g-sunset"), secondaryGoals: ["תפוסה של 85% בשעות השקיעה"], allocation: 5000,
      status: "on_track", statusReason: "קצב ההזמנות מקדים את החודש ב־21%",
      moveIds: ["m-sunset-meta", "m-sunset-organic", "m-sunset-crm"],
      needs: [{ id: "need-sunset-20", priorityId: "p-sunset", kind: "coverage_gap", short: 20, title: "חסר מהלך ל־20 הזמנות.", detail: "התרומות הצפויות נמוכות מהיעד." }],
      changeLog: [{ at: "2026-10-01", text: "התוכנית אושרה ע״י רון" }],
    },
    {
      priorityId: "p-delivery", rank: 3, goal: goal("g-delivery"), secondaryGoals: [], allocation: 1800,
      status: "unknown", statusReason: "אין מקור מדידה ליעד: מערכת ההזמנות לא מחוברת",
      moveIds: ["m-delivery-google", "m-delivery-meta"],
      needs: [{ id: "need-delivery-source", priorityId: "p-delivery", kind: "no_measurement", title: "מקור מדידה ליעד", detail: "מערכת ההזמנות לא מחוברת, אז אין \"בפועל\"." }],
      changeLog: [{ at: "2026-10-01", text: "התוכנית אושרה ע״י רון" }],
    },
  ],
  moments: [
    { id: "mo-sukkot", day: 1, label: "סוף סוכות" },
    { id: "mo-events", day: 13, label: "עונת אירועי סוף שנה נפתחת" },
    { id: "mo-fall", day: 22, label: "השקת תפריט סתיו", strong: true },
  ],
  nextReview: { day: 11, label: "סקירה שבועית · ראשון 11.10" },
};

/* ---------- assets ---------- */

export const ASSET_SUMMARIES: AssetSummary[] = [
  { priorityId: "p-events", total: 14, active: 4, scheduled: 2 },
  { priorityId: "p-sunset", total: 22, active: 3, scheduled: 0, fatigue: "\"שקיעה על המרפסת\" בשימוש 6 שבועות ברצף, התגובה ירדה 27% בשבועיים." },
  { priorityId: "p-delivery", total: 9, active: 2, scheduled: 0, rightsNote: "זכויות על 2 תמונות פגות ב־31.10" },
];

export const REQUIREMENTS: ContentRequirement[] = [
  {
    id: "req-events-vertical", gapLabel: "קריאייטיבים 9:16", priorityId: "p-events", moveId: "m-events-meta", title: "3 קריאייטיבים אנכיים 9:16", forLabel: "Meta לידים",
    spec: "9:16 · לטופס לידים", neededByDay: 11, slots: ["approved", "awaiting_approval", "awaiting_approval"],
    creativeIds: ["cr-hall", "cr-table", "cr-toast"], existingCandidates: [],
  },
  {
    id: "req-events-testimonial", gapLabel: "סרטון המלצה", priorityId: "p-events", moveId: "m-events-meta", title: "סרטון המלצה מלקוח עסקי", forLabel: "Meta לידים",
    spec: "9:16 · 15–30 שניות · לקוח אמיתי ששם אירוע", neededByDay: 18, slots: ["missing"],
    generateBlockedReason: "המלצה חייבת להיות של לקוח אמיתי (כלל במוח העסק)",
    existingCandidates: [
      { id: "as-launch", label: "אירוע השקה, סטארט־אפ", format: "16:9 · 48ש׳", note: "16:9, צריך חיתוך" },
      { id: "as-team", label: "ערב צוות", format: "9:16 · ספטמבר", note: "בשימוש 4 פעמים" },
    ],
    recommended: "ai_client", aiClientNote: "חיתוך הסרטון הקיים ל־9:16 והוספת כתוביות. מסומן \"משופר AI\".",
    requestNote: "יוצר משימה עם בריף מוכן. בעלים: מנהלת התוכן · יעד 15.10",
  },
  {
    id: "req-events-next", gapLabel: "קריאייטיב חדש לשבוע הבא", priorityId: "p-events", moveId: "m-events-meta", title: "קריאייטיב חדש לשבוע הבא", forLabel: "Meta לידים · רענון",
    spec: "9:16 · אחרי שבוע באוויר", neededByDay: 20, slots: ["missing"],
    existingCandidates: [{ id: "as-hall-2", label: "אולם ערוך, ספטמבר", format: "4:5", note: "צריך התאמה ל־9:16" }],
    recommended: "ai_client", aiClientNote: "גרסה אנכית לתמונת האולם הקיימת. מסומן \"משופר AI\".",
    requestNote: "יוצר משימה עם בריף מוכן. בעלים: מנהלת התוכן · יעד 17.10",
  },
  {
    id: "req-events-hall", gapLabel: "תמונות אולם 1:1", priorityId: "p-events", moveId: "m-events-google", title: "4 תמונות אולם 1:1", forLabel: "Google Search · תוספי תמונה",
    spec: "1:1", neededByDay: null, live: true, slots: ["approved", "approved", "approved", "approved"], existingCandidates: [],
  },
  {
    id: "req-sunset-fresh", gapLabel: "2 קריאייטיבים רעננים 4:5", priorityId: "p-sunset", moveId: "m-sunset-meta", title: "2 קריאייטיבים רעננים 4:5", forLabel: "Meta חשיפה · החלפה",
    spec: "4:5 · להחלפת \"שקיעה על המרפסת\"", neededByDay: 14, slots: ["missing", "missing"],
    existingCandidates: [{ id: "as-dinner", label: "שולחן ערב מול הים, ספטמבר", format: "1:1", note: "צריך התאמה ל־4:5" }],
    recommended: "ai_client", aiClientNote: "שתי גרסאות 4:5 מתמונות ערב קיימות. מסומן \"משופר AI\".",
    requestNote: "יוצר משימה עם בריף מוכן. בעלים: מנהלת התוכן · יעד 12.10",
  },
  {
    id: "req-delivery-dishes", gapLabel: "תמונות מנות תפריט סתיו", priorityId: "p-delivery", moveId: "m-delivery-meta", title: "תמונות מנות תפריט סתיו", forLabel: "Meta · תפריט סתיו",
    spec: "1:1 ו־4:5 · 4 מנות חדשות", neededByDay: 22, slots: ["missing", "missing", "missing", "missing"],
    generateBlockedReason: "תמונת מנה חייבת להיות המנה האמיתית (כלל במוח העסק)", existingCandidates: [],
    recommended: "request", requestNote: "יוצר משימה לצילום מנות עם בריף מוכן. בעלים: מנהלת התוכן · יעד 19.10",
  },
];

/* ---------- timeline ---------- */

/** Flight bars — period context only (what is running, being built, waiting). Execution is in `DAY_ITEMS`. */
export const TIMELINE: TimelineItem[] = [
  { id: "tl-eg-live", moveId: "m-events-google", kind: "live", startDay: 1, endDay: 31, label: "פעיל" },
  { id: "tl-em-build", moveId: "m-events-meta", kind: "build", startDay: 1, endDay: 8, label: "בנייה" },
  { id: "tl-em-review", moveId: "m-events-meta", kind: "review", startDay: 9, endDay: 10, label: "בדיקה", agenda: "Meta לידים · בדיקה מתחילה" },
  { id: "tl-em-flight", moveId: "m-events-meta", kind: "waiting_flight", startDay: 13, endDay: 31, label: "ממתין לאישור · עולה 13.10" },
  { id: "tl-el-build", moveId: "m-events-linkedin", kind: "build", startDay: 12, endDay: 18, label: "בנייה", agenda: "LinkedIn · בנייה מתחילה" },
  { id: "tl-el-planned", moveId: "m-events-linkedin", kind: "planned", startDay: 19, endDay: 31, label: "מתוכנן" },
  { id: "tl-sm-live", moveId: "m-sunset-meta", kind: "live", startDay: 1, endDay: 31, label: "פעיל" },
  { id: "tl-so-live", moveId: "m-sunset-organic", kind: "live", startDay: 1, endDay: 31, label: "סדרה אורגנית" },
  { id: "tl-sc-build", moveId: "m-sunset-crm", kind: "build", startDay: 9, endDay: 15, label: "בנייה", agenda: "רצף CRM · בנייה מתחילה" },
  { id: "tl-sc-planned", moveId: "m-sunset-crm", kind: "planned", startDay: 16, endDay: 31, label: "מתוכנן" },
  { id: "tl-dg-live", moveId: "m-delivery-google", kind: "live", startDay: 1, endDay: 31, label: "פעיל" },
  { id: "tl-dm-planned", moveId: "m-delivery-meta", kind: "planned", startDay: 22, endDay: 31, label: "מתוכנן" },
];

const day = (id: string, d: number, type: DayItem["type"], title: string, priorityId: string | null, moveId: string | null, status: DayItem["status"], extra: Partial<DayItem> = {}): DayItem =>
  ({ id, day: d, type, title, priorityId, moveId, status, ...extra });

/**
 * Execution on exact days (UMINO, October; today = 7.10). Past items are done unless something is late; the three
 * situations the package calls out stay true: Meta לידים launches 13.10 with its approval and 2 creatives still open,
 * Sunset's Meta creative is 6 weeks old (refresh 14.10), and the fall-menu dishes do not exist yet (22.10).
 */
export const DAY_ITEMS: DayItem[] = [
  // the whole plan: business moments and the weekly review
  day("di-mo-sukkot", 1, "moment", "סוף סוכות", null, null, "done"),
  day("di-mo-events", 13, "moment", "עונת אירועי סוף שנה נפתחת", null, null, "planned"),
  day("di-mo-fall", 22, "moment", "השקת תפריט סתיו", null, null, "planned"),
  ...[4, 11, 18, 25].map((d) => day(`di-review-${d}`, d, "milestone", "סקירה שבועית של התוכנית", null, null, d < 7 ? "done" : "planned")),

  // אירועים עסקיים
  ...[8, 15, 22, 29].map((d) => day(`di-eg-opt-${d}`, d, "optimization_review", "בדיקת אופטימיזציה · Google Search", "p-events", "m-events-google", "planned")),
  day("di-eg-review-15", 15, "campaign_review", "סקירת אמצע חודש · Google Search", "p-events", "m-events-google", "planned"),
  day("di-em-creatives", 9, "creative_due", "3 קריאייטיבים אנכיים 9:16", "p-events", "m-events-meta", "in_progress", { needs: { requirementId: "req-events-vertical" } }),
  day("di-em-approval", 11, "approval_due", "אישור בעלים · Meta לידים", "p-events", "m-events-meta", "planned"),
  day("di-em-launch", 13, "launch", "השקת Meta לידים", "p-events", "m-events-meta", "planned", { needs: { requirementId: "req-events-vertical", approvalItemId: "di-em-approval" } }),
  day("di-em-testimonial", 18, "creative_due", "סרטון המלצה מלקוח עסקי", "p-events", "m-events-meta", "planned", { needs: { requirementId: "req-events-testimonial" } }),
  day("di-em-next", 20, "creative_refresh", "קריאייטיב חדש לשבוע השני", "p-events", "m-events-meta", "planned", { needs: { requirementId: "req-events-next" } }),
  ...[20, 27].map((d) => day(`di-em-opt-${d}`, d, "optimization_review", "בדיקת אופטימיזציה · Meta לידים", "p-events", "m-events-meta", "planned")),
  day("di-el-launch", 19, "launch", "השקת LinkedIn · מנהלות HR", "p-events", "m-events-linkedin", "planned"),

  // הזמנות שקיעה — organic series (posts, stories, reels), the Meta reach campaign, the CRM sequence
  ...([[2, "done"], [6, "done"], [9, "scheduled"], [13, "scheduled"], [16, "scheduled"], [20, "planned"], [23, "planned"], [27, "planned"], [30, "planned"]] as const)
    .map(([d, st]) => day(`di-so-post-${d}`, d, "post", d === 9 ? "שקיעה על המרפסת" : "פוסט שקיעה שבועי", "p-sunset", "m-sunset-organic", st)),
  ...([[5, "done"], [7, "scheduled"], [12, "planned"], [19, "planned"], [26, "planned"]] as const)
    .map(([d, st]) => day(`di-so-story-${d}`, d, "story", "סטורי · השולחן של הערב", "p-sunset", "m-sunset-organic", st)),
  day("di-so-reel-shoot", 5, "creative_due", "צילום רילס שקיעה", "p-sunset", "m-sunset-organic", "in_progress"),
  day("di-so-reel", 14, "reel", "רילס · 30 שניות של שקיעה", "p-sunset", "m-sunset-organic", "planned"),
  day("di-sm-refresh", 14, "creative_refresh", "רענון קריאייטיב · Meta חשיפה", "p-sunset", "m-sunset-meta", "planned", { needs: { requirementId: "req-sunset-fresh" } }),
  ...[10, 24].map((d) => day(`di-sm-opt-${d}`, d, "optimization_review", "בדיקת אופטימיזציה · Meta חשיפה", "p-sunset", "m-sunset-meta", "planned")),
  day("di-sc-wa-16", 16, "whatsapp", "WhatsApp · הזמנה לשקיעה לחוזרים", "p-sunset", "m-sunset-crm", "planned"),
  day("di-sc-email-18", 18, "email", "ניוזלטר · ערבי שקיעה באוקטובר", "p-sunset", "m-sunset-crm", "planned"),
  day("di-sc-wa-23", 23, "whatsapp", "WhatsApp · תזכורת לסוף השבוע", "p-sunset", "m-sunset-crm", "planned"),

  // משלוחים
  ...[10, 24].map((d) => day(`di-dg-opt-${d}`, d, "optimization_review", "בדיקת אופטימיזציה · Google משלוחים", "p-delivery", "m-delivery-google", "planned")),
  day("di-dm-dishes", 21, "creative_due", "צילום 4 מנות תפריט סתיו", "p-delivery", "m-delivery-meta", "planned", { needs: { requirementId: "req-delivery-dishes" } }),
  day("di-dm-launch", 22, "launch", "השקת תפריט סתיו · Meta", "p-delivery", "m-delivery-meta", "blocked", {
    blockedReason: "המבצע לא אושר לפרסום במוח העסק", needs: { requirementId: "req-delivery-dishes" },
  }),
];

/** Content-production rows: hidden unless a warning, an approval due, a near deadline, an expanded move or the switch. */
export const PRODUCTION: ProductionRow[] = [
  { moveId: "m-events-meta", startDay: 5, endDay: 11, label: "2 ממתינים לאישור · 1 מאושר", warning: true, approvalDue: true, deadlineDay: 11 },
  { moveId: "m-events-google", startDay: 1, endDay: 3, label: "4 תמונות אולם · מאושרות", warning: false, approvalDue: false, deadlineDay: 3 },
  { moveId: "m-sunset-meta", startDay: 10, endDay: 14, label: "2 קריאייטיבים רעננים 4:5", warning: false, approvalDue: false, deadlineDay: 14 },
  { moveId: "m-sunset-organic", startDay: 1, endDay: 31, label: "צילום שבועי לסדרה", warning: false, approvalDue: false, deadlineDay: 31 },
  { moveId: "m-delivery-meta", startDay: 15, endDay: 21, label: "צילום מנות סתיו", warning: false, approvalDue: false, deadlineDay: 21 },
];

/* ---------- builders ---------- */

export const BUILDERS: BuilderProposal[] = [
  {
    id: "sunset-google", moveId: "m-sunset-google", channel: "google", title: "Google Search · הזמנות שקיעה", priorityId: "p-sunset",
    intro: "Mytiv הכין את ההצעה מהתוכנית, ממוח העסק ומ־Google Search · משלוחים. בדוק חמש החלטות:",
    decisions: [
      { key: "promote", label: "מה מקדמים", value: "ארוחת שקיעה מול הים, 18:00–19:30", detail: "מבצע מאושר במוח העסק · דף נחיתה umino.co.il/sunset" },
      { key: "result", label: "איזו תוצאה", value: "20 הזמנות שולחן באוקטובר", detail: "כ־₪60 להזמנה · נספר במערכת ההזמנות (ישיר)" },
      { key: "audience", label: "את מי", value: "מי שמחפש מסעדה לערב, עד 5 ק״מ מהנמל", chips: ["מסעדה עם שקיעה", "ארוחה מול הים", "מסעדה בנמל תל אביב"] },
      { key: "budget", label: "כמה משקיעים", value: "" },
      { key: "acceptable", label: "ההצעה מקובלת?", value: "" },
    ],
    summary: "קמפיין חיפוש אחד, שתי קבוצות מודעות, תשלום לפי הזמנות.",
    removedClaim: "הנוף הכי יפה בעיר",
    budget: { amount: 1200, fromDay: 9, toDay: 31, fromUnallocated: true, costPerResult: { low: 50, high: 66.7 }, resultWord: "הזמנות" },
    preview: { url: "umino.co.il/sunset", headline: "ארוחת שקיעה מול הים | UMINO נמל תל אביב", body: "שולחן ל־18:00 עם השקיעה. תפריט סתיו חדש. הזמינו עכשיו, אישור מיידי.", footer: "15 כותרות · 4 תיאורים · 4 תמונות מהספרייה" },
    details: [
      { key: "structure", label: "מבנה וקבוצות מודעות", summary: "1 · 2", lines: ["קמפיין חיפוש אחד", "קבוצה 1 · שקיעה וים (14 מילות מפתח)", "קבוצה 2 · מסעדה בנמל (10 מילות מפתח)"] },
      { key: "keywords", label: "מילות מפתח והתאמה", summary: "24 · 12 שליליות", lines: ["\"מסעדה עם שקיעה\" · ביטוי", "[ארוחה מול הים] · מדויק", "\"מסעדה בנמל תל אביב\" · ביטוי", "ועוד 21 מילות מפתח", "שליליות: חתונה, עבודה, משלוחים, זול, מתכון ועוד 7"] },
      { key: "location", label: "מיקום ולוח זמנים", summary: "5 ק״מ · 14–19", lines: ["רדיוס 5 ק״מ מנמל תל אביב", "מוצג 14:00–19:00, כל הימים"] },
      { key: "bidding", label: "אסטרטגיית הצעת מחיר", summary: "מקסימום הזמנות", lines: ["מקסימום המרות (הזמנת שולחן)", "בלי מגבלת עלות בשבוע הראשון; בדיקה ב־16.10"] },
      { key: "extensions", label: "תוספים", summary: "4", lines: ["קישורי אתר: תפריט, אירועים", "4 תמונות מהספרייה", "שיחה", "מיקום"] },
      { key: "tracking", label: "דף נחיתה ומעקב", summary: "3/4 · חסר אירוע המרה", problem: "חסר אירוע המרה", lines: ["✓ הדף נטען תוך 1.8 שניות", "✓ תיוג UTM", "✓ מערכת ההזמנות מקושרת", "✕ אירוע המרה על כפתור \"הזמן\" חסר"] },
    ],
    footerNote: "אחרי אישור: מוכן להשקה. ב־V1 אדם מעלה ידנית ומסמן \"פעיל\" עם קישור לקמפיין.",
    sideNote: "אירוע ההמרה על כפתור \"הזמן\" חסר. בשליחה לאישור תיווצר משימת בדיקת מעקב לפני ההשקה (בעלים: אחראי הקמפיין).",
    context: { plan: "לא מוקצה ₪1,200 · הקצאת שקיעה ₪5,000, מחויב ₪4,700", brain: "40 מקומות בשקיעה ליום · בממוצע 70% תפוסה", earlier: "Google · משלוחים: ₪58 להמרה" },
    launchDay: 9,
    preLaunchTask: "בדיקת אירוע המרה על כפתור \"הזמן\" · Google Search · שקיעה",
  },
  {
    id: "events-meta", moveId: "m-events-meta", channel: "meta", title: "Meta לידים · אירועים עסקיים", priorityId: "p-events",
    intro: "Mytiv הכין את ההצעה מהתוכנית, ממוח העסק ומ־Google Search · אירועים. בדוק חמש החלטות:",
    decisions: [
      { key: "promote", label: "מה מקדמים", value: "אירוח פרטי לחברות, 20–120 אורחים", detail: "תפריט אירועים מאושר במוח העסק" },
      { key: "result", label: "איזו תוצאה", value: "15 לידים מוסמכים", detail: "מוסמך = חברה, 20+ אורחים, תאריך בשלושת החודשים הקרובים · נספר במכירות" },
      { key: "audience", label: "את מי", value: "מנהלות משרד ו־HR בחברות במרכז", detail: "+ מי שביקר בעמוד האירועים ב־30 הימים האחרונים · בלי לקוחות קיימים" },
      { key: "budget", label: "כמה משקיעים", value: "" },
      { key: "acceptable", label: "ההצעה מקובלת?", value: "" },
    ],
    summary: "קמפיין לידים אחד, שתי קבוצות: קהל חדש וחזרה למבקרים. טופס לידים בתוך Instagram ו־Facebook.",
    budget: { amount: 2500, fromDay: 13, toDay: 31, fromUnallocated: false, costPerResult: { low: 147, high: 208 }, resultWord: "לידים מוסמכים" },
    budgetNote: "בתוך הקצאת הנושא · צפי כ־₪165 לליד (לפי Google)",
    creatives: [
      { id: "cr-hall", label: "תמונת אולם", origin: "original", availability: "approved" },
      { id: "cr-table", label: "שולחן ערוך", origin: "ai_edited", availability: "awaiting_approval" },
      { id: "cr-toast", label: "צוות בהרמת כוסית", origin: "ai_edited", availability: "awaiting_approval" },
    ],
    creativeNote: "3 גרסאות טקסט · כפתור \"קבלו הצעת מחיר\" · \"החלף\" פותח את ארבע דרכי הכיסוי בלי לצאת מהבונה",
    details: [
      { key: "structure", label: "מטרה ומבנה", summary: "לידים · 1 · 2", lines: ["מטרה: לידים (טופס בתוך Instagram ו־Facebook)", "קבוצה 1 · קהל חדש", "קבוצה 2 · חזרה למבקרי עמוד האירועים"] },
      { key: "audiences", label: "קהלים, החרגות, חזרה", summary: "3", lines: ["מנהלות משרד ו־HR, חברות במרכז", "חזרה: מבקרי עמוד האירועים, 30 יום", "החרגה: לקוחות קיימים"] },
      { key: "placements", label: "מיקומים ולוח זמנים", summary: "אוטומטי · א׳–ה׳", lines: ["מיקומים אוטומטיים", "ימים א׳–ה׳"] },
      { key: "form", label: "טופס לידים", summary: "4 שדות", lines: ["שם", "חברה", "מספר אורחים", "תאריך משוער"] },
      { key: "tracking", label: "יעד ומעקב", summary: "✓ מוכן", lines: ["✓ הלידים נכנסים למכירות", "✓ פיקסל ואירוע ליד"] },
    ],
    footerNote: "יעלה ב־13.10 אחרי אישור · התוכנית תתעדכן: Meta לידים › \"מוכן\"",
    sideNote: "שני הקריאייטיבים הממתינים ייכללו בבקשת האישור. קריאייטיב חדש שעולה לאוויר הוא תמיד אישור בעלים.",
    context: { plan: "הקצאת אירועים ₪6,000 · מחויב ₪2,500", brain: "תפריט אירועים מאושר · 20–120 אורחים", earlier: "Google Search · אירועים: ₪168 לליד מוסמך (ידוע)" },
    launchDay: 13,
  },
  {
    id: "fallmenu-meta", moveId: "m-delivery-meta", channel: "meta", title: "Meta · תפריט סתיו", priorityId: "p-delivery",
    intro: "Mytiv הכין את ההצעה מהתוכנית ומ־Google Search · משלוחים. בדוק חמש החלטות:",
    decisions: [
      { key: "promote", label: "מה מקדמים", value: "תפריט סתיו · 4 מנות חדשות", detail: "המבצע לא אושר לפרסום במוח העסק", warn: "המבצע לא אושר לפרסום במוח העסק" },
      { key: "result", label: "איזו תוצאה", value: "₪15,000 הכנסה ממשלוחים", detail: "אין מקור מדידה ליעד · ההכנסה לא נמדדת" },
      { key: "audience", label: "את מי", value: "תושבי רדיוס 5 ק״מ מהמסעדה", detail: "בלי מי שהזמין בשבוע האחרון" },
      { key: "budget", label: "כמה משקיעים", value: "" },
      { key: "acceptable", label: "ההצעה מקובלת?", value: "" },
    ],
    summary: "קמפיין חשיפה אחד לתפריט הסתיו, קבוצה אחת ברדיוס המשלוחים.",
    budget: { amount: 500, fromDay: 22, toDay: 31, fromUnallocated: false, costPerResult: null, resultWord: "הכנסה" },
    budgetNote: "בתוך הקצאת הנושא · אין מקור מדידה, אז אין צפי",
    details: [
      { key: "structure", label: "מטרה ומבנה", summary: "חשיפה · 1 · 1", lines: ["מטרה: חשיפה", "קבוצה אחת ברדיוס 5 ק״מ"] },
      { key: "tracking", label: "יעד ומעקב", summary: "אין מקור מדידה", problem: "אין מקור מדידה", lines: ["✕ מערכת ההזמנות לא מחוברת"] },
    ],
    footerNote: "חסום עד שהמבצע יאומת במוח העסק. שום דבר לא נשלח לאישור.",
    blocked: "המבצע לא אושר לפרסום במוח העסק",
    context: { plan: "הקצאת משלוחים ₪1,800 · מחויב ₪1,300", brain: "תפריט הסתיו: קיים, פרסום חסום עד אישור התנאים", earlier: "Google Search · משלוחים: ₪58 להמרה" },
    launchDay: 22,
  },
];
