/**
 * H1 — כל הפרויקטים
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (H1) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenH1() {
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
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                לקוחות ופרויקטים
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                שיווק ותוכן
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
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
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              לקוחות ופרויקטים
            </span>
            <h2 style={{ margin: "0px", fontSize: "32px", fontWeight: "800" }}>
              פרויקטים
            </h2>
            <span style={{ fontSize: "17px" }}>
              5 פרויקטים פעילים אצל 3 לקוחות. אחד בסיכון.
            </span>
          </div>
          <span style={{ display: "flex", gap: "2px", padding: "3px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset", fontSize: "13px" }}>
            <span style={{ padding: "8px 14px", borderRadius: "999px", background: "#161d2e", color: "#ffffff", fontWeight: "700" }}>
              כרטיסים
            </span>
            <span style={{ padding: "8px 14px" }}>
              רשימה
            </span>
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            + פרויקט חדש
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "14px", padding: "10px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset", color: "var(--f-muted)", width: "260px" }}>
            חיפוש פרויקט או לקוח
          </span>
          <span style={{ fontSize: "13px", padding: "9px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            לקוח ▾
          </span>
          <span style={{ fontSize: "13px", padding: "9px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            אחראי ▾
          </span>
          <span style={{ fontSize: "13px", padding: "9px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            מצב ▾
          </span>
          <span style={{ fontSize: "13px", padding: "9px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            סיכון ▾
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            מיון: דחיפות ▾
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0px, 1fr))", gap: "16px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  <span className="sc-interp">
                    UMINO
                  </span>
                </span>
                <b style={{ fontSize: "16px" }}>
                  <span className="sc-interp">
                    השקת תפריט סתיו
                  </span>
                </b>
              </div>
              <span style={{ flex: "0 0 auto", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-red-ink)", background: "var(--f-red-bg)" }}>
                <span className="sc-interp">
                  ▲ בסיכון
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                שתי חסימות מעכבות את הפוסט המרכזי.
              </span>
            </span>
            <div style={{ display: "flex", gap: "12px", fontSize: "12.5px", color: "var(--f-muted)", flexWrap: "wrap" }}>
              <span>
                <span className="sc-interp">
                  דנה
                </span>
              </span>
              <span>
                {"יעד "}
                <span className="sc-interp">
                  8.10
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  34/40 ש׳
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  2 לאישור
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", padding: "9px 12px", borderRadius: "10px", background: "var(--f-surface-2)" }}>
              <b>
                הבא:
              </b>
              {" "}
              <span className="sc-interp">
                לתאם צילום עד 3.10
              </span>
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                {"עודכן "}
                <span className="sc-interp">
                  לפני שעה
                </span>
              </span>
              <span style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "7px 11px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  + משימה
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                  פתח
                </span>
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  <span className="sc-interp">
                    גל פילאטיס
                  </span>
                </span>
                <b style={{ fontSize: "16px" }}>
                  <span className="sc-interp">
                    אתר
                  </span>
                </b>
              </div>
              <span style={{ flex: "0 0 auto", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)" }}>
                <span className="sc-interp">
                  ◆ דורש מעקב
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                ממתינים לחומרים מהלקוחה 6 ימים.
              </span>
            </span>
            <div style={{ display: "flex", gap: "12px", fontSize: "12.5px", color: "var(--f-muted)", flexWrap: "wrap" }}>
              <span>
                <span className="sc-interp">
                  יואב
                </span>
              </span>
              <span>
                {"יעד "}
                <span className="sc-interp">
                  15.10
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  22/30 ש׳
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  1 לאישור
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", padding: "9px 12px", borderRadius: "10px", background: "var(--f-surface-2)" }}>
              <b>
                הבא:
              </b>
              {" "}
              <span className="sc-interp">
                שיחה עם הלקוחה
              </span>
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                {"עודכן "}
                <span className="sc-interp">
                  אתמול
                </span>
              </span>
              <span style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "7px 11px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  + משימה
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                  פתח
                </span>
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  <span className="sc-interp">
                    UMINO
                  </span>
                </span>
                <b style={{ fontSize: "16px" }}>
                  <span className="sc-interp">
                    תוכן שוטף · אוקטובר
                  </span>
                </b>
              </div>
              <span style={{ flex: "0 0 auto", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
                <span className="sc-interp">
                  ● תקין
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                כל התכנים בזמן.
              </span>
            </span>
            <div style={{ display: "flex", gap: "12px", fontSize: "12.5px", color: "var(--f-muted)", flexWrap: "wrap" }}>
              <span>
                <span className="sc-interp">
                  דנה
                </span>
              </span>
              <span>
                {"יעד "}
                <span className="sc-interp">
                  31.10
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  8/20 ש׳
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  —
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", padding: "9px 12px", borderRadius: "10px", background: "var(--f-surface-2)" }}>
              <b>
                הבא:
              </b>
              {" "}
              <span className="sc-interp">
                תוכנית שבוע 41
              </span>
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                {"עודכן "}
                <span className="sc-interp">
                  היום
                </span>
              </span>
              <span style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "7px 11px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  + משימה
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                  פתח
                </span>
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  <span className="sc-interp">
                    {"בית קפה \"שלוש\""}
                  </span>
                </span>
                <b style={{ fontSize: "16px" }}>
                  <span className="sc-interp">
                    ריטיינר תוכן
                  </span>
                </b>
              </div>
              <span style={{ flex: "0 0 auto", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)" }}>
                <span className="sc-interp">
                  ◆ דורש מעקב
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                אין מכסת שעות מוגדרת.
              </span>
            </span>
            <div style={{ display: "flex", gap: "12px", fontSize: "12.5px", color: "var(--f-muted)", flexWrap: "wrap" }}>
              <span>
                <span className="sc-interp">
                  רון
                </span>
              </span>
              <span>
                {"יעד "}
                <span className="sc-interp">
                  שוטף
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  ≈ 6 ש׳
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  —
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", padding: "9px 12px", borderRadius: "10px", background: "var(--f-surface-2)" }}>
              <b>
                הבא:
              </b>
              {" "}
              <span className="sc-interp">
                להגדיר מכסת שעות
              </span>
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                {"עודכן "}
                <span className="sc-interp">
                  29.9
                </span>
              </span>
              <span style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "7px 11px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  + משימה
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                  פתח
                </span>
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  <span className="sc-interp">
                    גל פילאטיס
                  </span>
                </span>
                <b style={{ fontSize: "16px" }}>
                  <span className="sc-interp">
                    קמפיין חגים
                  </span>
                </b>
              </div>
              <span style={{ flex: "0 0 auto", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
                <span className="sc-interp">
                  ● תקין
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                בתכנון. בריף אושר.
              </span>
            </span>
            <div style={{ display: "flex", gap: "12px", fontSize: "12.5px", color: "var(--f-muted)", flexWrap: "wrap" }}>
              <span>
                <span className="sc-interp">
                  יואב
                </span>
              </span>
              <span>
                {"יעד "}
                <span className="sc-interp">
                  20.10
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  2/12 ש׳
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  —
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", padding: "9px 12px", borderRadius: "10px", background: "var(--f-surface-2)" }}>
              <b>
                הבא:
              </b>
              {" "}
              <span className="sc-interp">
                תוכנית שיווק לאישור
              </span>
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                {"עודכן "}
                <span className="sc-interp">
                  30.9
                </span>
              </span>
              <span style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "7px 11px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  + משימה
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                  פתח
                </span>
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  <span className="sc-interp">
                    UMINO
                  </span>
                </span>
                <b style={{ fontSize: "16px" }}>
                  <span className="sc-interp">
                    תפריט קיץ
                  </span>
                </b>
              </div>
              <span style={{ flex: "0 0 auto", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "999px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
                <span className="sc-interp">
                  ✓ הושלם
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13.5px", lineHeight: "1.45", color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                הושלם ב־15.9 · 38/40 ש׳.
              </span>
            </span>
            <div style={{ display: "flex", gap: "12px", fontSize: "12.5px", color: "var(--f-muted)", flexWrap: "wrap" }}>
              <span>
                <span className="sc-interp">
                  דנה
                </span>
              </span>
              <span>
                {"יעד "}
                <span className="sc-interp">
                  15.9
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  38/40 ש׳
                </span>
              </span>
              <span>
                <span className="sc-interp">
                  —
                </span>
              </span>
            </div>
            <span style={{ fontSize: "13px", padding: "9px 12px", borderRadius: "10px", background: "var(--f-surface-2)" }}>
              <b>
                הבא:
              </b>
              {" "}
              <span className="sc-interp">
                אין
              </span>
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                {"עודכן "}
                <span className="sc-interp">
                  15.9
                </span>
              </span>
              <span style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "7px 11px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  + משימה
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                  פתח
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
