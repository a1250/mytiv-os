/**
 * W2 — סביבת פרויקט › ביצוע › Mytiv Work · List · תת־משימות מתקפלות · תלויות · checklist בשורה
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (W2) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenW2() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ background: "var(--f-surface)", padding: "20px 40px 0px", display: "flex", flexDirection: "column", gap: "14px", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          לקוחות ופרויקטים › UMINO › השקת תפריט סתיו
        </span>
        <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--f-surface-2)", borderRadius: "999px", alignSelf: "flex-start" }}>
          <span style={{ fontSize: "14px", padding: "9px 18px", borderRadius: "999px" }}>
            סקירה
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 18px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "rgba(22, 29, 46, 0.12) 0px 1px 2px" }}>
            {"ביצוע "}
            <b style={{ color: "var(--f-red-text)" }}>
              2
            </b>
          </span>
          <span style={{ fontSize: "14px", padding: "9px 18px", borderRadius: "999px" }}>
            שיווק ותוכן
          </span>
          <span style={{ fontSize: "14px", padding: "9px 18px", borderRadius: "999px" }}>
            ידע ותוצאות
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--f-surface-2)", borderRadius: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", padding: "7px 14px", borderRadius: "7px", background: "var(--f-surface)" }}>
              List
            </span>
            <span style={{ fontSize: "13px", padding: "7px 14px", borderRadius: "7px" }}>
              Kanban
            </span>
            <span style={{ fontSize: "13px", padding: "7px 14px", borderRadius: "7px" }}>
              ציר זמן
            </span>
          </div>
          <span style={{ fontSize: "13px", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            כל הסטטוסים ▾
          </span>
          <span style={{ fontSize: "13px", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            אחראי ▾
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "12px", color: "var(--f-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
            {"Mytiv "}
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#56617a", marginInlineStart: "6px" }}></span>
            ClickUp
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "10px 16px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            + משימה
          </span>
        </div>
      </div>
      <div style={{ padding: "20px 40px 28px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0px, 1fr) 150px 120px 130px 90px", gap: "12px", padding: "0px 14px", fontSize: "12px", color: "var(--f-muted)", fontWeight: "600" }}>
          <span></span>
          <span>
            משימה
          </span>
          <span>
            אחראי
          </span>
          <span>
            יעד
          </span>
          <span>
            סטטוס
          </span>
          <span>
            זמן
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "12px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0px, 1fr) 150px 120px 130px 90px", gap: "12px", alignItems: "center", padding: "13px 14px" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--f-muted)" }}>
              <Icon name="chevron-down" size={16} label="כווץ" />
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: "0px" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid var(--f-line-strong)", flex: "0 0 auto" }}></span>
              <b style={{ fontSize: "14.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                הפקת תוכן לקמפיין יום חמישי
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-muted)", flex: "0 0 auto" }}>
                3 תת־משימות
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ד
              </span>
              <span style={{ fontSize: "13px" }}>
                דנה
              </span>
            </div>
            <span style={{ fontSize: "13px" }}>
              8.10
            </span>
            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "3px 9px", borderRadius: "999px", justifySelf: "start" }}>
              ◐ בתהליך
            </span>
            <span style={{ fontSize: "12px", color: "var(--f-muted)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
              6/14h
            </span>
          </div>
          <div style={{ background: "#fafbfd", borderTop: "1px solid var(--f-surface-2)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0px, 1fr) 150px 120px 130px 90px", gap: "12px", alignItems: "center", padding: "11px 14px", borderBottom: "1px solid var(--f-surface-2)" }}>
              <span></span>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", paddingInlineStart: "22px", minWidth: "0px" }}>
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#23774a", color: "#ffffff", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                  ✓
                </span>
                <span style={{ fontSize: "14px", color: "var(--f-faint)", textDecoration: "line-through" }}>
                  כתיבת בריף
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ד
                </span>
                <span style={{ fontSize: "13px", color: "var(--f-faint)" }}>
                  דנה
                </span>
              </div>
              <span style={{ fontSize: "13px", color: "var(--f-faint)" }}>
                29.9
              </span>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "3px 9px", borderRadius: "999px", justifySelf: "start" }}>
                ✓ הושלם
              </span>
              <span style={{ fontSize: "12px", color: "var(--f-muted)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                2/2h
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0px, 1fr) 150px 120px 130px 90px", gap: "12px", alignItems: "center", padding: "11px 14px", borderBottom: "1px solid var(--f-surface-2)", boxShadow: "var(--f-accent) 3px 0px 0px inset" }}>
              <span></span>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", paddingInlineStart: "22px", minWidth: "0px" }}>
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid var(--f-line-strong)", flex: "0 0 auto" }}></span>
                <span style={{ fontSize: "14px" }}>
                  לעצב פוסט 4:5
                </span>
                <span style={{ fontSize: "10.5px", fontWeight: "700", color: "var(--f-ink)", background: "var(--f-surface-2)", padding: "1px 7px", borderRadius: "5px", flex: "0 0 auto" }}>
                  ■ חסום
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#bcd4c6", color: "#1f5c3a", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  י
                </span>
                <span style={{ fontSize: "13px" }}>
                  יואב
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                6.10
              </span>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-ink)", background: "var(--f-surface-2)", padding: "3px 9px", borderRadius: "999px", justifySelf: "start" }}>
                ■ חסום
              </span>
              <span style={{ fontSize: "12px", color: "var(--f-muted)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                0/4h
              </span>
            </div>
            <div style={{ padding: "2px 14px 10px 50px" }}>
              <div style={{ display: "flex", gap: "7px", alignItems: "center", padding: "7px 11px", borderRadius: "8px", background: "var(--f-surface)", boxShadow: "#f0d3cf 0px 0px 0px 1px", width: "fit-content" }}>
                <Icon name="link" size={13} style={{ opacity: "0.7" }} />
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  {"חסום על ידי "}
                  <b style={{ color: "var(--f-ink)" }}>
                    צילום מנת הספיישל
                  </b>
                  {" · ממתין 12 ימים"}
                </span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                  הצג
                </span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0px, 1fr) 150px 120px 130px 90px", gap: "12px", alignItems: "center", padding: "11px 14px" }}>
              <span></span>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", paddingInlineStart: "22px", minWidth: "0px" }}>
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid var(--f-line-strong)", flex: "0 0 auto" }}></span>
                <span style={{ fontSize: "14px" }}>
                  טקסט נלווה לקרוסלה
                </span>
                <span style={{ fontSize: "11px", color: "var(--f-muted)", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Icon name="check-square" size={13} style={{ opacity: "0.7" }} />
                  2/3
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ד
                </span>
                <span style={{ fontSize: "13px" }}>
                  דנה
                </span>
              </div>
              <span style={{ fontSize: "13px" }}>
                6.10
              </span>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "3px 9px", borderRadius: "999px", justifySelf: "start" }}>
                ◐ בתהליך
              </span>
              <span style={{ fontSize: "12px", color: "var(--f-muted)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                1/3h
              </span>
            </div>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "12px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0px, 1fr) 150px 120px 130px 90px", gap: "12px", alignItems: "center", padding: "13px 14px" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--f-muted)" }}>
              <Icon name="chevron-left" size={16} label="הרחב" />
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: "0px" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid var(--f-line-strong)", flex: "0 0 auto" }}></span>
              <b style={{ fontSize: "14.5px" }}>
                צילום ועריכה
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-red-text)", fontWeight: "700", flex: "0 0 auto" }}>
                חסם פתוח
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--f-surface-2)", color: "var(--f-muted)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ?
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-red-text)" }}>
                ללא אחראי
              </span>
            </div>
            <span style={{ fontSize: "13px" }}>
              3.10
            </span>
            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-ink)", background: "var(--f-surface-2)", padding: "3px 9px", borderRadius: "999px", justifySelf: "start" }}>
              ■ חסום
            </span>
            <span style={{ fontSize: "12px", color: "var(--f-muted)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
              0/6h
            </span>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "12px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0px, 1fr) 150px 120px 130px 90px", gap: "12px", alignItems: "center", padding: "13px 14px" }}>
            <span></span>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: "0px" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid var(--f-line-strong)", flex: "0 0 auto" }}></span>
              <span style={{ fontSize: "14.5px" }}>
                לתזמן פרסום בכל הערוצים
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ר
              </span>
              <span style={{ fontSize: "13px" }}>
                רון
              </span>
            </div>
            <span style={{ fontSize: "13px" }}>
              7.10
            </span>
            <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-muted)", background: "var(--f-surface-2)", padding: "3px 9px", borderRadius: "999px", justifySelf: "start" }}>
              ○ לא התחיל
            </span>
            <span style={{ fontSize: "12px", color: "var(--f-muted)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
              0/2h
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 16px", color: "var(--f-muted)", fontSize: "14px" }}>
          <span style={{ fontSize: "18px" }}>
            +
          </span>
          משימה חדשה בפרויקט
        </div>
      </div>
    </div>
  );
}
