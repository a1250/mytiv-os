/**
 * F5 — משימות · כל הפרויקטים
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (F5) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */

export default function ScreenF5() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ padding: "28px 40px 40px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
          <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              עבודה ותקשורת › משימות
            </span>
            <h2 style={{ margin: "0px", fontSize: "32px", fontWeight: "800" }}>
              משימות
            </h2>
            <span style={{ fontSize: "17px" }}>
              4 משימות שלך היום. אחת באיחור.
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            + משימה
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", padding: "8px 14px", borderRadius: "999px", background: "#161d2e", color: "#ffffff" }}>
            שלי 6
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            היום 4
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            באיחור 1
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            חסומות 1
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            ממתינות לאחרים 2
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            לפי פרויקט
          </span>
          <span style={{ fontSize: "13px", padding: "8px 14px", borderRadius: "999px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}>
            לפי אחראי
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            {"ClickUp · לפני 4 דק׳ · "}
            <span style={{ fontWeight: "600" }}>
              רענן
            </span>
          </span>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "36px minmax(0px, 1fr) 200px 120px 120px 150px 150px", gap: "14px", padding: "11px 20px", background: "var(--f-bg)", fontSize: "12.5px", color: "var(--f-muted)" }}>
            <span></span>
            <span>
              משימה
            </span>
            <span>
              פרויקט
            </span>
            <span>
              מצב
            </span>
            <span>
              יעד
            </span>
            <span>
              מקור האמת
            </span>
            <span>
              פעולה מהירה
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "36px minmax(0px, 1fr) 200px 120px 120px 150px 150px", gap: "14px", padding: "12px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "7px", boxShadow: "var(--f-line-strong) 0px 0px 0px 2px inset" }}></span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  {"תקני את סטורי \"ערבי סושי\""}
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  רון ביקש 2 תיקונים
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                UMINO · תפריט סתיו
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)" }}>
              <span className="sc-interp">
                ◐ בתהליך
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                היום
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                Mytiv · סטודיו
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                פתח בעורך
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "36px minmax(0px, 1fr) 200px 120px 120px 150px 150px", gap: "14px", padding: "12px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "7px", boxShadow: "var(--f-line-strong) 0px 0px 0px 2px inset" }}></span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  צילום מנת הספיישל
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  ממתין לצלם חיצוני
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                UMINO · תפריט סתיו
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", color: "var(--f-red-ink)", background: "var(--f-red-bg)" }}>
              <span className="sc-interp">
                ■ חסום
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                3.10
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                ClickUp ↗
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                הקצה לי
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "36px minmax(0px, 1fr) 200px 120px 120px 150px 150px", gap: "14px", padding: "12px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "7px", boxShadow: "var(--f-line-strong) 0px 0px 0px 2px inset" }}></span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  לשלוח הצעה לנועה כהן
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  מהליד · אירוע ל־35
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                מכירות
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)" }}>
              <span className="sc-interp">
                ◐ בתהליך
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                4.10
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                Mytiv בלבד
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                פתח הצעה
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "36px minmax(0px, 1fr) 200px 120px 120px 150px 150px", gap: "14px", padding: "12px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "7px", boxShadow: "var(--f-line-strong) 0px 0px 0px 2px inset" }}></span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  עדכון תפריט PDF
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  יואב · ביקשת לעקוב
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                UMINO · תפריט סתיו
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)" }}>
              <span className="sc-interp">
                ◐ בתהליך
              </span>
            </span>
            <span style={{ color: "var(--f-red-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                29.9 · באיחור
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                ClickUp ↗
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                שנה תאריך
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "36px minmax(0px, 1fr) 200px 120px 120px 150px 150px", gap: "14px", padding: "12px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "7px", boxShadow: "var(--f-line-strong) 0px 0px 0px 2px inset" }}></span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  לבדוק זמינות חדר ל־15.10
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  עבור נועה כהן
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                מכירות
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", color: "var(--f-ink)", background: "var(--f-surface-2)" }}>
              <span className="sc-interp">
                ○ לא התחיל
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                היום
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                Mytiv בלבד
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                סמן כהושלם
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "36px minmax(0px, 1fr) 200px 120px 120px 150px 150px", gap: "14px", padding: "12px 20px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "7px", boxShadow: "var(--f-line-strong) 0px 0px 0px 2px inset" }}></span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <b style={{ fontSize: "14.5px" }}>
                <span className="sc-interp">
                  חומרים לאתר
                </span>
              </b>
              <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  ממתין ללקוחה 6 ימים
                </span>
              </span>
            </div>
            <span style={{ color: "var(--f-ink-soft)" }}>
              <span className="sc-interp">
                גל פילאטיס · אתר
              </span>
            </span>
            <span style={{ justifySelf: "start", fontSize: "12px", fontWeight: "700", padding: "3px 9px", borderRadius: "6px", color: "var(--f-amber-ink)", background: "var(--f-amber-bg)" }}>
              <span className="sc-interp">
                ⏸ ממתין
              </span>
            </span>
            <span style={{ color: "var(--f-ink)", fontWeight: "400" }}>
              <span className="sc-interp">
                8.10
              </span>
            </span>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              <span className="sc-interp">
                ClickUp ↗
              </span>
            </span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
              <span className="sc-interp">
                שלח תזכורת
              </span>
            </span>
          </div>
        </div>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          {"משימה ש־ClickUp הוא מקור האמת שלה מתעדכנת שם. משימה מקומית מסומנת \"Mytiv בלבד\" ואינה מסונכרנת."}
        </span>
      </div>
    </div>
  );
}
