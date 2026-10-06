/**
 * E1 — קמפיין · נקודת הכניסה ליצירת תוכן
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (E1) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenE1() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ background: "var(--f-surface)", padding: "22px 40px 20px", display: "flex", flexDirection: "column", gap: "14px", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          שיווק ותוכן › קמפיינים › UMINO
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: "0px", fontSize: "30px", fontWeight: "800" }}>
              ערבי סושי של חמישי
            </h2>
            <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
              UMINO · השקת תפריט סתיו · 1.10–31.10.2026 · Instagram, Facebook · אחראית: דנה
            </span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)", padding: "5px 12px", borderRadius: "6px" }}>
            ◐ בתהליך
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            ערוך קמפיין
          </span>
          <span style={{ fontSize: "15px", fontWeight: "700", padding: "13px 22px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            ✦ צור תוכן לקמפיין
          </span>
        </div>
      </div>
      <div style={{ padding: "28px 40px 40px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 380px", gap: "24px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: "0px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                מטרה
              </span>
              <b style={{ fontSize: "16px", lineHeight: "1.4" }}>
                יותר הזמנות בין 19:00 ל־22:00 בימי חמישי
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                יעד: 120 הזמנות בחודש · נקבע ע״י רון
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                קהל
              </span>
              <b style={{ fontSize: "16px", lineHeight: "1.4" }}>
                זוגות וקבוצות חברים באזור
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                מוח העסק · ✓ אומת
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                מסר מרכזי
              </span>
              <b style={{ fontSize: "16px", lineHeight: "1.4" }}>
                {"\"ערב חמישי מתחיל כאן\""}
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                הצעה: 1+1 על סטים · ✓ אושר עד 31.10
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "20px 22px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <b style={{ fontSize: "16px" }}>
                תוכנית תוכן
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                5 תכנים · 2 לאישור
              </span>
              <span style={{ flex: "1 1 0%" }}></span>
              <span style={{ display: "flex", gap: "2px", padding: "3px", borderRadius: "999px", background: "var(--f-surface-2)", fontSize: "13px" }}>
                <span style={{ padding: "6px 12px", borderRadius: "999px", background: "var(--f-surface)", fontWeight: "700", boxShadow: "rgba(22, 29, 46, 0.12) 0px 1px 2px" }}>
                  רשימה
                </span>
                <span style={{ padding: "6px 12px" }}>
                  Kanban
                </span>
                <span style={{ padding: "6px 12px" }}>
                  לוח שנה
                </span>
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0px, 1fr) 120px 150px 110px", gap: "14px", padding: "0px 4px", fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span></span>
              <span>
                תוכן
              </span>
              <span>
                פרסום
              </span>
              <span>
                מצב
              </span>
              <span></span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0px, 1fr) 120px 150px 110px", gap: "14px", alignItems: "center", padding: "10px 4px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span style={{ width: "40px", height: "72px", borderRadius: "6px", background: "#1f1b17" }}></span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b style={{ fontSize: "14.5px" }}>
                  סטורי · ערב חמישי מתחיל כאן
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  Instagram · דנה · גרסה 3
                </span>
              </div>
              <span style={{ fontSize: "13.5px" }}>
                שישי 2.10, 18:00
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "999px" }}>
                … ממתין לאישור
              </span>
              <span style={{ fontSize: "13.5px", fontWeight: "700" }}>
                פתח
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0px, 1fr) 120px 150px 110px", gap: "14px", alignItems: "center", padding: "10px 4px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span style={{ width: "58px", height: "72px", borderRadius: "6px", background: "#1f1b17" }}></span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b style={{ fontSize: "14.5px" }}>
                  פוסט אנכי · ערב חמישי מתחיל כאן
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  Instagram, Facebook · דנה
                </span>
              </div>
              <span style={{ fontSize: "13.5px" }}>
                שישי 2.10, 18:00
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "999px" }}>
                … ממתין לאישור
              </span>
              <span style={{ fontSize: "13.5px", fontWeight: "700" }}>
                פתח
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0px, 1fr) 120px 150px 110px", gap: "14px", alignItems: "center", padding: "10px 4px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span style={{ display: "flex", gap: "2px" }}>
                <span style={{ width: "20px", height: "26px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
                <span style={{ width: "20px", height: "26px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
                <span style={{ width: "20px", height: "26px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b style={{ fontSize: "14.5px" }}>
                  קרוסלה · חמש מנות לסתיו
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  Instagram · יואב · חסום ע״י צילום
                </span>
              </div>
              <span style={{ fontSize: "13.5px" }}>
                שלישי 6.10
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "3px 9px", borderRadius: "6px" }}>
                ■ חסום
              </span>
              <span style={{ fontSize: "13.5px", fontWeight: "700" }}>
                פתח
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0px, 1fr) 120px 150px 110px", gap: "14px", alignItems: "center", padding: "10px 4px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span style={{ width: "72px", height: "38px", borderRadius: "6px", background: "var(--f-surface-2)" }}></span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b style={{ fontSize: "14.5px" }}>
                  באנר לאתר · תפריט סתיו
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  אתר · יואב
                </span>
              </div>
              <span style={{ fontSize: "13.5px" }}>
                —
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", color: "var(--f-muted)", boxShadow: "#4d5870 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "999px" }}>
                ✎ טיוטה
              </span>
              <span style={{ fontSize: "13.5px", fontWeight: "700" }}>
                פתח
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0px, 1fr) 120px 150px 110px", gap: "14px", alignItems: "center", padding: "10px 4px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span style={{ width: "40px", height: "72px", borderRadius: "6px", border: "1.5px dashed var(--f-line-strong)" }}></span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b style={{ fontSize: "14.5px", color: "var(--f-muted)" }}>
                  סטורי · תזכורת ביום חמישי
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  בתוכנית, עדיין לא נוצר
                </span>
              </div>
              <span style={{ fontSize: "13.5px" }}>
                חמישי 8.10
              </span>
              <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: "var(--f-surface-2)" }}>
                ○ רעיון
              </span>
              <span style={{ fontSize: "13.5px", fontWeight: "700" }}>
                ✦ צור
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "15px" }}>
                תוצאות
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                מתחילת הקמפיין
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "14px" }}>
                הזמנות בחמישי 19–22
              </span>
              <span>
                <b style={{ fontSize: "20px" }}>
                  —
                </b>
                {" "}
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  טרם התקבל
                </span>
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "14px" }}>
                חשיפות Instagram
              </span>
              <b style={{ fontSize: "20px", color: "var(--f-neutral-text)" }}>
                —
              </b>
            </div>
            <span style={{ fontSize: "12.5px", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              ⊘ לא זמין עקב תקלה בחיבור מ־27.9
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              הקמפיין התחיל היום. נתון ראשון צפוי ביום שישי.
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <b style={{ fontSize: "15px" }}>
              תקציב ונכסים
            </b>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span>
                תקציב מדיה
              </span>
              <span style={{ color: "var(--f-neutral-text)", fontWeight: "600" }}>
                — טרם התקבל
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span>
                נכסים מאושרים
              </span>
              <span>
                0 מתוך 5
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span>
                אישורים פתוחים
              </span>
              <span>
                2
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <b style={{ fontSize: "15px" }}>
              יומן שינויים
            </b>
            <span style={{ fontSize: "13px", lineHeight: "1.5" }}>
              היום 08:12 · רון אישר מבצע 1+1 עד 31.10
            </span>
            <span style={{ fontSize: "13px", lineHeight: "1.5" }}>
              29.9 · דנה הוסיפה את הקרוסלה לתוכנית
            </span>
            <span style={{ fontSize: "13px", lineHeight: "1.5" }}>
              22.9 · רון אישר את תוכנית השיווק
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
