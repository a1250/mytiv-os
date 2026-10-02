/**
 * E3 — יצירה · שלבים 1–3: מטרה, פורמט ובריף
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (E3) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenE3() {
  return (
    <div className="f-screen f-focusmode" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ height: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "14px", padding: "0px 28px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "10px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          ✕ סגור
        </span>
        <b style={{ fontSize: "17px" }}>
          תוכן חדש
        </b>
        <div style={{ display: "flex", gap: "4px", fontSize: "13px" }}>
          <span style={{ padding: "6px 11px", borderRadius: "999px", color: "var(--f-green-text)", fontWeight: "700" }}>
            ✓ מטרה
          </span>
          <span style={{ padding: "6px 11px", borderRadius: "999px", color: "var(--f-green-text)", fontWeight: "700" }}>
            ✓ פורמט
          </span>
          <span style={{ padding: "6px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", fontWeight: "700" }}>
            3 בריף
          </span>
          <span style={{ padding: "6px 11px", color: "var(--f-muted)" }}>
            4 כיוונים
          </span>
          <span style={{ padding: "6px 11px", color: "var(--f-muted)" }}>
            5 עריכה
          </span>
        </div>
        <span style={{ flex: "1 1 0%" }}></span>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          הבריף נשמר לפני רגע
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0px, 1fr) 340px", gap: "24px", padding: "28px 40px 0px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "14px", color: "var(--f-green-text)" }}>
                ✓ 1 · מטרה
              </b>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>
                שנה
              </span>
            </div>
            <span style={{ fontSize: "14px" }}>
              UMINO · קמפיין ערבי סושי של חמישי
            </span>
            <span style={{ fontSize: "14px" }}>
              יותר הזמנות בין 19:00 ל־22:00
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              פעולה מהקהל: הזמנת שולחן
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "14px", color: "var(--f-green-text)" }}>
                ✓ 2 · ערוץ ופורמט
              </b>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>
                שנה
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "13px", fontWeight: "700", padding: "8px 12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                <span style={{ width: "9px", height: "16px", borderRadius: "2px", background: "var(--f-accent)" }}></span>
                סטורי
              </span>
              <span style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "13px", fontWeight: "700", padding: "8px 12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                <span style={{ width: "13px", height: "16px", borderRadius: "2px", background: "var(--f-accent)" }}></span>
                פוסט אנכי
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              Instagram, Facebook · המידות נקבעות אוטומטית
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <b style={{ fontSize: "14px" }}>
              Brand Kit
            </b>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#1f1b17", color: "#f4ede1", fontSize: "8px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                UMINO
              </span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>
                  UMINO
                </span>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  נבחר לפי הלקוח · טון: חם, עכשווי
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "20px", padding: "24px 26px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <b style={{ fontSize: "20px", flex: "1 1 0%" }}>
              3 · תוכן ובריף
            </b>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 16px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              ✦ הכן טיוטה בעזרת AI
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "14px", fontWeight: "700" }}>
              מסר מרכזי
            </label>
            <span style={{ fontSize: "15px", padding: "12px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
              ערב חמישי מתחיל כאן
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                טקסט משני
              </label>
              <span style={{ fontSize: "15px", padding: "12px 14px", borderRadius: "10px", boxShadow: "var(--f-accent) 0px 0px 0px 2px inset" }}>
                סושי, קוקטיילים וחברים|
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                הנעה לפעולה
              </label>
              <span style={{ fontSize: "15px", padding: "12px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                הזמינו שולחן
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                מבצע
              </label>
              <span style={{ fontSize: "15px", padding: "12px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                1+1 על סטים נבחרים
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--f-green-text)", fontWeight: "700" }}>
                ✓ אושר ע״י רון · בתוקף עד 31.10
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                שפה
              </label>
              <span style={{ fontSize: "15px", padding: "12px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                עברית ▾
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "14px", fontWeight: "700" }}>
              מידע שחייב להופיע
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                שעות 19:00–22:00 ✕
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                לוגו ✕
              </span>
              <span style={{ fontSize: "13px", padding: "7px 12px", borderRadius: "999px", border: "1.5px dashed var(--f-line-strong)" }}>
                + הוסף
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "14px", fontWeight: "700" }}>
              אסור להמציא
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-red-bg)", color: "#7f1f19" }}>
                מחירים ✕
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-red-bg)", color: "#7f1f19" }}>
                המלצות לקוחות ✕
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-red-bg)", color: "#7f1f19" }}>
                מבצעים שלא אושרו ✕
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "14px", fontWeight: "700" }}>
              חומרים
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ width: "84px", height: "64px", borderRadius: "10px", background: "#1f1b17" }}></span>
              <span style={{ width: "84px", height: "64px", borderRadius: "10px", background: "repeating-linear-gradient(135deg, var(--f-neutral-bg) 0px, var(--f-neutral-bg) 5px, var(--f-bg) 5px, var(--f-bg) 10px)" }}></span>
              <span style={{ width: "84px", height: "64px", borderRadius: "10px", border: "1.5px dashed var(--f-line-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "var(--f-muted)", textAlign: "center" }}>
                מהספרייה או העלאה
              </span>
            </div>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              צילום המנה טרם צולם. הכיוונים ישאירו מקום שמור.
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <b style={{ fontSize: "15px" }}>
              מה AI יעשה בשלב הבא
            </b>
            <span style={{ fontSize: "14px", lineHeight: "1.55" }}>
              ייצור 3 כיוונים שונים בגישה, לשני הפורמטים, לפי הבריף וה־Brand Kit.
            </span>
            <b style={{ fontSize: "13px", marginTop: "4px" }}>
              מה הוא לא יעשה
            </b>
            <span style={{ fontSize: "13.5px", lineHeight: "1.55", color: "var(--f-ink-soft)" }}>
              לא יוסיף מחירים, ציטוטים או נתונים. לא יפרסם ולא ישלח לאישור.
            </span>
            <b style={{ fontSize: "13px", marginTop: "4px" }}>
              כמה זמן
            </b>
            <span style={{ fontSize: "13.5px", lineHeight: "1.55", color: "var(--f-ink-soft)" }}>
              כדקה. אפשר לעזוב את המסך ולקבל התראה.
            </span>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: "14px", background: "var(--f-green-bg)", display: "flex", flexDirection: "column", gap: "6px" }}>
            <b style={{ fontSize: "13px", color: "#185436" }}>
              ✓ עובדות זמינות מהמוח של UMINO
            </b>
            <span style={{ fontSize: "13px", color: "#1f4a33", lineHeight: "1.5" }}>
              שעות פעילות · תפריט 28.9 · כתובת · טון כתיבה
            </span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: "24px", height: "80px", background: "var(--f-surface)", borderTop: "1px solid var(--f-border)", display: "flex", alignItems: "center", gap: "12px", padding: "0px 40px" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "12px 18px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          → חזרה
        </span>
        <span style={{ flex: "1 1 0%" }}></span>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          שדות חובה: מסר מרכזי, הנעה לפעולה ✓
        </span>
        <span style={{ fontSize: "15px", fontWeight: "700", padding: "14px 24px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
          ✦ צור 3 כיוונים
        </span>
      </div>
    </div>
  );
}
