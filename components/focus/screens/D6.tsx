/**
 * D6 — אישורים · מצב פוקוס · סיכום לפני ביצוע · פעולה בסיכון גבוה, שלב 2 מתוך 2
 * Generated from the Claude Design handoff (D6) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenD6() {
  return (
    <div className="f-screen f-focusmode" style={{ minHeight: "1000px", background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ height: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "16px", padding: "0px 28px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "10px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          ✕ צא ממצב פוקוס
        </span>
        <span style={{ flex: "1 1 0%" }}></span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", fontWeight: "700" }}>
            אישור 1 מתוך 4
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ width: "28px", height: "6px", borderRadius: "3px", background: "#161d2e" }}></span>
            <span style={{ width: "28px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
            <span style={{ width: "28px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
            <span style={{ width: "28px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
          </div>
        </div>
        <span style={{ flex: "1 1 0%" }}></span>
        <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
          דלג לבא ←
        </span>
      </div>
      <div style={{ flex: "1 1 0%", display: "grid", gridTemplateColumns: "300px minmax(0px, 780px) 300px", justifyContent: "center", gap: "32px", padding: "32px 28px", minHeight: "0px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-muted)" }}>
            הבא בתור
          </span>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>
              מבצע 1+1 לקמפיין יום חמישי
            </span>
            <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
              UMINO · ◆ בינוני
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>
              {"סטורי \"ערבי סושי של חמישי\""}
            </span>
            <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
              UMINO · ● נמוך
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px", opacity: "0.75" }}>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>
              תוכנית אוקטובר
            </span>
            <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
              גל פילאטיס · ◆ בינוני
            </span>
          </div>
          <span style={{ fontSize: "12.5px", color: "var(--f-muted)", lineHeight: "1.5", marginTop: "6px" }}>
            הסדר בתור: סיכון גבוה קודם, ואז לפי זמן המתנה.
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "20px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px, rgba(22, 29, 46, 0.35) 0px 24px 48px -28px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 28px", display: "flex", gap: "8px", alignItems: "center", borderBottom: "1px solid var(--f-surface-2)", fontSize: "13px" }}>
            <span style={{ fontWeight: "600", color: "var(--f-green-text)" }}>
              ✓ 1 בדיקה
            </span>
            <span style={{ color: "#b5bccb" }}>
              —
            </span>
            <span style={{ fontWeight: "700", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)", padding: "4px 10px", borderRadius: "999px" }}>
              2 סיכום סופי
            </span>
            <span style={{ color: "#b5bccb" }}>
              —
            </span>
            <span style={{ color: "var(--f-muted)" }}>
              3 שליחה
            </span>
          </div>
          <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                מכירות · ליד: נועה כהן · אירוע חברה ל־35
              </span>
              <h2 style={{ margin: "0px", fontSize: "28px", fontWeight: "800" }}>
                שליחת הצעת מחיר לנועה כהן
              </h2>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 16px", borderRadius: "12px", background: "var(--f-red-bg)", color: "#7f1f19" }}>
              <span style={{ fontSize: "20px", fontWeight: "800" }}>
                ▲
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b style={{ fontSize: "15px" }}>
                  סיכון גבוה: פעולה חיצונית שלא ניתן לבטל
                </b>
                <span style={{ fontSize: "13px" }}>
                  ההצעה תגיע לתיבת הדואר של הלקוחה מיד.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--f-border)", borderRadius: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px", padding: "12px 16px", borderBottom: "1px solid var(--f-surface-2)", fontSize: "15px" }}>
                <span style={{ color: "var(--f-muted)" }}>
                  נמענת
                </span>
                <span>
                  {"נועה כהן · "}
                  <bdi dir="ltr">
                    noa.cohen@example.co.il
                  </bdi>
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px", padding: "12px 16px", borderBottom: "1px solid var(--f-surface-2)", fontSize: "15px", alignItems: "center" }}>
                <span style={{ color: "var(--f-muted)" }}>
                  מה יישלח
                </span>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ width: "44px", height: "56px", borderRadius: "4px", background: "repeating-linear-gradient(135deg, var(--f-surface-2) 0px, var(--f-surface-2) 5px, var(--f-surface) 5px, var(--f-surface) 10px)", border: "1px solid var(--f-border)", fontSize: "9px", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "3px", color: "var(--f-muted)" }}>
                    PDF
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <b>
                      אירוח עסקי — 8,750 ₪
                    </b>
                    <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                      גרסה 1 · כולל מע״מ · בתוקף עד 15.10
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px", padding: "12px 16px", borderBottom: "1px solid var(--f-surface-2)", fontSize: "15px" }}>
                <span style={{ color: "var(--f-muted)" }}>
                  דרך
                </span>
                <span>
                  {"Gmail · מהחשבון "}
                  <bdi dir="ltr">
                    ron@mytiv.co.il
                  </bdi>
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "12px", padding: "12px 16px", fontSize: "15px" }}>
                <span style={{ color: "var(--f-muted)" }}>
                  אחרי השליחה
                </span>
                <span>
                  גרסה 1 ננעלת לעריכה. נוצרת משימת מעקב לדנה ל־4.10.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px" }}>
              <span style={{ color: "var(--f-green-text)", fontWeight: "600" }}>
                ✓ הסכום תואם לגרסה 1 של ההצעה
              </span>
              <span style={{ color: "var(--f-green-text)", fontWeight: "600" }}>
                ✓ כתובת המייל תואמת לפרטי הליד
              </span>
              <span style={{ color: "var(--f-amber-text)", fontWeight: "600" }}>
                {"◆ גוף המייל נכתב בעזרת AI ונערך ע״י דנה · "}
                <a href="#D6">
                  הצג טקסט
                </a>
              </span>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "14px 16px", borderRadius: "12px", background: "var(--f-bg)" }}>
              <span style={{ width: "24px", height: "24px", flex: "0 0 auto", borderRadius: "6px", background: "var(--f-accent)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800" }}>
                ✓
              </span>
              <span style={{ fontSize: "15px", lineHeight: "1.5" }}>
                אני מאשר לשלוח לנועה כהן הצעה על סך 8,750 ₪, וידוע לי שלא ניתן לבטל את השליחה.
              </span>
            </div>
          </div>
          <div style={{ marginTop: "auto", padding: "18px 28px", borderTop: "1px solid var(--f-surface-2)", display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontSize: "16px", fontWeight: "700", padding: "15px 26px", borderRadius: "999px", background: "#b8322a", color: "#ffffff" }}>
              שלח עכשיו לנועה
            </span>
            <span style={{ fontSize: "15px", fontWeight: "600", padding: "14px 22px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              חזור לבדיקה
            </span>
            <span style={{ flex: "1 1 0%" }}></span>
            <span style={{ fontSize: "13px", color: "var(--f-muted)", maxWidth: "220px", lineHeight: "1.45" }}>
              {"\"נשלח\" יוצג רק אחרי ש־Gmail יאשר את השליחה."}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-muted)" }}>
            איך זה ייראה אחרי
          </span>
          <div style={{ background: "#161d2e", color: "#ffffff", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px" }} role="status">
            <b style={{ fontSize: "14px" }}>
              ✓ ההצעה נשלחה
            </b>
            <span style={{ fontSize: "13px", color: "#cfd5e2", lineHeight: "1.5" }}>
              Gmail אישר ב־08:09. משימת מעקב נוצרה ל־4.10.
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#c9c1f0" }}>
              פתח ביומן הפעולות
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <b style={{ fontSize: "14px", color: "var(--f-amber-text)" }}>
              ⧗ ממתין לאישור Gmail
            </b>
            <span style={{ fontSize: "13px", color: "var(--f-muted)", lineHeight: "1.5" }}>
              אם אין תשובה תוך דקה, ההצעה נשמרת כטיוטה בדואר ולא מסומנת כנשלחה.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
