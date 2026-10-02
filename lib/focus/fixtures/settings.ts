import type { AccountRole, AiCapability, AiProvider, BrandKit, BusinessSettings, Permission, PermissionRow, SettingsNavItem, UserAccount } from "@/lib/focus/contracts/settings";
import { R } from "@/lib/focus/routes";
import { at } from "./clock";
import { CLIENTS, PEOPLE } from "./people";

/** Settings demo data (handoff H13 users & permissions, H14 business / AI / Brand Kit). */

export const SETTINGS_NAV: SettingsNavItem[] = [
  { key: "business", label: "העסק והסטודיו", href: R.settingsBusiness },
  { key: "brand", label: "Brand Kits", href: `${R.settingsBusiness}#brand-kit` },
  { key: "users", label: "משתמשים והרשאות", href: R.settingsUsers },
  { key: "ai", label: "AI", href: `${R.settingsBusiness}#ai` },
  { key: "connections", label: "חיבורים", href: R.settings, count: 1, countLabel: "תקלה אחת בחיבור" },
];

/* ---------- H13 ---------- */

export const ROLE_LABEL: Record<AccountRole, { m: string; f: string; column: string }> = {
  owner: { m: "בעלים", f: "בעלים", column: "בעלים" },
  manager: { m: "מנהל", f: "מנהלת", column: "מנהל" },
  viewer: { m: "צופה", f: "צופה", column: "צופה" },
};

export const USERS: UserAccount[] = [
  { id: PEOPLE.ron.id, name: PEOPLE.ron.name, initial: PEOPLE.ron.initial, email: PEOPLE.ron.email, gender: "m", role: "owner", status: "active", lastActiveAt: null },
  { id: PEOPLE.dana.id, name: PEOPLE.dana.name, initial: PEOPLE.dana.initial, email: PEOPLE.dana.email, gender: "f", role: "manager", status: "active", lastActiveAt: at("2026-10-01", "08:05"), activityHref: R.activity },
  { id: PEOPLE.yoav.id, name: PEOPLE.yoav.name, initial: PEOPLE.yoav.initial, email: PEOPLE.yoav.email, gender: "m", role: "manager", status: "active", lastActiveAt: at("2026-09-30", "18:20"), activityHref: R.activity },
  { id: PEOPLE.shira.id, name: PEOPLE.shira.name, initial: PEOPLE.shira.initial, email: PEOPLE.shira.email, title: "רואת חשבון", gender: "f", role: "viewer", status: "active", lastActiveAt: at("2026-09-28", "11:00") },
];

export const PERMISSION_WORD: Record<Permission, { glyph: string; word: string }> = {
  yes: { glyph: "✓", word: "כן" },
  no: { glyph: "—", word: "לא" },
  gated: { glyph: "◆", word: "בסף" },
  own: { glyph: "◒", word: "רק לפרויקטים שלו" },
};

export const PERMISSIONS: PermissionRow[] = [
  { id: "view", label: "צפייה ודוחות", cells: { owner: "yes", manager: "yes", viewer: "yes" } },
  { id: "work", label: "משימות, לידים, פרויקטים", cells: { owner: "yes", manager: "yes", viewer: "no" } },
  { id: "content", label: "תוכן ו־AI", cells: { owner: "yes", manager: "yes", viewer: "no" } },
  { id: "high-risk", label: "אישור בסיכון גבוה", cells: { owner: "gated", manager: "no", viewer: "no" } },
  { id: "external", label: "שליחה חיצונית", cells: { owner: "gated", manager: "gated", viewer: "no" } },
  { id: "costs", label: "עלויות ורווחיות", cells: { owner: "yes", manager: "own", viewer: "no" } },
  { id: "admin", label: "חיבורים ומשתמשים", cells: { owner: "yes", manager: "no", viewer: "no" } },
];

export const PERMISSION_LEGEND = "◆ בסף = עם סיכום לפני ביצוע או סף · — לא = לא מוצג בממשק";

/* ---------- H14 ---------- */

export const BUSINESS: BusinessSettings = {
  name: "Mytiv",
  language: "he",
  timeZone: "Asia/Jerusalem",
  brandColor: "#5b45c9",
  ai: { drafts: true, suggestions: true },
};

export const LANGUAGES = [
  { value: "he", label: "עברית" },
  { value: "en", label: "אנגלית" },
];

export const TIME_ZONES = [
  { value: "Asia/Jerusalem", label: "ירושלים" },
  { value: "Europe/London", label: "לונדון" },
  { value: "America/New_York", label: "ניו יורק" },
];

export const AI_PROVIDERS: AiProvider[] = [
  { id: "text", label: "ספק טקסט", status: "connected", detail: "מפתח שמור · •••• 4f2a · לא מוצג שוב" },
  { id: "image", label: "יצירת תמונות", status: "connected", detail: "קונספטים בלבד · לא לצילומי מוצר" },
];

export const AI_CAPABILITIES: AiCapability[] = [
  { key: "drafts", label: "ניסוח טיוטות, סיכומים, כיוונים לתוכן", help: "AI מנסח. אדם עורך ומאשר לפני כל שימוש.", available: true },
  { key: "suggestions", label: "הצעות לפעולות", help: "כל הצעה עוברת לתור האישורים ולא מתבצעת לבד.", available: true },
  { key: "autoSend", label: "שליחה או פרסום אוטומטיים", help: "לא זמין במערכת. שליחה ופרסום תמיד דורשים אישור אדם.", available: false },
];

export const AI_CHECK_MS = 1400;

export const BRAND_KITS: BrandKit[] = [
  {
    clientId: CLIENTS.umino.id, clientName: CLIENTS.umino.name, href: R.clientBrain("umino"),
    colors: [{ hex: "#1f1b17", name: "פחם" }, { hex: "#f4ede1", name: "שמנת" }, { hex: "#c4462e", name: "חמרה" }, { hex: "#6b7f5e", name: "זית" }],
    rows: [
      { label: "פונטים", value: "כותרות: מותאם · גוף: Open Sans" },
      { label: "טון", value: "חם, עכשווי, לא צעקני" },
      { label: "מילים אסורות", value: "\"הכי טוב בעיר\", \"מבצע\" ללא תוקף" },
      { label: "חובה", value: "לוגו בכל סטורי · כתובת בפוסטים" },
      { label: "הסתייגות", value: "\"בכפוף לזמינות\"" },
    ],
    note: "נבחר אוטומטית בכל תוכן חדש של UMINO.",
  },
  {
    clientId: CLIENTS.gal.id, clientName: CLIENTS.gal.name,
    colors: [{ hex: "#2d3a3a", name: "צפחה" }, { hex: "#f6f3ee", name: "חול" }, { hex: "#b98b6e", name: "טרקוטה" }],
    rows: [
      { label: "פונטים", value: "כותרות ותוכן: Open Sans" },
      { label: "טון", value: "רגוע, מקצועי, אישי" },
      { label: "מילים אסורות", value: "\"ירידה במשקל מובטחת\"" },
      { label: "חובה", value: "שם הסטודיו בכל פוסט" },
      { label: "הסתייגות", value: "—" },
    ],
    note: "נבחר אוטומטית בכל תוכן חדש של גל פילאטיס.",
  },
];
