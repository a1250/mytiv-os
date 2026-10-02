/**
 * F2 — מסך ליד · זרימה 6 · נקודת התחלה
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (F2) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenF2() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ background: "var(--f-surface)", padding: "22px 40px 20px", display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          מכירות › לידים › נועה כהן
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
            נכ
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: "0px", fontSize: "30px", fontWeight: "800" }}>
              נועה כהן
            </h2>
            <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
              אירוע חברה ל־35 משתתפים · מקור: טופס באתר UMINO · אחראית: דנה
            </span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)", padding: "5px 12px", borderRadius: "6px" }}>
            שלב: פגישה ▾
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            שלח פנייה
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            קבע פגישה
          </span>
          <span style={{ fontSize: "15px", fontWeight: "700", padding: "13px 22px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            צור הצעת מחיר
          </span>
        </div>
      </div>
      <div style={{ padding: "24px 40px 40px", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 380px", gap: "24px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "0px" }}>
          <div style={{ background: "var(--f-accent)", color: "#ffffff", borderRadius: "16px", padding: "20px 22px", display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#e2dcfb" }}>
                הפעולה הבאה
              </span>
              <b style={{ fontSize: "20px" }}>
                לשלוח הצעה עד יום ראשון, 4.10
              </b>
              <span style={{ fontSize: "14px", color: "#ece8fb" }}>
                ביקשה במייל מ־29.9. השיחה איתה היום ב־10:00.
              </span>
            </div>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "13px 20px", borderRadius: "999px", background: "var(--f-surface)", color: "var(--f-accent-ink)" }}>
              צור הצעת מחיר
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "20px 22px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <b style={{ fontSize: "16px", flex: "1 1 0%" }}>
                ציר זמן
              </b>
              <span style={{ fontSize: "13px", fontWeight: "700", padding: "7px 12px", borderRadius: "999px", background: "#161d2e", color: "#ffffff" }}>
                הכול
              </span>
              <span style={{ fontSize: "13px", padding: "7px 12px", borderRadius: "999px", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
                מיילים 2
              </span>
              <span style={{ fontSize: "13px", padding: "7px 12px", borderRadius: "999px", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
                פגישות 1
              </span>
              <span style={{ fontSize: "13px", padding: "7px 12px", borderRadius: "999px", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
                הערות 1
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 14px", borderRadius: "12px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset", color: "var(--f-muted)", fontSize: "14px" }}>
              הוסף הערה…
            </div>
            <div style={{ display: "flex", flexDirection: "column", borderInlineStart: "2px solid var(--f-border)", paddingInlineStart: "18px", gap: "16px", marginTop: "4px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-25px", top: "4px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
                <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                  <b style={{ fontSize: "14px" }}>
                    שיחת היכרות
                  </b>
                  <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                    היום 10:00 · Google Meet · ביומן
                  </span>
                </div>
                <span style={{ fontSize: "14px", color: "var(--f-ink-soft)" }}>
                  {"30 דקות · "}
                  <span style={{ fontWeight: "700" }}>
                    הצטרף
                  </span>
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-25px", top: "4px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--f-line-strong)" }}></span>
                <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                  <b style={{ fontSize: "14px" }}>
                    מייל מנועה
                  </b>
                  <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                    29.9 · Gmail
                  </span>
                </div>
                <span style={{ fontSize: "14px", color: "var(--f-ink-soft)", lineHeight: "1.5" }}>
                  {"\"מחפשים ערב לצוות באמצע אוקטובר, 35 איש. אשמח להצעה עד סוף השבוע הבא.\""}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-25px", top: "4px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--f-line-strong)" }}></span>
                <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                  <b style={{ fontSize: "14px" }}>
                    הערה של דנה
                  </b>
                  <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                    29.9
                  </span>
                </div>
                <span style={{ fontSize: "14px", color: "var(--f-ink-soft)" }}>
                  להציע את החדר הפנימי. לבדוק זמינות ל־15.10.
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-25px", top: "4px", width: "12px", height: "12px", borderRadius: "50%", background: "var(--f-line-strong)" }}></span>
                <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                  <b style={{ fontSize: "14px" }}>
                    הליד נוצר
                  </b>
                  <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                    28.9 · טופס באתר
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <b style={{ fontSize: "15px" }}>
              פרטי קשר
            </b>
            <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: "8px 10px", fontSize: "14px" }}>
              <span style={{ color: "var(--f-muted)" }}>
                מייל
              </span>
              <bdi style={{ textAlign: "right" }} dir="ltr">
                noa.cohen@example.co.il
              </bdi>
              <span style={{ color: "var(--f-muted)" }}>
                טלפון
              </span>
              <bdi style={{ textAlign: "right" }} dir="ltr">
                050-0000000
              </bdi>
              <span style={{ color: "var(--f-muted)" }}>
                חברה
              </span>
              <span>
                חברת הייטק, תל אביב
              </span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-green-text)", boxShadow: "#23774a 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "6px", alignSelf: "flex-start" }}>
              ✓ אומת מול המייל שלה
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <b style={{ fontSize: "15px" }}>
              הצורך
            </b>
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "8px 10px", fontSize: "14px" }}>
              <span style={{ color: "var(--f-muted)" }}>
                אירוע
              </span>
              <span>
                ערב צוות
              </span>
              <span style={{ color: "var(--f-muted)" }}>
                משתתפים
              </span>
              <span>
                35
              </span>
              <span style={{ color: "var(--f-muted)" }}>
                מועד
              </span>
              <span>
                אמצע אוקטובר · טרם נקבע
              </span>
              <span style={{ color: "var(--f-muted)" }}>
                תקציב
              </span>
              <span style={{ color: "var(--f-neutral-text)", fontWeight: "600" }}>
                — לא נמסר
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "15px" }}>
                הצעות ומשימות
              </b>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>
                + משימה
              </span>
            </div>
            <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
              עדיין אין הצעה לליד הזה.
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", paddingTop: "8px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span>
                לבדוק זמינות חדר ל־15.10
              </span>
              <span style={{ color: "var(--f-muted)" }}>
                דנה · 2.10
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "15px" }}>
                אנשי קשר נוספים
              </b>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>
                ✦ מצא איש קשר
              </span>
            </div>
            <span style={{ fontSize: "13.5px", color: "var(--f-muted)", lineHeight: "1.5" }}>
              חיפוש רץ ברקע ומציג מקור ורמת ביטחון. איש קשר לא יתווסף בלי אישור שלך.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
