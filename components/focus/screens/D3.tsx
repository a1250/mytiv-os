/**
 * D3 — סביבת פרויקט › ביצוע › משימות · זרימה 2 · משימה חסומה
 * Generated from the Claude Design handoff (D3) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/icon";

export default function ScreenD3() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ background: "var(--f-surface)", padding: "20px 40px 18px", display: "flex", flexDirection: "column", gap: "14px", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          לקוחות ופרויקטים › UMINO › השקת תפריט סתיו
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#1f1b17", color: "#f4ede1", fontSize: "10px", fontWeight: "800", letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center" }}>
            UMINO
          </span>
          <h2 style={{ margin: "0px", fontSize: "26px", fontWeight: "800" }}>
            השקת תפריט סתיו
          </h2>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "5px 12px", borderRadius: "999px" }}>
            ▲ בסיכון · 2 חסימות
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--f-surface-2)", borderRadius: "999px" }}>
            <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px" }}>
              סקירה
            </span>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "rgba(22, 29, 46, 0.12) 0px 1px 2px" }}>
              {"ביצוע "}
              <b style={{ color: "var(--f-red-text)" }}>
                2
              </b>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px" }}>
              {"שיווק ותוכן "}
              <b style={{ color: "var(--f-accent-ink)" }}>
                2
              </b>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px" }}>
              ידע ותוצאות
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 420px", gap: "24px", padding: "24px 40px 40px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "0px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <b style={{ fontSize: "16px", marginInlineEnd: "6px" }}>
              ביצוע · Mytiv Work
            </b>
            <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--f-surface-2)", borderRadius: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", padding: "7px 13px", borderRadius: "7px", background: "var(--f-surface)" }}>
                List
              </span>
              <span style={{ fontSize: "13px", padding: "7px 13px", borderRadius: "7px" }}>
                Kanban
              </span>
              <span style={{ fontSize: "13px", padding: "7px 13px", borderRadius: "7px" }}>
                ציר זמן
              </span>
            </div>
            <span style={{ flex: "1 1 0%" }}></span>
            <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
              אחראי: כולם ▾
            </span>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "10px 16px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              + משימה
            </span>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "center", fontSize: "13px", color: "var(--f-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
              Mytiv 7
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#56617a" }}></span>
              ClickUp 2 · בתקופת מעבר
            </span>
            <span style={{ flex: "1 1 0%" }}></span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon name="refresh-cw" size={14} style={{ opacity: "0.6" }} />
              סונכרן לפני 4 דק׳
            </span>
            <a style={{ fontWeight: "600" }} href="#">
              רענן
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--f-red-text)" }}>
              ■ חסום · 2
            </span>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 110px 100px 180px", gap: "14px", alignItems: "center", boxShadow: "var(--f-accent) 0px 0px 0px 2px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  צילום מנת הספיישל
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  ממתין לצלם חיצוני · ללא עדכון 12 ימים
                </span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-amber-text)" }}>
                ללא אחראי
              </span>
              <span style={{ fontSize: "13px" }}>
                יעד 3.10
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
                חוסם: פוסט 4:5, קרוסלה
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 110px 100px 180px", gap: "14px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  פוסט 4:5 — ערבי סושי
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  {"תלוי ב\"צילום מנת הספיישל\""}
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                יואב
              </span>
              <span style={{ fontSize: "13px" }}>
                יעד 4.10
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
                ממתין לתלות
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700" }}>
              ◐ בתהליך וממתין · 3
            </span>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 110px 100px 180px", gap: "14px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  סטורי ערבי סושי · גרסה 3
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  ⏸ ממתין לאישור רון
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                דנה
              </span>
              <span style={{ fontSize: "13px" }}>
                יעד 2.10
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
                —
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 110px 100px 180px", gap: "14px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  {"קרוסלה \"חמש מנות לסתיו\""}
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  ◐ בתהליך
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                יואב
              </span>
              <span style={{ fontSize: "13px" }}>
                יעד 6.10
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
                —
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 110px 100px 180px", gap: "14px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  עדכון תפריט PDF
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  ◐ בתהליך
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                יואב
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-red-text)", fontWeight: "700" }}>
                באיחור · 29.9
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
                —
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700" }}>
              ○ לא התחיל · 2
            </span>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 110px 100px 180px", gap: "14px", alignItems: "center", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <b style={{ fontSize: "15px" }}>
                  דיוור ללקוחות קבועים
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  ○ לא התחיל
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                דנה
              </span>
              <span style={{ fontSize: "13px" }}>
                יעד 7.10
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
                ממתין להחלטת 1+1
              </span>
            </div>
          </div>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            {"✓ הושלמו 2 · "}
            <a style={{ fontWeight: "600" }} href="#">
              הצג
            </a>
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "20px", boxShadow: "var(--f-border) 0px 0px 0px 1px, rgba(22, 29, 46, 0.45) 0px 24px 48px -28px", display: "flex", flexDirection: "column", overflow: "hidden", position: "sticky", top: "0px" }}>
          <div style={{ padding: "18px 22px 14px", display: "flex", flexDirection: "column", gap: "8px", borderBottom: "1px solid var(--f-surface-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#56617a" }}></span>
                משימה · מקור: ClickUp
              </span>
              <span style={{ width: "36px", height: "36px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="x" size={15} label="סגירה" style={{ opacity: "0.7" }} />
              </span>
            </div>
            <b style={{ fontSize: "20px" }}>
              צילום מנת הספיישל
            </b>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "3px 9px", borderRadius: "6px" }}>
                ■ חסום
              </span>
              <span style={{ fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: "var(--f-surface-2)" }}>
                עדיפות גבוהה
              </span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)", padding: "3px 0px" }}>
                ללא עדכון 12 ימים
              </span>
            </div>
          </div>
          <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--f-red-bg)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <b style={{ fontSize: "13px", color: "#7f1f19" }}>
                סיבת החסימה
              </b>
              <span style={{ fontSize: "14px", color: "#6a1d17" }}>
                ממתין לצלם חיצוני. לא נקבע מועד.
              </span>
              <span style={{ fontSize: "12.5px", color: "#6a1d17" }}>
                משפיע על: פוסט 4:5, קרוסלה, השקה 8.10
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                אחראי
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ flex: "1 1 0%", fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset", color: "var(--f-muted)" }}>
                  בחר אחראי ▾
                </span>
                <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 16px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
                  הקצה לי
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                הצעד הבא
              </label>
              <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-accent) 0px 0px 0px 2px inset" }}>
                לתאם צילום עם הצלם עד 3.10|
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                תאריך מעקב
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", padding: "8px 12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                  מחר
                </span>
                <span style={{ fontSize: "13px", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  בעוד 3 ימים
                </span>
                <span style={{ fontSize: "13px", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  בחר תאריך
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                הערה
              </label>
              <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset", color: "var(--f-muted)", height: "64px" }}>
                הוסף הערה לצלם או לצוות…
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px", color: "var(--f-muted)", paddingTop: "10px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span>
                19.9 · דנה יצרה את המשימה
              </span>
              <span>
                {"19.9 · סומנה כחסומה: \"ממתין לצלם\""}
              </span>
            </div>
          </div>
          <div style={{ padding: "14px 22px", borderTop: "1px solid var(--f-surface-2)", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
              שמור וסנכרן
            </span>
            <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 14px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              שנה מצב ▾
            </span>
            <span style={{ flex: "1 1 0%" }}></span>
            <a style={{ fontSize: "13px", fontWeight: "600" }} href="#">
              פתח ב־ClickUp ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
