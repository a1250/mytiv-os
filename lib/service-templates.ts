/**
 * Ready-made service rows for the proposal editor, ported from the offermytiv
 * prototype. Prices are starting points — the editor lets you override them
 * per proposal. `monthlyBreakdown` is one feature per line; the PDF renders
 * each line as a checkmark bullet inside the monthly block.
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

export type ServiceTemplate = {
  id: string;
  label: string;
  service: Omit<ServiceItem, "id">;
};

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    id: "ai-chatbot",
    label: "בוט שירות לקוחות AI",
    service: {
      title: "בוט שירות לקוחות AI",
      description:
        "סוכן AI חכם ל-WhatsApp ואינסטגרם — עונה על שאלות, מתאם פגישות ומפנה לנציג אנושי כשצריך. כולל לוח בקרה לניהול שיחות ועריכת תסריטים.",
      setupFee: 4500,
      monthlyFee: 890,
      monthlyBlockTitle: "ריטיינר AI חודשי",
      monthlyBreakdown: "ניטור ותחזוקה שוטפת\nעדכוני תסריטים וידע\nדוח ביצועים חודשי\nתמיכה טכנית",
    },
  },
  {
    id: "landing-page",
    label: "דף נחיתה",
    service: {
      title: "דף נחיתה ממיר",
      description:
        "עיצוב ופיתוח דף נחיתה מקצועי עם תוכן שיווקי, טפסי לידים וחיבור ל-CRM. אופטימיזציה למובייל ו-SEO בסיסי.",
      setupFee: 2800,
      monthlyFee: 290,
      monthlyBlockTitle: "חבילת תחזוקה ואחסון",
      monthlyBreakdown: "אחסון בשרת מהיר\nתעודת אבטחה (SSL)\nגיבוי שבועי\nתמיכה טכנית",
    },
  },
  {
    id: "business-website",
    label: "אתר תדמית",
    service: {
      title: "אתר תדמית מקצועי",
      description:
        "עיצוב ובניית אתר רב-עמודי עם מערכת ניהול תוכן, גלריה, עמוד שירותים ועמוד צור קשר. אופטימיזציה מלאה למובייל ו-SEO.",
      setupFee: 6500,
      monthlyFee: 490,
      monthlyBlockTitle: "חבילת תחזוקה ואחסון",
      monthlyBreakdown: "אחסון בשרת מהיר\nתעודת אבטחה (SSL)\nגיבוי יומי\nעדכוני תוכנה\nתמיכה טכנית",
    },
  },
  {
    id: "automation",
    label: "אוטומציה עסקית",
    service: {
      title: "אוטומציה עסקית",
      description:
        "בניית תהליכי אוטומציה חכמים שמחברים בין הכלים הקיימים: CRM, מייל, WhatsApp, Google Sheets ועוד. חוסך שעות עבודה ידנית מדי שבוע.",
      setupFee: 3200,
      monthlyFee: 390,
      monthlyBlockTitle: "ריטיינר תחזוקה חודשי",
      monthlyBreakdown: "ניטור תהליכים\nתיקון שגיאות\nהוספת שינויים קטנים\nדוח פעילות",
    },
  },
  {
    id: "ai-assistant",
    label: "עוזר AI למנהל",
    service: {
      title: "עוזר AI אישי למנהל",
      description:
        "עוזר AI מותאם אישית שמנהל לוח שנה, מסכם פגישות, מכין טיוטות מיילים ומספק תובנות מהנתונים העסקיים. מחובר ל-Gmail, Calendar ו-Notion.",
      setupFee: 3800,
      monthlyFee: 690,
      monthlyBlockTitle: "ריטיינר AI חודשי",
      monthlyBreakdown: "שיפורים ועדכונים שוטפים\nהרחבת יכולות\nתמיכה וזמינות\nדוח שימוש חודשי",
    },
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

export function serviceFromTemplate(template: ServiceTemplate): ServiceItem {
  return { id: crypto.randomUUID(), ...template.service };
}
