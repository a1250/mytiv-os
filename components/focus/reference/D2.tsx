/**
 * D2 — סביבת פרויקט › סקירה
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (D2) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenD2() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ background: "var(--f-surface)", padding: "24px 40px 22px", display: "flex", flexDirection: "column", gap: "18px", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          לקוחות ופרויקטים › UMINO
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#1f1b17", color: "#f4ede1", fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center" }}>
            UMINO
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: "0px", fontSize: "30px", fontWeight: "800" }}>
              השקת תפריט סתיו
            </h2>
            <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
              אחראית: דנה · יעד 8.10.2026 · עודכן לפני שעה
            </span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "5px 12px", borderRadius: "999px" }}>
            ▲ בסיכון · 2 חסימות
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            הוסף עדכון
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            + משימה
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--f-surface-2)", borderRadius: "999px", alignSelf: "flex-start" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 18px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "rgba(22, 29, 46, 0.12) 0px 1px 2px" }}>
            סקירה
          </span>
          <span style={{ fontSize: "14px", padding: "9px 18px", borderRadius: "999px" }}>
            {"ביצוע "}
            <b style={{ color: "var(--f-red-text)" }}>
              2
            </b>
          </span>
          <span style={{ fontSize: "14px", padding: "9px 18px", borderRadius: "999px" }}>
            {"שיווק ותוכן "}
            <b style={{ color: "var(--f-accent-ink)" }}>
              2
            </b>
          </span>
          <span style={{ fontSize: "14px", padding: "9px 18px", borderRadius: "999px" }}>
            ידע ותוצאות
          </span>
        </div>
      </div>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "22px 26px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b style={{ fontSize: "15px" }}>
              אבני דרך
            </b>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              עוד 7 ימים להשקה
            </span>
          </div>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", paddingTop: "14px" }}>
            <span style={{ position: "absolute", top: "21px", insetInline: "10%", height: "4px", background: "var(--f-border)", borderRadius: "2px" }}></span>
            <span style={{ position: "absolute", top: "21px", insetInlineStart: "10%", width: "33%", height: "4px", background: "#23774a", borderRadius: "2px" }}></span>
            <span style={{ position: "absolute", top: "4px", insetInlineStart: "46%", fontSize: "11px", fontWeight: "700", color: "var(--f-red-text)" }}>
              היום ▾
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#23774a", border: "3px solid var(--f-surface)", boxShadow: "#23774a 0px 0px 0px 1px" }}></span>
              <b style={{ fontSize: "14px" }}>
                בריף
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-green-text)", fontWeight: "600" }}>
                ✓ 15.9
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#23774a", border: "3px solid var(--f-surface)", boxShadow: "#23774a 0px 0px 0px 1px" }}></span>
              <b style={{ fontSize: "14px" }}>
                תוכנית שיווק
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-green-text)", fontWeight: "600" }}>
                ✓ 22.9
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "4px", background: "#b8322a", border: "3px solid var(--f-surface)", boxShadow: "#b8322a 0px 0px 0px 1px" }}></span>
              <b style={{ fontSize: "14px" }}>
                צילום
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-red-text)", fontWeight: "700" }}>
                ■ חסום · 3.10
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--f-surface)", border: "3px solid var(--f-border)" }}></span>
              <b style={{ fontSize: "14px" }}>
                תוכן לאישור
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                6.10
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--f-surface)", border: "3px solid var(--f-border)" }}></span>
              <b style={{ fontSize: "14px" }}>
                השקה
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                8.10
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0px, 1fr))", gap: "16px" }}>
          <div style={{ gridColumn: "span 2", background: "var(--f-accent)", color: "#ffffff", borderRadius: "16px", padding: "22px 24px", display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#e2dcfb" }}>
                הפעולה הבאה
              </span>
              <b style={{ fontSize: "22px", lineHeight: "1.3" }}>
                לתאם צילום של מנת הספיישל עד 3.10
              </b>
              <span style={{ fontSize: "15px", color: "#ece8fb" }}>
                חוסם את הפוסט 4:5 ואת הקרוסלה. אין אחראי כבר 12 ימים.
              </span>
            </div>
            <span style={{ fontSize: "15px", fontWeight: "700", padding: "14px 22px", borderRadius: "999px", background: "var(--f-surface)", color: "var(--f-accent-ink)" }}>
              הקצה לי ותאם
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", alignItems: "center", gap: "18px" }}>
            <span style={{ width: "84px", height: "84px", borderRadius: "50%", background: "conic-gradient(#8c5a00 0deg, #8c5a00 85%, var(--f-surface-2) 85%, var(--f-surface-2) 100%)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
              <span style={{ width: "62px", height: "62px", borderRadius: "50%", background: "var(--f-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "800" }}>
                85%
              </span>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <b style={{ fontSize: "15px" }}>
                34 מתוך 40 שעות
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                ClickUp · לפני 4 דק׳
              </span>
              <span style={{ fontSize: "13px" }}>
                {"תקציב מדיה: "}
                <span style={{ color: "var(--f-neutral-text)", fontWeight: "600" }}>
                  — טרם התקבל
                </span>
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "15px" }}>
                חסימות
              </b>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "2px 9px", borderRadius: "999px" }}>
                2
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 12px", background: "var(--f-bg)", borderRadius: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600" }}>
                צילום מנת הספיישל
              </span>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                ממתין לצלם · ללא אחראי · 12 ימים
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "10px 12px", background: "var(--f-bg)", borderRadius: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: "600" }}>
                פוסט 4:5
              </span>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                תלוי בצילום · יואב
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "15px" }}>
                החלטות ואישורים
              </b>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)", padding: "2px 9px", borderRadius: "999px" }}>
                3
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--f-bg)", borderRadius: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>
                  מבצע 1+1 בימי חמישי
                </span>
                <span style={{ fontSize: "12px", color: "var(--f-amber-text)", fontWeight: "600" }}>
                  ◆ בינוני · ממתין לרון
                </span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--f-bg)", borderRadius: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>
                  סטורי ערבי סושי
                </span>
                <span style={{ fontSize: "12px", color: "var(--f-green-text)", fontWeight: "600" }}>
                  ● נמוך · מחר 18:00
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <b style={{ fontSize: "15px" }}>
              תוצאות שיווק
            </b>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "14px" }}>
                הזמנות בימי חמישי
              </span>
              <span>
                <b style={{ fontSize: "20px" }}>
                  ≈ 96
                </b>
                {" "}
                <span style={{ fontSize: "12px", color: "var(--f-amber-text)", fontWeight: "600" }}>
                  מוערך
                </span>
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
              {"מערכת ההזמנות · 30.9 · חסר יום אחד · "}
              <span >
                מקור
              </span>
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "6px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span style={{ fontSize: "14px" }}>
                חשיפות Instagram
              </span>
              <b style={{ fontSize: "20px", color: "var(--f-neutral-text)" }}>
                —
              </b>
            </div>
            <span style={{ fontSize: "12px", color: "var(--f-neutral-text)", fontWeight: "600" }}>
              לא זמין עקב תקלה בחיבור מ־27.9
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
