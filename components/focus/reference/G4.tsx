/**
 * G4 — יומן פעולות
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (G4) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenG4() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              דוחות ובקרה › יומן פעולות
            </span>
            <h2 style={{ margin: "0px", fontSize: "30px", fontWeight: "800" }}>
              יומן פעולות
            </h2>
            <span style={{ fontSize: "16px" }}>
              מי עשה מה, מתי, ומה אפשר לבטל.
            </span>
          </div>
          <span style={{ fontSize: "14px", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset", color: "var(--f-muted)", width: "300px" }}>
            חיפוש ביומן
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", padding: "8px 14px", borderRadius: "999px", background: "#161d2e", color: "#ffffff" }}>
            הכול
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            בוצע בשמי
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            החלטות
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            פעולות חיצוניות
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            {"נכשלו "}
            <b style={{ color: "var(--f-red-text)" }}>
              1
            </b>
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            AI
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            אדם ▾
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0px, 1fr) 260px 170px", gap: "16px", padding: "11px 20px", background: "var(--f-bg)", fontSize: "12.5px", color: "var(--f-muted)" }}>
            <span>
              מתי ומי
            </span>
            <span>
              מה נעשה
            </span>
            <span>
              לפני ← אחרי
            </span>
            <span>
              תוצאה
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0px, 1fr) 260px 170px", gap: "16px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "start", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "13.5px" }}>
                <span className="sc-interp">
                  היום 09:52
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  רון · בעלים
                </span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  {"אישר את הסטורי והפוסט \"ערבי סושי של חמישי\""}
                </span>
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  UMINO · גרסה 3
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)", lineHeight: "1.5" }}>
              <span className="sc-interp">
                ממתין לאישור ← אושר
              </span>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
                <span className="sc-interp">
                  ✓ בוצע
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  בטל אישור
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0px, 1fr) 260px 170px", gap: "16px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "start", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "13.5px" }}>
                <span className="sc-interp">
                  היום 08:20
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  דנה · מנהלת
                </span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  {"סימנה את \"צילום מנת הספיישל\" כחסומה והקצתה לעצמה"}
                </span>
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  UMINO · סונכרן ל־ClickUp
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)", lineHeight: "1.5" }}>
              <span className="sc-interp">
                ללא אחראי ← דנה
              </span>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
                <span className="sc-interp">
                  ✓ בוצע
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  בטל
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0px, 1fr) 260px 170px", gap: "16px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "start", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "13.5px" }}>
                <span className="sc-interp">
                  היום 08:12
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  רון · בעלים
                </span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  אישר הוספת מבצע 1+1 לקמפיין
                </span>
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  {"נימוק: \"בתוקף עד 31.10. לא בערבי חג.\""}
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)", lineHeight: "1.5" }}>
              <span className="sc-interp">
                אין מבצע ← 1+1 על סטים נבחרים
              </span>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
                <span className="sc-interp">
                  ✓ בוצע
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  בטל פעולה
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0px, 1fr) 260px 170px", gap: "16px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "start", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "13.5px" }}>
                <span className="sc-interp">
                  היום 08:09
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  רון · בעלים
                </span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  שלח הצעת מחיר לנועה כהן
                </span>
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  אירוח עסקי — 8,750 ₪ · דרך Gmail
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)", lineHeight: "1.5" }}>
              <span className="sc-interp">
                טיוטה ← נשלחה · גרסה 1 ננעלה
              </span>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
                <span className="sc-interp">
                  ✓ בוצע
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  לא ניתן לבטל
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0px, 1fr) 260px 170px", gap: "16px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "start", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "13.5px" }}>
                <span className="sc-interp">
                  היום 03:00
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  סנכרון אוטומטי
                </span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  ניסיון לקרוא מדדי Instagram
                </span>
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  UMINO · פג תוקף ההרשאה
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)", lineHeight: "1.5" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-red-ink)", background: "var(--f-red-bg)" }}>
                <span className="sc-interp">
                  ! נכשל
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  נסה שוב
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0px, 1fr) 260px 170px", gap: "16px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "start", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "13.5px" }}>
                <span className="sc-interp">
                  28.9 16:40
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  ✦ מנוע השיווק
                </span>
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  הציע מבצע 1+1 לקמפיין יום חמישי
                </span>
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  הועבר לתור האישורים
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-ink-soft)", lineHeight: "1.5" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
                <span className="sc-interp">
                  ✓ בוצע
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  פתח הצעה
                </span>
              </span>
            </div>
          </div>
        </div>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          {"מזהים טכניים, גרסת תוכנית וקוד שגיאה מוצגים רק ב\"פרטים מתקדמים\" של כל אירוע."}
        </span>
      </div>
    </div>
  );
}
