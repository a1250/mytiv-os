/**
 * W6 — מצבי מערכת · יצירה מהירה · מתוכנן
 * Generated from the Claude Design handoff (W6) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/icon";

export default function ScreenW6() {
  return (
    <div className="f-screen" style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-start", width: "100%" }}>
      <div style={{ width: "330px", height: "260px", background: "var(--f-surface)", borderRadius: "14px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px", textAlign: "center" }}>
        <span style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="check-check" size={24} style={{ opacity: "0.6" }} />
        </span>
        <b style={{ fontSize: "16px" }}>
          אין משימות להיום
        </b>
        <span style={{ fontSize: "13px", color: "var(--f-muted)", lineHeight: "1.5" }}>
          {"הכל מטופל. אפשר למשוך משימה מ\"בקרוב\" או ליצור חדשה."}
        </span>
        <span style={{ fontSize: "13px", fontWeight: "700", padding: "9px 16px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
          + משימה
        </span>
        <span style={{ fontSize: "11px", color: "var(--f-faint)" }}>
          מצב ריק
        </span>
      </div>
      <div style={{ width: "330px", height: "260px", background: "var(--f-surface)", borderRadius: "14px", boxShadow: "var(--f-border) 0px 0px 0px 1px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ height: "16px", width: "50%", borderRadius: "6px", background: "var(--f-surface-2)" }}></div>
        <div style={{ height: "66px", borderRadius: "10px", background: "var(--f-bg)" }}></div>
        <div style={{ height: "66px", borderRadius: "10px", background: "var(--f-bg)" }}></div>
        <div style={{ height: "40px", borderRadius: "10px", background: "var(--f-bg)" }}></div>
        <span style={{ fontSize: "11px", color: "var(--f-faint)", marginTop: "auto" }}>
          טעינה · Skeleton
        </span>
      </div>
      <div style={{ width: "330px", height: "260px", background: "var(--f-surface)", borderRadius: "14px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px", textAlign: "center" }}>
        <span style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--f-red-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--f-red-ink)", fontSize: "24px", fontWeight: "800" }}>
          !
        </span>
        <b style={{ fontSize: "16px" }}>
          לא הצלחנו לטעון משימות
        </b>
        <span style={{ fontSize: "13px", color: "var(--f-muted)", lineHeight: "1.5" }}>
          הנתונים שהוצגו לאחרונה נשמרו. אפשר לנסות שוב.
        </span>
        <span style={{ fontSize: "13px", fontWeight: "700", padding: "9px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          נסה שוב
        </span>
        <span style={{ fontSize: "11px", color: "var(--f-faint)" }}>
          תקלה
        </span>
      </div>
      <div style={{ width: "330px", height: "260px", background: "var(--f-surface)", borderRadius: "14px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px", textAlign: "center" }}>
        <span style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="lock" size={22} style={{ opacity: "0.6" }} />
        </span>
        <b style={{ fontSize: "16px" }}>
          צפייה בלבד
        </b>
        <span style={{ fontSize: "13px", color: "var(--f-muted)", lineHeight: "1.5" }}>
          אין לך הרשאה לערוך משימות בפרויקט הזה. אפשר להגיב ולעקוב.
        </span>
        <span style={{ fontSize: "12.5px", color: "var(--f-accent-ink)", fontWeight: "700" }}>
          בקש גישה ממנהל הצוות
        </span>
        <span style={{ fontSize: "11px", color: "var(--f-faint)" }}>
          הרשאה חסרה
        </span>
      </div>
      <div style={{ width: "454px", background: "var(--f-surface)", borderRadius: "14px", boxShadow: "#f0d3cf 0px 0px 0px 1px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--f-amber-bg)", color: "var(--f-amber-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "800" }}>
            ⧗
          </span>
          <b style={{ fontSize: "16px" }}>
            דנה עדכנה משימה זו בזמן שערכת
          </b>
        </div>
        <p style={{ margin: "0px", fontSize: "13.5px", color: "var(--f-muted)", lineHeight: "1.55" }}>
          {"השדה \"אחראי\" השתנה אצל שניכם. בחר איזו גרסה לשמור — שום דבר לא נדרס עד שתחליט."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div style={{ border: "1px solid var(--f-border)", borderRadius: "10px", padding: "11px 13px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--f-muted)" }}>
              שלך
            </span>
            <b style={{ fontSize: "14px" }}>
              אחראי: יואב
            </b>
          </div>
          <div style={{ border: "2px solid var(--f-accent)", borderRadius: "10px", padding: "11px 13px", display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--f-accent-ink)", fontWeight: "600" }}>
              של דנה · חדש יותר
            </span>
            <b style={{ fontSize: "14px" }}>
              אחראי: נועה
            </b>
          </div>
        </div>
        <div style={{ display: "flex", gap: "9px" }}>
          <span style={{ fontSize: "13px", fontWeight: "700", padding: "9px 15px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            שמור את שלי
          </span>
          <span style={{ fontSize: "13px", fontWeight: "600", padding: "9px 15px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            קבל את של דנה
          </span>
        </div>
        <span style={{ fontSize: "11px", color: "var(--f-faint)" }}>
          קונפליקט גרסאות
        </span>
      </div>
      <div style={{ width: "454px", background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px, rgba(22, 29, 46, 0.45) 0px 24px 48px -28px", padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ fontSize: "17px" }}>
            משימה חדשה
          </b>
          <span style={{ fontSize: "20px", color: "var(--f-faint)" }}>
            ×
          </span>
        </div>
        <div style={{ border: "1px solid var(--f-line-strong)", borderRadius: "10px", padding: "12px 14px", fontSize: "15px" }}>
          לעצב באנר רחב לאתר
        </div>
        <div style={{ border: "1px solid var(--f-border)", borderRadius: "10px", padding: "10px 14px", fontSize: "13.5px", color: "var(--f-faint)" }}>
          תיאור (לא חובה)…
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", padding: "8px 13px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", gap: "6px" }}>
            {"יעד: "}
            <b>
              מחר
            </b>
          </span>
          <span style={{ fontSize: "13px", padding: "8px 13px", borderRadius: "999px", background: "var(--f-amber-bg)", color: "var(--f-amber-ink-strong)", fontWeight: "600" }}>
            ◆ בינוני
          </span>
          <span style={{ fontSize: "13px", padding: "8px 13px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
            @ אחראי
          </span>
          <span style={{ fontSize: "13px", padding: "8px 13px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", fontWeight: "600" }}>
            # UMINO
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "4px" }}>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "11px 20px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
            צור
          </span>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            או צור ועוד אחת
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "11px", color: "var(--f-faint)", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
            ⌘⏎
          </span>
        </div>
      </div>
      <div style={{ width: "454px", background: "#fbfbfe", borderRadius: "14px", boxShadow: "#d9d2f4 0px 0px 0px 1px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "9px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.04em", color: "var(--f-accent-ink)", background: "var(--f-accent-weak)", padding: "3px 10px", borderRadius: "6px" }}>
            מתוכנן
          </span>
          <b style={{ fontSize: "15px" }}>
            יכולת בהמתנה ל־backend
          </b>
        </div>
        <p style={{ margin: "0px", fontSize: "13.5px", color: "var(--f-muted)", lineHeight: "1.55" }}>
          {"יכולות שעוד אין להן שרת (טיימר מתמשך, תלויות, דוח שעות) מוצגות במצב \"מתוכנן\" עם נתוני fixture. הרכיב מרונדר מלא כדי לשמור חוזה ברור — החיבור מזרים נתונים אמיתיים בלי לשנות את ה־UI."}
        </p>
        <div style={{ fontFamily: "\"IBM Plex Mono\", monospace", fontSize: "11.5px", color: "var(--f-ink-soft)", background: "#f3f1fb", borderRadius: "8px", padding: "10px 12px", lineHeight: "1.6" }} dir="ltr">
          {"TaskTimer · source: \"planned\""}
          <br />
          {"// fixture now → POST /work/timers later"}
        </div>
      </div>
    </div>
  );
}
