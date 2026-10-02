import { ready } from "@/lib/focus/contracts/loadable";
import type {
  BriefAnalysis, Campaign, InspirationFilter, InspirationItem, Moodboard, OpportunityFeed, PromptTemplate, PublishPlan,
  RecentAsset, StartFrom, StudioItem,
} from "@/lib/focus/contracts/marketing";
import { R } from "@/lib/focus/routes";
import { at } from "./clock";
import { CLIENTS, PEOPLE } from "./people";
import { MEDIA_BUDGET, PROJECT_UMINO } from "./projects";

/**
 * Marketing & content demo data (handoff H6, H7, H11, H12, E1, E2, E7) on the UMINO / גל פילאטיס story.
 * Client brand colours are the client's content (Brand Kit), not theme tokens — they stay as data.
 * Live state (approval decisions, Meta scheduling) is read from the demo store, never baked in here.
 */
const INK = "#1f1b17", RED = "#c4462e";

/* ---------- H6 · inspiration ---------- */
export const INSPIRATION: InspirationItem[] = [
  { id: "i-warm-sushi", kind: "photo", placeholder: "צילום מנה", title: "אור חם על סושי", clientId: CLIENTS.umino.id, tags: ["#צילום אוכל"], height: 220, boardIds: ["b-thursday"], addedAt: at("2026-09-24", "10:00") },
  { id: "i-big-type", kind: "poster", placeholder: "פוסטר", title: "טיפוגרפיה גדולה על כהה", clientId: CLIENTS.umino.id, tags: ["#טיפוגרפיה"], height: 160, boardIds: ["b-thursday"], addedAt: at("2026-09-24", "10:05") },
  { id: "i-friends", kind: "photo", placeholder: "צילום", title: "שולחן חברים בערב", clientId: CLIENTS.umino.id, tags: [], height: 190, boardIds: ["b-thursday"], addedAt: at("2026-09-25", "09:30") },
  { id: "i-tokyo", kind: "link", placeholder: "קישור", title: "מסעדה בטוקיו · Instagram", clientId: null, tags: [], height: 150, url: "https://example.com/tokyo-izakaya", boardIds: ["b-thursday"], addedAt: at("2026-09-25", "12:00") },
  { id: "i-studio-morning", kind: "photo", placeholder: "צילום", title: "סטודיו באור בוקר", clientId: CLIENTS.gal.id, tags: [], height: 170, boardIds: ["b-body"], addedAt: at("2026-09-26", "08:40") },
  { id: "i-grid", kind: "poster", placeholder: "פוסטר", title: "רשת נקייה, צבע אחד", clientId: null, tags: ["#טיפוגרפיה"], height: 210, boardIds: [], addedAt: at("2026-09-27", "11:00") },
  { id: "i-back-to-routine", kind: "link", placeholder: "קישור", title: "קמפיין חזרה לשגרה", clientId: CLIENTS.gal.id, tags: [], height: 150, url: "https://example.com/back-to-routine", boardIds: ["b-body"], addedAt: at("2026-09-28", "15:20") },
  { id: "i-cocktail", kind: "photo", placeholder: "צילום", title: "קוקטייל על בר", clientId: CLIENTS.umino.id, tags: [], height: 180, boardIds: ["b-thursday"], addedAt: at("2026-09-29", "17:10") },
];

export const INSPIRATION_FILTERS: InspirationFilter[] = [
  { key: "all", label: "הכול", counted: true },
  { key: "umino", label: CLIENTS.umino.name, clientId: CLIENTS.umino.id, counted: true },
  { key: "gal", label: CLIENTS.gal.name, clientId: CLIENTS.gal.id, counted: true },
  { key: "type", label: "#טיפוגרפיה", tag: "#טיפוגרפיה", counted: false },
  { key: "food", label: "#צילום אוכל", tag: "#צילום אוכל", counted: false },
];

export const MOODBOARDS: Moodboard[] = [
  {
    id: "b-thursday", title: "ערבי חמישי", clientId: CLIENTS.umino.id,
    cover: [{ kind: "color", hex: INK, label: "דיו" }, { kind: "photo" }, { kind: "color", hex: RED, label: "אדום" }],
    usedIn: { label: "משמש ככיוון בקמפיין ערבי סושי", href: R.campaign("thursday-sushi") },
  },
  { id: "b-body", title: "חוזרות לגוף", clientId: CLIENTS.gal.id, cover: [{ kind: "photo" }, { kind: "tint" }, { kind: "photo" }] },
];

export const INSPIRATION_NOTE = "השראה משמשת לכיוון חזותי בלבד. הסטודיו לא מעתיק יצירה של צד שלישי.";

/* ---------- H7 · opportunities ---------- */
export const OPPORTUNITIES: OpportunityFeed = {
  updatedAt: at("2026-10-01", "06:00"),
  sourceCount: 12,
  items: ready([
    { id: "o-holidays", source: "לוח שנה עברי", publishedAt: at("2026-10-01", "06:00"), title: "חגי תשרי: שינוי בשעות הפתיחה", why: "לקוחות שואלים על שעות בחג. בקשת מידע כבר פתוחה ב־UMINO.", client: CLIENTS.umino, confidence: "high", basis: "3 שאלות על שעות בחג בשבוע האחרון" },
    { id: "o-groups", source: "מגזין מסעדנות", publishedAt: at("2026-09-30", "09:00"), title: "עלייה בהזמנות קבוצתיות באמצע השבוע", why: "מתאים לקמפיין ערבי חמישי ולליד של נועה כהן.", client: CLIENTS.umino, confidence: "medium", basis: "מגמה כללית בענף, לא נתון של UMINO" },
    { id: "o-bts", source: "Instagram · מגמות", publishedAt: at("2026-09-29", "12:00"), title: "קרוסלות \"מאחורי הקלעים\" בסטודיו", why: "מתאים למסר \"יום בסטודיו\" בתוכנית אוקטובר.", client: CLIENTS.gal, confidence: "medium", basis: "מעורבות גבוהה אצל סטודיואים דומים" },
    { id: "o-parking", source: "אתר חדשות מקומי", publishedAt: at("2026-09-28", "14:00"), title: "פתיחת חניון חדש באזור", why: "עשוי להקל על הגעה למסעדה. לא נמצא קשר ישיר לקמפיין.", client: CLIENTS.umino, confidence: "low", basis: "קשר עקיף בלבד" },
  ]),
};

/* ---------- H11 · brief analysis ---------- */
export const BRIEF_GAL: BriefAnalysis = {
  id: "gal-holidays",
  title: "קמפיין חגים",
  client: CLIENTS.gal,
  source: { label: "מייל מגל", at: at("2026-09-25", "09:12") },
  segments: [
    { text: "אנחנו רוצות " }, { text: "להחזיר מתאמנות אחרי החגים", extracted: true }, { text: ". חשבנו על " },
    { text: "שיעור ניסיון", extracted: true },
    { text: " ועל תוכן באינסטגרם. התקציב מוגבל. חשוב שזה ייראה כמו הסטודיו, לא כמו חדר כושר. " },
    { text: "נשמח שיהיה מוכן לפני 20.10", extracted: true }, { text: "." },
  ],
  stated: [
    { id: "goal", label: "מטרה", value: "החזרת מתאמנות אחרי החגים" },
    { id: "output", label: "תוצר", value: "שיעור ניסיון, תוכן ל־Instagram" },
    { id: "date", label: "תאריך", value: "מוכן לפני 20.10" },
    { id: "limit", label: "מגבלה", value: "תקציב מוגבל, \"לא כמו חדר כושר\"" },
  ],
  inferred: [
    { id: "aud", label: "קהל", value: "מתאמנות שהפסיקו להגיע בחודשיים האחרונים" },
    { id: "tone", label: "טון", value: "אישי ושקט, לא מכירתי" },
    { id: "chan", label: "ערוץ נוסף", value: "WhatsApp למתאמנות קיימות" },
  ],
  missing: ["סכום התקציב", "האם שיעור הניסיון חינם"],
  conflicts: [{ id: "budget", text: "\"תקציב מוגבל\" מול רצון לתוכן בכמה ערוצים", reason: "אין סכום, ולכן אי אפשר לדעת כמה ערוצים אפשר לממן." }],
  questions: ["מה התקציב?", "כמה מתאמנות ברשימה?", "מי מאשר תוכן?"],
};

/* ---------- H12 · prompt library ---------- */
export const PROMPTS: PromptTemplate[] = [
  {
    id: "p-dish-photo", title: "צילום מנה לפוסט", category: "image", owner: { kind: "mine" }, favorite: true, version: 3, savedAt: at("2026-09-30", "17:40"),
    tool: "יצירת תמונות", output: "תמונת קונספט",
    goal: "קונספט לצילום מנה עבור UMINO, אור חם, שולחן כהה, לפי סגנון הצילום ב־Brand Kit",
    constraints: ["בלי טקסט בתמונה", "בלי לוגואים של אחרים"],
    checks: [{ id: "k1", text: "תואם את סגנון הצילום", done: true }, { id: "k2", text: "יחס 4:5", done: true }, { id: "k3", text: "אין אנשים מזוהים", done: false }],
    full: "Warm-lit close-up of a sushi set on a dark wooden table, shallow depth of field, 4:5, no text, no third-party logos, natural steam, editorial food photography.",
    improved: "Warm, low-key light on a sushi set on a dark wooden table, shallow depth of field, 4:5 crop, natural steam, editorial food photography. No text, no third-party logos, no identifiable people.",
  },
  {
    id: "p-story-headlines", title: "כותרות לסטורי", category: "text", owner: { kind: "system" }, favorite: false, version: 1, savedAt: at("2026-09-01", "09:00"),
    tool: "טקסט", output: "5 כותרות קצרות",
    goal: "כותרות לסטורי לפי טון המותג, עד 5 מילים, בלי סופרלטיבים",
    constraints: ["עד 5 מילים", "בלי מחירים שלא אומתו"],
    checks: [{ id: "k1", text: "תואם את טון המותג", done: true }, { id: "k2", text: "אין עובדה בלי מקור", done: true }],
    full: "Write 5 short Hebrew story headlines (max 5 words each) in the brand's tone: warm, matter-of-fact, no superlatives. Do not mention prices or offers unless verified in the Business Brain.",
  },
  {
    id: "p-meeting-summary", title: "סיכום פגישת לקוח", category: "text", owner: { kind: "person", personId: PEOPLE.dana.id }, favorite: false, version: 2, savedAt: at("2026-09-22", "14:10"),
    tool: "טקסט", output: "סיכום ומשימות",
    goal: "סיכום פגישה קצר עם החלטות, משימות ואחראים",
    constraints: ["בלי פרטים אישיים מעבר לנדרש"],
    checks: [{ id: "k1", text: "כל משימה עם אחראי", done: true }, { id: "k2", text: "החלטות מסומנות בנפרד", done: true }],
    full: "Summarize the client meeting in Hebrew: decisions first, then tasks with an owner and a due date for each, then open questions. Keep personal details out unless needed.",
  },
  {
    id: "p-carousel-captions", title: "טקסט נלווה לקרוסלה", category: "text", owner: { kind: "mine" }, favorite: false, version: 1, savedAt: at("2026-09-29", "11:30"),
    tool: "טקסט", output: "טקסט נלווה",
    goal: "טקסט נלווה לקרוסלה של 5 מנות, משפט אחד לכל שקף",
    constraints: ["בלי אימוג׳י", "בלי מחירים"],
    checks: [{ id: "k1", text: "משפט אחד לכל שקף", done: false }],
    full: "Write a Hebrew caption for a 5-slide carousel of autumn dishes: one sentence per slide, warm tone, no emoji, no prices.",
  },
  {
    id: "p-studio-light", title: "אור בוקר בסטודיו", category: "image", owner: { kind: "system" }, favorite: true, version: 2, savedAt: at("2026-09-10", "10:00"),
    tool: "יצירת תמונות", output: "תמונת קונספט",
    goal: "קונספט לתמונת סטודיו באור בוקר רך, בלי אנשים מזוהים",
    constraints: ["בלי אנשים מזוהים", "בלי טקסט בתמונה"],
    checks: [{ id: "k1", text: "אור טבעי", done: true }, { id: "k2", text: "יחס 4:5", done: true }],
    full: "Soft morning light in a quiet pilates studio, empty reformers, natural wood and linen, 4:5, no text, no identifiable people.",
  },
];

export const PROMPT_TOOLS = ["יצירת תמונות", "טקסט"];
export const PROMPT_OUTPUTS = ["תמונת קונספט", "5 כותרות קצרות", "סיכום ומשימות", "טקסט נלווה"];

/* ---------- E1 · campaign ---------- */
export const CAMPAIGN_SUSHI: Campaign = {
  id: "thursday-sushi",
  name: "ערבי סושי של חמישי",
  client: CLIENTS.umino,
  projectId: PROJECT_UMINO.id,
  projectName: PROJECT_UMINO.name,
  start: "2026-10-01",
  end: "2026-10-31",
  channels: ["Instagram", "Facebook"],
  ownerId: PEOPLE.dana.id,
  goal: { label: "מטרה", value: "יותר הזמנות בין 19:00 ל־22:00 בימי חמישי", note: "יעד: 120 הזמנות בחודש · נקבע ע״י רון" },
  audience: { label: "קהל", value: "זוגות וקבוצות חברים באזור", note: "מוח העסק", verification: "verified" },
  message: { label: "מסר מרכזי", value: "\"ערב חמישי מתחיל כאן\"", note: "הצעה: 1+1 על סטים", approvalId: "promo-1plus1" },
  plan: ready([
    { id: "row-story", title: "סטורי · ערב חמישי מתחיל כאן", channels: "Instagram", ownerId: PEOPLE.dana.id, version: 3, publishAt: at("2026-10-02", "18:00"), thumb: { kind: "design", designId: "thursday-sushi", format: "story" }, approvalId: "content-sushi-story", state: { kind: "approval", status: "pending" }, href: R.design("thursday-sushi") },
    { id: "row-post", title: "פוסט אנכי · ערב חמישי מתחיל כאן", channels: "Instagram, Facebook", ownerId: PEOPLE.dana.id, publishAt: at("2026-10-02", "18:00"), thumb: { kind: "design", designId: "thursday-sushi", format: "post" }, approvalId: "content-sushi-story", state: { kind: "approval", status: "pending" }, href: R.design("thursday-sushi") },
    { id: "row-carousel", title: "קרוסלה · חמש מנות לסתיו", channels: "Instagram", ownerId: PEOPLE.yoav.id, publishAt: "2026-10-06", thumb: { kind: "slides", count: 3 }, state: { kind: "blocked", blockedBy: "צילום מנת הספיישל" }, href: R.task("t-photo-shoot") },
    { id: "row-banner", title: "באנר לאתר · תפריט סתיו", channels: "אתר", ownerId: PEOPLE.yoav.id, publishAt: null, thumb: { kind: "wide" }, state: { kind: "approval", status: "draft" }, href: R.studio },
    { id: "row-reminder", title: "סטורי · תזכורת ביום חמישי", channels: "בתוכנית, עדיין לא נוצר", ownerId: PEOPLE.dana.id, publishAt: "2026-10-08", thumb: { kind: "planned" }, state: { kind: "idea" }, href: `${R.studioNew}?campaign=thursday-sushi&format=story` },
  ]),
  results: ready([
    { id: "r-thu", label: "הזמנות בחמישי 19–22", reading: { kind: "unknown", reason: "טרם התקבל" }, unit: "count", source: { system: "bookings", label: "מערכת ההזמנות", href: R.reports } },
    { id: "r-reach", label: "חשיפות Instagram", reading: { kind: "unavailable", since: at("2026-09-27", "03:00"), reason: "תקלה בחיבור" }, unit: "count", source: { system: "instagram", label: "Instagram", href: R.settings } },
  ]),
  firstDataAt: "2026-10-02",
  mediaBudget: MEDIA_BUDGET,
  log: [
    { id: "l2", at: at("2026-09-29", "11:20"), text: "דנה הוסיפה את הקרוסלה לתוכנית" },
    { id: "l1", at: at("2026-09-22", "16:00"), text: "רון אישר את תוכנית השיווק" },
  ],
};

/* ---------- E2 · studio home ---------- */
const out = (id: string, title: string, client: keyof typeof CLIENTS, format: StudioItem["format"], stage: StudioItem["stage"], date: string): StudioItem =>
  ({ id, title, client: CLIENTS[client], format, stage, ownerId: PEOPLE.dana.id, updatedAt: at(date, "10:00") });

export const STUDIO_ITEMS: StudioItem[] = [
  { id: "s-sushi", title: "סטורי ופוסט · ערבי סושי", client: CLIENTS.umino, format: "story", stage: "pending", ownerId: PEOPLE.dana.id, updatedAt: at("2026-10-01", "07:50"), designId: "thursday-sushi", href: R.design("thursday-sushi") },
  { id: "s-carousel", title: "חמש מנות לסתיו", client: CLIENTS.umino, format: "carousel", stage: "blocked", note: "ממתין לצילום", ownerId: PEOPLE.yoav.id, updatedAt: at("2026-09-29", "11:20"), thumbLabel: "קרוסלה · 5 שקפים", href: R.task("t-photo-shoot") },
  { id: "s-banner", title: "באנר לאתר · סתיו", client: CLIENTS.umino, format: "banner", stage: "draft", ownerId: PEOPLE.yoav.id, updatedAt: at("2026-09-30", "16:00"), thumbLabel: "באנר רחב" },
  { id: "s-trial", title: "פוסט · שיעור ניסיון", client: CLIENTS.gal, format: "post", stage: "draft", ownerId: PEOPLE.dana.id, updatedAt: at("2026-09-30", "12:30"), thumbLabel: "פוסט אנכי" },
  { id: "s-routine", title: "סטורי · חזרה לשגרה", client: CLIENTS.gal, format: "story", stage: "pending", ownerId: PEOPLE.yoav.id, updatedAt: at("2026-09-30", "10:15"), thumbLabel: "סטורי" },
  out("s-a1", "פוסט · תפריט סתיו", "umino", "post", "approved", "2026-09-28"),
  out("s-a2", "סטורי · שעות פתיחה בחג", "umino", "story", "approved", "2026-09-29"),
  out("s-a3", "ריבוע · כרטיסיית 10 שיעורים", "gal", "square", "approved", "2026-09-27"),
  out("s-a4", "באנר · הרשמה לסדנה", "gal", "banner", "approved", "2026-09-26"),
  out("s-o1", "באנר תפריט קיץ", "umino", "banner", "published", "2026-09-30"),
  out("s-o2", "סטורי · ערב יפני", "umino", "story", "published", "2026-09-24"),
  out("s-o3", "פוסט · שף אורח", "umino", "post", "published", "2026-09-21"),
  out("s-o4", "קרוסלה · מנות קיץ", "umino", "carousel", "published", "2026-09-15"),
  out("s-o5", "פוסט · סדנת נשימה", "gal", "post", "published", "2026-09-18"),
  out("s-o6", "סטורי · מערכת שעות", "gal", "story", "published", "2026-09-14"),
  out("s-o7", "ריבוע · קפה של הבוקר", "shalosh", "square", "published", "2026-09-12"),
  out("s-o8", "באנר · תפריט בוקר", "shalosh", "banner", "exported", "2026-09-11"),
  out("s-o9", "פוסט · מאפה העונה", "shalosh", "post", "published", "2026-09-09"),
  out("s-o10", "סטורי · ערב פתיחה", "mytiv", "story", "exported", "2026-09-08"),
  out("s-o11", "פוסט · מה חדש ב־Mytiv", "mytiv", "post", "published", "2026-09-05"),
  out("s-o12", "סטורי · ראש השנה", "umino", "story", "scheduled", "2026-09-30"),
];

export const START_FROM: StartFrom[] = [
  { id: "from-campaign", label: "מתוך קמפיין", detail: CAMPAIGN_SUSHI.name, href: `${R.studioNew}?campaign=thursday-sushi` },
  { id: "from-board", label: "מתוך מודבורד", detail: "ערבי חמישי", href: `${R.studioNew}?board=b-thursday` },
  { id: "from-template", label: "מתבנית", detail: "הכרזת מנה חדשה" },
  { id: "from-published", label: "שכפול של תוכן שפורסם", detail: "" },
];

export const RECENT_ASSETS: { items: RecentAsset[]; note: string } = {
  items: [
    { id: "as1", label: "צילום מנה", swatch: { kind: "photo" } },
    { id: "as2", label: "צילום מנה", swatch: { kind: "photo" } },
    { id: "as3", label: "לוגו UMINO", swatch: { kind: "color", hex: INK, label: "דיו" } },
    { id: "as4", label: "רקע", swatch: { kind: "photo" } },
  ],
  note: "לוגו UMINO, צילומי מנות, רקעים",
};

/* ---------- E7 · export & publish ---------- */
export const PUBLISH_SUSHI: PublishPlan = {
  designId: "thursday-sushi",
  approvalId: "content-sushi-story",
  campaignId: "thursday-sushi",
  formats: ["story", "post"],
  downloads: [{ format: "story", label: "סטורי", files: "PNG · JPG" }, { format: "post", label: "פוסט אנכי", files: "PNG · JPG" }],
  channels: [
    { value: "ig", label: "Instagram · @umino" },
    { value: "fb", label: "Facebook · UMINO" },
    { value: "ig-fb", label: "Instagram + Facebook" },
  ],
  account: "Meta · מחובר עם הרשאת פרסום",
  defaultAt: at("2026-10-02", "18:00"),
  placeholder: { title: "התמונה עדיין מקום שמור", detail: "אפשר לתזמן רק אחרי שיתווסף צילום אמיתי.", taskId: "t-photo-shoot" },
  originNote: "קונספט שנוצר ב־AI (כיוון \"טיפוגרפי\"), טקסט נערך ע״י דנה. הסימון נשמר עם הקבצים שמורידים.",
  meta: {
    checks: [
      { id: "m-version", text: "מתזמנים את הגרסה שאושרה", tone: "ok" },
      { id: "m-safe", text: "הכותרת מחוץ לאזורים המוסתרים", tone: "ok" },
      { id: "m-offer", text: "הטקסט הנלווה מזכיר 1+1 שתוקפו טרם אומת", tone: "warning" },
    ],
    after: "Meta תפרסם במועד שנבחר. אחרי שהפוסט עולה אי אפשר לבטל אותו מכאן.",
    finalLabel: "תזמן ב־Meta",
    pendingLabel: "ממתין ל־Meta…",
    pendingNote: "\"תוזמן\" יוצג רק אחרי ש־Meta תאשר את התזמון.",
    successTitle: "Meta אישרה את התזמון",
    successDetail: "התוכן יעלה במועד שנבחר. \"פורסם\" יסומן רק כשהפוסט עלה בפועל.",
    failureTitle: "Meta לא אישרה את התזמון",
    failureDetail: "התוכן נשמר כטיוטה ולא תוזמן. דבר לא פורסם.",
    latencyMs: 2000,
  },
};
