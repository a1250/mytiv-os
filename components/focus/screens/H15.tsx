/**
 * H15 — התראות · ארבע קבוצות
 * Generated from the Claude Design handoff (H15) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/icon";

export default function ScreenH15() {
  return (
    <div className="f-screen" style={{ minHeight: "640px", background: "var(--f-bg)", display: "flex", flexDirection: "column", position: "relative", width: "100%" }}>
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
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", whiteSpace: "nowrap", flex: "0 0 auto" }}>
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
      <div style={{ padding: "28px 40px", opacity: "0.35", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ fontSize: "14px" }}>
          יום חמישי, 1 באוקטובר 2026
        </span>
        <b style={{ fontSize: "34px" }}>
          בוקר טוב, רון
        </b>
      </div>
      <div style={{ position: "absolute", top: "76px", insetInlineEnd: "150px", width: "440px", background: "var(--f-surface)", borderRadius: "20px", boxShadow: "var(--f-border) 0px 0px 0px 1px, rgba(22, 29, 46, 0.5) 0px 24px 48px -24px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 18px 0px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: "17px" }}>
              התראות
            </b>
            <a style={{ fontSize: "13px", fontWeight: "600" }} href="#">
              סמן הכול כנקרא
            </a>
          </div>
          <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--f-surface-2)", borderRadius: "999px", fontSize: "12.5px" }}>
            <span style={{ flex: "1 1 0%", textAlign: "center", padding: "8px 0px", borderRadius: "999px", background: "var(--f-surface)", fontWeight: "700", boxShadow: "rgba(22, 29, 46, 0.12) 0px 1px 2px" }}>
              דורש פעולה 2
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center", padding: "8px 0px" }}>
              עדכונים 4
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center", padding: "8px 0px" }}>
              הושלמו
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center", padding: "8px 0px", color: "var(--f-red-text)", fontWeight: "700" }}>
              תקלות 1
            </span>
          </div>
        </div>
        <div style={{ padding: "10px 8px 8px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px", borderRadius: "12px", background: "var(--f-accent-tint)", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--f-accent)", marginTop: "7px", flex: "0 0 auto" }}></span>
            <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "3px" }}>
              <b style={{ fontSize: "14px" }}>
                הצעה לנועה כהן ממתינה לשליחה
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                מכירות · ▲ סיכון גבוה · לפני שעה
              </span>
            </div>
            <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 12px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
              בדוק
            </span>
          </div>
          <div style={{ padding: "12px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--f-accent)", marginTop: "7px", flex: "0 0 auto" }}></span>
            <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "3px" }}>
              <b style={{ fontSize: "14px" }}>
                מבצע 1+1 ממתין להחלטה שלך
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                UMINO · ◆ בינוני · 3 ימים
              </span>
            </div>
            <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              פתח
            </span>
          </div>
        </div>
        <div style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--f-surface-2)", fontSize: "12.5px", color: "var(--f-muted)", lineHeight: "1.5" }}>
          תקלות בחיבורים בלשונית נפרדת, כדי שלא ייבלעו בין עדכונים רגילים.
        </div>
      </div>
    </div>
  );
}
