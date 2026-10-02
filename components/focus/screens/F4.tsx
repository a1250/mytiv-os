/**
 * F4 — פניות יזומות · טיוטה ובדיקת עובדות
 * Generated from the Claude Design handoff (F4) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenF4() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "28px 40px 40px", display: "grid", gridTemplateColumns: "320px minmax(0px, 1fr) 340px", gap: "24px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            מכירות › פניות יזומות › חדשה
          </span>
          <b style={{ fontSize: "24px" }}>
            פנייה חדשה
          </b>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13.5px", fontWeight: "700" }}>
                למי
              </label>
              <span style={{ fontSize: "14px", padding: "10px 12px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                {"מיכל ברק · בית קפה \"שלוש\""}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13.5px", fontWeight: "700" }}>
                מטרת הפנייה
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "13px", padding: "7px 11px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  מייל ראשוני
                </span>
                <span style={{ fontSize: "13px", fontWeight: "700", padding: "7px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                  הודעת המשך
                </span>
                <span style={{ fontSize: "13px", padding: "7px 11px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  LinkedIn
                </span>
                <span style={{ fontSize: "13px", padding: "7px 11px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  שיתוף פעולה
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "13.5px", fontWeight: "700" }}>
                טון
              </label>
              <div style={{ display: "flex", gap: "4px", padding: "3px", borderRadius: "999px", background: "var(--f-surface-2)", fontSize: "13px" }}>
                <span style={{ flex: "1 1 0%", textAlign: "center", padding: "7px 0px" }}>
                  רשמי
                </span>
                <span style={{ flex: "1 1 0%", textAlign: "center", padding: "7px 0px", borderRadius: "999px", background: "var(--f-surface)", fontWeight: "700", boxShadow: "rgba(22, 29, 46, 0.12) 0px 1px 2px" }}>
                  חם
                </span>
                <span style={{ flex: "1 1 0%", textAlign: "center", padding: "7px 0px" }}>
                  קליל
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "var(--f-muted)", padding: "0px 4px" }}>
            <span>
              1 · ליד ומטרה ✓
            </span>
            <span>
              2 · טון ✓
            </span>
            <span style={{ color: "var(--f-accent-ink)", fontWeight: "700" }}>
              3 · טיוטה ועריכה
            </span>
            <span>
              4 · בדיקת פרטים
            </span>
            <span>
              5 · שמירה והעברה לדואר
            </span>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "18px 22px 14px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--f-surface-2)" }}>
            <b style={{ fontSize: "16px", flex: "1 1 0%" }}>
              טיוטה
            </b>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-accent-ink)", boxShadow: "var(--f-accent-ink) 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "999px" }}>
              ✦ נוסח בעזרת AI · ניתן לעריכה מלאה
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              נסח מחדש
            </span>
          </div>
          <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: "10px", alignItems: "center", fontSize: "14px" }}>
              <span style={{ color: "var(--f-muted)" }}>
                אל
              </span>
              <bdi style={{ textAlign: "right" }} dir="ltr">
                michal@example.co.il
              </bdi>
              <span style={{ color: "var(--f-muted)" }}>
                נושא
              </span>
              <span style={{ padding: "9px 12px", borderRadius: "10px", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px inset" }}>
                המשך לשיחה שלנו על התוכן לסתיו
              </span>
            </div>
            <div style={{ padding: "16px 18px", borderRadius: "12px", boxShadow: "var(--f-accent) 0px 0px 0px 2px inset", fontSize: "15px", lineHeight: "1.75", minHeight: "260px" }}>
              היי מיכל,
              <br />
              <br />
              {"תודה על השיחה בשבוע שעבר. כמו שסיכמנו, צירפתי "}
              <mark style={{ background: "var(--f-amber-bg)", color: "var(--f-amber-ink-strong)", padding: "0px 2px" }}>
                שלוש דוגמאות לעבודות שעשינו לבתי קפה
              </mark>
              .
              <br />
              <br />
              אשמח לקבוע שיחה קצרה ב
              <mark style={{ background: "var(--f-red-bg)", color: "#6a1d17", padding: "0px 2px" }}>
                יום ראשון, 5.10
              </mark>
              , כדי לדבר על תוכנית התוכן לסתיו.
              <br />
              <br />
              דנה, Mytiv|
            </div>
          </div>
          <div style={{ padding: "14px 22px", borderTop: "1px solid var(--f-surface-2)", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
              צור טיוטה ב־Gmail
            </span>
            <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              שמור כטיוטה כאן
            </span>
            <span style={{ flex: "1 1 0%" }}></span>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              שום דבר לא נשלח. השליחה נעשית מ־Gmail.
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <b style={{ fontSize: "15px" }}>
              פרטים לבדיקה · 2
            </b>
            <div style={{ padding: "12px 14px", borderRadius: "12px", background: "var(--f-amber-bg)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <b style={{ fontSize: "13px", color: "var(--f-amber-strong-text)" }}>
                {"◆ \"שלוש דוגמאות לבתי קפה\""}
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-amber-strong-text)", lineHeight: "1.5" }}>
                לא נמצאו בתיק העבודות. לצרף, לשנות או למחוק?
              </span>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: "12px", background: "var(--f-red-bg)", display: "flex", flexDirection: "column", gap: "4px" }}>
              <b style={{ fontSize: "13px", color: "#7f1f19" }}>
                {"▲ \"יום ראשון, 5.10\""}
              </b>
              <span style={{ fontSize: "13px", color: "#6a1d17", lineHeight: "1.5" }}>
                {"5.10.2026 הוא יום שני. לתקן ל\"יום שני\" או לשנות תאריך?"}
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <b style={{ fontSize: "15px" }}>
              על מה הטיוטה הסתמכה
            </b>
            <span style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
              · הערת שיחה של דנה מ־27.9
            </span>
            <span style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
              · פרטי הליד: בית קפה, צורך בתוכן עונתי
            </span>
            <span style={{ fontSize: "13.5px", lineHeight: "1.5", color: "var(--f-muted)" }}>
              לא נעשה שימוש במחירים או בהבטחות לתוצאות.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
