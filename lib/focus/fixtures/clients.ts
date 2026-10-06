import type {
  ClientProfile, ContentItem, ContentStage, MarketingPlan, NewProjectDraft, PortfolioProject, WizardStepKey,
} from "@/lib/focus/contracts/clients";
import type { Metric } from "@/lib/focus/contracts/common";
import { dataOf, ready } from "@/lib/focus/contracts/loadable";
import { R } from "@/lib/focus/routes";
import { APPROVALS } from "./approvals";
import { at, DEMO_NOW } from "./clock";
import { CLIENTS, PEOPLE } from "./people";
import { PROJECT_UMINO } from "./projects";

/**
 * Clients & projects demo data (handoff H1–H5). Placeholders on the demo clock — no real people, e-mails or amounts.
 * The UMINO autumn launch is the same project as the project environment (PROJECT_UMINO), so both screens agree.
 */

/* ---------- H1 · portfolio ---------- */

const umino = PROJECT_UMINO;

export const PORTFOLIO: PortfolioProject[] = [
  {
    id: umino.id, name: umino.name, client: umino.client, ownerId: umino.ownerId, dueDate: umino.dueDate, health: umino.health,
    hours: umino.hours, pendingApprovals: umino.pendingApprovals, next: umino.next, updated: umino.updated,
    phase: "active", healthNote: "", href: R.project(umino.id), taskHref: R.workCreate("umino-autumn"),
  },
  {
    id: "gal-site", name: "אתר", client: CLIENTS.gal, ownerId: PEOPLE.yoav.id, dueDate: "2026-10-15",
    health: { state: "attention", reason: "ממתינים לחומרים מהלקוחה 6 ימים." }, hours: { spent: 22, budget: 30, certainty: "known" },
    pendingApprovals: 1, next: { text: "שיחה עם הלקוחה" }, updated: { at: at("2026-09-30", "15:00"), source: { system: "clickup", label: "ClickUp" } },
    phase: "active", healthNote: "", href: null, taskHref: `${R.work}?create=1`,
  },
  {
    id: "umino-october", name: "תוכן שוטף · אוקטובר", client: CLIENTS.umino, ownerId: PEOPLE.dana.id, dueDate: "2026-10-31",
    health: { state: "on_track" }, hours: { spent: 8, budget: 20, certainty: "known" },
    pendingApprovals: 0, next: { text: "תוכנית שבוע 41" }, updated: { at: at("2026-10-01", "06:40"), source: { system: "clickup", label: "ClickUp" } },
    phase: "active", healthNote: "כל התכנים בזמן.", href: null, taskHref: `${R.work}?create=1`,
  },
  {
    id: "shalosh-retainer", name: "ריטיינר תוכן", client: CLIENTS.shalosh, ownerId: PEOPLE.ron.id, dueDate: null, ongoing: true,
    health: { state: "attention", reason: "אין מכסת שעות מוגדרת." }, hours: { spent: 6, budget: null, certainty: "estimated" },
    pendingApprovals: 0, next: { text: "להגדיר מכסת שעות" }, updated: { at: at("2026-09-29", "11:00"), source: { system: "mytiv", label: "Mytiv" } },
    phase: "active", healthNote: "", href: null, taskHref: `${R.work}?create=1`,
  },
  {
    id: "gal-holidays", name: "קמפיין חגים", client: CLIENTS.gal, ownerId: PEOPLE.yoav.id, dueDate: "2026-10-20",
    health: { state: "on_track" }, hours: { spent: 2, budget: 12, certainty: "known" },
    pendingApprovals: 0, next: { text: "תוכנית שיווק לאישור", due: "2026-10-06" }, updated: { at: at("2026-09-30", "10:20"), source: { system: "mytiv", label: "Mytiv" } },
    phase: "planning", healthNote: "בתכנון. בריף אושר.", href: null, taskHref: `${R.work}?create=1`,
  },
  {
    id: "umino-summer", name: "תפריט קיץ", client: CLIENTS.umino, ownerId: PEOPLE.dana.id, dueDate: "2026-09-15",
    health: { state: "done", at: "2026-09-15" }, hours: { spent: 38, budget: 40, certainty: "known" },
    pendingApprovals: 0, next: null, updated: { at: at("2026-09-15", "17:00"), source: { system: "clickup", label: "ClickUp" } },
    phase: "done", healthNote: "נסגר בתוך מכסת השעות.", href: null, taskHref: `${R.work}?create=1`,
  },
];

/* ---------- H2 · client UMINO ---------- */

const reach = dataOf(PROJECT_UMINO.results)?.find((m) => m.id === "r-reach");

const CLIENT_RESULTS: Metric[] = [
  { id: "c-campaigns", label: "קמפיינים פעילים", reading: { kind: "known", value: 1 }, unit: "count", source: { system: "marketing_engine", label: "מנוע השיווק", href: R.campaign("thursday-sushi") }, note: "ערבי סושי של חמישי" },
  { id: "c-published", label: "תכנים שפורסמו · ספטמבר", reading: { kind: "known", value: 14 }, unit: "count", source: { system: "studio", label: "סטודיו", href: R.studio } },
  ...(reach ? [reach] : []),
];

export const CLIENT_UMINO: ClientProfile = {
  client: CLIENTS.umino,
  slug: "umino",
  logo: { text: "UMINO", bg: "#1f1b17", fg: "#f4ede1" },
  kind: "מסעדת סושי",
  since: "2026-03-01",
  primaryContact: "בעל העסק",
  ownerId: PEOPLE.dana.id,
  contacts: ready([
    { id: "ct-owner", role: "בעל העסק", scope: "מאשר מחירים", email: "owner@umino.example" },
    { id: "ct-chef", role: "השף", scope: "תפריט ושעות", email: "chef@umino.example" },
  ]),
  brain: ready({
    verified: 8, partial: 2, missing: 1,
    stale: [{ id: "st-cocktails", text: "מחירי קוקטיילים לא עדכניים" }],
    updatedAt: at("2026-09-30", "18:00"),
  }),
  connections: ready([
    { id: "cn-instagram", label: "Instagram", detail: "פג תוקף ההרשאה", state: "expired", since: at("2026-09-27", "03:00") },
    { id: "cn-meta", label: "Meta", detail: "פרסום", state: "ok" },
    { id: "cn-clickup", label: "ClickUp", detail: "3 תיקיות", state: "ok" },
  ]),
  results: ready(CLIENT_RESULTS),
};

/* ---------- H3 · new project wizard ---------- */

export const WIZARD_STEPS: { key: WizardStepKey; title: string; hint: string; optional?: boolean }[] = [
  { key: "basics", title: "לקוח ופרויקט", hint: "לקוח ושם לפרויקט" },
  { key: "goals", title: "מטרות ותוצרים", hint: "מה נחשב הצלחה" },
  { key: "dates", title: "תאריכים ואחראים", hint: "אחראי ראשי חובה" },
  { key: "budget", title: "תקציב או מכסת שעות", hint: "אפשר להשלים אחר כך", optional: true },
  { key: "connections", title: "חיבורים", hint: "ClickUp, Meta", optional: true },
  { key: "summary", title: "סיכום ואישור", hint: "בדיקה אחרונה" },
];

export const WIZARD_CLIENTS = [CLIENTS.umino, CLIENTS.gal, CLIENTS.shalosh];
/** People who can own a project (viewers cannot). */
export const WIZARD_OWNERS = [PEOPLE.ron, PEOPLE.dana, PEOPLE.yoav];
export const WIZARD_TEAM = [PEOPLE.ron, PEOPLE.dana, PEOPLE.yoav, PEOPLE.shira];
export const DELIVERABLE_SUGGESTIONS = ["תוכנית שיווק", "סדרת סטוריז", "פוסטים לפיד", "באנר לאתר", "קמפיין ממומן"];

/** The wizard starts on the demo day; everything else is empty until the user fills it. */
export const EMPTY_DRAFT: NewProjectDraft = {
  clientId: "", name: "", goal: "", deliverables: [], startDate: DEMO_NOW.slice(0, 10), dueDate: "", ownerId: "", teamIds: [],
  milestones: [], hoursBudget: "", moneyBudget: "", connections: { clickup: false, meta: false },
};

/* ---------- H4 · marketing plan (גל פילאטיס · אוקטובר) ---------- */

const planApproval = APPROVALS.find((a) => a.id === "plan-october");

export const PLAN_OCTOBER: MarketingPlan = {
  id: "plan-october",
  client: CLIENTS.gal,
  title: "תוכנית שיווק · אוקטובר",
  approvalId: "plan-october",
  status: planApproval?.status ?? "pending",
  requestedAt: planApproval?.requestedAt ?? at("2026-09-26", "10:00"),
  fields: [
    { key: "goal", label: "מטרה", value: "20 מנויים חדשים לסטודיו עד סוף אוקטובר" },
    { key: "audience", label: "קהלים", value: "נשים 28–45 בשכונה · מתאמנות לשעבר" },
    { key: "message", label: "מסר", value: "\"חוזרות לגוף אחרי החגים\"" },
    { key: "channels", label: "ערוצים", value: "Instagram · WhatsApp · אתר" },
  ],
  items: [
    { id: "pi-trial", title: "שיעור ניסיון חינם לחוזרות", channels: "Instagram, אתר", metric: "הרשמות לשיעור", approval: "pending" },
    { id: "pi-stories", title: "סדרת סטוריז \"יום בסטודיו\"", channels: "Instagram", metric: "צפיות, הודעות", approval: "pending" },
    { id: "pi-whatsapp", title: "הודעה למתאמנות לשעבר", channels: "WhatsApp", metric: "חזרה למנוי", approval: "pending" },
  ],
  assumptions: [
    { id: "as-trial", text: "שיעור ניסיון חינם", verification: "unverified", basis: "טרם אושר ע״י גל" },
    { id: "as-list", text: "רשימת מתאמנות לשעבר קיימת ומותרת לפנייה", verification: "unverified", basis: "לא נבדק מול הלקוחה" },
  ],
  basis: { briefAt: "2026-09-25", brainOf: CLIENTS.gal.name, originLabel: "נוסח בעזרת מנוע השיווק", origin: "ai_edited" },
  recipient: { name: "גל", email: "gal@example.co.il" },
};

/* ---------- H5 · content work board (UMINO) ---------- */

export const CONTENT_STAGES: { key: ContentStage; title: string; hideWhenEmpty?: boolean }[] = [
  { key: "idea", title: "רעיון" },
  { key: "planning", title: "בתכנון" },
  { key: "production", title: "בהפקה" },
  { key: "review", title: "בבדיקה" },
  { key: "pending_approval", title: "ממתין לאישור" },
  { key: "approved", title: "מאושר" },
  { key: "scheduled", title: "מתוזמן", hideWhenEmpty: true },
  { key: "measured", title: "נמדד", hideWhenEmpty: true },
];

export const BOARD_CLIENT = CLIENTS.umino;

export const CONTENT_ITEMS: ContentItem[] = [
  { id: "ci-thu-reminder", title: "תזכורת ביום חמישי", format: "סטורי", stage: "idea", ownerId: PEOPLE.dana.id, due: "2026-10-08", origin: "original" },
  { id: "ci-holiday-hours", title: "שעות פתיחה בחג", format: "פוסט", stage: "idea", ownerId: null, due: null, note: "מתוך הזדמנויות", origin: "ai_suggested" },
  { id: "ci-site-banner", title: "באנר לאתר · סתיו", format: "באנר", stage: "planning", ownerId: PEOPLE.yoav.id, due: null, origin: "original" },
  { id: "ci-carousel", title: "חמש מנות לסתיו", format: "קרוסלה", stage: "production", ownerId: PEOPLE.yoav.id, due: "2026-10-06", origin: "original", blockedReason: "תלוי בצילום מנת הספיישל", href: R.task("t-photo-shoot", "board") },
  { id: "ci-sushi-story", title: "ערבי סושי · גרסה 2", format: "סטורי", stage: "pending_approval", ownerId: PEOPLE.dana.id, due: "2026-10-02", origin: "ai_concept", approvalId: "content-sushi-story", href: R.approval("content-sushi-story") },
  { id: "ci-sushi-post", title: "ערבי סושי", format: "פוסט אנכי", stage: "pending_approval", ownerId: PEOPLE.dana.id, due: "2026-10-02", origin: "ai_concept", approvalId: "content-sushi-story", href: R.approval("content-sushi-story") },
  { id: "ci-autumn-launch", title: "תפריט סתיו · הכרזה", format: "פוסט", stage: "approved", ownerId: PEOPLE.yoav.id, due: null, note: "ממתין לתזמון", origin: "original" },
];
