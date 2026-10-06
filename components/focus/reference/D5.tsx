/**
 * D5 — אישור · פירוט · מצב פוקוס · זרימה 3 · סיכון בינוני
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (D5) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenD5() {
  return (
    <div className="f-screen f-focusmode" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ height: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "16px", padding: "0px 28px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "10px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          ✕ צא ממצב פוקוס
        </span>
        <span style={{ flex: "1 1 0%" }}></span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", fontWeight: "700" }}>
            אישור 2 מתוך 4
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ width: "28px", height: "6px", borderRadius: "3px", background: "var(--f-accent)" }}></span>
            <span style={{ width: "28px", height: "6px", borderRadius: "3px", background: "#161d2e" }}></span>
            <span style={{ width: "28px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
            <span style={{ width: "28px", height: "6px", borderRadius: "3px", background: "var(--f-accent-soft-2)" }}></span>
          </div>
        </div>
        <span style={{ flex: "1 1 0%" }}></span>
        <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
          דלג לבא ←
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0px, 800px) 300px", justifyContent: "center", gap: "28px", padding: "28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-muted)" }}>
            טופלו
          </span>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-green-text)" }}>
              ✓ נשלח · 08:09
            </span>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>
              הצעת מחיר לנועה כהן
            </span>
            <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
              Gmail אישר את השליחה
            </span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-muted)", marginTop: "10px" }}>
            הבא בתור
          </span>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>
              סטורי ערבי סושי · גרסה 3
            </span>
            <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
              UMINO · ● נמוך
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px", boxShadow: "var(--f-border) 0px 0px 0px 1px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>
              תוכנית אוקטובר
            </span>
            <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
              גל פילאטיס · ◆ בינוני
            </span>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "20px", boxShadow: "var(--f-border) 0px 0px 0px 1px, rgba(22, 29, 46, 0.35) 0px 24px 48px -28px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "24px 28px 18px", display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid var(--f-surface-2)" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              UMINO · ערבי סושי של חמישי · שינוי בקמפיין
            </span>
            <h2 style={{ margin: "0px", fontSize: "28px", fontWeight: "800", lineHeight: "1.25" }}>
              הוספת מבצע 1+1 לקמפיין יום חמישי
            </h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)", padding: "4px 10px", borderRadius: "999px" }}>
                ◆ סיכון בינוני · דורש בדיקה
              </span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-text)", boxShadow: "#8c5a00 0px 0px 0px 1px inset", padding: "4px 10px", borderRadius: "999px" }}>
                … ממתין לאישור
              </span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-accent-ink)", boxShadow: "var(--f-accent-ink) 0px 0px 0px 1px inset", padding: "4px 10px", borderRadius: "999px" }}>
                ✦ הוצע ע״י מנוע השיווק
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                בעקבות הבריף מ־20.9 · ממתין 3 ימים
              </span>
            </div>
          </div>
          <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <b style={{ fontSize: "16px" }}>
                מה עומד להשתנות?
              </b>
              <div style={{ borderRadius: "14px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: "12px", padding: "9px 16px", background: "var(--f-bg)", fontSize: "12.5px", color: "var(--f-muted)" }}>
                  <span>
                    מה
                  </span>
                  <span>
                    היום
                  </span>
                  <span>
                    אחרי אישור
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: "12px", padding: "11px 16px", borderTop: "1px solid var(--f-surface-2)", fontSize: "14.5px" }}>
                  <span style={{ color: "var(--f-muted)" }}>
                    מבצע בקמפיין
                  </span>
                  <span style={{ color: "var(--f-muted)" }}>
                    —
                  </span>
                  <b>
                    1+1 על סטים נבחרים
                  </b>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: "12px", padding: "11px 16px", borderTop: "1px solid var(--f-surface-2)", fontSize: "14.5px" }}>
                  <span style={{ color: "var(--f-muted)" }}>
                    תכנים
                  </span>
                  <span>
                    סטורי, פוסט 4:5, קרוסלה
                  </span>
                  <span>
                    אותם תכנים, יחזרו לאישור שלך
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: "12px", padding: "11px 16px", borderTop: "1px solid var(--f-surface-2)", fontSize: "14.5px" }}>
                  <span style={{ color: "var(--f-muted)" }}>
                    מחיר לסועד
                  </span>
                  <span>
                    לפי התפריט
                  </span>
                  <span style={{ color: "var(--f-amber-text)", fontWeight: "700" }}>
                    מוזל בחמישי, בסטים נבחרים
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: "12px", padding: "11px 16px", borderTop: "1px solid var(--f-surface-2)", fontSize: "14.5px" }}>
                  <span style={{ color: "var(--f-muted)" }}>
                    פרסום
                  </span>
                  <span>
                    —
                  </span>
                  <span>
                    אין שינוי. דבר לא יפורסם.
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <b style={{ fontSize: "16px" }}>
                למה מוצע לבצע זאת?
              </b>
              <p style={{ margin: "0px", fontSize: "15px", lineHeight: "1.6" }}>
                {"מטרת הקמפיין היא יותר הזמנות בין 19:00 ל־22:00. מבצע לזוגות וקבוצות מתאים לקהל היעד ולמסר \"ערב חמישי עם חברים\"."}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <b style={{ fontSize: "16px" }}>
                על סמך מה?
              </b>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "14px 16px", borderRadius: "14px", background: "var(--f-green-bg)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#185436" }}>
                    ✓ עובדות שאומתו · 2
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "14px" }}>
                      הסטים הנבחרים ומחיריהם
                    </span>
                    <span style={{ fontSize: "12.5px", color: "#1f4a33" }}>
                      {"תפריט UMINO, עודכן ב־28.9.2026 · "}
                      <span style={{ color: "#185436" }}>
                        מקור
                      </span>
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "14px" }}>
                      שעות פעילות בחמישי: 18:00–23:30
                    </span>
                    <span style={{ fontSize: "12.5px", color: "#1f4a33" }}>
                      מוח העסק · אומת ע״י בעל העסק
                    </span>
                  </div>
                </div>
                <div style={{ padding: "14px 16px", borderRadius: "14px", background: "var(--f-amber-bg)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--f-amber-ink-strong)" }}>
                    ○ הנחות שלא אומתו · 2
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "14px" }}>
                      תוקף המבצע
                    </span>
                    <span style={{ fontSize: "12.5px", color: "var(--f-amber-ink-strong)" }}>
                      טרם אומת. נדרש לפני כל פרסום.
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "14px" }}>
                      המבצע יגדיל הזמנות של קבוצות
                    </span>
                    <span style={{ fontSize: "12.5px", color: "var(--f-amber-ink-strong)" }}>
                      הערכה של AI, אין נתון תומך
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--f-bg)", display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  השפעה
                </span>
                <span style={{ fontSize: "14px" }}>
                  על הלקוח: מחיר מוזל. מערכות חיצוניות: אין.
                </span>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--f-bg)", display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  למה בינוני
                </span>
                <span style={{ fontSize: "14px" }}>
                  משפיע על מחיר, ולכן דורש אישור בעלים.
                </span>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--f-bg)", display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                  חזרה אחורה
                </span>
                <span style={{ fontSize: "14px", color: "var(--f-green-text)", fontWeight: "700" }}>
                  ↺ ביטול מיידי עד לפרסום
                </span>
              </div>
            </div>
          </div>
          <div style={{ padding: "18px 28px 22px", borderTop: "1px solid var(--f-surface-2)", background: "#fbfbfd", display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontSize: "14px", fontWeight: "700" }}>
              {"נימוק "}
              <span style={{ fontWeight: "400", color: "var(--f-muted)" }}>
                (חובה בסיכון בינוני ומעלה)
              </span>
            </label>
            <span style={{ fontSize: "15px", padding: "12px 14px", borderRadius: "10px", background: "var(--f-surface)", boxShadow: "var(--f-accent) 0px 0px 0px 2px inset" }}>
              בתוקף עד 31.10. לא בערבי חג.|
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              התוקף שתכתוב יישמר כעובדה מאומתת במוח העסק של UMINO.
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", paddingTop: "4px" }}>
              <span style={{ fontSize: "15px", fontWeight: "700", padding: "13px 26px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
                אשר
              </span>
              <span style={{ fontSize: "15px", fontWeight: "700", padding: "13px 20px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
                בקש שינוי
              </span>
              <span style={{ fontSize: "15px", fontWeight: "600", padding: "12px 18px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                דחה
              </span>
              <span style={{ flex: "1 1 0%" }}></span>
              <span style={{ fontSize: "14px", color: "var(--f-muted)" }}>
                שמור להמשך
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <b style={{ fontSize: "14px" }}>
              היסטוריה
            </b>
            <span style={{ fontSize: "13px", lineHeight: "1.5" }}>
              28.9 · מנוע השיווק הציע את השינוי
            </span>
            <span style={{ fontSize: "13px", lineHeight: "1.5" }}>
              {"29.9 · דנה: \"לבדוק תוקף מול רון\""}
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>
              פרטים מתקדמים
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <b style={{ fontSize: "14px" }}>
              ✦ על ה־AI בהצעה הזו
            </b>
            <span style={{ fontSize: "13px", lineHeight: "1.55", color: "var(--f-ink-soft)" }}>
              המנוע השתמש בבריף, בתפריט ובמטרות הקמפיין. הוא לא בדק זמינות מטבח או רווחיות.
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                ההצעה מועילה
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                לא מתאימה
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12.5px", color: "var(--f-muted)", padding: "0px 4px" }}>
            <span>
              <b style={{ color: "var(--f-ink)" }} dir="ltr">
                A
              </b>
              {" אשר · "}
              <b style={{ color: "var(--f-ink)" }} dir="ltr">
                R
              </b>
              {" בקש שינוי · "}
              <b style={{ color: "var(--f-ink)" }} dir="ltr">
                J
              </b>
              {" הבא"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
