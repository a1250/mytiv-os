/**
 * Starter catalogue only. The editor reads a business's *own* service templates
 * from the service_templates table via the API — these rows are just what gets
 * inserted when a business asks to load the starter set, and are Mytiv's own
 * offerings and prices. Never render this array directly in a business-scoped
 * screen: that would show Mytiv's pricing to every other business.
 */

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  setupFee: number;
  monthlyFee: number;
  monthlyBreakdown?: string;
  monthlyBlockTitle?: string;
};

/** Row shape stored in service_templates. */
export type ServiceTemplate = {
  id: string;
  label: string;
  title: string | null;
  description: string | null;
  setupFee: number | null;
  monthlyFee: number | null;
  monthlyBreakdown: string | null;
  monthlyBlockTitle: string | null;
};

export const STARTER_SERVICE_TEMPLATES = [
  {
    label: "בוט שירות לקוחות AI",
    title: "בוט שירות לקוחות AI",
    description:
      "סוכן AI חכם ל-WhatsApp ואינסטגרם — עונה על שאלות, מתאם פגישות ומפנה לנציג אנושי כשצריך. כולל לוח בקרה לניהול שיחות ועריכת תסריטים.",
    setupFee: 4500,
    monthlyFee: 890,
    monthlyBlockTitle: "ריטיינר AI חודשי",
    monthlyBreakdown: "ניטור ותחזוקה שוטפת\nעדכוני תסריטים וידע\nדוח ביצועים חודשי\nתמיכה טכנית",
  },
  {
    label: "דף נחיתה",
    title: "דף נחיתה ממיר",
    description:
      "עיצוב ופיתוח דף נחיתה מקצועי עם תוכן שיווקי, טפסי לידים וחיבור ל-CRM. אופטימיזציה למובייל ו-SEO בסיסי.",
    setupFee: 2800,
    monthlyFee: 290,
    monthlyBlockTitle: "חבילת תחזוקה ואחסון",
    monthlyBreakdown: "אחסון בשרת מהיר\nתעודת אבטחה (SSL)\nגיבוי שבועי\nתמיכה טכנית",
  },
  {
    label: "אתר תדמית",
    title: "אתר תדמית מקצועי",
    description:
      "עיצוב ובניית אתר רב-עמודי עם מערכת ניהול תוכן, גלריה, עמוד שירותים ועמוד צור קשר. אופטימיזציה מלאה למובייל ו-SEO.",
    setupFee: 6500,
    monthlyFee: 490,
    monthlyBlockTitle: "חבילת תחזוקה ואחסון",
    monthlyBreakdown: "אחסון בשרת מהיר\nתעודת אבטחה (SSL)\nגיבוי יומי\nעדכוני תוכנה\nתמיכה טכנית",
  },
  {
    label: "אוטומציה עסקית",
    title: "אוטומציה עסקית",
    description:
      "בניית תהליכי אוטומציה חכמים שמחברים בין הכלים הקיימים: CRM, מייל, WhatsApp, Google Sheets ועוד. חוסך שעות עבודה ידנית מדי שבוע.",
    setupFee: 3200,
    monthlyFee: 390,
    monthlyBlockTitle: "ריטיינר תחזוקה חודשי",
    monthlyBreakdown: "ניטור תהליכים\nתיקון שגיאות\nהוספת שינויים קטנים\nדוח פעילות",
  },
  {
    label: "עוזר AI למנהל",
    title: "עוזר AI אישי למנהל",
    description:
      "עוזר AI מותאם אישית שמנהל לוח שנה, מסכם פגישות, מכין טיוטות מיילים ומספק תובנות מהנתונים העסקיים. מחובר ל-Gmail, Calendar ו-Notion.",
    setupFee: 3800,
    monthlyFee: 690,
    monthlyBlockTitle: "ריטיינר AI חודשי",
    monthlyBreakdown: "שיפורים ועדכונים שוטפים\nהרחבת יכולות\nתמיכה וזמינות\nדוח שימוש חודשי",
  },
];

export function blankService(): ServiceItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    setupFee: 0,
    monthlyFee: 0,
    monthlyBlockTitle: "",
    monthlyBreakdown: "",
  };
}

/** Turns a stored template row into a service line for the proposal being edited. */
export function serviceFromTemplate(template: ServiceTemplate): ServiceItem {
  return {
    id: crypto.randomUUID(),
    title: template.title || template.label,
    description: template.description ?? "",
    setupFee: template.setupFee ?? 0,
    monthlyFee: template.monthlyFee ?? 0,
    monthlyBlockTitle: template.monthlyBlockTitle ?? "",
    monthlyBreakdown: template.monthlyBreakdown ?? "",
  };
}
