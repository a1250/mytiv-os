/**
 * W4 — מגירת פרטי משימה · חוזה הרכיב המלא · נפתחת מעל כל תצוגה
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (W4) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenW4() {
  return (
    <div className="f-screen" style={{ minHeight: "1020px", background: "var(--f-bg)", display: "flex", position: "relative", width: "100%" }}>
      <div style={{ flex: "1 1 0%", filter: "saturate(0.6)", opacity: "0.5", padding: "40px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ height: "56px", background: "var(--f-surface)", borderRadius: "12px" }}></div>
        <div style={{ height: "48px", background: "var(--f-surface)", borderRadius: "10px" }}></div>
        <div style={{ height: "48px", background: "var(--f-surface)", borderRadius: "10px" }}></div>
        <div style={{ height: "48px", background: "var(--f-surface)", borderRadius: "10px" }}></div>
      </div>
      <div style={{ position: "absolute", inset: "0px", background: "rgba(22, 29, 46, 0.28)" }}></div>
      <div style={{ position: "absolute", insetBlock: "0px", insetInlineStart: "0px", width: "760px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px, rgba(22, 29, 46, 0.5) 24px 0px 60px -30px", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 28px", borderBottom: "1px solid var(--f-surface-2)", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            UMINO › השקת תפריט סתיו › הפקת תוכן
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "12px", color: "var(--f-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
            מקור: Mytiv
          </span>
          <span style={{ width: "36px", height: "36px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={17} label="סגור" style={{ opacity: "0.75" }} />
          </span>
        </div>
        <div style={{ flex: "1 1 0%", overflow: "hidden", display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 300px" }}>
          <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "20px", overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", border: "2px solid var(--f-line-strong)", flex: "0 0 auto" }}></span>
                <h2 style={{ margin: "0px", fontSize: "22px", fontWeight: "800" }}>
                  לעצב פוסט 4:5 לקמפיין
                </h2>
              </div>
              <p style={{ margin: "0px", fontSize: "14px", lineHeight: "1.55", color: "var(--f-ink-soft)" }}>
                {"גרסה אנכית לפיד לפי מדריך המותג של UMINO. להשתמש בצילום מנת הספיישל ברגע שיאושר. טקסט ראשי + הנעה לפעולה \"הזמינו שולחן\"."}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  סטטוס
                </span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-ink)", background: "var(--f-surface-2)", padding: "7px 13px", borderRadius: "999px" }}>
                  ■ חסום ▾
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  עדיפות
                </span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "7px 13px", borderRadius: "999px" }}>
                  ◆ בינוני ▾
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  אחראי
                </span>
                <span style={{ fontSize: "13px", fontWeight: "600", background: "var(--f-surface-2)", padding: "6px 12px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#bcd4c6", color: "#1f5c3a", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    י
                  </span>
                  יואב ▾
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  משתתפים
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px" }}>
                  <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ד
                  </span>
                  <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--f-surface-2)", color: "var(--f-muted)", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--f-line-strong)" }}>
                    +
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ border: "1px solid var(--f-border)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  התחלה
                </span>
                <b style={{ fontSize: "14px" }}>
                  3.10.2026
                </b>
              </div>
              <div style={{ border: "1px solid var(--f-border)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  יעד
                </span>
                <b style={{ fontSize: "14px" }}>
                  6.10.2026
                </b>
              </div>
            </div>
            <div style={{ border: "1px solid var(--f-border)", borderRadius: "12px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "15px" }}>
                  זמן
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                  0h / 4h מתוכנן
                </span>
              </div>
              <div style={{ height: "8px", borderRadius: "999px", background: "var(--f-surface-2)", overflow: "hidden" }}>
                <span style={{ display: "block", width: "4%", height: "100%", background: "var(--f-accent)" }}></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff", display: "flex", alignItems: "center", gap: "7px" }}>
                  <Icon name="play" size={15} />
                  הפעל טיימר
                </span>
                <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                  או הזן ידנית
                </span>
                <span style={{ fontSize: "13px", color: "var(--f-muted)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                  0:00
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <b style={{ fontSize: "15px" }}>
                תלויות
              </b>
              <div style={{ display: "flex", gap: "9px", alignItems: "center", padding: "10px 13px", borderRadius: "10px", background: "var(--f-bg)" }}>
                <Icon name="link" size={15} style={{ opacity: "0.7" }} />
                <span style={{ fontSize: "13.5px" }}>
                  {"חסום על ידי "}
                  <b>
                    צילום מנת הספיישל
                  </b>
                </span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f-ink)", background: "var(--f-surface-2)", padding: "2px 8px", borderRadius: "5px", marginInlineStart: "auto" }}>
                  ■ חסום
                </span>
              </div>
              <span style={{ fontSize: "13px", color: "var(--f-accent-ink)", fontWeight: "700", padding: "2px" }}>
                + הוסף תלות
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "15px" }}>
                  תת־משימות
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  0/2
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "9px 12px", borderRadius: "10px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid var(--f-line-strong)" }}></span>
                <span style={{ fontSize: "14px" }}>
                  גרסת טקסט ראשית
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "9px 12px", borderRadius: "10px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid var(--f-line-strong)" }}></span>
                <span style={{ fontSize: "14px" }}>
                  התאמת צבעי מותג
                </span>
              </div>
              <span style={{ fontSize: "13px", color: "var(--f-muted)", padding: "2px" }}>
                + תת־משימה
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "15px" }}>
                  Checklist · לפני שליחה
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-green-text)", fontWeight: "700" }}>
                  2/4
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "14px" }}>
                  <span style={{ width: "18px", height: "18px", borderRadius: "5px", background: "#23774a", color: "#ffffff", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✓
                  </span>
                  <span style={{ color: "var(--f-faint)", textDecoration: "line-through" }}>
                    טקסט בתוך אזור בטוח
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "14px" }}>
                  <span style={{ width: "18px", height: "18px", borderRadius: "5px", background: "#23774a", color: "#ffffff", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✓
                  </span>
                  <span style={{ color: "var(--f-faint)", textDecoration: "line-through" }}>
                    ניגודיות תקינה
                  </span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "14px" }}>
                  <span style={{ width: "18px", height: "18px", borderRadius: "5px", border: "2px solid var(--f-line-strong)" }}></span>
                  הנעה לפעולה קיימת
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "14px" }}>
                  <span style={{ width: "18px", height: "18px", borderRadius: "5px", border: "2px solid var(--f-line-strong)" }}></span>
                  מחיר לא מופיע ללא אישור
                </label>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <b style={{ fontSize: "15px" }}>
                ראיות
              </b>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ width: "70px", height: "70px", borderRadius: "10px", background: "repeating-linear-gradient(135deg, var(--f-surface-2) 0px, var(--f-surface-2) 6px, var(--f-surface) 6px, var(--f-surface) 12px)", border: "1px solid var(--f-border)" }}></span>
                <span style={{ width: "70px", height: "70px", borderRadius: "10px", border: "2px dashed var(--f-line-strong)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--f-faint)", fontSize: "22px" }}>
                  +
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <b style={{ fontSize: "15px" }}>
                מקושר אל
              </b>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12.5px", padding: "6px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Icon name="folder" size={13} />
                  פרויקט: השקת תפריט סתיו
                </span>
                <span style={{ fontSize: "12.5px", padding: "6px 11px", borderRadius: "999px", background: "var(--f-surface-2)", color: "var(--f-ink-soft)", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Icon name="megaphone" size={13} />
                  קמפיין: יום חמישי
                </span>
                <span style={{ fontSize: "12.5px", padding: "6px 11px", borderRadius: "999px", background: "var(--f-surface-2)", color: "var(--f-ink-soft)", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
                  + ליד / הצעה
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <b style={{ fontSize: "15px" }}>
                תגובות
              </b>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                  ד
                </span>
                <div style={{ flex: "1 1 0%", background: "var(--f-bg)", borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "3px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                    <b style={{ fontSize: "13px" }}>
                      דנה
                    </b>
                    <span style={{ fontSize: "11px", color: "var(--f-faint)" }}>
                      אתמול 16:20
                    </span>
                  </div>
                  <span style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
                    <span style={{ color: "var(--f-accent-ink)", fontWeight: "600" }}>
                      @יואב
                    </span>
                    {" נתחיל ברגע שהצילום מאושר. שים דגש על הקריאוּת בפיד."}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                  ר
                </span>
                <div style={{ flex: "1 1 0%", border: "1px solid var(--f-border)", borderRadius: "999px", padding: "9px 14px", fontSize: "13.5px", color: "var(--f-faint)" }}>
                  כתוב תגובה… השתמש ב־@ לאזכור
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: "#fafbfd", borderInlineStart: "1px solid var(--f-surface-2)", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", overflow: "auto" }}>
            <b style={{ fontSize: "14px" }}>
              ציר פעילות
            </b>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "12.5px", position: "relative", paddingInlineStart: "14px", borderInlineStart: "2px solid #e3e8f0" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-21px", top: "3px", width: "9px", height: "9px", borderRadius: "50%", background: "#161d2e" }}></span>
                <span>
                  {"דנה אזכרה את "}
                  <b style={{ color: "var(--f-accent-ink)" }}>
                    @יואב
                  </b>
                </span>
                <span style={{ color: "var(--f-faint)" }}>
                  אתמול 16:20
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-21px", top: "3px", width: "9px", height: "9px", borderRadius: "50%", background: "#b8322a" }}></span>
                <span>
                  הפכה ל
                  <b>
                    חסומה
                  </b>
                  {" ע״י \"צילום\""}
                </span>
                <span style={{ color: "var(--f-faint)" }}>
                  28.9 · 09:10
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-21px", top: "3px", width: "9px", height: "9px", borderRadius: "50%", background: "var(--f-accent)" }}></span>
                <span>
                  אחראי שונה ל
                  <b>
                    יואב
                  </b>
                </span>
                <span style={{ color: "var(--f-faint)" }}>
                  27.9 · 14:02
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", position: "relative" }}>
                <span style={{ position: "absolute", insetInlineStart: "-21px", top: "3px", width: "9px", height: "9px", borderRadius: "50%", background: "#23774a" }}></span>
                <span>
                  נוצרה מתוך הפרויקט
                </span>
                <span style={{ color: "var(--f-faint)" }}>
                  25.9 · 11:30
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--f-surface-2)", display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 20px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            סמן כבוצע
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "10px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            שכפל
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
            עודכן לפני 4 דק׳ · נשמר אוטומטית
          </span>
        </div>
      </div>
    </div>
  );
}
