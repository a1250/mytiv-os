/**
 * F1 — לידים · רשימה
 * Generated from the Claude Design handoff (F1) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenF1() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              מכירות › לידים
            </span>
            <h2 style={{ margin: "0px", fontSize: "32px", fontWeight: "800" }}>
              לידים
            </h2>
            <span style={{ fontSize: "17px" }}>
              2 לידים חדשים השבוע. לאחד אין פעולה הבאה.
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            גילוי לידים
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            + ליד חדש
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", padding: "8px 14px", borderRadius: "999px", background: "#161d2e", color: "#ffffff" }}>
            <span className="sc-interp">
              הכול 9
            </span>
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            <span className="sc-interp">
              חדש 2
            </span>
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            <span className="sc-interp">
              בטיפול 3
            </span>
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            <span className="sc-interp">
              ממתין לתגובה 1
            </span>
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            <span className="sc-interp">
              פגישה 1
            </span>
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            <span className="sc-interp">
              הצעה נשלחה 1
            </span>
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            <span className="sc-interp">
              זכה 1
            </span>
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            <span className="sc-interp">
              ללא פעולה הבאה 1
            </span>
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            מיון: הפעולה הבאה ▾
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.4fr) 130px 120px 110px 90px minmax(0px, 1.3fr) 110px 120px", gap: "14px", padding: "11px 20px", background: "var(--f-bg)", fontSize: "12.5px", color: "var(--f-muted)" }}>
            <span>
              שם וחברה
            </span>
            <span>
              מקור
            </span>
            <span>
              שלב
            </span>
            <span>
              שווי משוער
            </span>
            <span>
              אחראי
            </span>
            <span>
              הפעולה הבאה
            </span>
            <span>
              קשר אחרון
            </span>
            <span>
              איכות מידע
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.4fr) 130px 120px 110px 90px minmax(0px, 1.3fr) 110px 120px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  נועה כהן
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  אירוע חברה ל־35 משתתפים
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                טופס באתר UMINO
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                פגישה
              </span>
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              <span className="sc-interp">
                ≈ 9,000 ₪
              </span>
            </span>
            <span>
              <span className="sc-interp">
                דנה
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                שלח הצעה עד 4.10
              </span>
            </span>
            <span style={{ color: "var(--f-muted)" }}>
              <span className="sc-interp">
                היום 10:00
              </span>
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓ מלא
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.4fr) 130px 120px 110px 90px minmax(0px, 1.3fr) 110px 120px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  אבי לוי
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  {"סטודיו פילאטיס \"קו\""}
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                הפניה מגל פילאטיס
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                חדש
              </span>
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <span>
              <span className="sc-interp">
                רון
              </span>
            </span>
            <span style={{ color: "var(--f-red-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ללא פעולה הבאה
              </span>
            </span>
            <span style={{ color: "var(--f-muted)" }}>
              <span className="sc-interp">
                29.9
              </span>
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-amber-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ◑ חסר טלפון
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.4fr) 130px 120px 110px 90px minmax(0px, 1.3fr) 110px 120px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  מיכל ברק
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  {"בית קפה \"שלוש\""}
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                LinkedIn
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                בטיפול
              </span>
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              <span className="sc-interp">
                ≈ 4,500 ₪
              </span>
            </span>
            <span>
              <span className="sc-interp">
                דנה
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                שיחת המשך 5.10
              </span>
            </span>
            <span style={{ color: "var(--f-muted)" }}>
              <span className="sc-interp">
                27.9
              </span>
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓ מלא
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.4fr) 130px 120px 110px 90px minmax(0px, 1.3fr) 110px 120px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  יוסי אדלר
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  רשת חנויות יין
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                גילוי לידים
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                חדש
              </span>
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <span>
              <span className="sc-interp">
                דנה
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                אמת איש קשר
              </span>
            </span>
            <span style={{ color: "var(--f-muted)" }}>
              <span className="sc-interp">
                טרם
              </span>
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ○ לא מאומת
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.4fr) 130px 120px 110px 90px minmax(0px, 1.3fr) 110px 120px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  רותם שגיא
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  {"מספרה \"רותם\""}
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                אינסטגרם
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                ממתין לתגובה
              </span>
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              <span className="sc-interp">
                ≈ 2,800 ₪
              </span>
            </span>
            <span>
              <span className="sc-interp">
                יואב
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                תזכורת 3.10
              </span>
            </span>
            <span style={{ color: "var(--f-muted)" }}>
              <span className="sc-interp">
                24.9
              </span>
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓ מלא
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1.4fr) 130px 120px 110px 90px minmax(0px, 1.3fr) 110px 120px", gap: "14px", padding: "13px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  דניאל אור
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  משרד אדריכלים
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                כנס
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                הצעה נשלחה
              </span>
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              <span className="sc-interp">
                6,200 ₪
              </span>
            </span>
            <span>
              <span className="sc-interp">
                רון
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                מעקב 6.10
              </span>
            </span>
            <span style={{ color: "var(--f-muted)" }}>
              <span className="sc-interp">
                22.9
              </span>
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓ מלא
              </span>
            </span>
          </div>
        </div>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          {"\"שווי משוער\" הוא הערכה של האחראי, לא סכום הצעה. סכום מוצג רק אחרי שנוצרה הצעה."}
        </span>
      </div>
    </div>
  );
}
