/**
 * H12 — פרומפטים · בונה וספרייה
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (H12) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenH12() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div className="sc-host" data-sc-name="TopBar">
        <div style={{ minHeight: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px", padding: "0px clamp(12px, 2vw, 28px)", minWidth: "0px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)", fontFamily: "\"Open Sans\", system-ui, sans-serif", color: "var(--f-ink)" }} dir="rtl">
          <span style={{ fontSize: "19px", fontWeight: "800", marginInlineEnd: "6px", flex: "0 0 auto" }}>
            Mytiv
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)", marginInlineEnd: "8px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
            <span className="sc-interp">
              כל הלקוחות
            </span>
            {" ▾"}
          </span>
          <div style={{ flex: "1 1 auto", minWidth: "0px", display: "flex", gap: "2px", overflowX: "auto", scrollbarWidth: "none" }}>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                היום שלי
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                לקוחות ופרויקטים
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                שיווק ותוכן
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                מכירות
              </span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                עבודה ותקשורת
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                דוחות
              </span>
            </span>
          </div>
          <span style={{ flex: "0 0 auto", width: "44px", height: "44px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="search" size={18} label="חיפוש" style={{ opacity: "0.8" }} />
          </span>
          <span style={{ flex: "0 0 auto", position: "relative", width: "44px", height: "44px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bell" size={18} label="התראות" style={{ opacity: "0.8" }} />
            <span style={{ position: "absolute", top: "4px", insetInlineEnd: "4px", fontSize: "10px", fontWeight: "700", background: "#b8322a", color: "#ffffff", borderRadius: "999px", padding: "0px 5px" }}>
              3
            </span>
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 16px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff", whiteSpace: "nowrap", flex: "0 0 auto" }}>
            + יצירה
          </span>
          <span style={{ flex: "0 0 auto", width: "40px", height: "40px", borderRadius: "50%", background: "var(--f-accent-avatar)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", color: "var(--f-accent-ink)" }}>
            <span className="sc-interp">
              ד
            </span>
          </span>
        </div>
      </div>
      <div style={{ padding: "28px 40px 40px", display: "grid", gridTemplateColumns: "320px minmax(0px, 1fr) 400px", gap: "24px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <b style={{ fontSize: "20px" }}>
            ספרייה
          </b>
          <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset", color: "var(--f-muted)" }}>
            חיפוש פרומפט
          </span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "12.5px" }}>
            <span style={{ fontWeight: "700", padding: "6px 11px", borderRadius: "999px", background: "#161d2e", color: "#ffffff" }}>
              הכול
            </span>
            <span style={{ padding: "6px 11px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
              ★ מועדפים
            </span>
            <span style={{ padding: "6px 11px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
              שלי
            </span>
            <span style={{ padding: "6px 11px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
              תבניות מערכת
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "12px 14px", boxShadow: "var(--f-accent) 0px 0px 0px 2px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <b style={{ fontSize: "14px" }}>
              ★ צילום מנה לפוסט
            </b>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              יצירת תמונות · שלי · גרסה 3
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "12px 14px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <b style={{ fontSize: "14px" }}>
              כותרות לסטורי
            </b>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              טקסט · תבנית מערכת
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "12px 14px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <b style={{ fontSize: "14px" }}>
              סיכום פגישת לקוח
            </b>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              טקסט · דנה
            </span>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "20px", padding: "22px 24px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <b style={{ fontSize: "20px", flex: "1 1 0%" }}>
              צילום מנה לפוסט
            </b>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              גרסה 3 · נשמר
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13.5px", fontWeight: "700" }}>
                כלי יעד
              </label>
              <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                יצירת תמונות ▾
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13.5px", fontWeight: "700" }}>
                סוג תוצר
              </label>
              <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                תמונת קונספט ▾
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13.5px", fontWeight: "700" }}>
              מטרה והקשר
            </label>
            <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset", lineHeight: "1.5" }}>
              קונספט לצילום מנה עבור UMINO, אור חם, שולחן כהה, לפי סגנון הצילום ב־Brand Kit
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13.5px", fontWeight: "700" }}>
              מגבלות
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                בלי טקסט בתמונה ✕
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                בלי לוגואים של אחרים ✕
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13.5px", fontWeight: "700" }}>
              רשימת בדיקות איכות
            </label>
            <span style={{ fontSize: "13.5px", lineHeight: "1.7" }}>
              ☑ תואם את סגנון הצילום · ☑ יחס 4:5 · ☐ אין אנשים מזוהים
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ background: "#161d2e", color: "#eef1f7", borderRadius: "16px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <b style={{ fontSize: "14px" }}>
              הפרומפט המלא
            </b>
            <p style={{ margin: "0px", fontSize: "13px", lineHeight: "1.65", fontFamily: "ui-monospace, monospace", color: "#cfd5e2", textAlign: "left" }} dir="ltr">
              Warm-lit close-up of a sushi set on a dark wooden table, shallow depth of field, 4:5, no text, no third-party logos, natural steam, editorial food photography.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
              העתק
            </span>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 16px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              ✦ שפר בעזרת AI
            </span>
            <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              צור גרסה
            </span>
          </div>
          <span style={{ fontSize: "12.5px", color: "var(--f-muted)", lineHeight: "1.5" }}>
            {"\"שפר\" מציג את ההבדלים מול הגרסה הנוכחית לפני שמירה."}
          </span>
        </div>
      </div>
    </div>
  );
}
