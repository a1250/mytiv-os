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
};

export type Lang = "en" | "he";

export function makeT(lang: Lang) {
  if (lang !== "he") return (s: string) => s;
  return (s: string) => HE[s] ?? s;
}
