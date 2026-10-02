/**
 * M4 — סיכום לפני ביצוע · גיליון תחתון
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (M4) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenM4() {
  return (
    <div className="f-focusmode f-device">
      <div className="f-device__stage">
      <div style={{ width: "390px", height: "844px", background: "#4a5163", borderRadius: "44px", boxShadow: "#161d2e 0px 0px 0px 10px, rgba(22, 29, 46, 0.5) 0px 30px 60px -20px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}>
        <div style={{ position: "absolute", top: "0px", insetInline: "0px", height: "50px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0px 28px", fontSize: "14px", fontWeight: "700", color: "#ffffff" }} dir="ltr">
          <span>
            8:09
          </span>
          <span style={{ width: "110px", height: "30px", borderRadius: "999px", background: "#161d2e" }}></span>
          <span>
            100%
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "28px 28px 0px 0px", padding: "10px 18px 26px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ alignSelf: "center", width: "40px", height: "5px", borderRadius: "3px", background: "var(--f-line-strong)" }}></span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
            <span style={{ fontWeight: "700", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)", padding: "3px 9px", borderRadius: "999px" }}>
              שלב 2 מתוך 2 · סיכום סופי
            </span>
            <span style={{ color: "var(--f-muted)" }}>
              ✕ ביטול
            </span>
          </div>
          <b style={{ fontSize: "22px", fontWeight: "800" }}>
            שליחת הצעת מחיר לנועה כהן
          </b>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 12px", borderRadius: "12px", background: "var(--f-red-bg)", color: "#7f1f19", fontSize: "13.5px" }}>
            <b>
              ▲
            </b>
            <span>
              <b>
                סיכון גבוה:
              </b>
              {" פעולה חיצונית שלא ניתן לבטל."}
            </span>
          </div>
          <div style={{ borderRadius: "14px", boxShadow: "var(--f-border) 0px 0px 0px 1px", fontSize: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "86px 1fr", padding: "10px 12px", borderBottom: "1px solid var(--f-surface-2)" }}>
              <span style={{ color: "var(--f-muted)" }}>
                נמענת
              </span>
              <span>
                נועה כהן
                <br />
                <bdi style={{ fontSize: "12.5px", color: "var(--f-muted)" }} dir="ltr">
                  noa.cohen@example.co.il
                </bdi>
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "86px 1fr", padding: "10px 12px", borderBottom: "1px solid var(--f-surface-2)" }}>
              <span style={{ color: "var(--f-muted)" }}>
                מה יישלח
              </span>
              <span>
                אירוח עסקי — 8,750 ₪ · PDF
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "86px 1fr", padding: "10px 12px" }}>
              <span style={{ color: "var(--f-muted)" }}>
                אחרי
              </span>
              <span>
                הגרסה ננעלת. מעקב ל־4.10.
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px", borderRadius: "12px", background: "var(--f-bg)" }}>
            <span style={{ width: "24px", height: "24px", flex: "0 0 auto", borderRadius: "7px", background: "var(--f-accent)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800" }}>
              ✓
            </span>
            <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
              אני מאשר לשלוח לנועה כהן הצעה על סך 8,750 ₪.
            </span>
          </div>
          <span style={{ fontSize: "16px", fontWeight: "700", padding: "15px", borderRadius: "999px", background: "#b8322a", color: "#ffffff", textAlign: "center" }}>
            שלח עכשיו לנועה
          </span>
          <span style={{ fontSize: "12.5px", color: "var(--f-muted)", textAlign: "center" }}>
            {"\"נשלח\" יוצג רק אחרי ש־Gmail יאשר."}
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}
