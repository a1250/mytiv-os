/**
 * F6 — דואר · שיחה וטיוטת תשובה
 * Generated from the Claude Design handoff (F6) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenF6() {
  return (
    <div className="f-screen" style={{ minHeight: "900px", background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ flex: "1 1 0%", display: "grid", gridTemplateColumns: "360px minmax(0px, 1fr) 320px", minHeight: "0px" }}>
        <div style={{ background: "var(--f-surface)", borderInlineEnd: "1px solid var(--f-border)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 18px 12px", display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid var(--f-surface-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <b style={{ fontSize: "20px", flex: "1 1 0%" }}>
                דואר
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                Gmail · לפני 2 דק׳
              </span>
            </div>
            <span style={{ fontSize: "14px", padding: "10px 14px", borderRadius: "999px", background: "var(--f-surface-2)", color: "var(--f-muted)" }}>
              חיפוש בדואר
            </span>
            <div style={{ display: "flex", gap: "6px", fontSize: "12.5px" }}>
              <span style={{ fontWeight: "700", padding: "6px 11px", borderRadius: "999px", background: "#161d2e", color: "#ffffff" }}>
                לא נקרא 3
              </span>
              <span style={{ padding: "6px 11px", borderRadius: "999px", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
                משויך ללקוח
              </span>
              <span style={{ padding: "6px 11px", borderRadius: "999px", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
                לידים
              </span>
            </div>
          </div>
          <div style={{ padding: "12px 18px", background: "var(--f-accent-weak)", display: "flex", flexDirection: "column", gap: "3px", borderInlineStart: "3px solid var(--f-accent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "14px" }}>
                נועה כהן
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                08:41
              </span>
            </div>
            <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
              שאלה על המחיר לפני השיחה
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              ליד · אירוע חברה ל־35
            </span>
          </div>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "14px" }}>
                שף UMINO
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                אתמול
              </span>
            </div>
            <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
              שעות פתיחה בחג
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              UMINO · תפריט סתיו
            </span>
          </div>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b style={{ fontSize: "14px" }}>
                גל פילאטיס
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                29.9
              </span>
            </div>
            <span style={{ fontSize: "13.5px", fontWeight: "600" }}>
              החומרים לאתר בדרך
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              גל פילאטיס · אתר
            </span>
          </div>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px" }}>
                ניוזלטר ספק
              </span>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                28.9
              </span>
            </div>
            <span style={{ fontSize: "13.5px", color: "var(--f-muted)" }}>
              עדכון מחירון
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              {"לא משויך · "}
              <a href="#">
                שייך
              </a>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: "0px" }}>
          <div style={{ padding: "20px 26px 14px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)", display: "flex", flexDirection: "column", gap: "6px" }}>
            <b style={{ fontSize: "20px" }}>
              שאלה על המחיר לפני השיחה
            </b>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              {"נועה כהן · "}
              <bdi dir="ltr">
                noa.cohen@example.co.il
              </bdi>
              {" · אליך · היום 08:41"}
            </span>
          </div>
          <div style={{ flex: "1 1 0%", padding: "20px 26px", display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", fontSize: "15px", lineHeight: "1.7" }}>
              היי דנה,
              <br />
              לפני השיחה ב־10:00, אפשר לקבל מושג על מחיר לאדם? ויש אפשרות לתפריט צמחוני לחלק מהמשתתפים?
              <br />
              תודה, נועה
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-accent) 0px 0px 0px 2px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", display: "flex", gap: "8px", alignItems: "center", borderBottom: "1px solid var(--f-surface-2)" }}>
                <b style={{ fontSize: "14px", flex: "1 1 0%" }}>
                  טיוטת תשובה
                </b>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-accent-ink)", boxShadow: "var(--f-accent-ink) 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "999px" }}>
                  ✦ טיוטה של AI · לא נשלחה
                </span>
              </div>
              <div style={{ padding: "16px 18px", fontSize: "15px", lineHeight: "1.7" }}>
                היי נועה,
                <br />
                {"תודה על השאלה. תפריט האירוח העסקי עולה "}
                <mark style={{ background: "var(--f-green-bg)", color: "#185436", padding: "0px 2px" }}>
                  250 ₪ לאדם כולל מע״מ
                </mark>
                {", כולל שתייה קלה. "}
                <mark style={{ background: "var(--f-amber-bg)", color: "var(--f-amber-ink-strong)", padding: "0px 2px" }}>
                  יש אפשרות לגרסה צמחונית
                </mark>
                . נעבור על הכול בשיחה ב־10:00.
                <br />
                דנה|
              </div>
              <div style={{ padding: "12px 18px", borderTop: "1px solid var(--f-surface-2)", display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
                  פתח ב־Gmail לשליחה
                </span>
                <span style={{ fontSize: "14px", fontWeight: "600", padding: "10px 14px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  נסח מחדש
                </span>
                <span style={{ flex: "1 1 0%" }}></span>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  אין שליחה אוטומטית
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderInlineStart: "1px solid var(--f-border)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <b style={{ fontSize: "15px" }}>
            הקשר עסקי
          </b>
          <div style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--f-bg)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <b style={{ fontSize: "14px" }}>
              נועה כהן · ליד
            </b>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              שלב: פגישה · היום 10:00 · אחראית: דנה
            </span>
            <a style={{ fontSize: "13px", fontWeight: "700" }} href="#">
              פתח ליד
            </a>
          </div>
          <b style={{ fontSize: "14px" }}>
            על מה הטיוטה הסתמכה
          </b>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ color: "var(--f-green-text)", fontWeight: "700" }}>
                ✓ 250 ₪ לאדם
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                טיוטת ההצעה: 8,750 ₪ ל־35 משתתפים
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ color: "var(--f-amber-text)", fontWeight: "700" }}>
                {"◆ \"גרסה צמחונית\""}
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                לא נמצא בתפריט UMINO. כדאי לאמת מול השף.
              </span>
            </div>
          </div>
          <div style={{ marginTop: "auto", padding: "12px 14px", borderRadius: "14px", background: "var(--f-neutral-bg)", color: "#2f3748", fontSize: "13px", lineHeight: "1.5" }}>
            הטיוטה מבוססת על נתונים מהמערכת. לפני שליחה כדאי לבדוק את הפרטים המסומנים.
          </div>
        </div>
      </div>
    </div>
  );
}
