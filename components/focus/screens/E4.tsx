/**
 * E4 — יצירה · שלב 4: כיוונים · כולל מצב "מעבד"
 * Generated from the Claude Design handoff (E4) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenE4() {
  return (
    <div className="f-screen f-focusmode" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ height: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "14px", padding: "0px 28px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "10px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          ✕ סגור
        </span>
        <b style={{ fontSize: "17px" }}>
          ערבי סושי של חמישי
        </b>
        <div style={{ display: "flex", gap: "4px", fontSize: "13px" }}>
          <span style={{ padding: "6px 11px", color: "var(--f-green-text)", fontWeight: "700" }}>
            ✓ מטרה
          </span>
          <span style={{ padding: "6px 11px", color: "var(--f-green-text)", fontWeight: "700" }}>
            ✓ פורמט
          </span>
          <span style={{ padding: "6px 11px", color: "var(--f-green-text)", fontWeight: "700" }}>
            ✓ בריף
          </span>
          <span style={{ padding: "6px 11px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", fontWeight: "700" }}>
            4 כיוונים
          </span>
          <span style={{ padding: "6px 11px", color: "var(--f-muted)" }}>
            5 עריכה
          </span>
        </div>
        <span style={{ flex: "1 1 0%" }}></span>
      </div>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "4px" }}>
            <b style={{ fontSize: "24px" }}>
              שלושה כיוונים
            </b>
            <span style={{ fontSize: "15px", color: "var(--f-ink-soft)" }}>
              כל כיוון שונה בגישה, לא רק בצבע. בוחרים אחד וממשיכים לעריכה, או מבקשים גרסה דומה.
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            ערוך בריף
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "20px", overflow: "hidden", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "330px", background: "var(--f-surface-2)", display: "flex", gap: "14px", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "140px", height: "250px", borderRadius: "8px", background: "#c4462e", color: "#ffffff", padding: "18px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "20px", fontWeight: "800", lineHeight: "1.05" }}>
                  חמישי. 19:00. שולחן מחכה.
                </span>
                <span style={{ marginTop: "auto", height: "70px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.18)" }}></span>
                <span style={{ alignSelf: "flex-start", fontSize: "9px", fontWeight: "800", padding: "4px 8px", borderRadius: "999px", background: "var(--f-surface)", color: "#c4462e" }}>
                  הזמינו שולחן
                </span>
              </div>
              <div style={{ width: "160px", height: "200px", borderRadius: "8px", background: "#c4462e", color: "#ffffff", padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "17px", fontWeight: "800", lineHeight: "1.05" }}>
                  חמישי. 19:00. שולחן מחכה.
                </span>
                <span style={{ marginTop: "auto", height: "60px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.18)" }}></span>
              </div>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "16px" }}>
                  ישיר ומכירתי
                </b>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-accent-ink)", boxShadow: "var(--f-accent-ink) 0px 0px 0px 1px inset", padding: "2px 8px", borderRadius: "999px" }}>
                  ✦ קונספט AI
                </span>
              </div>
              <span style={{ fontSize: "13.5px", color: "var(--f-ink-soft)", lineHeight: "1.5" }}>
                הסתמך על: מטרת הקמפיין, CTA, שעות מאומתות.
              </span>
              <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                <span style={{ flex: "1 1 0%", fontSize: "14px", fontWeight: "700", padding: "12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", textAlign: "center" }}>
                  בחר וערוך
                </span>
                <span style={{ fontSize: "14px", fontWeight: "600", padding: "12px 14px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  גרסה דומה
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "20px", overflow: "hidden", boxShadow: "var(--f-accent) 0px 0px 0px 2px", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "330px", background: "var(--f-surface-2)", display: "flex", gap: "14px", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "140px", height: "250px", borderRadius: "8px", background: "#1f1b17", color: "#f4ede1", padding: "28px 12px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "22px", fontWeight: "800", lineHeight: "1.02" }}>
                  ערב חמישי מתחיל כאן
                </span>
                <span style={{ height: "80px", borderRadius: "4px", background: "repeating-linear-gradient(135deg, #3a342d 0px, #3a342d 5px, #2e2924 5px, #2e2924 10px)" }}></span>
                <span style={{ alignSelf: "flex-start", fontSize: "9px", fontWeight: "800", padding: "4px 8px", borderRadius: "999px", background: "#f4ede1", color: "#1f1b17" }}>
                  הזמינו שולחן
                </span>
              </div>
              <div style={{ width: "160px", height: "200px", borderRadius: "8px", background: "#1f1b17", color: "#f4ede1", display: "grid", gridTemplateRows: "1fr 70px", overflow: "hidden" }}>
                <span style={{ padding: "14px", fontSize: "18px", fontWeight: "800", lineHeight: "1.05" }}>
                  ערב חמישי מתחיל כאן
                </span>
                <span style={{ background: "repeating-linear-gradient(135deg, #3a342d 0px, #3a342d 5px, #2e2924 5px, #2e2924 10px)" }}></span>
              </div>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: "16px" }}>
                  טיפוגרפי
                </b>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-accent-ink)", boxShadow: "var(--f-accent-ink) 0px 0px 0px 1px inset", padding: "2px 8px", borderRadius: "999px" }}>
                  ✦ קונספט AI
                </span>
              </div>
              <span style={{ fontSize: "13.5px", color: "var(--f-ink-soft)", lineHeight: "1.5" }}>
                הסתמך על: טון ושפה מה־Brand Kit, מסר הקמפיין.
              </span>
              <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                <span style={{ flex: "1 1 0%", fontSize: "14px", fontWeight: "700", padding: "12px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff", textAlign: "center" }}>
                  בחר וערוך
                </span>
                <span style={{ fontSize: "14px", fontWeight: "600", padding: "12px 14px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  גרסה דומה
                </span>
              </div>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "20px", overflow: "hidden", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "330px", background: "var(--f-bg)", display: "flex", flexDirection: "column", gap: "14px", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
              <span style={{ width: "56px", height: "56px", borderRadius: "50%", borderWidth: "4px", borderStyle: "solid", borderColor: "var(--f-accent) #ece8fb #ece8fb", borderImage: "none" }}></span>
              <b style={{ fontSize: "16px" }} role="status">
                ⟳ יוצר כיוון שלישי · מבוסס צילום
              </b>
              <span style={{ fontSize: "13.5px", color: "var(--f-muted)", lineHeight: "1.5", maxWidth: "300px" }}>
                {"בוחר תמונות מהספרייה לפי המודבורד \"ערבי חמישי\". עוד כ־20 שניות."}
              </span>
              <span style={{ fontSize: "13.5px", color: "var(--f-muted)", lineHeight: "1.5", maxWidth: "300px" }}>
                אפשר להמשיך לעבוד על הכיוונים האחרים. אם זה ייכשל, שני הכיוונים האחרים נשמרים.
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                בטל כיוון זה
              </span>
            </div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <b style={{ fontSize: "16px", color: "var(--f-muted)" }}>
                מבוסס צילום
              </b>
              <span style={{ fontSize: "13.5px", color: "var(--f-muted)", lineHeight: "1.5" }}>
                {"יסתמך על: מודבורד \"ערבי חמישי\", סגנון הצילום של UMINO."}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "14px 18px", borderRadius: "14px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px", fontSize: "14px", color: "var(--f-ink-soft)" }}>
          <b style={{ color: "var(--f-ink)" }}>
            מה AI לא עשה:
          </b>
          <span>
            לא הוסיף מחירים, מבצעים או ציטוטים. התמונות הן מקום שמור לצילום אמיתי מהספרייה.
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            משוב על הכיוונים:
          </span>
          <span style={{ fontSize: "13px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            מתאים
          </span>
          <span style={{ fontSize: "13px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            לא מתאים
          </span>
        </div>
      </div>
    </div>
  );
}
