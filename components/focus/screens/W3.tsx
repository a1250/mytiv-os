/**
 * W3 — ביצוע › Kanban לפי סטטוס · גרירה או מקלדת · Space לבחירה, חצים להזזה
 * Generated from the Claude Design handoff (W3) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/icon";

export default function ScreenW3() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "20px 32px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <b style={{ fontSize: "17px" }}>
            השקת תפריט סתיו · לוח עבודה
          </b>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            8 משימות · מקובצות לפי סטטוס
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "13px", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            קבץ לפי: סטטוס ▾
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "0px 4px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "var(--f-line-strong)" }}></span>
              <b style={{ fontSize: "14px" }}>
                לא התחיל
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                2
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ◆ בינוני
                </span>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
              </div>
              <b style={{ fontSize: "14px", lineHeight: "1.35" }}>
                לתזמן פרסום בכל הערוצים
              </b>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ר
                </span>
                <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                  7.10
                </span>
              </div>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ● נמוך
                </span>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#56617a" }}></span>
              </div>
              <b style={{ fontSize: "14px", lineHeight: "1.35" }}>
                לרענן מדריך מותג
              </b>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#bcd4c6", color: "#1f5c3a", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  י
                </span>
                <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                  —
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "0px 4px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#8c5a00" }}></span>
              <b style={{ fontSize: "14px" }}>
                בתהליך
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                2
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px", outline: "var(--f-accent) solid 2px", outlineOffset: "0px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ◆ בינוני
                </span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-accent-ink)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                  ● 00:42
                </span>
              </div>
              <b style={{ fontSize: "14px", lineHeight: "1.35" }}>
                לתאם צילום מנת הספיישל
              </b>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                מועבר לכאן · נבחר
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ר
                </span>
                <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                  1.10
                </span>
              </div>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ● נמוך
                </span>
                <span style={{ fontSize: "11px", color: "var(--f-muted)" }}>
                  2/3
                </span>
              </div>
              <b style={{ fontSize: "14px", lineHeight: "1.35" }}>
                טקסט נלווה לקרוסלה
              </b>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ד
                </span>
                <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                  6.10
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "0px 4px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#161d2e" }}></span>
              <b style={{ fontSize: "14px" }}>
                חסום / ממתין
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                2
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-ink)", background: "var(--f-surface-2)", padding: "2px 8px", borderRadius: "5px" }}>
                  ■ חסום
                </span>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
              </div>
              <b style={{ fontSize: "14px", lineHeight: "1.35" }}>
                לעצב פוסט 4:5
              </b>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "11px", color: "var(--f-muted)" }}>
                <Icon name="link" size={12} style={{ opacity: "0.7" }} />
                חסום ע״י צילום
              </div>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ⏸ ממתין
                </span>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
              </div>
              <b style={{ fontSize: "14px", lineHeight: "1.35" }}>
                אישור תקציב מדיה
              </b>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                ממתין ל: דנה
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "0px 4px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#23774a" }}></span>
              <b style={{ fontSize: "14px" }}>
                הושלם
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                2
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "var(--f-border) 0px 0px 0px 1px", opacity: "0.8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ✓ הושלם
                </span>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
              </div>
              <b style={{ fontSize: "14px", lineHeight: "1.35", textDecoration: "line-through", color: "var(--f-muted)" }}>
                כתיבת בריף
              </b>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "var(--f-border) 0px 0px 0px 1px", opacity: "0.8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ✓ הושלם
                </span>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#56617a" }}></span>
              </div>
              <b style={{ fontSize: "14px", lineHeight: "1.35", textDecoration: "line-through", color: "var(--f-muted)" }}>
                תוכנית שיווק
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
