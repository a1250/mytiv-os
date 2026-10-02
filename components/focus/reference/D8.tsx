/**
 * D8 — היום שלי · מנהלת · נתונים חלקיים ותקלה · מצבי קצה והרשאות
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (D8) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenD8() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
            יום חמישי, 1 באוקטובר 2026
          </span>
          <h2 style={{ margin: "0px", fontSize: "34px", fontWeight: "800" }}>
            בוקר טוב, דנה
          </h2>
          <span style={{ fontSize: "18px" }}>
            אין כרגע משהו דחוף. 2 פריטים להיום, ואחד ממתין לרון.
          </span>
        </div>
        <div style={{ display: "flex", gap: "14px", alignItems: "center", padding: "14px 18px", borderRadius: "14px", background: "var(--f-amber-bg)", color: "var(--f-amber-ink-strong)" }}>
          <b style={{ fontSize: "17px" }}>
            ◑
          </b>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "2px" }}>
            <b style={{ fontSize: "15px" }}>
              התקבלה רק חלק מהמשימות מ־ClickUp.
            </b>
            <span style={{ fontSize: "13.5px" }}>
              {"\"מה תקוע\" ומספר המשימות באיחור מוסתרים עד שהקריאה תושלם, כדי לא להציג מספר חסר."}
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 18px", borderRadius: "999px", background: "var(--f-surface)" }}>
            נסה לטעון הכול
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0px, 1fr)) 340px", gap: "16px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <b style={{ fontSize: "16px" }}>
                עכשיו
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                0
              </span>
            </div>
            <div style={{ borderRadius: "14px", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "6px", border: "1.5px dashed var(--f-line-strong)", alignItems: "flex-start" }}>
              <b style={{ fontSize: "15px" }}>
                ✓ אין פריטים דחופים
              </b>
              <span style={{ fontSize: "13.5px", color: "var(--f-muted)", lineHeight: "1.5" }}>
                מה שנכנס עד 12:00 או עם יעד היום יופיע כאן.
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "999px" }}>
                  ↺ נדרש תיקון
                </span>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  20 דק׳
                </span>
              </div>
              <b style={{ fontSize: "15px" }}>
                {"תקני את סטורי \"ערבי סושי\""}
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                רון ביקש 2 תיקונים · מתוזמן מחר
              </span>
              <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff", textAlign: "center" }}>
                פתח בעורך
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-red-ink)", background: "var(--f-red-bg)", padding: "3px 9px", borderRadius: "6px" }}>
                  ■ חסום
                </span>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  12 ימים
                </span>
              </div>
              <b style={{ fontSize: "15px" }}>
                צילום מנת הספיישל
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                UMINO · ללא אחראי
              </span>
              <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", textAlign: "center" }}>
                הקצה לי
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <b style={{ fontSize: "16px" }}>
                ממתין לאחרים
              </b>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                1
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "3px 9px", borderRadius: "999px" }}>
                  ◆ סיכון בינוני
                </span>
                <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                  3 ימים
                </span>
              </div>
              <b style={{ fontSize: "15px" }}>
                מבצע 1+1 לקמפיין יום חמישי
              </b>
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: "var(--f-neutral-bg)", color: "#2f3748", fontSize: "13px", lineHeight: "1.5" }}>
                שינוי מחיר דורש אישור בעלים. ההחלטה אצל רון.
              </div>
              <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px", borderRadius: "999px", background: "var(--f-surface-2)", textAlign: "center" }}>
                שלח תזכורת לרון
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  משימות באיחור
                </span>
                <b style={{ fontSize: "24px", color: "var(--f-neutral-text)" }}>
                  —
                </b>
                <span style={{ fontSize: "11.5px", color: "var(--f-amber-text)", fontWeight: "700" }}>
                  ◑ קריאה חלקית
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
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
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  חשיפות Instagram
                </span>
                <b style={{ fontSize: "24px", color: "var(--f-neutral-text)" }}>
                  —
                </b>
                <span style={{ fontSize: "11.5px", color: "var(--f-neutral-text)", fontWeight: "700" }}>
                  ⊘ לא זמין · מ־27.9
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  לידים חדשים
                </span>
                <b style={{ fontSize: "24px" }}>
                  2
                </b>
                <span style={{ fontSize: "11.5px", color: "var(--f-muted)" }}>
                  מכירות · 08:02
                </span>
              </div>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: "14px", background: "var(--f-neutral-bg)", color: "#2f3748", display: "flex", flexDirection: "column", gap: "6px" }}>
              <b style={{ fontSize: "14px" }}>
                ⊘ Instagram לא מחובר
              </b>
              <span style={{ fontSize: "13px", lineHeight: "1.5" }}>
                רק בעלים יכול לחבר מחדש. ביקשת מרון אתמול.
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>
                פרטי התקלה
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <b style={{ fontSize: "15px" }}>
              צופה · איך המסך נראה לרואת החשבון
            </b>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 14px", borderRadius: "12px", background: "var(--f-neutral-bg)", color: "#2f3748", fontSize: "14px" }}>
              <b>
                צפייה בלבד
              </b>
              <span>
                אפשר לראות ולייצא דוחות.
              </span>
            </div>
            <span style={{ fontSize: "13.5px", lineHeight: "1.55", color: "var(--f-ink-soft)" }}>
              {"אין עמודות \"עכשיו\" ו\"היום\". מוצגים רק מדדים, פרויקטים ודוחות, בלי כפתורי פעולה."}
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <b style={{ fontSize: "15px" }}>
              כשהכול טופל
            </b>
            <span style={{ fontSize: "20px", fontWeight: "800" }}>
              טיפלת בכל 6 הפריטים של היום.
            </span>
            <span style={{ fontSize: "13.5px", color: "var(--f-muted)" }}>
              הבא בתור: פגישת צוות ב־13:30. אין פריטים חדשים מאז 08:14.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
