/**
 * W5 — פס טיימר קבוע · דוח שעות בסיסי
 * Generated from the Claude Design handoff (W5) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/icon";

export default function ScreenW5() {
  return (
    <div className="f-screen" style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start", width: "100%" }}>
      <div style={{ width: "620px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-muted)" }}>
          מצבי הפס הקבוע (מופיע בתחתית בכל המסכים)
        </span>
        <div style={{ height: "60px", background: "#161d2e", color: "#ffffff", borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px", padding: "0px 20px" }}>
          <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--f-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
            <Icon name="pause" size={15} />
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <b style={{ fontSize: "13.5px" }}>
              לתאם צילום מנת הספיישל
            </b>
            <span style={{ fontSize: "11.5px", color: "var(--f-faint-2)" }}>
              UMINO
            </span>
          </div>
          <span style={{ fontFamily: "\"IBM Plex Mono\", monospace", fontSize: "20px", fontWeight: "600", marginInlineStart: "6px" }} dir="ltr">
            00:42:18
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 13px", borderRadius: "999px", background: "#2b3245" }}>
            עצור ושמור
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
          פעיל · רץ
        </span>
        <div style={{ height: "56px", background: "#222838", color: "#ffffff", borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px", padding: "0px 20px", opacity: "0.95" }}>
          <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#2b3245", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
            <Icon name="play" size={14} />
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <b style={{ fontSize: "13px" }}>
              לתאם צילום מנת הספיישל
            </b>
            <span style={{ fontSize: "11px", color: "var(--f-faint-2)" }}>
              מושהה
            </span>
          </div>
          <span style={{ fontFamily: "\"IBM Plex Mono\", monospace", fontSize: "19px", marginInlineStart: "6px", color: "var(--f-faint-2)" }} dir="ltr">
            00:42:18
          </span>
          <span style={{ flex: "1 1 0%" }}></span>
          <span style={{ fontSize: "12.5px", fontWeight: "700", padding: "7px 13px", borderRadius: "999px", background: "#2b3245" }}>
            המשך
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
          מושהה
        </span>
        <div style={{ height: "50px", background: "var(--f-surface)", borderRadius: "12px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", alignItems: "center", gap: "12px", padding: "0px 18px" }}>
          <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
            <Icon name="play" size={13} style={{ opacity: "0.7" }} />
          </span>
          <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
            אין טיימר פעיל · בחר משימה כדי להתחיל
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
          לא פעיל (מכווץ)
        </span>
      </div>
      <div style={{ width: "780px", background: "var(--f-bg)", borderRadius: "16px", overflow: "hidden", boxShadow: "rgba(22, 29, 46, 0.35) 0px 30px 60px -30px" }}>
        <div style={{ background: "var(--f-surface)", padding: "20px 28px", borderBottom: "1px solid var(--f-border)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h3 style={{ margin: "0px", fontSize: "20px", fontWeight: "800" }}>
              דוח שעות
            </h3>
            <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
              29.9 – 5.10
            </span>
            <span style={{ flex: "1 1 0%" }}></span>
            <span style={{ fontSize: "13px", padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              ייצוא
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--f-surface-2)", borderRadius: "999px", alignSelf: "flex-start" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", padding: "8px 15px", borderRadius: "999px", background: "var(--f-surface)" }}>
              עובד
            </span>
            <span style={{ fontSize: "13px", padding: "8px 15px", borderRadius: "999px" }}>
              פרויקט
            </span>
            <span style={{ fontSize: "13px", padding: "8px 15px", borderRadius: "999px" }}>
              לקוח
            </span>
            <span style={{ fontSize: "13px", padding: "8px 15px", borderRadius: "999px" }}>
              משימה
            </span>
          </div>
        </div>
        <div style={{ padding: "16px 28px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "14px 16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                סה״כ נרשם
              </span>
              <b style={{ fontSize: "24px", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                61.5h
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-amber-text)", fontWeight: "600" }}>
                ≈ 4 ללא דיווח
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "14px 16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                מול תקציב
              </span>
              <b style={{ fontSize: "24px", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                61.5/80h
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-green-text)", fontWeight: "600" }}>
                = 77% מנוצל
              </span>
            </div>
            <div style={{ background: "var(--f-surface)", borderRadius: "12px", padding: "14px 16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
                פרויקט חורג
              </span>
              <b style={{ fontSize: "24px", color: "var(--f-red-text)" }}>
                1
              </b>
              <span style={{ fontSize: "11px", color: "var(--f-muted)" }}>
                גל פילאטיס · אתר
              </span>
            </div>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "12px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 120px 110px", gap: "12px", padding: "12px 18px", fontSize: "12px", color: "var(--f-muted)", fontWeight: "600", borderBottom: "1px solid var(--f-surface-2)" }}>
              <span>
                עובד
              </span>
              <span>
                שעות
              </span>
              <span>
                מול תקציב
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 120px 110px", gap: "12px", padding: "13px 18px", alignItems: "center", borderBottom: "1px solid #f0f2f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ד
                </span>
                <span style={{ fontSize: "14px" }}>
                  דנה
                </span>
              </div>
              <b style={{ fontSize: "14px", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                26.0h
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-green-text)", fontWeight: "600" }}>
                = תקין
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 120px 110px", gap: "12px", padding: "13px 18px", alignItems: "center", borderBottom: "1px solid #f0f2f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#bcd4c6", color: "#1f5c3a", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  י
                </span>
                <span style={{ fontSize: "14px" }}>
                  יואב
                </span>
              </div>
              <b style={{ fontSize: "14px", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                22.5h
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-amber-text)", fontWeight: "600" }}>
                ≈ 2 מוערך
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 120px 110px", gap: "12px", padding: "13px 18px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ר
                </span>
                <span style={{ fontSize: "14px" }}>
                  רון
                </span>
              </div>
              <b style={{ fontSize: "14px", fontFamily: "\"IBM Plex Mono\", monospace" }} dir="ltr">
                13.0h
              </b>
              <span style={{ fontSize: "12px", color: "var(--f-green-text)", fontWeight: "600" }}>
                = תקין
              </span>
            </div>
          </div>
          <span style={{ fontSize: "12px", color: "var(--f-muted)" }}>
            {"מבוסס על טיימרים ורישום ידני · מקור: Mytiv Work · ClickUp מסומן בנפרד · "}
            <a href="#W5">
              מקור חישוב
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
