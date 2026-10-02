/**
 * E7 — יצוא ופרסום · אחרי אישור · "נשמר", "יוצא", "תוזמן" ו"פורסם" הם מצבים נפרדים
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (E7) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenE7() {
  return (
    <div className="f-screen f-focusmode" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ height: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "12px", padding: "0px 24px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "10px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          → לקמפיין
        </span>
        <b style={{ fontSize: "16px" }}>
          ערבי סושי של חמישי · סטורי ופוסט
        </b>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-green-text)", boxShadow: "#23774a 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "999px" }}>
          ✓ אושר ע״י רון · גרסה 3 · 09:52
        </span>
        <span style={{ flex: "1 1 0%" }}></span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 460px", gap: "24px", padding: "28px 40px 40px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "20px", padding: "22px 24px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <b style={{ fontSize: "17px" }}>
              הורדה
            </b>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "14px", borderRadius: "14px", background: "var(--f-bg)" }}>
                <span style={{ width: "24px", height: "42px", borderRadius: "4px", background: "#1f1b17" }}></span>
                <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column" }}>
                  <b style={{ fontSize: "14px" }}>
                    סטורי
                  </b>
                  <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                    PNG · JPG
                  </span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-surface)" }}>
                  הורד
                </span>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "14px", borderRadius: "14px", background: "var(--f-bg)" }}>
                <span style={{ width: "34px", height: "42px", borderRadius: "4px", background: "#1f1b17" }}></span>
                <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column" }}>
                  <b style={{ fontSize: "14px" }}>
                    פוסט אנכי
                  </b>
                  <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                    PNG · JPG
                  </span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-surface)" }}>
                  הורד
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                הורד את כל הגדלים · ZIP
              </span>
              <span style={{ fontSize: "14px", fontWeight: "600", padding: "12px 18px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                העתק טקסט נלווה
              </span>
              <span style={{ fontSize: "14px", fontWeight: "600", padding: "12px 18px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                PDF לקרוסלה
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              {"הורדה מסמנת את התוכן \"יוצא\", לא \"פורסם\"."}
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "20px", padding: "22px 24px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b style={{ fontSize: "17px" }}>
                תזמון ופרסום
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                דרך Meta · מחובר עם הרשאת פרסום
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", fontWeight: "700" }}>
                  ערוצים
                </label>
                <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                  Instagram · @umino
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", fontWeight: "700" }}>
                  תאריך
                </label>
                <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                  שישי 2.10.2026
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", fontWeight: "700" }}>
                  שעה
                </label>
                <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                  18:00
                </span>
              </div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--f-amber-bg)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <b style={{ fontSize: "13.5px", color: "var(--f-amber-ink-strong)" }}>
                ◆ התמונה עדיין מקום שמור
              </b>
              <span style={{ fontSize: "13.5px", color: "var(--f-amber-ink-strong)" }}>
                אפשר לתזמן רק אחרי שיתווסף צילום אמיתי. הצילום מתוכנן ל־3.10.
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "15px", fontWeight: "700", padding: "13px 22px", borderRadius: "999px", background: "var(--f-border)", color: "var(--f-muted)" }}>
                המשך לתזמון
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                התזמון יעבור דרך מסך סיכום לפני ביצוע
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "20px", padding: "20px 22px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <b style={{ fontSize: "16px" }}>
              המצב של התוכן
            </b>
            <div style={{ display: "flex", flexDirection: "column", gap: "0px", borderInlineStart: "2px solid var(--f-border)", paddingInlineStart: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "6px 0px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-23px", top: "9px", width: "12px", height: "12px", borderRadius: "50%", background: "#23774a" }}></span>
                <b style={{ fontSize: "14px" }}>
                  נשמר
                </b>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  גרסה 3 · 09:40
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "6px 0px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-23px", top: "9px", width: "12px", height: "12px", borderRadius: "50%", background: "#23774a" }}></span>
                <b style={{ fontSize: "14px" }}>
                  אושר
                </b>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  רון · 09:52
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "6px 0px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-23px", top: "9px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--f-surface)", boxShadow: "var(--f-line-strong) 0px 0px 0px 2px inset" }}></span>
                <b style={{ fontSize: "14px", color: "var(--f-muted)" }}>
                  יוצא
                </b>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  עדיין לא הורד
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "6px 0px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-23px", top: "9px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--f-surface)", boxShadow: "var(--f-line-strong) 0px 0px 0px 2px inset" }}></span>
                <b style={{ fontSize: "14px", color: "var(--f-muted)" }}>
                  תוזמן
                </b>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  רק אחרי ש־Meta מאשרת
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "6px 0px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-23px", top: "9px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--f-surface)", boxShadow: "var(--f-line-strong) 0px 0px 0px 2px inset" }}></span>
                <b style={{ fontSize: "14px", color: "var(--f-muted)" }}>
                  פורסם
                </b>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  רק כשהפוסט עלה בפועל
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "20px", padding: "20px 22px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <b style={{ fontSize: "15px" }}>
              מקור התוכן
            </b>
            <span style={{ fontSize: "13.5px", lineHeight: "1.55" }}>
              {"קונספט שנוצר ב־AI (כיוון \"טיפוגרפי\"), טקסט נערך ע״י דנה. הסימון נשמר עם הקבצים שמורידים."}
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>
              היסטוריית גרסאות
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
