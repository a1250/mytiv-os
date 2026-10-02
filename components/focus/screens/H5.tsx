/**
 * H5 — לוח עבודה · Kanban
 * Generated from the Claude Design handoff (H5) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/icon";

export default function ScreenH5() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div className="sc-host" data-sc-name="TopBar">
        <div style={{ minHeight: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px", padding: "0px clamp(12px, 2vw, 28px)", minWidth: "0px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)", fontFamily: "\"Open Sans\", system-ui, sans-serif", color: "var(--f-ink)" }} dir="rtl">
          <span style={{ fontSize: "19px", fontWeight: "800", marginInlineEnd: "6px", flex: "0 0 auto" }}>
            Mytiv
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)", marginInlineEnd: "8px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
            <span className="sc-interp">
              UMINO
            </span>
            {" ▾"}
          </span>
          <div style={{ flex: "1 1 auto", minWidth: "0px", display: "flex", gap: "2px", overflowX: "auto", scrollbarWidth: "none" }}>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                היום שלי
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                לקוחות ופרויקטים
              </span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", whiteSpace: "nowrap", flex: "0 0 auto" }}>
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
      <div style={{ padding: "24px 40px 40px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <b style={{ fontSize: "26px", flex: "1 1 0%" }}>
            לוח עבודה · UMINO
          </b>
          <span style={{ display: "flex", gap: "2px", padding: "3px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset", fontSize: "13px" }}>
            <span style={{ padding: "8px 14px" }}>
              רשימה
            </span>
            <span style={{ padding: "8px 14px", borderRadius: "999px", background: "#161d2e", color: "#ffffff", fontWeight: "700" }}>
              Kanban
            </span>
            <span style={{ padding: "8px 14px" }}>
              לוח שנה
            </span>
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0px, 1fr))", gap: "12px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "16px", background: "var(--f-neutral-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 4px" }}>
              <b style={{ fontSize: "14px" }}>
                <span className="sc-interp">
                  רעיון
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  2
                </span>
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "rgba(22, 29, 46, 0.08) 0px 1px 2px" }}>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  סטורי
                </span>
              </span>
              <b style={{ fontSize: "13.5px", lineHeight: "1.35" }}>
                <span className="sc-interp">
                  תזכורת ביום חמישי
                </span>
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  דנה · 8.10
                </span>
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "rgba(22, 29, 46, 0.08) 0px 1px 2px" }}>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  פוסט
                </span>
              </span>
              <b style={{ fontSize: "13.5px", lineHeight: "1.35" }}>
                <span className="sc-interp">
                  שעות פתיחה בחג
                </span>
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  מתוך הזדמנויות
                </span>
              </span>
              <span style={{ alignSelf: "flex-start", fontSize: "11.5px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)" }}>
                <span className="sc-interp">
                  ✦ AI
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "16px", background: "var(--f-neutral-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 4px" }}>
              <b style={{ fontSize: "14px" }}>
                <span className="sc-interp">
                  בתכנון
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  1
                </span>
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "rgba(22, 29, 46, 0.08) 0px 1px 2px" }}>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  באנר
                </span>
              </span>
              <b style={{ fontSize: "13.5px", lineHeight: "1.35" }}>
                <span className="sc-interp">
                  באנר לאתר · סתיו
                </span>
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  יואב · ללא תאריך
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "16px", background: "var(--f-neutral-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 4px" }}>
              <b style={{ fontSize: "14px" }}>
                <span className="sc-interp">
                  בהפקה
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  1
                </span>
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "rgba(22, 29, 46, 0.08) 0px 1px 2px" }}>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  קרוסלה
                </span>
              </span>
              <b style={{ fontSize: "13.5px", lineHeight: "1.35" }}>
                <span className="sc-interp">
                  חמש מנות לסתיו
                </span>
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  יואב · 6.10
                </span>
              </span>
              <span style={{ alignSelf: "flex-start", fontSize: "11.5px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-red-ink)", background: "var(--f-red-bg)" }}>
                <span className="sc-interp">
                  ■ חסום
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "16px", background: "var(--f-neutral-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 4px" }}>
              <b style={{ fontSize: "14px" }}>
                <span className="sc-interp">
                  בבדיקה
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  0
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "16px", background: "var(--f-neutral-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 4px" }}>
              <b style={{ fontSize: "14px" }}>
                <span className="sc-interp">
                  ממתין לאישור
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  2
                </span>
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "rgba(22, 29, 46, 0.08) 0px 1px 2px" }}>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  סטורי
                </span>
              </span>
              <b style={{ fontSize: "13.5px", lineHeight: "1.35" }}>
                <span className="sc-interp">
                  ערבי סושי · גרסה 3
                </span>
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  דנה · 2.10
                </span>
              </span>
              <span style={{ alignSelf: "flex-start", fontSize: "11.5px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)" }}>
                <span className="sc-interp">
                  … ממתין לאישור
                </span>
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "rgba(22, 29, 46, 0.08) 0px 1px 2px" }}>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  פוסט אנכי
                </span>
              </span>
              <b style={{ fontSize: "13.5px", lineHeight: "1.35" }}>
                <span className="sc-interp">
                  ערבי סושי
                </span>
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  דנה · 2.10
                </span>
              </span>
              <span style={{ alignSelf: "flex-start", fontSize: "11.5px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)" }}>
                <span className="sc-interp">
                  … ממתין לאישור
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", borderRadius: "16px", background: "var(--f-neutral-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 4px" }}>
              <b style={{ fontSize: "14px" }}>
                <span className="sc-interp">
                  מאושר
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  1
                </span>
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "rgba(22, 29, 46, 0.08) 0px 1px 2px" }}>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  פוסט
                </span>
              </span>
              <b style={{ fontSize: "13.5px", lineHeight: "1.35" }}>
                <span className="sc-interp">
                  תפריט סתיו · הכרזה
                </span>
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  יואב · ממתין לתזמון
                </span>
              </span>
              <span style={{ alignSelf: "flex-start", fontSize: "11.5px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", color: "var(--f-green-ink)", background: "var(--f-green-bg)" }}>
                <span className="sc-interp">
                  ✓ אושר
                </span>
              </span>
            </div>
          </div>
        </div>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          {"שלבים נוספים: \"מתוזמן\" ו\"נמדד\" מוסתרים כשהם ריקים. גרירה גם במקלדת: Space לבחירה, חצים להזזה."}
        </span>
      </div>
    </div>
  );
}
