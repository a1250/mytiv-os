/**
 * H11 — בריפים · תוצאת ניתוח · מה כתוב בבריף ומה AI הסיק
 * Generated from the Claude Design handoff (H11) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/icon";

export default function ScreenH11() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div className="sc-host" data-sc-name="TopBar">
        <div style={{ minHeight: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px", padding: "0px clamp(12px, 2vw, 28px)", minWidth: "0px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)", fontFamily: "\"Open Sans\", system-ui, sans-serif", color: "var(--f-ink)" }} dir="rtl">
          <span style={{ fontSize: "19px", fontWeight: "800", marginInlineEnd: "6px", flex: "0 0 auto" }}>
            Mytiv
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)", marginInlineEnd: "8px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
            <span className="sc-interp">
              גל פילאטיס
            </span>
            {" ▾"}
          </span>
          <div style={{ flex: "1 1 auto", minWidth: "0px", display: "flex", gap: "2px", overflowX: "auto", scrollbarWidth: "none" }}>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                היום שלי
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                לקוחות ופרויקטים
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                שיווק ותוכן
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                מכירות
              </span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                עבודה ותקשורת
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                דוחות
              </span>
            </span>
          </div>
          <span style={{ flex: "0 0 auto", width: "44px", height: "44px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="search" size={18} label="חיפוש" style={{ opacity: "0.8" }} />
          </span>
          <span style={{ flex: "0 0 auto", position: "relative", width: "44px", height: "44px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bell" size={18} label="התראות" style={{ opacity: "0.8" }} />
            <span style={{ position: "absolute", top: "4px", insetInlineEnd: "4px", fontSize: "10px", fontWeight: "700", background: "#b8322a", color: "#ffffff", borderRadius: "999px", padding: "0px 5px" }}>
              3
            </span>
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 16px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff", whiteSpace: "nowrap", flex: "0 0 auto" }}>
            + יצירה
          </span>
          <span style={{ flex: "0 0 auto", width: "40px", height: "40px", borderRadius: "50%", background: "var(--f-accent-avatar)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", color: "var(--f-accent-ink)" }}>
            <span className="sc-interp">
              ד
            </span>
          </span>
        </div>
      </div>
      <div style={{ padding: "28px 40px 40px", display: "grid", gridTemplateColumns: "420px minmax(0px, 1fr)", gap: "24px", alignItems: "start" }}>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b style={{ fontSize: "15px" }}>
              הבריף המקורי
            </b>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              מייל מגל · 25.9
            </span>
          </div>
          <p style={{ margin: "0px", fontSize: "14px", lineHeight: "1.75", color: "var(--f-ink-soft)" }}>
            {"אנחנו רוצות "}
            <mark style={{ background: "var(--f-accent-weak)", padding: "0px 2px" }}>
              להחזיר מתאמנות אחרי החגים
            </mark>
            {". חשבנו על "}
            <mark style={{ background: "var(--f-accent-weak)", padding: "0px 2px" }}>
              שיעור ניסיון
            </mark>
            {" ועל תוכן באינסטגרם. התקציב מוגבל. חשוב שזה ייראה כמו הסטודיו, לא כמו חדר כושר. "}
            <mark style={{ background: "var(--f-accent-weak)", padding: "0px 2px" }}>
              נשמח שיהיה מוכן לפני 20.10
            </mark>
            .
          </p>
          <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
            מסומן: מידע שחולץ מהבריף
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <b style={{ fontSize: "24px", flex: "1 1 0%" }}>
              ניתוח · קמפיין חגים
            </b>
            <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              הוסף למוח העסק
            </span>
            <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              הפוך למשימות
            </span>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
              צור קמפיין
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ alignSelf: "flex-start", fontSize: "11.5px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px", background: "var(--f-surface-2)" }}>
                = מופיע בבריף
              </span>
              <span style={{ fontSize: "14px" }}>
                <b>
                  מטרה:
                </b>
                {" החזרת מתאמנות אחרי החגים"}
              </span>
              <span style={{ fontSize: "14px" }}>
                <b>
                  תוצר:
                </b>
                {" שיעור ניסיון, תוכן ל־Instagram"}
              </span>
              <span style={{ fontSize: "14px" }}>
                <b>
                  תאריך:
                </b>
                {" מוכן לפני 20.10"}
              </span>
              <span style={{ fontSize: "14px" }}>
                <b>
                  מגבלה:
                </b>
                {" תקציב מוגבל, \"לא כמו חדר כושר\""}
              </span>
              <div style={{ display: "flex", gap: "6px", paddingTop: "4px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 12px", borderRadius: "999px", background: "var(--f-green-bg)", color: "#185436" }}>
                  אשר מידע
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: "600", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                  ערוך
                </span>
              </div>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "16px 18px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ alignSelf: "flex-start", fontSize: "11.5px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", color: "var(--f-accent-ink)", boxShadow: "var(--f-accent-ink) 0px 0px 0px 1px inset" }}>
                ✦ מסקנה של AI
              </span>
              <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
                <b>
                  קהל:
                </b>
                {" מתאמנות שהפסיקו להגיע בחודשיים האחרונים"}
              </span>
              <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
                <b>
                  טון:
                </b>
                {" אישי ושקט, לא מכירתי"}
              </span>
              <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
                <b>
                  ערוץ נוסף:
                </b>
                {" WhatsApp למתאמנות קיימות"}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            <div style={{ padding: "14px 16px", borderRadius: "16px", background: "var(--f-amber-bg)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <b style={{ fontSize: "13.5px", color: "var(--f-amber-strong-text)" }}>
                ○ מידע חסר
              </b>
              <span style={{ fontSize: "13.5px", color: "var(--f-amber-strong-text)", lineHeight: "1.5" }}>
                סכום התקציב · האם שיעור הניסיון חינם
              </span>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: "16px", background: "var(--f-red-bg)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <b style={{ fontSize: "13.5px", color: "#7f1f19" }}>
                ▲ סתירה
              </b>
              <span style={{ fontSize: "13.5px", color: "#6a1d17", lineHeight: "1.5" }}>
                {"\"תקציב מוגבל\" מול רצון לתוכן בכמה ערוצים"}
              </span>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: "16px", background: "var(--f-surface)", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <b style={{ fontSize: "13.5px" }}>
                שאלות להמשך
              </b>
              <span style={{ fontSize: "13.5px", lineHeight: "1.5" }}>
                1. מה התקציב? 2. כמה מתאמנות ברשימה? 3. מי מאשר תוכן?
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                שלח שאלות לגל
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
