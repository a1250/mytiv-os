import type { Design, FormatDef } from "@/lib/focus/contracts/studio";
import { at } from "./clock";

/**
 * Studio demo content (handoff Desktop 2, D7, M8). Client brand colours are the client's content (Brand Kit), not
 * theme tokens — they stay as data. Photos are placeholders until the client's assets arrive.
 */
export const FORMATS: FormatDef[] = [
  { key: "story", label: "סטורי", hint: "מסך מלא", ratio: { w: 9, h: 16 } },
  { key: "post", label: "פוסט אנכי", hint: "פיד", ratio: { w: 4, h: 5 } },
  { key: "square", label: "ריבוע", hint: "קטלוג", ratio: { w: 1, h: 1 } },
  { key: "banner", label: "באנר רחב", hint: "אתר, מייל", ratio: { w: 16, h: 9 } },
  { key: "carousel", label: "קרוסלה", hint: "עד 10 שקפים", ratio: { w: 4, h: 5 } },
  { key: "custom", label: "מותאם", hint: "מידות ידניות", ratio: { w: 1, h: 1 } },
];

const INK = "#1f1b17", CREAM = "#f4ede1", SAND = "#e6dccb", PHOTO: [string, string] = ["#3a342d", "#2e2924"];

export const DESIGNS: Design[] = [
  {
    id: "thursday-sushi",
    title: "ערבי סושי של חמישי",
    client: "UMINO",
    campaign: "ערבי סושי של חמישי",
    origin: "ai_concept",
    originLabel: "קונספט AI · נערך ע״י דנה",
    version: 3,
    savedAt: at("2026-10-01", "08:09"),
    brand: {
      client: "UMINO",
      colors: [{ hex: INK, label: "דיו" }, { hex: CREAM, label: "שמנת" }, { hex: "#c4462e", label: "אדום" }, { hex: "#6b7f5e", label: "זית" }],
      font: "Open Sans · 800",
      tone: "חם, ענייני, בלי סופרלטיבים",
    },
    variants: [
      {
        format: "story", base: { w: 360, h: 640 }, background: INK,
        safeZones: [{ edge: "top", height: 90, label: "אזור שם החשבון והסגירה" }, { edge: "bottom", height: 120, label: "אזור התגובה והשליחה" }],
        layers: [
          { id: "headline", kind: "headline", label: "כותרת", visible: true, locked: false, text: "ערב חמישי\nמתחיל כאן", box: { top: 112, inline: 30, inlineEnd: 30 }, style: { size: 42, weight: 800, color: CREAM, lineHeight: 1.02 } },
          { id: "sub", kind: "text", label: "טקסט משני", visible: true, locked: false, text: "סושי, קוקטיילים וחברים · 19:00–22:00", box: { top: 444, inline: 30, inlineEnd: 30 }, style: { size: 15, color: SAND } },
          { id: "cta", kind: "button", label: "כפתור · הזמינו שולחן", visible: true, locked: false, text: "הזמינו שולחן", box: { top: 476, inline: 30 }, style: { size: 14, weight: 700, color: INK, bg: CREAM, pill: true } },
          { id: "logo", kind: "logo", label: "לוגו UMINO", visible: false, locked: true, text: "UMINO", box: { top: 100, inline: 30, inlineEnd: 30 }, style: { size: 12, weight: 800, color: CREAM, tracking: ".12em" }, required: true },
          { id: "photo", kind: "image", label: "תמונה · מקום שמור", visible: true, locked: false, text: "צילום מנה · מקום שמור", box: { top: 240, inline: 30, inlineEnd: 30, height: 190 }, style: { pattern: PHOTO, color: SAND } },
          { id: "bg", kind: "background", label: "רקע", visible: true, locked: true, box: { top: 0, inline: 0 }, style: { bg: INK } },
        ],
      },
      {
        format: "post", base: { w: 256, h: 320 }, background: INK, safeZones: [],
        layers: [
          { id: "headline", kind: "headline", label: "כותרת", visible: true, locked: false, text: "ערב חמישי מתחיל כאן", box: { top: 20, inline: 20, inlineEnd: 20 }, style: { size: 24, weight: 800, color: CREAM, lineHeight: 1.05 } },
          { id: "sub", kind: "text", label: "טקסט משני", visible: true, locked: false, text: "סושי, קוקטיילים וחברים · 19:00–22:00", box: { top: 84, inline: 20, inlineEnd: 20 }, style: { size: 12, color: SAND } },
          { id: "cta", kind: "button", label: "כפתור", visible: true, locked: false, text: "הזמינו שולחן", box: { top: 152, inline: 20 }, style: { size: 11, weight: 700, color: INK, bg: CREAM, pill: true } },
          { id: "photo", kind: "image", label: "תמונה", visible: true, locked: false, box: { bottom: 0, inline: 0, inlineEnd: 0, height: 130 }, style: { pattern: PHOTO } },
        ],
      },
    ],
    checks: [
      { id: "c-logo", level: "warning", text: "הלוגו מוסתר. ב־Brand Kit של UMINO הלוגו נדרש בכל סטורי.", fix: { label: "הצג לוגו", layerId: "logo" } },
      { id: "c-photo", level: "info", text: "הצילום הוא מקום שמור. אפשר לשלוח לאישור, אבל לא לתזמן." },
      { id: "p1", level: "pass", text: "הכותרת מחוץ לאזור המוסתר (תוקן בגרסה 3)" },
      { id: "p2", level: "pass", text: "יש הנעה לפעולה" },
      { id: "p3", level: "pass", text: "\"19:00–22:00\" אומת במוח העסק" },
      { id: "p4", level: "pass", text: "אין מספרים ללא מקור" },
      { id: "p5", level: "pass", text: "ניגודיות ואיות תקינים" },
    ],
    comments: [{ id: "cm1", author: "רון", target: "כותרת", text: "להוריד קצת את הכותרת", resolvedIn: 3 }],
    versions: [{ n: 3, note: "נוכחית · הכותרת הוזזה מתחת לאזור החשבון" }, { n: 2, note: "נשלחה לתיקון ע״י רון" }, { n: 1, note: "קונספט AI" }],
  },
];

export const designById = (id: string) => DESIGNS.find((d) => d.id === id);
