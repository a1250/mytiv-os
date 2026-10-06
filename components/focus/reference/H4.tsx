/**
 * H4 — תוכנית שיווק
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (H4) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenH4() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div className="sc-host" data-sc-name="TopBar">
        <div style={{ minHeight: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px", padding: "0px clamp(12px, 2vw, 28px)", minWidth: "0px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)", fontFamily: "\"Open Sans\", system-ui, sans-serif", color: "var(--f-ink)" }} dir="rtl">
          <span style={{ fontSize: "19px", fontWeight: "800", marginInlineEnd: "6px", flex: "0 0 auto" }}>
            Mytiv
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)", marginInlineEnd: "8px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
            <span className="sc-interp">
              גל פילאטיס
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
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                שיווק ותוכן
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                מכירות
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
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
              ר
            </span>
          </span>
        </div>
      </div>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              שיווק ותוכן › תוכניות › גל פילאטיס
            </span>
            <h2 style={{ margin: "0px", fontSize: "30px", fontWeight: "800" }}>
              תוכנית שיווק · אוקטובר
            </h2>
            <span style={{ fontSize: "16px" }}>
              3 מהלכים ממתינים לאישור. 2 הנחות דורשות אימות לפני הפקה.
            </span>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", padding: "4px 10px", borderRadius: "999px" }}>
            … ממתין לאישור · 5 ימים
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            לוח עבודה
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            שלח לאישור הלקוחה
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              מטרה
            </span>
            <b style={{ fontSize: "15px", lineHeight: "1.4" }}>
              20 מנויים חדשים לסטודיו עד סוף אוקטובר
            </b>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              קהלים
            </span>
            <b style={{ fontSize: "15px", lineHeight: "1.4" }}>
              נשים 28–45 בשכונה · מתאמנות לשעבר
            </b>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              מסר
            </span>
            <b style={{ fontSize: "15px", lineHeight: "1.4" }}>
              {"\"חוזרות לגוף אחרי החגים\""}
            </b>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              ערוצים
            </span>
            <b style={{ fontSize: "15px", lineHeight: "1.4" }}>
              Instagram · WhatsApp · אתר
            </b>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 400px", gap: "20px", alignItems: "start" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 140px 160px 150px", gap: "14px", padding: "11px 20px", background: "var(--f-bg)", fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span>
                מהלך
              </span>
              <span>
                ערוץ
              </span>
              <span>
                מדד הצלחה
              </span>
              <span>
                אישור
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 140px 160px 150px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
              <b>
                שיעור ניסיון חינם לחוזרות
              </b>
              <span>
                Instagram, אתר
              </span>
              <span>
                הרשמות לשיעור
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", padding: "2px 8px", borderRadius: "999px" }}>
                … ממתין
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 140px 160px 150px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
              <b>
                {"סדרת סטוריז \"יום בסטודיו\""}
              </b>
              <span>
                Instagram
              </span>
              <span>
                צפיות, הודעות
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", padding: "2px 8px", borderRadius: "999px" }}>
                … ממתין
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 140px 160px 150px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
              <b>
                הודעה למתאמנות לשעבר
              </b>
              <span>
                WhatsApp
              </span>
              <span>
                חזרה למנוי
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", padding: "2px 8px", borderRadius: "999px" }}>
                … ממתין
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "16px 18px", borderRadius: "16px", background: "var(--f-amber-bg)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <b style={{ fontSize: "14px", color: "var(--f-amber-ink-strong)" }}>
                ○ הנחות שדורשות אימות · 2
              </b>
              <span style={{ fontSize: "13.5px", color: "var(--f-amber-ink-strong)", lineHeight: "1.5" }}>
                שיעור ניסיון חינם · טרם אושר ע״י גל
              </span>
              <span style={{ fontSize: "13.5px", color: "var(--f-amber-ink-strong)", lineHeight: "1.5" }}>
                רשימת מתאמנות לשעבר קיימת ומותרת לפנייה
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                בקש אימות מהלקוחה
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <b style={{ fontSize: "14px" }}>
                על מה התוכנית מבוססת
              </b>
              <span style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
                {"בריף מ־25.9 · מוח העסק של גל פילאטיס · "}
                <span style={{ color: "var(--f-accent-ink)", fontWeight: "700" }}>
                  ✦ נוסח בעזרת מנוע השיווק
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
