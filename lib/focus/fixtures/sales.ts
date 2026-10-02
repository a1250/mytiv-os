import type { DiscoveryData, Lead, LeadDetail, OutreachData, ProposalDraft, ProposalSummary, ProposalTemplate } from "@/lib/focus/contracts/sales";
import { ready } from "@/lib/focus/contracts/loadable";
import { R } from "@/lib/focus/routes";
import { at } from "./clock";
import { CLIENTS, PEOPLE } from "./people";

/**
 * Sales demo data (handoff F1–F4, H8, H9, M7) on the demo clock. Placeholders, not real people: names, e-mails and
 * phone numbers are invented. The lead "נועה כהן" and her proposal are the same story as the approval "proposal-noa".
 */

const OWNER_ESTIMATE = "הערכת האחראי";

export const LEADS: Lead[] = [
  {
    id: "noa-cohen", name: "נועה כהן", company: "אירוע חברה ל־35 משתתפים", source: "טופס באתר UMINO", stage: "meeting",
    value: { kind: "estimated", value: 9000, basis: OWNER_ESTIMATE }, ownerId: PEOPLE.dana.id,
    next: { text: "שלח הצעה עד", due: "2026-10-04" }, lastContact: at("2026-10-01", "10:00"), createdAt: at("2026-09-28", "18:20"),
    quality: { state: "verified", label: "מלא" }, email: "noa.cohen@example.co.il", href: R.lead("noa-cohen"),
  },
  {
    id: "avi-levi", name: "אבי לוי", company: "סטודיו פילאטיס \"קו\"", source: `הפניה מ${CLIENTS.gal.name}`, stage: "new",
    value: { kind: "unknown", reason: "טרם הוערך" }, ownerId: PEOPLE.ron.id, next: null,
    lastContact: at("2026-09-29", "12:40"), createdAt: at("2026-09-29", "12:40"),
    quality: { state: "partial", label: "חסר טלפון" }, email: "avi@example.co.il", href: null,
  },
  {
    id: "michal-barak", name: "מיכל ברק", company: "בית קפה \"שלוש\"", source: "LinkedIn", stage: "in_progress",
    value: { kind: "estimated", value: 4500, basis: OWNER_ESTIMATE }, ownerId: PEOPLE.dana.id,
    next: { text: "שיחת המשך", due: "2026-10-05" }, lastContact: at("2026-09-27", "14:00"), createdAt: at("2026-09-15", "10:00"),
    quality: { state: "verified", label: "מלא" }, email: "michal@example.co.il", href: null,
  },
  {
    id: "yossi-adler", name: "יוסי אדלר", company: "רשת חנויות יין", source: "גילוי לידים", stage: "new",
    value: { kind: "unknown", reason: "טרם הוערך" }, ownerId: PEOPLE.dana.id, next: { text: "אמת איש קשר", due: null },
    lastContact: null, createdAt: at("2026-09-27", "09:00"),
    quality: { state: "unverified", label: "לא מאומת" }, href: null,
  },
  {
    id: "rotem-sagi", name: "רותם שגיא", company: "מספרה \"רותם\"", source: "אינסטגרם", stage: "waiting",
    value: { kind: "estimated", value: 2800, basis: OWNER_ESTIMATE }, ownerId: PEOPLE.yoav.id,
    next: { text: "תזכורת", due: "2026-10-03" }, lastContact: at("2026-09-24", "16:00"), createdAt: at("2026-09-10", "09:00"),
    quality: { state: "verified", label: "מלא" }, href: null,
  },
  {
    id: "daniel-or", name: "דניאל אור", company: "משרד אדריכלים", source: "כנס", stage: "proposal_sent",
    value: { kind: "known", value: 6200 }, ownerId: PEOPLE.ron.id, next: { text: "מעקב", due: "2026-10-06" },
    lastContact: at("2026-09-22", "11:00"), createdAt: at("2026-09-05", "09:00"),
    quality: { state: "verified", label: "מלא" }, href: null,
  },
  {
    id: "shahar-mizrahi", name: "שחר מזרחי", company: "סטודיו יוגה \"נשימה\"", source: "פייסבוק", stage: "in_progress",
    value: { kind: "estimated", value: 3200, basis: OWNER_ESTIMATE }, ownerId: PEOPLE.yoav.id,
    next: { text: "לשלוח דוגמאות", due: "2026-10-02" }, lastContact: at("2026-09-20", "13:00"), createdAt: at("2026-09-02", "09:00"),
    quality: { state: "verified", label: "מלא" }, href: null,
  },
  {
    id: "liat-katz", name: "ליאת כץ", company: "מאפיית \"שאור\"", source: "הפניה מלקוח", stage: "in_progress",
    value: { kind: "estimated", value: 5000, basis: OWNER_ESTIMATE }, ownerId: PEOPLE.dana.id,
    next: { text: "פגישת היכרות", due: "2026-10-07" }, lastContact: at("2026-09-18", "10:30"), createdAt: at("2026-09-01", "09:00"),
    quality: { state: "partial", label: "חסר מייל" }, href: null,
  },
  {
    id: "gal-shamir", name: "גל שמיר", company: CLIENTS.gal.name, source: "המלצה", stage: "won",
    value: { kind: "known", value: 7800 }, ownerId: PEOPLE.ron.id, next: null,
    lastContact: at("2026-09-15", "12:00"), createdAt: at("2026-08-20", "09:00"),
    quality: { state: "verified", label: "מלא" }, href: null,
  },
];

export const LEAD_SOURCES = ["טופס באתר", "הפניה", "LinkedIn", "אינסטגרם", "פייסבוק", "כנס", "גילוי לידים", "אחר"];

/** "שווי משוער" footnote (F1). */
export const LEAD_VALUE_NOTE = "\"שווי משוער\" הוא הערכה של האחראי, לא סכום הצעה. סכום מוצג רק אחרי שנוצרה הצעה.";

export const LEAD_NOA: LeadDetail = {
  leadId: "noa-cohen",
  initials: "נכ",
  headline: "אירוע חברה ל־35 משתתפים",
  shortHeadline: "אירוע חברה ל־35",
  next: { title: "לשלוח הצעה עד", due: "2026-10-04", requestedAt: at("2026-09-29", "11:20"), meetingAt: at("2026-10-01", "10:00") },
  contact: {
    email: "noa.cohen@example.co.il", phone: "050-0000000", company: "חברת הייטק, תל אביב",
    verification: { state: "verified", label: "אומת מול המייל שלה" },
  },
  need: [
    { label: "אירוע", value: { kind: "text", text: "ערב צוות" } },
    { label: "משתתפים", value: { kind: "text", text: "35" } },
    { label: "מועד", value: { kind: "text", text: "אמצע אוקטובר · טרם נקבע" } },
    { label: "תקציב", value: { kind: "unknown", reason: "לא נמסר" } },
  ],
  timeline: ready([
    {
      id: "ev-call", kind: "meeting", at: at("2026-10-01", "10:00"), title: "שיחת היכרות", source: "Google Meet", meta: "ביומן",
      text: "30 דקות", link: { label: "פתח ביומן", href: R.calendar }, short: "שיחת היכרות",
    },
    {
      id: "ev-mail", kind: "email", at: at("2026-09-29", "11:20"), title: "מייל מנועה", source: "Gmail", quote: true,
      text: "מחפשים ערב לצוות באמצע אוקטובר, 35 איש. אשמח להצעה עד סוף השבוע הבא.", short: "\"מחפשים ערב לצוות באמצע אוקטובר, 35 איש.\"",
    },
    {
      id: "ev-note", kind: "note", at: at("2026-09-29", "12:05"), title: "הערה של דנה", authorId: PEOPLE.dana.id,
      text: "להציע את החדר הפנימי. לבדוק זמינות ל־15.10.",
    },
    { id: "ev-created", kind: "system", at: at("2026-09-28", "18:20"), title: "הליד נוצר", source: "טופס באתר", short: "הליד נוצר מטופס באתר" },
  ]),
  proposalId: "corporate-hosting",
  suggestions: [
    {
      id: "sg-roy", name: "רועי לוי", role: "מנהל משאבי אנוש", source: "LinkedIn", confidence: "medium",
      contact: { text: "roy.levi@…", verification: "unverified", basis: "ניחוש לפי תבנית המייל של החברה" },
    },
    {
      id: "sg-maya", name: "מאיה רז", role: "אחראית רווחה", source: "אתר החברה", confidence: "low",
      contact: { text: "", verification: "unverified", basis: "שם בלבד, בלי פרטי קשר" },
    },
  ],
  searchMs: 2400,
};

/* ---------- proposal editor (F3) ---------- */

const CORPORATE_LINES = [
  { id: "ln-menu", name: "תפריט אירוח עסקי", note: "מחיר מתוך תפריט UMINO, 28.9.2026", qty: 35, unit: 186.44 },
  { id: "ln-drinks", name: "שתייה קלה ללא הגבלה", note: "מחיר מתוך תפריט UMINO", qty: 35, unit: 25.42 },
  { id: "ln-room", name: "חדר פנימי", note: "בכפוף לזמינות · ללא תוספת", qty: 1, unit: 0 },
];
const CORPORATE_NOTES = "30% מקדמה באישור, יתרה ביום האירוע. החדר הפנימי בכפוף לזמינות.";

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  { id: "corporate", label: "אירוח עסקי", lines: CORPORATE_LINES, notes: CORPORATE_NOTES },
  {
    id: "private", label: "אירוע פרטי",
    lines: [
      { id: "ln-p-menu", name: "תפריט ערב פרטי", note: "מחיר מתוך תפריט UMINO", qty: 20, unit: 210 },
      { id: "ln-p-cake", name: "קינוח ושתייה חמה", note: "מחיר מתוך תפריט UMINO", qty: 20, unit: 32 },
    ],
    notes: "50% מקדמה באישור. ביטול עד 7 ימים לפני האירוע ללא חיוב.",
  },
  {
    id: "content", label: "ריטיינר תוכן",
    lines: [{ id: "ln-c-month", name: "ריטיינר תוכן חודשי", note: "12 פוסטים · 8 סטוריז", qty: 1, unit: 4500 }],
    notes: "התחייבות לשלושה חודשים. תשלום בתחילת כל חודש.",
  },
];

export const PROPOSAL_CORPORATE: ProposalDraft = {
  id: "corporate-hosting",
  number: "2026-014",
  leadId: "noa-cohen",
  clientName: "נועה כהן",
  templateId: "corporate",
  createdAt: at("2026-10-01", "08:00"),
  validityDays: 14,
  vatRate: 0.18,
  lines: CORPORATE_LINES,
  notes: CORPORATE_NOTES,
  versions: [{ n: 1, status: "draft", byId: PEOPLE.dana.id, at: at("2026-10-01", "08:09") }],
  savedAt: at("2026-10-01", "08:10"),
  brand: { label: "UMINO", bg: "#1f1b17", fg: "#f4ede1" },
  approvalId: "proposal-noa",
};

export const VALIDITY_OPTIONS = [7, 14, 30];

/* ---------- proposals list (H9) ---------- */

export const PROPOSALS: ProposalSummary[] = [
  {
    id: "corporate-hosting", number: "2026-014", client: "נועה כהן", subject: "אירוח עסקי · 35", amount: { amount: 8750, currency: "ILS" },
    status: "pending", createdAt: at("2026-10-01", "08:00"), validUntil: "2026-10-15", view: { kind: "none" }, followUp: "2026-10-04",
    href: R.proposal("corporate-hosting"), approvalId: "proposal-noa",
  },
  {
    id: "architects-content", number: "2026-012", client: "דניאל אור", subject: "משרד אדריכלים · תוכן", amount: { amount: 6200, currency: "ILS" },
    status: "sent", createdAt: at("2026-09-22", "10:00"), validUntil: "2026-10-06", view: { kind: "viewed", at: at("2026-09-23", "09:30"), responded: false },
    followUp: null, href: null,
  },
  {
    id: "cafe-retainer", number: "2026-013", client: "מיכל ברק", subject: "בית קפה · ריטיינר", amount: { amount: 4500, currency: "ILS" },
    status: "draft", createdAt: at("2026-09-29", "15:00"), validUntil: null, view: { kind: "none" }, followUp: null, href: null,
  },
  {
    id: "gal-holidays", number: "2026-009", client: CLIENTS.gal.name, subject: "קמפיין חגים", amount: { amount: 7800, currency: "ILS" },
    status: "accepted", createdAt: at("2026-09-10", "10:00"), validUntil: null, view: { kind: "accepted", at: at("2026-09-15", "12:00") },
    followUp: null, href: null,
  },
];

export const PROPOSALS_NOTE = "\"נצפתה\" מוצג רק כשהמערכת יודעת זאת (קישור למסמך). אחרת כתוב \"לא ידוע\".";

/* ---------- outreach (F4) ---------- */

export const OUTREACH: OutreachData = {
  leadId: "michal-barak",
  to: { name: "מיכל ברק", company: "בית קפה \"שלוש\"", email: "michal@example.co.il" },
  purposes: [
    { key: "first", label: "מייל ראשוני" }, { key: "followup", label: "הודעת המשך" },
    { key: "linkedin", label: "LinkedIn" }, { key: "partnership", label: "שיתוף פעולה" },
  ],
  tones: [{ key: "formal", label: "רשמי" }, { key: "warm", label: "חם" }, { key: "light", label: "קליל" }],
  defaults: { purpose: "followup", tone: "warm" },
  subjects: {
    first: "רעיונות לתוכן הסתיו של \"שלוש\"",
    followup: "המשך לשיחה שלנו על התוכן לסתיו",
    linkedin: "תוכן לסתיו",
    partnership: "הצעה לשיתוף פעולה עם \"שלוש\"",
  },
  greetings: { formal: "שלום מיכל,", warm: "היי מיכל,", light: "מיכל, היי!" },
  bodies: {
    first: "אני דנה מ־Mytiv. ראיתי שבית הקפה מעלה תוכן עונתי לאינסטגרם, ואשמח להציע כמה רעיונות לתוכנית התוכן לסתיו.\n\nאפשר לקבוע שיחה קצרה ביום ראשון, 4.10?",
    followup: "תודה על השיחה בשבוע שעבר. כמו שסיכמנו, צירפתי שלוש דוגמאות לעבודות שעשינו לבתי קפה.\n\nאשמח לקבוע שיחה קצרה ביום ראשון, 5.10, כדי לדבר על תוכנית התוכן לסתיו.",
    linkedin: "תודה על השיחה בשבוע שעבר. אשמח להמשיך לדבר על תוכנית התוכן לסתיו, אולי ביום ראשון, 5.10?",
    partnership: "אנחנו מחפשים בית קפה שכונתי לשיתוף פעולה בתוכן לסתיו: צילום משותף ופוסט אצל שני הצדדים.\n\nאשמח לקבוע שיחה קצרה ביום ראשון, 4.10.",
  },
  closings: { formal: "בברכה,\nדנה · Mytiv", warm: "דנה, Mytiv", light: "תודה!\nדנה" },
  claims: [
    {
      id: "samples", quote: "שלוש דוגמאות לעבודות שעשינו לבתי קפה", level: "medium",
      title: "\"שלוש דוגמאות לבתי קפה\"", message: "לא נמצאו בתיק העבודות. לשנות או למחוק?",
      fixes: [
        { label: "שנה לדוגמאות מהתיק", find: "שלוש דוגמאות לעבודות שעשינו לבתי קפה", replace: "כמה דוגמאות מתיק העבודות שלנו" },
        { label: "מחק את המשפט", find: " כמו שסיכמנו, צירפתי שלוש דוגמאות לעבודות שעשינו לבתי קפה.", replace: "" },
      ],
    },
  ],
  verified: [{ quote: "השיחה בשבוע שעבר", basis: "הערת שיחה של דנה מ־27.9" }],
  basis: [
    { text: "הערת שיחה של דנה מ־27.9", verification: "verified" },
    { text: "פרטי הליד: בית קפה, צורך בתוכן עונתי", verification: "verified" },
  ],
  noUse: "לא נעשה שימוש במחירים או בהבטחות לתוצאות.",
  steps: ["ליד ומטרה", "טון", "טיוטה ועריכה", "בדיקת פרטים", "שמירה והעברה לדואר"],
  redraftMs: 1800,
};

/* ---------- lead discovery (H8) ---------- */

export const DISCOVERY: DiscoveryData = {
  categories: [{ value: "cafes", label: "בתי קפה" }, { value: "restaurants", label: "מסעדות" }, { value: "studios", label: "סטודיו וכושר" }],
  last: { query: "בתי קפה בוטיק בתל אביב שמעלים תוכן לאינסטגרם", category: "cafes", ranAt: at("2026-09-30", "16:40") },
  results: [
    {
      id: "d-shalosh", name: "בית קפה \"שלוש\"", meta: "פלורנטין · פעיל באינסטגרם", category: "cafes", sources: ["אתר", "Instagram"],
      contact: { kind: "existing", leadId: "michal-barak", leadName: "מיכל ברק" }, confidence: "high",
    },
    {
      id: "d-givol", name: "קפה \"גבעול\"", meta: "לב העיר · 3 פוסטים בשבוע", category: "cafes", sources: ["Instagram", "Google Maps"],
      contact: { kind: "found", text: "info@…", source: "מהאתר" }, confidence: "high",
    },
    {
      id: "d-makinta", name: "\"מקינטה\"", meta: "יפו · פוסט אחרון לפני חודש", category: "cafes", sources: ["Google Maps"],
      contact: { kind: "estimated", text: "hello@…", basis: "ניחוש לפי שם הדומיין" }, confidence: "medium",
    },
    {
      id: "d-ehad", name: "קפה \"אחד\"", meta: "רמת אביב · ללא אתר", category: "cafes", sources: ["Instagram"],
      contact: { kind: "none" }, confidence: "low",
      guess: { kind: "estimated", text: "הודעה ישירה באינסטגרם", basis: "פרופיל Instagram בלבד" },
    },
    {
      id: "d-nachat", name: "\"נחת\"", meta: "נווה צדק · 2 פוסטים בשבוע", category: "cafes", sources: ["Instagram", "אתר"],
      contact: { kind: "found", text: "hello@…", source: "מהאתר" }, confidence: "medium",
    },
    {
      id: "d-boker", name: "\"בוקר טוב\"", meta: "צפון הישן · פעיל בטיקטוק", category: "cafes", sources: ["TikTok"],
      contact: { kind: "none" }, confidence: "low",
      guess: { kind: "estimated", text: "054-…", basis: "מספר מ־Google Maps, לא אומת" },
    },
  ],
  searchMs: 2600,
  contactMs: 1500,
};

export const DISCOVERY_NOTE = "שום עסק לא נוסף כליד בלי אישור. פרטי קשר שנמצאו בניחוש מסומנים \"משוער\" ולא מוצגים כעובדה.";
