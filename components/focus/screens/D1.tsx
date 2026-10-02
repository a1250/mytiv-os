/**
 * D1 — היום שלי · לפי זמן
 * Generated from the Claude Design handoff (D1) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/icon";

export default function ScreenD1() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "32px 40px 40px", display: "flex", flexDirection: "column", gap: "28px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "24px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
              יום חמישי, 1 באוקטובר 2026
            </span>
            <h2 style={{ margin: "0px", fontSize: "36px", fontWeight: "800" }}>
              בוקר טוב, רון
            </h2>
            <span style={{ fontSize: "19px" }}>
              יש היום 6 פריטים שדורשים את תשומת ליבך.
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ width: "30px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
              <span style={{ width: "30px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
              <span style={{ width: "30px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
              <span style={{ width: "30px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
              <span style={{ width: "30px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
              <span style={{ width: "30px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              טופלו 0 מתוך 6
            </span>
          </div>
          <span style={{ fontSize: "15px", fontWeight: "700", padding: "13px 22px", borderRadius: "999px", background: "#161d2e", color: "#ffffff" }}>
            התחל לטפל, אחד־אחד
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 360px", gap: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0px, 1fr))", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <b style={{ fontSize: "16px" }}>
                  עכשיו
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  לפני 12:00 · 2
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                    ▲ סיכון גבוה
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                    ממתין יום
                  </span>
                </div>
                <b style={{ fontSize: "16px", lineHeight: "1.35" }}>
                  {"שלח את ההצעה \"אירוח עסקי — 8,750 ₪\""}
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  נועה כהן · אירוע חברה ל־35
                </span>
                <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
                  ביקשה לקבל עד יום ראשון. השיחה איתה היום ב־10:00.
                </span>
                <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff", textAlign: "center" }}>
                  בדוק ושלח
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-green-ink)", background: "var(--f-green-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                    ● סיכון נמוך
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                    ממתין יומיים
                  </span>
                </div>
                <b style={{ fontSize: "16px", lineHeight: "1.35" }}>
                  {"אשר את סטורי \"ערבי סושי של חמישי\""}
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  UMINO · מתוזמן למחר 18:00
                </span>
                <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", textAlign: "center" }}>
                  בדוק ואשר
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <b style={{ fontSize: "16px" }}>
                  עד סוף היום
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  2
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                    ◆ סיכון בינוני
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                    3 ימים
                  </span>
                </div>
                <b style={{ fontSize: "16px", lineHeight: "1.35" }}>
                  החלט על מבצע 1+1 לקמפיין יום חמישי
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  UMINO · הצעה של AI · משפיע על מחיר
                </span>
                <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", textAlign: "center" }}>
                  פתח החלטה
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-neutral-ink)", background: "var(--f-neutral-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                    ! תקלה בחיבור
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                    4 ימים
                  </span>
                </div>
                <b style={{ fontSize: "16px", lineHeight: "1.35" }}>
                  חבר מחדש את Instagram
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  UMINO · מדדים לא מתעדכנים מ־27.9
                </span>
                <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", textAlign: "center" }}>
                  התחבר מחדש
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <b style={{ fontSize: "16px" }}>
                  השבוע
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  2
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
                <b style={{ fontSize: "15px" }}>
                  ענה: שעות פתיחה בחג
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  UMINO · בקשת מידע · ● נמוך
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
                <b style={{ fontSize: "15px" }}>
                  אשר את תוכנית אוקטובר
                </b>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  גל פילאטיס · ◆ בינוני · 5 ימים
                </span>
              </div>
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px", padding: "16px", borderRadius: "14px", background: "var(--f-amber-bg)" }}>
                <b style={{ fontSize: "15px", color: "var(--f-amber-strong-text)" }}>
                  מה תקוע · 3
                </b>
                <span style={{ fontSize: "14px", lineHeight: "1.45" }}>
                  {"צילום מנת הספיישל ממתין לצלם 12 ימים, ללא אחראי. "}
                  <a style={{ fontWeight: "700" }} href="#D2">
                    הקצה
                  </a>
                </span>
                <span style={{ fontSize: "14px", lineHeight: "1.45" }}>
                  אין נכס מאושר לפוסט 4:5 של הקמפיין.
                </span>
                <span style={{ fontSize: "14px", lineHeight: "1.45" }}>
                  גל פילאטיס ממתינה לחומרים 6 ימים.
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: "10px" }}>
              <b style={{ fontSize: "16px" }}>
                היום ביומן
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                Google · סונכרן לפני 2 דק׳
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "52px 1fr", gap: "0px 12px" }}>
              <span style={{ fontSize: "13px", color: "var(--f-red-text)", fontWeight: "700", textAlign: "right" }} dir="ltr">
                08:10
              </span>
              <div style={{ height: "18px", position: "relative" }}>
                <span style={{ position: "absolute", top: "8px", insetInline: "0px", borderTop: "2px solid #b8322a" }}></span>
                <span style={{ position: "absolute", top: "4px", insetInlineStart: "-5px", width: "10px", height: "10px", borderRadius: "50%", background: "#b8322a" }}></span>
              </div>
              <span style={{ fontSize: "13px", color: "var(--f-muted)", textAlign: "right", paddingTop: "2px" }} dir="ltr">
                09:00
              </span>
              <span style={{ borderTop: "1px solid var(--f-surface-2)", height: "36px" }}></span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)", textAlign: "right", paddingTop: "2px" }} dir="ltr">
                10:00
              </span>
              <div style={{ borderTop: "1px solid var(--f-surface-2)", padding: "6px 0px 10px" }}>
                <div style={{ background: "var(--f-accent-weak)", borderRadius: "10px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <b style={{ fontSize: "14px", color: "var(--f-accent-ink)" }}>
                      שיחת היכרות — נועה כהן
                    </b>
                    <span style={{ fontSize: "12px", color: "var(--f-accent-ink)" }}>
                      Google Meet · 30 דק׳
                    </span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: "700", padding: "8px 12px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
                    הצטרף
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "13px", color: "var(--f-muted)", textAlign: "right", paddingTop: "2px" }} dir="ltr">
                13:30
              </span>
              <div style={{ borderTop: "1px solid var(--f-surface-2)", padding: "6px 0px 10px" }}>
                <div style={{ background: "var(--f-surface-2)", borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <b style={{ fontSize: "14px" }}>
                    פגישת צוות שבועית
                  </b>
                  <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                    משרד · 45 דק׳
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "13px", color: "var(--f-muted)", textAlign: "right", paddingTop: "2px" }} dir="ltr">
                18:00
              </span>
              <div style={{ borderTop: "1px solid var(--f-surface-2)", padding: "6px 0px 10px" }}>
                <div style={{ border: "1.5px dashed #8c5a00", borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <b style={{ fontSize: "14px" }}>
                    פרסום מתוזמן: סטורי ערבי סושי
                  </b>
                  <span style={{ fontSize: "12px", color: "var(--f-amber-text)", fontWeight: "600" }}>
                    … ממתין לאישור שלך
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "14px", marginTop: "6px", borderTop: "1px solid var(--f-surface-2)" }}>
              <b style={{ fontSize: "14px" }}>
                המשך מאיפה שעצרת
              </b>
              <span style={{ fontSize: "14px" }}>
                {"הצעה: אירוח עסקי "}
                <span style={{ color: "var(--f-muted)" }}>
                  · אתמול
                </span>
              </span>
              <span style={{ fontSize: "14px" }}>
                {"סטורי ערבי סושי · גרסה 2 "}
                <span style={{ color: "var(--f-muted)" }}>
                  · לפני 3 שעות
                </span>
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <b style={{ fontSize: "20px" }}>
              העבודה שלי להיום
            </b>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              4 להיום · 2 באיחור · 1 חסומה · 2 ממתינות לאחרים
            </span>
            <span style={{ flex: "1 1 0%" }}></span>
            <a style={{ fontSize: "13px", fontWeight: "700", textDecoration: "none" }} href="#">
              {"פתח את \"המשימות שלי\" ←"}
            </a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0px, 1fr))", gap: "14px", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "7px" }}>
                <b style={{ fontSize: "15px" }}>
                  היום
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  4
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "7px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, var(--f-border) 0px 0px 0px 1px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                    ◆ בינוני
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--f-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
                    Mytiv
                  </span>
                </div>
                <b style={{ fontSize: "14px", lineHeight: "1.35" }}>
                  לתאם צילום מנת הספיישל
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  הבא: להתקשר לצלם
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--f-accent-ink)", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Icon name="play" size={14} />
                  הפעל טיימר
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 13px", display: "flex", flexDirection: "column", gap: "3px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
                <b style={{ fontSize: "13.5px" }}>
                  טקסט נלווה לקרוסלה
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  הבא: לכתוב וריאציה · 2/3
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "7px" }}>
                <b style={{ fontSize: "15px", color: "var(--f-red-text)" }}>
                  באיחור
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  2
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "rgba(22, 29, 46, 0.06) 0px 1px 2px, #f3c4bf 0px 0px 0px 1px", borderInlineStart: "3px solid #b8322a" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "2px 8px", borderRadius: "999px" }}>
                    ▲ גבוה
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--f-red-text)", fontWeight: "700" }}>
                    2 ימים
                  </span>
                </div>
                <b style={{ fontSize: "14px", lineHeight: "1.35" }}>
                  לסיים בריף לקמפיין
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  הבא: לאשר מול דנה
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 13px", display: "flex", flexDirection: "column", gap: "3px", boxShadow: "#f3c4bf 0px 0px 0px 1px", borderInlineStart: "3px solid #b8322a" }}>
                <b style={{ fontSize: "13.5px" }}>
                  לעדכן שעות בפרויקט
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  גל פילאטיס · באיחור יום
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "7px" }}>
                <b style={{ fontSize: "15px" }}>
                  חסומות
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  1
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "13px", display: "flex", flexDirection: "column", gap: "7px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-ink)", background: "var(--f-surface-2)", padding: "2px 8px", borderRadius: "5px", alignSelf: "flex-start" }}>
                  ■ חסום
                </span>
                <b style={{ fontSize: "14px", lineHeight: "1.35" }}>
                  לעצב פוסט 4:5
                </b>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", padding: "7px 9px", borderRadius: "8px", background: "var(--f-bg)" }}>
                  <Icon name="link" size={13} style={{ opacity: "0.7" }} />
                  <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                    חסום ע״י צילום מנת הספיישל
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "7px" }}>
                <b style={{ fontSize: "15px" }}>
                  ממתינות לאחרים
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  2
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 13px", display: "flex", flexDirection: "column", gap: "5px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <b style={{ fontSize: "13.5px" }}>
                    אישור תקציב מדיה
                  </b>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "2px 7px", borderRadius: "999px" }}>
                    ⏸
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  ממתין ל: דנה · 3 ימים
                </span>
              </div>
              <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "12px 13px", display: "flex", flexDirection: "column", gap: "5px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <b style={{ fontSize: "13.5px" }}>
                    חומרים מהלקוחה
                  </b>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "2px 7px", borderRadius: "999px" }}>
                    ⏸
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  ממתין ל: גל פילאטיס · 6 ימים
                </span>
              </div>
            </div>
          </div>
          <div style={{ height: "54px", background: "#161d2e", color: "#ffffff", borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px", padding: "0px 20px" }}>
            <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--f-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
              <Icon name="pause" size={14} label="השהה" />
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <b style={{ fontSize: "13px" }}>
                טיימר פעיל · לתאם צילום מנת הספיישל
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-faint-2)" }}>
                UMINO · השקת תפריט סתיו
              </span>
            </div>
            <span style={{ fontFamily: "\"IBM Plex Mono\", monospace", fontSize: "19px", fontWeight: "600", marginInlineStart: "6px" }} dir="ltr">
              00:42:18
            </span>
            <span style={{ flex: "1 1 0%" }}></span>
            <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 13px", borderRadius: "999px", background: "#2b3245" }}>
              עצור ושמור
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) minmax(0px, 1fr) minmax(0px, 1.6fr)", gap: "16px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "15px" }}>
                UMINO · השקת תפריט סתיו
              </b>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                בסיכון
              </span>
            </div>
            <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
              שתי חסימות מעכבות את הפוסט המרכזי.
            </span>
            <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--f-muted)" }}>
              <span>
                דנה
              </span>
              <span>
                יעד 8.10
              </span>
              <span>
                34/40 שעות
              </span>
            </div>
            <span style={{ fontSize: "13px", padding: "8px 10px", borderRadius: "10px", background: "var(--f-surface-2)" }}>
              <b>
                הבא:
              </b>
              {" לתאם צילום עד 3.10"}
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "15px" }}>
                גל פילאטיס · אתר
              </b>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                בסיכון
              </span>
            </div>
            <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
              ממתינים לחומרים מהלקוחה 6 ימים.
            </span>
            <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--f-muted)" }}>
              <span>
                יואב
              </span>
              <span>
                יעד 15.10
              </span>
              <span>
                22/30 שעות
              </span>
            </div>
            <span style={{ fontSize: "13px", padding: "8px 10px", borderRadius: "10px", background: "var(--f-surface-2)" }}>
              <b>
                הבא:
              </b>
              {" שיחה עם הלקוחה"}
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                לידים חדשים
              </span>
              <b style={{ fontSize: "24px" }}>
                {"2 "}
                <span style={{ fontSize: "13px", color: "var(--f-green-text)", fontWeight: "600" }}>
                  +1
                </span>
              </b>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                מכירות · 08:02 · ידוע
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                הצעות פתוחות
              </span>
              <b style={{ fontSize: "24px" }}>
                8,750 ₪
              </b>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                1 הצעה · טרם נשלחה
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                משימות באיחור
              </span>
              <b style={{ fontSize: "24px", color: "var(--f-red-text)" }}>
                2
              </b>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                ClickUp · לפני 4 דק׳
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                שעות מול תקציב
              </span>
              <b style={{ fontSize: "24px" }}>
                ≈ 56/70
              </b>
              <span style={{ fontSize: "11.5px", color: "var(--f-amber-text)", fontWeight: "600" }}>
                מוערך · 2 ללא דיווח
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                תוכן לאישור
              </span>
              <b style={{ fontSize: "24px" }}>
                3
              </b>
              <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                סטודיו · ידוע
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                חשיפות Instagram
              </span>
              <b style={{ fontSize: "24px", color: "var(--f-neutral-text)" }}>
                —
              </b>
              <span style={{ fontSize: "11.5px", color: "var(--f-neutral-text)", fontWeight: "600" }}>
                לא זמין · מ־27.9
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
