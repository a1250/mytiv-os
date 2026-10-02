/**
 * G1 — דוחות › יעדים וביצועים · מגירת מקור הנתון · זרימה 8
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (G1) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenG1() {
  return (
    <div className="f-screen" style={{ minHeight: "940px", background: "var(--f-bg)", display: "flex", flexDirection: "column", position: "relative", width: "100%" }}>
      <div style={{ padding: "28px 40px", display: "flex", flexDirection: "column", gap: "18px", width: "960px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              דוחות ובקרה › יעדים וביצועים
            </span>
            <h2 style={{ margin: "0px", fontSize: "30px", fontWeight: "800" }}>
              UMINO · ספטמבר 2026
            </h2>
            <span style={{ fontSize: "16px" }}>
              2 מדדים מעל היעד, אחד מוערך ואחד לא זמין.
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            ספטמבר ▾
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            ייצוא
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 90px 130px 90px 170px", gap: "14px", padding: "11px 20px", background: "var(--f-bg)", fontSize: "12.5px", color: "var(--f-muted)" }}>
            <span>
              מדד
            </span>
            <span>
              יעד
            </span>
            <span>
              ביצוע
            </span>
            <span>
              שינוי
            </span>
            <span>
              מקור ואימות
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 90px 130px 90px 170px", gap: "14px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14.5px", background: "var(--f-accent-tint)", boxShadow: "var(--f-accent) 3px 0px 0px inset" }}>
            <b>
              הזמנות 19:00–22:00 בימי חמישי
            </b>
            <span>
              120
            </span>
            <span>
              <b>
                ≈ 96
              </b>
              {" "}
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)" }}>
                מוערך
              </span>
            </span>
            <span>
              +14
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>
              מערכת ההזמנות · ◑
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 90px 130px 90px 170px", gap: "14px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14.5px" }}>
            <b>
              לידים לאירועים
            </b>
            <span>
              4
            </span>
            <span>
              <b>
                5
              </b>
              {" "}
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                ידוע
              </span>
            </span>
            <span style={{ color: "var(--f-green-text)" }}>
              +2
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>
              מכירות · ✓
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 90px 130px 90px 170px", gap: "14px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14.5px" }}>
            <b>
              תכנים שפורסמו
            </b>
            <span>
              12
            </span>
            <span>
              <b>
                14
              </b>
              {" "}
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                ידוע
              </span>
            </span>
            <span style={{ color: "var(--f-green-text)" }}>
              +3
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>
              סטודיו · ✓
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 90px 130px 90px 170px", gap: "14px", padding: "14px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14.5px" }}>
            <b>
              חשיפות Instagram
            </b>
            <span>
              20,000
            </span>
            <span>
              <b style={{ color: "var(--f-neutral-text)" }}>
                —
              </b>
              {" "}
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-neutral-text)" }}>
                לא זמין
              </span>
            </span>
            <span style={{ color: "var(--f-neutral-text)" }}>
              —
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>
              Instagram · ⊘ תקלה
            </span>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b style={{ fontSize: "15px" }}>
              הזמנות בימי חמישי · 19:00–22:00
            </b>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              4 ימי חמישי בספטמבר
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "28px", height: "150px", padding: "0px 20px", borderBottom: "1px solid var(--f-border)" }}>
            <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <b style={{ fontSize: "13px" }}>
                22
              </b>
              <span style={{ width: "100%", height: "88px", borderRadius: "8px 8px 0px 0px", background: "var(--f-accent)" }}></span>
            </div>
            <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <b style={{ fontSize: "13px" }}>
                25
              </b>
              <span style={{ width: "100%", height: "100px", borderRadius: "8px 8px 0px 0px", background: "var(--f-accent)" }}></span>
            </div>
            <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <b style={{ fontSize: "13px" }}>
                25
              </b>
              <span style={{ width: "100%", height: "100px", borderRadius: "8px 8px 0px 0px", background: "var(--f-accent)" }}></span>
            </div>
            <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <b style={{ fontSize: "13px", color: "var(--f-amber-text)" }}>
                ≈ 24
              </b>
              <span style={{ width: "100%", height: "96px", borderRadius: "8px 8px 0px 0px", background: "repeating-linear-gradient(135deg, var(--f-accent-soft-2) 0px, var(--f-accent-soft-2) 6px, var(--f-accent-weak) 6px, var(--f-accent-weak) 12px)", boxShadow: "#8c5a00 0px 0px 0px 2px inset" }}></span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "28px", padding: "0px 20px", fontSize: "12.5px", color: "var(--f-muted)" }}>
            <span style={{ flex: "1 1 0%", textAlign: "center" }}>
              3.9
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center" }}>
              10.9
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center" }}>
              17.9
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center", color: "var(--f-amber-text)", fontWeight: "700" }}>
              24.9 · מוערך
            </span>
          </div>
          <span style={{ fontSize: "13px", color: "var(--f-ink-soft)" }}>
            {"בטבלה: 22, 25, 25 הזמנות בשלושה ימים ידועים. יום אחד הושלם לפי ממוצע, ולכן הסכום מסומן \"מוערך\"."}
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", top: "68px", bottom: "0px", insetInlineEnd: "0px", width: "440px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px, rgba(22, 29, 46, 0.45) -24px 0px 48px -28px", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--f-surface-2)" }}>
          <b style={{ fontSize: "18px" }}>
            מקור הנתון
          </b>
          <span style={{ width: "40px", height: "40px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={16} label="סגירה" style={{ opacity: "0.7" }} />
          </span>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: "1 1 0%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
              הזמנות 19:00–22:00 בימי חמישי · ספטמבר
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <b style={{ fontSize: "40px" }}>
                ≈ 96
              </b>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "4px 10px", borderRadius: "6px" }}>
                ≈ מוערך
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--f-amber-text)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", padding: "4px 10px", borderRadius: "6px" }}>
                ◑ אומת חלקית
              </span>
            </div>
          </div>
          <div style={{ borderRadius: "14px", boxShadow: "var(--f-border) 0px 0px 0px 1px", fontSize: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", padding: "11px 14px", borderBottom: "1px solid var(--f-surface-2)" }}>
              <span style={{ color: "var(--f-muted)" }}>
                מקור
              </span>
              <span>
                מערכת ההזמנות של UMINO · ייצוא קובץ
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", padding: "11px 14px", borderBottom: "1px solid var(--f-surface-2)" }}>
              <span style={{ color: "var(--f-muted)" }}>
                עודכן
              </span>
              <span>
                30.9.2026, 09:12 · ידנית ע״י דנה
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", padding: "11px 14px", borderBottom: "1px solid var(--f-surface-2)" }}>
              <span style={{ color: "var(--f-muted)" }}>
                חישוב
              </span>
              <span>
                הזמנות שנפתחו בין 19:00 ל־22:00, בארבעה ימי חמישי
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "10px", padding: "11px 14px" }}>
              <span style={{ color: "var(--f-muted)" }}>
                מה חסר
              </span>
              <span>
                חמישי 24.9 לא נכלל בקובץ. הושלם לפי ממוצע שלושת הימים האחרים.
              </span>
            </div>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--f-amber-bg)", color: "var(--f-amber-ink-strong)", fontSize: "13.5px", lineHeight: "1.55" }}>
            בגלל היום החסר הערך מוערך ולא ידוע. הוא לא נכנס לסיכום הרבעוני כנתון סופי.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <b style={{ fontSize: "14px" }}>
              היכן הנתון בשימוש
            </b>
            <span style={{ fontSize: "13.5px" }}>
              סקירה שבועית 39 · קמפיין ערבי סושי · היום שלי
            </span>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--f-surface-2)", display: "flex", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            בקש נתון מהלקוח
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            פתח את הקובץ
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            היסטוריה
          </span>
        </div>
      </div>
    </div>
  );
}
