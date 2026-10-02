/**
 * W1 — עבודה › המשימות שלי · מסודר לפי זמן · טיימר פעיל קבוע למטה
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (W1) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenW1() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "28px 40px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "24px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
              עבודה · יום חמישי, 1 באוקטובר 2026
            </span>
            <h2 style={{ margin: "0px", fontSize: "36px", fontWeight: "800" }}>
              המשימות שלי
            </h2>
            <span style={{ fontSize: "19px" }}>
              14 משימות פתוחות · 2 באיחור · 1 חסומה.
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--f-surface-2)", borderRadius: "999px" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "rgba(22, 29, 46, 0.12) 0px 1px 2px" }}>
              לפי זמן
            </span>
            <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px" }}>
              List
            </span>
            <span style={{ fontSize: "14px", padding: "9px 16px", borderRadius: "999px" }}>
              Kanban
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "var(--f-surface)", borderRadius: "14px", padding: "12px 14px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
          <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--f-accent)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "700", flex: "0 0 auto" }}>
            +
          </span>
          <span style={{ flex: "1 1 0%", fontSize: "15px", color: "var(--f-faint)" }}>
            {"משימה חדשה… כתוב \"מחר\", \"גבוה\", \"@דנה\", \"#UMINO\" והשדות יתמלאו"}
          </span>
          <span style={{ fontSize: "13px", color: "var(--f-muted)", padding: "6px 10px", borderRadius: "8px", background: "var(--f-surface-2)" }}>
            היום
          </span>
          <span style={{ fontSize: "13px", color: "var(--f-muted)", padding: "6px 10px", borderRadius: "8px", background: "var(--f-surface-2)" }}>
            בינוני
          </span>
          <span style={{ fontSize: "13px", color: "var(--f-muted)", padding: "6px 10px", borderRadius: "8px", background: "var(--f-surface-2)" }}>
            ללא פרויקט
          </span>
          <span style={{ fontSize: "12px", color: "var(--f-faint)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
            ⏎
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 16px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            הוסף
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0px, 1fr))", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <b style={{ fontSize: "16px" }}>
                היום
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                4
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "9px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ◆ בינוני
                </span>
                <span style={{ fontSize: "11px", color: "var(--f-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
                  Mytiv
                </span>
              </div>
              <b style={{ fontSize: "15px", lineHeight: "1.35" }}>
                לתאם צילום מנת הספיישל
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                UMINO · השקת תפריט סתיו
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px", borderTop: "1px solid var(--f-surface-2)" }}>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  הבא: להתקשר לצלם
                </span>
                <span style={{ fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px", color: "var(--f-accent-ink)" }}>
                  <Icon name="play" size={15} />
                  הפעל טיימר
                </span>
              </div>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "9px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ● נמוך
                </span>
                <span style={{ fontSize: "11px", color: "var(--f-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#56617a" }}></span>
                  ClickUp
                </span>
              </div>
              <b style={{ fontSize: "15px", lineHeight: "1.35" }}>
                לכתוב טקסט נלווה לקרוסלה
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                UMINO · ◐ בתהליך
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px", borderTop: "1px solid var(--f-surface-2)" }}>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  תת־משימות 2/3
                </span>
                <span style={{ fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px", color: "var(--f-accent-ink)" }}>
                  <Icon name="play" size={15} />
                  הפעל
                </span>
              </div>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <b style={{ fontSize: "14px" }}>
                לאשר תמונת כריכה
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                גל פילאטיס · ● נמוך · Mytiv
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <b style={{ fontSize: "16px", color: "var(--f-red-text)" }}>
                באיחור
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                2
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "9px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, #f3c4bf 0px 0px 0px 1px", borderInlineStart: "3px solid #b8322a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ▲ גבוה
                </span>
                <span style={{ fontSize: "11px", color: "var(--f-red-text)", fontWeight: "700" }}>
                  באיחור 2 ימים
                </span>
              </div>
              <b style={{ fontSize: "15px", lineHeight: "1.35" }}>
                לסיים בריף לקמפיין יום חמישי
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                UMINO · יעד היה 29.9
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px", borderTop: "1px solid var(--f-surface-2)" }}>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  הבא: לאשר מול דנה
                </span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                  פתח
                </span>
              </div>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "#f3c4bf 0px 0px 0px 1px", borderInlineStart: "3px solid #b8322a" }}>
              <b style={{ fontSize: "14px" }}>
                לעדכן שעות בפרויקט אתר
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                גל פילאטיס · ◆ בינוני · באיחור יום
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
              <b style={{ fontSize: "16px" }}>
                חסומות
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                1
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "9px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-ink)", background: "var(--f-surface-2)", padding: "2px 8px", borderRadius: "6px" }}>
                  ■ חסום
                </span>
                <span style={{ fontSize: "11px", color: "var(--f-muted)" }}>
                  Mytiv
                </span>
              </div>
              <b style={{ fontSize: "15px", lineHeight: "1.35" }}>
                לעצב פוסט 4:5
              </b>
              <div style={{ display: "flex", gap: "7px", alignItems: "center", padding: "8px 10px", borderRadius: "8px", background: "var(--f-bg)" }}>
                <Icon name="link" size={14} style={{ opacity: "0.7" }} />
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  {"חסום על ידי "}
                  <b style={{ color: "var(--f-ink)" }}>
                    צילום מנת הספיישל
                  </b>
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <b style={{ fontSize: "16px" }}>
                בקרוב
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                3
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <b style={{ fontSize: "14px" }}>
                להכין סקירה שבועית ל־UMINO
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                יעד 5.10 · ◆ בינוני · Mytiv
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <b style={{ fontSize: "14px" }}>
                לעדכן הצעת מחיר לנועה
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                יעד 4.10 · ● נמוך · ClickUp
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
              <b style={{ fontSize: "16px" }}>
                ממתינות לאחרים
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                2
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b style={{ fontSize: "14px" }}>
                  אישור תקציב מדיה
                </b>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ⏸ ממתין
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                ממתין ל: דנה · 3 ימים
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <b style={{ fontSize: "14px" }}>
                  חומרים מהלקוחה
                </b>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                  ⏸ ממתין
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                ממתין ל: גל פילאטיס · 6 ימים
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
              <b style={{ fontSize: "16px" }}>
                ללא תאריך
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                4
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <b style={{ fontSize: "14px" }}>
                לרענן את מדריך המותג
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                ○ לא התחיל
              </span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-accent-ink)", fontWeight: "700", padding: "4px 2px" }}>
              הצג עוד 3
            </span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: "4px", height: "60px", flex: "0 0 auto", background: "#161d2e", color: "#ffffff", display: "flex", alignItems: "center", gap: "16px", padding: "0px 24px" }}>
        <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--f-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
          <Icon name="pause" size={16} label="השהה" />
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <b style={{ fontSize: "14px" }}>
            לתאם צילום מנת הספיישל
          </b>
          <span style={{ fontSize: "12px", color: "var(--f-faint-2)" }}>
            UMINO · השקת תפריט סתיו
          </span>
        </div>
        <span style={{ fontFamily: "\"IBM Plex Mono\", monospace", fontSize: "22px", fontWeight: "600", marginInlineStart: "8px" }} dir="ltr">
          00:42:18
        </span>
        <span style={{ flex: "1 1 0%" }}></span>
        <span style={{ fontSize: "13px", color: "var(--f-faint-2)" }}>
          רשום על המשימה · מתווסף לדוח השעות
        </span>
        <span style={{ fontSize: "13px", fontWeight: "700", padding: "8px 14px", borderRadius: "999px", background: "#2b3245", color: "#ffffff" }}>
          עצור ושמור
        </span>
      </div>
    </div>
  );
}
