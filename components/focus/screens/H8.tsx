/**
 * H8 — גילוי לידים · חיפוש ברקע
 * Generated from the Claude Design handoff (H8) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/icon";

export default function ScreenH8() {
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
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", whiteSpace: "nowrap", flex: "0 0 auto" }}>
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
              ד
            </span>
          </span>
        </div>
      </div>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            מכירות › גילוי לידים
          </span>
          <h2 style={{ margin: "0px", fontSize: "30px", fontWeight: "800" }}>
            גילוי לידים
          </h2>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ flex: "1 1 0%", fontSize: "15px", padding: "13px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-accent) 0px 0px 0px 2px inset" }}>
            בתי קפה בוטיק בתל אביב שמעלים תוכן לאינסטגרם
          </span>
          <span style={{ fontSize: "14px", padding: "12px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            קטגוריה: בתי קפה ▾
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "13px 20px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            חפש
          </span>
        </div>
        <div style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px 18px", borderRadius: "14px", background: "var(--f-accent-weak)", color: "#2b1f7a" }} role="status">
          <span style={{ width: "22px", height: "22px", borderRadius: "50%", borderWidth: "3px", borderStyle: "solid", borderColor: "var(--f-accent) #d4cdf5 #d4cdf5", borderImage: "none", flex: "0 0 auto" }}></span>
          <span style={{ flex: "1 1 0%", fontSize: "14px" }}>
            <b>
              ⟳ מחפש ברקע · 6 תוצאות עד עכשיו.
            </b>
            {" אפשר לעזוב את המסך, נשלח התראה בסיום. בדרך כלל עד דקה."}
          </span>
          <span style={{ fontSize: "13px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-surface)" }}>
            עצור חיפוש
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 220px 260px 150px 150px", gap: "14px", padding: "11px 20px", background: "var(--f-bg)", fontSize: "12.5px", color: "var(--f-muted)" }}>
            <span>
              עסק
            </span>
            <span>
              מקורות
            </span>
            <span>
              פרטי קשר
            </span>
            <span>
              ביטחון בהתאמה
            </span>
            <span></span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 220px 260px 150px 150px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b>
                <span className="sc-interp">
                  {"בית קפה \"שלוש\""}
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  פלורנטין · פעיל באינסטגרם
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                אתר, Instagram
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                כבר ליד אצלך
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
              <span className="sc-interp">
                גבוה
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                ✓ כבר ליד
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 220px 260px 150px 150px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b>
                <span className="sc-interp">
                  {"קפה \"גבעול\""}
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  לב העיר · 3 פוסטים בשבוע
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                Instagram, Google Maps
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                info@… · מהאתר
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
              <span className="sc-interp">
                גבוה
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                הוסף כליד
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 220px 260px 150px 150px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b>
                <span className="sc-interp">
                  {"\"מקינטה\""}
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  יפו · פוסט אחרון לפני חודש
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                Google Maps
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-amber-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                משוער · לא אומת
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)" }}>
              <span className="sc-interp">
                בינוני
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                הוסף כליד
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 220px 260px 150px 150px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b>
                <span className="sc-interp">
                  {"קפה \"אחד\""}
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  רמת אביב · ללא אתר
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                Instagram
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                לא נמצא
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-neutral-ink)", background: "var(--f-neutral-bg)" }}>
              <span className="sc-interp">
                נמוך
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                מצא איש קשר
              </span>
            </span>
          </div>
        </div>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          {"שום עסק לא נוסף כליד בלי אישור. פרטי קשר שנמצאו בניחוש מסומנים \"משוער\" ולא מוצגים כעובדה."}
        </span>
      </div>
    </div>
  );
}
