/**
 * H10 — יומן · שבוע
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (H10) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenH10() {
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
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
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
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", whiteSpace: "nowrap", flex: "0 0 auto" }}>
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
      <div style={{ padding: "24px 40px 40px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <b style={{ fontSize: "26px", flex: "1 1 0%" }}>
            27 בספטמבר – 3 באוקטובר 2026
          </b>
          <span style={{ display: "flex", gap: "2px", padding: "3px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset", fontSize: "13px" }}>
            <span style={{ padding: "8px 14px" }}>
              יום
            </span>
            <span style={{ padding: "8px 14px", borderRadius: "999px", background: "#161d2e", color: "#ffffff", fontWeight: "700" }}>
              שבוע
            </span>
            <span style={{ padding: "8px 14px" }}>
              חודש
            </span>
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            היום
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            + אירוע
          </span>
        </div>
        <div style={{ display: "flex", gap: "14px", alignItems: "center", padding: "12px 16px", borderRadius: "14px", background: "var(--f-green-bg)", color: "#185436", fontSize: "13.5px" }}>
          <b>
            ✓ Google Calendar מסונכרן
          </b>
          <span>
            לפני 2 דק׳ · משימות עם תאריך ומועדי פרסום מוצגים מ־Mytiv
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden", display: "grid", gridTemplateColumns: "60px repeat(7, minmax(0px, 1fr))" }}>
          <span style={{ background: "var(--f-bg)" }}></span>
          <div style={{ padding: "10px 12px", background: "var(--f-bg)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                ראשון
              </span>
            </span>
            <b style={{ fontSize: "18px", color: "var(--f-ink)" }}>
              <span className="sc-interp">
                27
              </span>
            </b>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--f-bg)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                שני
              </span>
            </span>
            <b style={{ fontSize: "18px", color: "var(--f-ink)" }}>
              <span className="sc-interp">
                28
              </span>
            </b>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--f-bg)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                שלישי
              </span>
            </span>
            <b style={{ fontSize: "18px", color: "var(--f-ink)" }}>
              <span className="sc-interp">
                29
              </span>
            </b>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--f-bg)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                רביעי
              </span>
            </span>
            <b style={{ fontSize: "18px", color: "var(--f-ink)" }}>
              <span className="sc-interp">
                30
              </span>
            </b>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--f-accent-weak)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                חמישי
              </span>
            </span>
            <b style={{ fontSize: "18px", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                1
              </span>
            </b>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--f-bg)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                שישי
              </span>
            </span>
            <b style={{ fontSize: "18px", color: "var(--f-ink)" }}>
              <span className="sc-interp">
                2
              </span>
            </b>
          </div>
          <div style={{ padding: "10px 12px", background: "var(--f-bg)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                שבת
              </span>
            </span>
            <b style={{ fontSize: "18px", color: "var(--f-ink)" }}>
              <span className="sc-interp">
                3
              </span>
            </b>
          </div>
          <span style={{ fontSize: "12px", color: "var(--f-muted)", padding: "10px 8px", textAlign: "right", borderTop: "1px solid var(--f-surface-2)" }} dir="ltr">
            <span className="sc-interp">
              09:00
            </span>
          </span>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ borderRadius: "8px", padding: "6px 8px", background: "var(--f-surface-2)", boxShadow: "var(--f-surface-2) 0px 0px 0px 1px inset", display: "flex", flexDirection: "column", gap: "1px" }}>
              <b style={{ fontSize: "12.5px", color: "var(--f-ink)" }}>
                <span className="sc-interp">
                  תפריט PDF
                </span>
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-ink)" }}>
                <span className="sc-interp">
                  יעד · יואב
                </span>
              </span>
            </div>
          </div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <span style={{ fontSize: "12px", color: "var(--f-muted)", padding: "10px 8px", textAlign: "right", borderTop: "1px solid var(--f-surface-2)" }} dir="ltr">
            <span className="sc-interp">
              10:00
            </span>
          </span>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ borderRadius: "8px", padding: "6px 8px", background: "var(--f-accent-weak)", boxShadow: "#ece8fb 0px 0px 0px 1px inset", display: "flex", flexDirection: "column", gap: "1px" }}>
              <b style={{ fontSize: "12.5px", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  שיחה · נועה כהן
                </span>
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  Meet · ליד
                </span>
              </span>
            </div>
          </div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <span style={{ fontSize: "12px", color: "var(--f-muted)", padding: "10px 8px", textAlign: "right", borderTop: "1px solid var(--f-surface-2)" }} dir="ltr">
            <span className="sc-interp">
              13:30
            </span>
          </span>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ borderRadius: "8px", padding: "6px 8px", background: "var(--f-accent-weak)", boxShadow: "#ece8fb 0px 0px 0px 1px inset", display: "flex", flexDirection: "column", gap: "1px" }}>
              <b style={{ fontSize: "12.5px", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  פגישת צוות
                </span>
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  משרד
                </span>
              </span>
            </div>
          </div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <span style={{ fontSize: "12px", color: "var(--f-muted)", padding: "10px 8px", textAlign: "right", borderTop: "1px solid var(--f-surface-2)" }} dir="ltr">
            <span className="sc-interp">
              16:00
            </span>
          </span>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ borderRadius: "8px", padding: "6px 8px", background: "var(--f-accent-weak)", boxShadow: "#ece8fb 0px 0px 0px 1px inset", display: "flex", flexDirection: "column", gap: "1px" }}>
              <b style={{ fontSize: "12.5px", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  גל פילאטיס
                </span>
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-accent-ink)" }}>
                <span className="sc-interp">
                  שיחת בריף
                </span>
              </span>
            </div>
          </div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <span style={{ fontSize: "12px", color: "var(--f-muted)", padding: "10px 8px", textAlign: "right", borderTop: "1px solid var(--f-surface-2)" }} dir="ltr">
            <span className="sc-interp">
              18:00
            </span>
          </span>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}></div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ borderRadius: "8px", padding: "6px 8px", background: "var(--f-surface)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", display: "flex", flexDirection: "column", gap: "1px" }}>
              <b style={{ fontSize: "12.5px", color: "var(--f-amber-ink-strong)" }}>
                <span className="sc-interp">
                  סטורי ערבי סושי
                </span>
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-amber-ink-strong)" }}>
                <span className="sc-interp">
                  … ממתין לאישור
                </span>
              </span>
            </div>
          </div>
          <div style={{ minHeight: "74px", padding: "6px", borderTop: "1px solid var(--f-surface-2)", borderInlineStart: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ borderRadius: "8px", padding: "6px 8px", background: "var(--f-surface-2)", boxShadow: "var(--f-surface-2) 0px 0px 0px 1px inset", display: "flex", flexDirection: "column", gap: "1px" }}>
              <b style={{ fontSize: "12.5px", color: "var(--f-ink)" }}>
                <span className="sc-interp">
                  צילום מנה
                </span>
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-ink)" }}>
                <span className="sc-interp">
                  יעד · ללא אחראי
                </span>
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "12.5px", color: "var(--f-muted)" }}>
          <span>
            <b style={{ color: "var(--f-accent-ink)" }}>
              ■
            </b>
            {" פגישה"}
          </span>
          <span>
            <b style={{ color: "var(--f-amber-text)" }}>
              ┄
            </b>
            {" פרסום מתוזמן"}
          </span>
          <span>
            <b style={{ color: "var(--f-ink)" }}>
              ■
            </b>
            {" משימה עם יעד"}
          </span>
          <span>
            {"כשסנכרון נכשל, מוצג באנר \"⊘ היומן לא מסונכרן מאז…\" ולא יומן ריק."}
          </span>
        </div>
      </div>
    </div>
  );
}
