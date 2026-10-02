/**
 * F3 — הצעת מחיר · עריכה ותצוגה מקדימה
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (F3) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenF3() {
  return (
    <div className="f-screen f-focusmode" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ height: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "12px", padding: "0px 28px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "10px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          → לליד
        </span>
        <b style={{ fontSize: "17px" }}>
          הצעה · אירוח עסקי · נועה כהן
        </b>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-muted)", boxShadow: "#4d5870 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "999px" }}>
          ✎ טיוטה · גרסה 1
        </span>
        <span style={{ flex: "1 1 0%" }}></span>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          נשמר לפני רגע
        </span>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          הפק PDF
        </span>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          ✦ כתוב מייל בעזרת AI
        </span>
        <span style={{ fontSize: "15px", fontWeight: "700", padding: "12px 20px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
          המשך לשליחה
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 520px", gap: "24px", padding: "28px 40px 40px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "0px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "20px 22px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                לקוחה
              </label>
              <span style={{ fontSize: "14.5px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                נועה כהן
              </span>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                מולא מהליד
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                תבנית
              </label>
              <span style={{ fontSize: "14.5px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                אירוח עסקי ▾
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700" }}>
                תוקף
              </label>
              <span style={{ fontSize: "14.5px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                14 יום · עד 15.10.2026
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "16px 22px 12px" }}>
              <b style={{ fontSize: "16px", flex: "1 1 0%" }}>
                שירותים
              </b>
              <span style={{ fontSize: "13.5px", fontWeight: "700" }}>
                + הוסף שירות
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 90px 120px 120px 32px", gap: "12px", padding: "9px 22px", background: "var(--f-bg)", fontSize: "12.5px", color: "var(--f-muted)" }}>
              <span>
                שירות
              </span>
              <span>
                כמות
              </span>
              <span>
                מחיר ליחידה
              </span>
              <span>
                סה״כ
              </span>
              <span></span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 90px 120px 120px 32px", gap: "12px", padding: "12px 22px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14.5px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b>
                  תפריט אירוח עסקי
                </b>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  מחיר מתוך תפריט UMINO, 28.9.2026
                </span>
              </div>
              <span style={{ padding: "8px 10px", borderRadius: "8px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset", fontVariantNumeric: "tabular-nums" }}>
                35
              </span>
              <span style={{ padding: "8px 10px", borderRadius: "8px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset", fontVariantNumeric: "tabular-nums" }}>
                186.44 ₪
              </span>
              <b style={{ fontVariantNumeric: "tabular-nums" }}>
                6,525.42 ₪
              </b>
              <Icon name="x" size={15} label="הסר" style={{ opacity: "0.5" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 90px 120px 120px 32px", gap: "12px", padding: "12px 22px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14.5px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b>
                  שתייה קלה ללא הגבלה
                </b>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  מחיר מתוך תפריט UMINO
                </span>
              </div>
              <span style={{ padding: "8px 10px", borderRadius: "8px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset", fontVariantNumeric: "tabular-nums" }}>
                35
              </span>
              <span style={{ padding: "8px 10px", borderRadius: "8px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset", fontVariantNumeric: "tabular-nums" }}>
                25.42 ₪
              </span>
              <b style={{ fontVariantNumeric: "tabular-nums" }}>
                889.70 ₪
              </b>
              <Icon name="x" size={15} label="הסר" style={{ opacity: "0.5" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 90px 120px 120px 32px", gap: "12px", padding: "12px 22px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14.5px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b>
                  חדר פנימי
                </b>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  בכפוף לזמינות · ללא תוספת
                </span>
              </div>
              <span style={{ padding: "8px 10px", borderRadius: "8px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                1
              </span>
              <span style={{ padding: "8px 10px", borderRadius: "8px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                0 ₪
              </span>
              <b>
                0 ₪
              </b>
              <Icon name="x" size={15} label="הסר" style={{ opacity: "0.5" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", padding: "16px 22px", borderTop: "1px solid var(--f-surface-2)", alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", fontWeight: "700" }}>
                  תנאי תשלום והערות
                </label>
                <span style={{ fontSize: "14px", padding: "11px 14px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset", lineHeight: "1.5", height: "72px" }}>
                  30% מקדמה באישור, יתרה ביום האירוע. החדר הפנימי בכפוף לזמינות.
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "14px 16px", borderRadius: "14px", background: "var(--f-bg)", fontSize: "14px", fontVariantNumeric: "tabular-nums" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>
                    לפני מע״מ
                  </span>
                  <span>
                    7,415.12 ₪
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>
                    הנחה
                  </span>
                  <span>
                    —
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>
                    מע״מ 18%
                  </span>
                  <span>
                    1,334.72 ₪
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--f-border)", fontSize: "17px", fontWeight: "800" }}>
                  <span>
                    סה״כ
                  </span>
                  <span>
                    8,750 ₪
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  מחושב אוטומטית · מעוגל לשקל
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: "15px" }}>
              תצוגה מקדימה
            </b>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              כך תיראה ההצעה ב־PDF
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "6px", boxShadow: "var(--f-border) 0px 0px 0px 1px, rgba(22, 29, 46, 0.45) 0px 24px 48px -28px", padding: "36px 34px", display: "flex", flexDirection: "column", gap: "16px", aspectRatio: "1 / 1.3" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <b style={{ fontSize: "22px" }}>
                  הצעת מחיר
                </b>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  מס׳ 2026-014 · 1.10.2026 · בתוקף עד 15.10.2026
                </span>
              </div>
              <span style={{ width: "56px", height: "56px", borderRadius: "12px", background: "#1f1b17", color: "#f4ede1", fontSize: "10px", fontWeight: "800", letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center" }}>
                UMINO
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "12.5px" }}>
              <span style={{ color: "var(--f-muted)" }}>
                לכבוד
              </span>
              <b style={{ fontSize: "14px" }}>
                נועה כהן
              </b>
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: "12px", borderTop: "1.5px solid #161d2e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0px", borderBottom: "1px solid var(--f-surface-2)" }}>
                <span>
                  תפריט אירוח עסקי × 35
                </span>
                <span>
                  6,525.42 ₪
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0px", borderBottom: "1px solid var(--f-surface-2)" }}>
                <span>
                  שתייה קלה ללא הגבלה × 35
                </span>
                <span>
                  889.70 ₪
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0px", borderBottom: "1px solid var(--f-surface-2)" }}>
                <span>
                  חדר פנימי
                </span>
                <span>
                  0 ₪
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0px", fontWeight: "800", fontSize: "14px" }}>
                <span>
                  סה״כ כולל מע״מ
                </span>
                <span>
                  8,750 ₪
                </span>
              </div>
            </div>
            <span style={{ fontSize: "11.5px", color: "var(--f-ink-soft)", lineHeight: "1.55" }}>
              30% מקדמה באישור, יתרה ביום האירוע. החדר הפנימי בכפוף לזמינות.
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <b style={{ fontSize: "14px" }}>
              גרסאות
            </b>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
              <span>
                <b>
                  גרסה 1
                </b>
                {" · טיוטה · דנה · היום"}
              </span>
              <span style={{ color: "var(--f-muted)" }}>
                נוכחית
              </span>
            </div>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              אחרי שליחה הגרסה ננעלת. שינוי יוצר גרסה 2, והקודמת נשמרת.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
