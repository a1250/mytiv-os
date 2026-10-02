/**
 * G2 — שעות ורווחיות
 * Generated from the Claude Design handoff (G2) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenG2() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              דוחות ובקרה › שעות ורווחיות
            </span>
            <h2 style={{ margin: "0px", fontSize: "30px", fontWeight: "800" }}>
              ספטמבר 2026
            </h2>
            <span style={{ fontSize: "16px" }}>
              פרויקט אחד חורג מהשעות שתוכננו. הנתונים מוערכים עד שיסתיים דיווח השעות.
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            לפי פרויקט ▾
          </span>
        </div>
        <div style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px 18px", borderRadius: "14px", background: "var(--f-amber-bg)", color: "var(--f-amber-ink-strong)" }}>
          <b style={{ fontSize: "17px" }}>
            ≈
          </b>
          <span style={{ flex: "1 1 0%", fontSize: "14px" }}>
            <b>
              נתונים מוערכים.
            </b>
            {" 2 משימות בלי דיווח שעות, ועלות השעה של פרילנסר אחד מבוססת על הערכה. אלה אינם סכומים חשבונאיים סופיים."}
          </span>
          <a style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--f-amber-strong-text)" }} href="#">
            מה חסר
          </a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              שעות בפועל מול מתוכנן
            </span>
            <b style={{ fontSize: "24px" }}>
              ≈ 56 / 70
            </b>
            <span style={{ fontSize: "12px", color: "var(--f-amber-text)", fontWeight: "700" }}>
              מוערך · פרויקטים עם מכסה
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              הכנסה שנחתמה
            </span>
            <b style={{ fontSize: "24px" }}>
              18,400 ₪
            </b>
            <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
              ידוע · חשבוניות שהופקו
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              עלות עבודה
            </span>
            <b style={{ fontSize: "24px" }}>
              ≈ 9,950 ₪
            </b>
            <span style={{ fontSize: "12px", color: "var(--f-amber-text)", fontWeight: "700" }}>
              מוערך · כולל הערכה לפרילנסר
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              רווח גולמי
            </span>
            <b style={{ fontSize: "24px" }}>
              ≈ 8,450 ₪
            </b>
            <span style={{ fontSize: "12px", color: "var(--f-amber-text)", fontWeight: "700" }}>
              מוערך · ≈ 46%
            </span>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.3fr) 150px 160px 120px 120px 120px 120px", gap: "14px", padding: "11px 20px", background: "var(--f-bg)", fontSize: "12.5px", color: "var(--f-muted)" }}>
            <span>
              פרויקט ולקוח
            </span>
            <span>
              שעות
            </span>
            <span>
              ניצול
            </span>
            <span>
              הכנסה
            </span>
            <span>
              עלות
            </span>
            <span>
              רווח גולמי
            </span>
            <span>
              חריגה
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.3fr) 150px 160px 120px 120px 120px 120px", gap: "14px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b>
                השקת תפריט סתיו
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                UMINO
              </span>
            </div>
            <span>
              34 / 40
            </span>
            <span style={{ height: "8px", borderRadius: "4px", background: "var(--f-surface-2)", overflow: "hidden" }}>
              <span style={{ display: "block", width: "85%", height: "100%", background: "#8c5a00" }}></span>
            </span>
            <span>
              9,800 ₪
            </span>
            <span>
              ≈ 5,950 ₪
            </span>
            <span>
              ≈ 3,850 ₪
            </span>
            <span style={{ color: "var(--f-amber-text)", fontWeight: "700" }}>
              ◆ 85%
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.3fr) 150px 160px 120px 120px 120px 120px", gap: "14px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b>
                אתר
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                גל פילאטיס
              </span>
            </div>
            <span>
              22 / 30
            </span>
            <span style={{ height: "8px", borderRadius: "4px", background: "var(--f-surface-2)", overflow: "hidden" }}>
              <span style={{ display: "block", width: "73%", height: "100%", background: "var(--f-accent)" }}></span>
            </span>
            <span>
              6,200 ₪
            </span>
            <span>
              ≈ 3,000 ₪
            </span>
            <span>
              ≈ 3,200 ₪
            </span>
            <span style={{ color: "var(--f-muted)" }}>
              —
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.3fr) 150px 160px 120px 120px 120px 120px", gap: "14px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b>
                ריטיינר תוכן
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                {"בית קפה \"שלוש\""}
              </span>
            </div>
            <span style={{ color: "var(--f-red-text)", fontWeight: "700" }}>
              ≈ 6 / 0
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-red-text)", fontWeight: "700" }}>
              ללא מכסה מוגדרת
            </span>
            <span>
              2,400 ₪
            </span>
            <span>
              ≈ 1,000 ₪
            </span>
            <span>
              ≈ 1,400 ₪
            </span>
            <span style={{ color: "var(--f-red-text)", fontWeight: "700" }}>
              ▲ אין תקציב שעות
            </span>
          </div>
        </div>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          כל סכום מוערך מסומן ב־≈. סכום ידוע מגיע מחשבונית שהופקה. לחיצה על ערך פותחת את מגירת המקור.
        </span>
      </div>
    </div>
  );
}
