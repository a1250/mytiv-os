/**
 * Ported as-is from the Electron app's src/lib/i18n.js — hand-rolled flat
 * dictionary (English string literal -> Hebrew translation), no i18next/ICU.
 * Extend HE as modules get ported; missing keys fall back to the English key.
 */
export const HE: Record<string, string> = {
  Dashboard: "לוח בקרה",
  "Tasks & Ops": "משימות ותפעול",
  "Lead CRM": "ניהול לידים",
  "Outreach Assistant": "עוזר פנייה",
  Mail: "דואר",
  Calendar: "יומן",
  "AI Weekly Radar": "רדאר שבועי",
  "Prompt Builder": "בילדר פרומפטים",
  "Prompt Library": "ספריית פרומפטים",
  "Carousel Studio": "סטודיו קרוסלות",
  Proposals: "הצעות מחיר",
  "Brief Analyzer": "מנתח בריף",
  Inspiration: "השראה",
  Moodboards: "מודבורדים",
  "Weekly Review": "סיכום שבועי",
  Settings: "הגדרות",
  "Loading…": "טוען…",
  "New task title…": "כותרת משימה חדשה…",
  Add: "הוסף",
  "No tasks yet.": "עדיין אין משימות.",
  Remove: "הסר",
  "No leads yet.": "עדיין אין לידים.",
  "New lead company name…": "שם חברה חדשה…",
  "Studio identity": "זהות המותג",
  "Studio name": "שם העסק",
  "Accent color": "צבע הדגשה",
  Save: "שמור",
  Saved: "נשמר",
  Notes: "הערות",
  "Add a note…": "הוסף הערה…",
  "New prompt title…": "כותרת פרומפט חדש…",
  "No saved prompts yet.": "עדיין אין פרומפטים שמורים.",
  "New proposal title…": "כותרת הצעת מחיר חדשה…",
  "No proposals yet.": "עדיין אין הצעות מחיר.",
  "Client name": "שם לקוח",
  Status: "סטטוס",
  "The Goal": "המטרה",
  Proposal: "הצעת מחיר",
  "Connect your Google account in Settings to see real Gmail here.": "חבר את חשבון Google שלך בהגדרות כדי לראות כאן Gmail אמיתי.",
  "Connect Google Account": "חבר חשבון Google",
  "Could not load inbox.": "לא ניתן לטעון את תיבת הדואר הנכנס.",
  "No messages.": "אין הודעות.",
  Unread: "לא נקרא",
  "Google Account": "חשבון Google",
  "Google account connected.": "חשבון Google חובר בהצלחה.",
  "Google connection failed": "החיבור לגוגל נכשל",
  "Not connected.": "לא מחובר.",
  Disconnect: "נתק",
  "Syncing…": "מסנכרן…",
  "Sync now": "סנכרן עכשיו",
  "Connect Google Calendar in Settings to sync — local events still work without it.": "חבר את יומן Google בהגדרות כדי לסנכרן — אירועים מקומיים עובדים גם בלעדיו.",
  "Event title…": "כותרת אירוע…",
  "No events yet.": "עדיין אין אירועים.",
};

export type Lang = "en" | "he";

export function makeT(lang: Lang) {
  if (lang !== "he") return (s: string) => s;
  return (s: string) => HE[s] ?? s;
}
