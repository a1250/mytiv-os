/**
 * D4 — מרכז האישורים · רשימה
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (D4) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenD4() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "20px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              היום שלי › אישורים
            </span>
            <h2 style={{ margin: "0px", fontSize: "32px", fontWeight: "800" }}>
              אישורים
            </h2>
            <span style={{ fontSize: "17px" }}>
              4 פריטים ממתינים להחלטה שלך. אחד מהם בסיכון גבוה.
            </span>
          </div>
          <span style={{ fontSize: "15px", fontWeight: "700", padding: "14px 22px", borderRadius: "999px", background: "#161d2e", color: "#ffffff" }}>
            התחל מצב פוקוס · 4
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 16px", borderRadius: "999px", background: "#161d2e", color: "#ffffff" }}>
            ממתין לי 4
          </span>
          <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            סיכון גבוה 1
          </span>
          <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            ממתין לאחרים 2
          </span>
          <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            פרויקט ▾
          </span>
          <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            סוג ▾
          </span>
          <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            תאריך ▾
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            אושרו · השבוע 5
          </span>
          <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            נדחו 1
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 340px", gap: "24px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 170px 120px 110px 150px", gap: "16px", padding: "0px 20px", fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span>
                מה מבקשים לאשר
              </span>
              <span>
                הציע
              </span>
              <span>
                סיכון
              </span>
              <span>
                ממתין
              </span>
              <span></span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px 20px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 170px 120px 110px 150px", gap: "16px", alignItems: "center", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  שליחת הצעת מחיר לנועה כהן
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  מכירות · שליחה חיצונית · 8,750 ₪
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                דנה
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                ▲ גבוה
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                יום
              </span>
              <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 0px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff", textAlign: "center" }}>
                בדוק ושלח
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px 20px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 170px 120px 110px 150px", gap: "16px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  הוספת מבצע 1+1 לקמפיין יום חמישי
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  UMINO · שינוי בקמפיין · משפיע על מחיר
                </span>
              </div>
              <span style={{ fontSize: "13px", color: "var(--f-accent-ink)", fontWeight: "600" }}>
                ✦ מנוע השיווק
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                ◆ בינוני
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                3 ימים
              </span>
              <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 0px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", textAlign: "center" }}>
                פתח החלטה
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px 20px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 170px 120px 110px 150px", gap: "16px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  {"סטורי \"ערבי סושי של חמישי\" · גרסה 3"}
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  UMINO · תוכן · מתוזמן למחר 18:00
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                {"דנה "}
                <span style={{ color: "var(--f-accent-ink)", fontWeight: "600" }}>
                  · ✦ נערך בעזרת AI
                </span>
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                ● נמוך
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                יומיים
              </span>
              <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 0px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", textAlign: "center" }}>
                בדוק ואשר
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px 20px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 170px 120px 110px 150px", gap: "16px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  תוכנית שיווק לאוקטובר
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  גל פילאטיס · תוכנית · 3 מהלכים
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                יואב
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                ◆ בינוני
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                5 ימים
              </span>
              <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 0px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", textAlign: "center" }}>
                פתח תוכנית
              </span>
            </div>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "16px 4px 4px" }}>
              ממתין לאחרים · 2
            </span>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 20px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 170px 120px 110px 150px", gap: "16px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px", opacity: "0.9" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  פוסט 4:5 · ערבי סושי
                </span>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  UMINO · ממתין לבעל העסק אצל הלקוח
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                יואב
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                ● נמוך
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                4 ימים
              </span>
              <span style={{ fontSize: "14px", fontWeight: "600", textAlign: "center" }}>
                שלח תזכורת
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 20px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 170px 120px 110px 150px", gap: "16px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px", opacity: "0.9" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "15px", fontWeight: "600" }}>
                  באנר לאתר · תפריט סתיו
                </span>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  UMINO · ממתין לדנה
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                יואב
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                ● נמוך
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                יום
              </span>
              <span></span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <b style={{ fontSize: "15px" }}>
                רמות סיכון
              </b>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ alignSelf: "flex-start", fontSize: "12px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                  ● נמוך
                </span>
                <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
                  מוגבל והפיך. אפשר לאשר מהרשימה.
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ alignSelf: "flex-start", fontSize: "12px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                  ◆ בינוני
                </span>
                <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
                  משפיע על מחיר, תקציב או תוכן. נימוק חובה.
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ alignSelf: "flex-start", fontSize: "12px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                  ▲ גבוה
                </span>
                <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
                  פעולה חיצונית. סיכום סופי לפני ביצוע, אף פעם לא אוטומטית.
                </span>
              </div>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <b style={{ fontSize: "15px" }}>
                הוחלט לאחרונה
              </b>
              <span style={{ fontSize: "13.5px" }}>
                <b style={{ color: "var(--f-green-text)" }}>
                  ✓
                </b>
                {" באנר תפריט קיץ · אתמול · "}
                <span >
                  בטל
                </span>
              </span>
              <span style={{ fontSize: "13.5px" }}>
                <b style={{ color: "var(--f-amber-text)" }}>
                  ↺
                </b>
                {" קרוסלה \"מאחורי הקלעים\" · נשלח לתיקון"}
              </span>
              <span style={{ fontSize: "13.5px" }}>
                <b style={{ color: "var(--f-red-text)" }}>
                  ✕
                </b>
                {" מבצע \"שתייה חינם\" · נדחה 27.9"}
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>
                ליומן הפעולות
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
