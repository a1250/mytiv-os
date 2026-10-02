/**
 * H13 — הגדרות › משתמשים והרשאות
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (H13) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenH13() {
  return (
    <div className="f-screen" style={{ background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div className="sc-host" data-sc-name="TopBar">
        <div style={{ minHeight: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "6px", padding: "0px clamp(12px, 2vw, 28px)", minWidth: "0px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)", fontFamily: "\"Open Sans\", system-ui, sans-serif", color: "var(--f-ink)" }} dir="rtl">
          <span style={{ fontSize: "19px", fontWeight: "800", marginInlineEnd: "6px", flex: "0 0 auto" }}>
            Mytiv
          </span>
          <span style={{ fontSize: "14px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)", marginInlineEnd: "8px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
            <span className="sc-interp">
              Mytiv
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
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                עבודה ותקשורת
              </span>
            </span>
            <span style={{ fontSize: "14px", padding: "9px 14px", borderRadius: "999px", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                דוחות
              </span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "9px 14px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)", whiteSpace: "nowrap", flex: "0 0 auto" }}>
              <span className="sc-interp">
                הגדרות
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
              ר
            </span>
          </span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "240px minmax(0px, 1fr) 400px", gap: "24px", padding: "28px 40px 40px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <b style={{ fontSize: "22px", padding: "0px 10px 12px" }}>
            הגדרות
          </b>
          <span style={{ fontSize: "14px", padding: "10px 12px" }}>
            העסק והסטודיו
          </span>
          <span style={{ fontSize: "14px", padding: "10px 12px" }}>
            Brand Kits
          </span>
          <span style={{ fontSize: "14px", fontWeight: "700", padding: "10px 12px", borderRadius: "12px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
            משתמשים והרשאות
          </span>
          <span style={{ fontSize: "14px", padding: "10px 12px" }}>
            AI
          </span>
          <span style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", padding: "10px 12px" }}>
            חיבורים
            <span style={{ fontSize: "11px", background: "#b8322a", color: "#ffffff", borderRadius: "999px", padding: "1px 7px" }}>
              1
            </span>
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", gap: "4px" }}>
              <b style={{ fontSize: "22px" }}>
                משתמשים · 4
              </b>
              <span style={{ fontSize: "14px", color: "var(--f-ink-soft)" }}>
                רק בעלים יכול להזמין, לשנות תפקיד ולבטל גישה.
              </span>
            </div>
            <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 18px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
              + הזמן משתמש
            </span>
          </div>
          <div style={{ background: "var(--f-surface)", borderRadius: "16px", boxShadow: "var(--f-border) 0px 0px 0px 1px", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0px, 1fr) 150px 140px 120px", gap: "14px", padding: "13px 18px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="sc-interp">
                  ר
                </span>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b>
                  <span className="sc-interp">
                    רון
                  </span>
                </b>
                <bdi style={{ fontSize: "12.5px", color: "var(--f-muted)", textAlign: "right" }} dir="ltr">
                  <span className="sc-interp">
                    ron@mytiv.co.il
                  </span>
                </bdi>
              </div>
              <span style={{ justifySelf: "start", fontSize: "13px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                <span className="sc-interp">
                  בעלים
                </span>
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  פעיל עכשיו
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>
                <span className="sc-interp">
                  —
                </span>
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0px, 1fr) 150px 140px 120px", gap: "14px", padding: "13px 18px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="sc-interp">
                  ד
                </span>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b>
                  <span className="sc-interp">
                    דנה
                  </span>
                </b>
                <bdi style={{ fontSize: "12.5px", color: "var(--f-muted)", textAlign: "right" }} dir="ltr">
                  <span className="sc-interp">
                    dana@mytiv.co.il
                  </span>
                </bdi>
              </div>
              <span style={{ justifySelf: "start", fontSize: "13px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                <span className="sc-interp">
                  מנהלת ▾
                </span>
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  לפני 5 דק׳
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>
                <span className="sc-interp">
                  צפה בפעילות
                </span>
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0px, 1fr) 150px 140px 120px", gap: "14px", padding: "13px 18px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="sc-interp">
                  י
                </span>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b>
                  <span className="sc-interp">
                    יואב
                  </span>
                </b>
                <bdi style={{ fontSize: "12.5px", color: "var(--f-muted)", textAlign: "right" }} dir="ltr">
                  <span className="sc-interp">
                    yoav@mytiv.co.il
                  </span>
                </bdi>
              </div>
              <span style={{ justifySelf: "start", fontSize: "13px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                <span className="sc-interp">
                  מנהל ▾
                </span>
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  אתמול
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>
                <span className="sc-interp">
                  צפה בפעילות
                </span>
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0px, 1fr) 150px 140px 120px", gap: "14px", padding: "13px 18px", borderTop: "1px solid var(--f-surface-2)", alignItems: "center", fontSize: "14px" }}>
              <span style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--f-accent-avatar)", color: "var(--f-accent-ink)", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="sc-interp">
                  ש
                </span>
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <b>
                  <span className="sc-interp">
                    שירה · רואת חשבון
                  </span>
                </b>
                <bdi style={{ fontSize: "12.5px", color: "var(--f-muted)", textAlign: "right" }} dir="ltr">
                  <span className="sc-interp">
                    shira@example.co.il
                  </span>
                </bdi>
              </div>
              <span style={{ justifySelf: "start", fontSize: "13px", fontWeight: "600", padding: "8px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
                <span className="sc-interp">
                  צופה ▾
                </span>
              </span>
              <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
                <span className="sc-interp">
                  28.9
                </span>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>
                <span className="sc-interp">
                  בטל גישה
                </span>
              </span>
            </div>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderRadius: "16px", padding: "18px 20px", boxShadow: "var(--f-border) 0px 0px 0px 1px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <b style={{ fontSize: "15px" }}>
            מה כל תפקיד יכול לעשות
          </b>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 54px 54px 54px", gap: "6px 8px", fontSize: "13px", alignItems: "center" }}>
            <span></span>
            <b style={{ textAlign: "center" }}>
              בעלים
            </b>
            <b style={{ textAlign: "center" }}>
              מנהל
            </b>
            <b style={{ textAlign: "center" }}>
              צופה
            </b>
            <span style={{ color: "var(--f-ink-soft)", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span className="sc-interp">
                צפייה ודוחות
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓
              </span>
            </span>
            <span style={{ color: "var(--f-ink-soft)", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span className="sc-interp">
                משימות, לידים, פרויקטים
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <span style={{ color: "var(--f-ink-soft)", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span className="sc-interp">
                תוכן ו־AI
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <span style={{ color: "var(--f-ink-soft)", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span className="sc-interp">
                אישור בסיכון גבוה
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-amber-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ◆
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <span style={{ color: "var(--f-ink-soft)", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span className="sc-interp">
                שליחה חיצונית
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-amber-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ◆
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-amber-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ◆
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <span style={{ color: "var(--f-ink-soft)", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span className="sc-interp">
                עלויות ורווחיות
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-amber-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ◆
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <span style={{ color: "var(--f-ink-soft)", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)" }}>
              <span className="sc-interp">
                חיבורים ומשתמשים
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-green-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                ✓
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
            <span style={{ textAlign: "center", padding: "5px 0px", borderTop: "1px solid var(--f-surface-2)", color: "var(--f-neutral-text)", fontWeight: "700" }}>
              <span className="sc-interp">
                —
              </span>
            </span>
          </div>
          <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
            ◆ = עם סיכום לפני ביצוע או סף · — = לא מוצג בממשק
          </span>
        </div>
      </div>
    </div>
  );
}
