/**
 * E6 — עורך · פורמט יחיד · אזורי בטיחות
  * VISUAL REFERENCE ONLY (not production). Generated from the Claude Design handoff (E6) by the Focus converter — design reference on demo data,
 * not wired to any backend. Edit freely; regenerate only if the handoff changes.
 */
import { Icon } from "@/components/focus/ui/icon";

export default function ScreenE6() {
  return (
    <div className="f-screen f-focusmode" style={{ minHeight: "960px", background: "var(--f-bg)", display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ height: "68px", flex: "0 0 auto", display: "flex", alignItems: "center", gap: "12px", padding: "0px 24px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-border)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "10px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          → כל הפורמטים
        </span>
        <b style={{ fontSize: "16px" }}>
          סטורי · ערבי סושי של חמישי
        </b>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-accent-ink)", boxShadow: "var(--f-accent-ink) 0px 0px 0px 1px inset", padding: "3px 9px", borderRadius: "999px" }}>
          ✦ קונספט AI · נערך ע״י דנה
        </span>
        <span style={{ flex: "1 1 0%" }}></span>
        <span style={{ fontSize: "13px", color: "var(--f-muted)" }}>
          גרסה 3 · נשמר לפני רגע
        </span>
        <span style={{ width: "44px", height: "44px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="undo-2" size={18} label="בטל" style={{ opacity: "0.8" }} />
        </span>
        <span style={{ width: "44px", height: "44px", borderRadius: "999px", background: "var(--f-surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="redo-2" size={18} label="בצע שוב" style={{ opacity: "0.8" }} />
        </span>
        <span style={{ fontSize: "14px", fontWeight: "600", padding: "11px 16px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
          גרסאות
        </span>
        <span style={{ fontSize: "14px", fontWeight: "700", padding: "12px 20px", borderRadius: "999px", background: "var(--f-accent)", color: "#ffffff" }}>
          שלח לאישור
        </span>
      </div>
      <div style={{ flex: "1 1 0%", display: "grid", gridTemplateColumns: "270px minmax(0px, 1fr) 320px", minHeight: "0px" }}>
        <div style={{ background: "var(--f-surface)", borderInlineEnd: "1px solid var(--f-border)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "4px", padding: "10px", borderBottom: "1px solid var(--f-surface-2)" }}>
            <span style={{ flex: "1 1 0%", textAlign: "center", fontSize: "13px", fontWeight: "700", padding: "8px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              שכבות
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center", fontSize: "13px", padding: "8px" }}>
              נכסי מותג
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center", fontSize: "13px", padding: "8px" }}>
              השראה
            </span>
          </div>
          <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "2px", fontSize: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "10px", background: "var(--f-accent-weak)" }}>
              <b style={{ color: "var(--f-accent-ink)", width: "16px" }}>
                T
              </b>
              <span style={{ flex: "1 1 0%", fontWeight: "600" }}>
                כותרת
              </span>
              <Icon name="eye" size={15} label="הסתר" style={{ opacity: "0.6" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px" }}>
              <b style={{ color: "var(--f-muted)", width: "16px" }}>
                T
              </b>
              <span style={{ flex: "1 1 0%" }}>
                טקסט משני
              </span>
              <Icon name="eye" size={15} label="הסתר" style={{ opacity: "0.6" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px" }}>
              <b style={{ color: "var(--f-muted)", width: "16px" }}>
                ▭
              </b>
              <span style={{ flex: "1 1 0%" }}>
                כפתור · הזמינו שולחן
              </span>
              <Icon name="eye" size={15} label="הסתר" style={{ opacity: "0.6" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px" }}>
              <b style={{ color: "var(--f-muted)", width: "16px" }}>
                ◻
              </b>
              <span style={{ flex: "1 1 0%" }}>
                לוגו UMINO
              </span>
              <Icon name="lock" size={15} label="נעול" style={{ opacity: "0.6" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px" }}>
              <b style={{ color: "var(--f-muted)", width: "16px" }}>
                ▨
              </b>
              <span style={{ flex: "1 1 0%" }}>
                תמונה · מקום שמור
              </span>
              <Icon name="eye" size={15} label="הסתר" style={{ opacity: "0.6" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px" }}>
              <b style={{ color: "var(--f-muted)", width: "16px" }}>
                ▭
              </b>
              <span style={{ flex: "1 1 0%" }}>
                רקע
              </span>
              <Icon name="lock" size={15} label="נעול" style={{ opacity: "0.6" }} />
            </div>
          </div>
          <div style={{ marginTop: "auto", padding: "14px", borderTop: "1px solid var(--f-surface-2)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
              צבעי Brand Kit · UMINO
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#1f1b17", boxShadow: "var(--f-surface) 0px 0px 0px 2px, var(--f-accent) 0px 0px 0px 4px" }}></span>
              <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#f4ede1", boxShadow: "var(--f-border) 0px 0px 0px 1px inset" }}></span>
              <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#c4462e" }}></span>
              <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#6b7f5e" }}></span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: "0px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "var(--f-surface)", borderBottom: "1px solid var(--f-surface-2)", fontSize: "13px" }}>
            <span style={{ fontWeight: "700", padding: "7px 12px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              אזורי בטיחות: Instagram סטורי ✓
            </span>
            <span style={{ padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              רשת
            </span>
            <span style={{ padding: "7px 12px", borderRadius: "999px", background: "var(--f-surface-2)" }}>
              100%
            </span>
            <span style={{ flex: "1 1 0%" }}></span>
            <span style={{ color: "var(--f-muted)" }}>
              יישור · חיתוך · שינוי גודל · שכפול · נעילה
            </span>
          </div>
          <div style={{ flex: "1 1 0%", display: "flex", alignItems: "center", justifyContent: "center", gap: "24px" }}>
            <div style={{ position: "relative", width: "360px", height: "640px", borderRadius: "10px", background: "#1f1b17", overflow: "hidden", boxShadow: "var(--f-line-strong) 0px 0px 0px 1px" }}>
              <div style={{ position: "absolute", inset: "0px 0px auto", height: "90px", background: "repeating-linear-gradient(135deg, rgba(91, 69, 201, 0.4) 0px, rgba(91, 69, 201, 0.4) 5px, transparent 5px, transparent 10px)", borderBottom: "1px dashed var(--f-accent-avatar)", display: "flex", alignItems: "flex-start", padding: "8px 10px", fontSize: "10.5px", color: "#e2dcfb" }}>
                אזור שם החשבון והסגירה
              </div>
              <div style={{ position: "absolute", inset: "auto 0px 0px", height: "120px", background: "repeating-linear-gradient(135deg, rgba(91, 69, 201, 0.4) 0px, rgba(91, 69, 201, 0.4) 5px, transparent 5px, transparent 10px)", borderTop: "1px dashed var(--f-accent-avatar)", display: "flex", alignItems: "flex-end", padding: "8px 10px", fontSize: "10.5px", color: "#e2dcfb" }}>
                אזור התגובה והשליחה
              </div>
              <div style={{ position: "absolute", top: "112px", insetInline: "30px", color: "#f4ede1", fontSize: "42px", fontWeight: "800", lineHeight: "1.02", outline: "var(--f-accent) solid 2px", outlineOffset: "5px" }}>
                ערב חמישי
                <br />
                מתחיל כאן
              </div>
              <span style={{ position: "absolute", top: "103px", insetInlineStart: "21px", width: "9px", height: "9px", background: "var(--f-surface)", boxShadow: "var(--f-accent) 0px 0px 0px 2px" }}></span>
              <span style={{ position: "absolute", top: "103px", insetInlineEnd: "21px", width: "9px", height: "9px", background: "var(--f-surface)", boxShadow: "var(--f-accent) 0px 0px 0px 2px" }}></span>
              <span style={{ position: "absolute", top: "212px", insetInlineStart: "21px", width: "9px", height: "9px", background: "var(--f-surface)", boxShadow: "var(--f-accent) 0px 0px 0px 2px" }}></span>
              <span style={{ position: "absolute", top: "212px", insetInlineEnd: "21px", width: "9px", height: "9px", background: "var(--f-surface)", boxShadow: "var(--f-accent) 0px 0px 0px 2px" }}></span>
              <div style={{ position: "absolute", top: "240px", insetInline: "30px", height: "190px", background: "repeating-linear-gradient(135deg, #3a342d 0px, #3a342d 6px, #2e2924 6px, #2e2924 12px)", display: "flex", alignItems: "center", justifyContent: "center", font: "11px ui-monospace, monospace", color: "#b5aa98", borderRadius: "4px" }}>
                צילום מנה · מקום שמור
              </div>
              <div style={{ position: "absolute", top: "444px", insetInline: "30px", color: "#e6dccb", fontSize: "15px" }}>
                סושי, קוקטיילים וחברים · 19:00–22:00
              </div>
              <div style={{ position: "absolute", top: "476px", insetInlineStart: "30px", padding: "8px 16px", background: "#f4ede1", color: "#1f1b17", fontSize: "14px", fontWeight: "700", borderRadius: "999px" }}>
                הזמינו שולחן
              </div>
              <div style={{ position: "absolute", top: "100px", insetInlineEnd: "30px", fontSize: "12px", fontWeight: "800", letterSpacing: "0.12em", color: "#f4ede1", opacity: "0" }}>
                UMINO
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "200px" }}>
              <div style={{ background: "var(--f-surface)", borderRadius: "14px", padding: "12px 14px", boxShadow: "var(--f-border) 0px 0px 0px 1px, rgba(22, 29, 46, 0.45) 0px 24px 48px -28px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <b style={{ fontSize: "13px" }}>
                  כותרת
                </b>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12.5px" }}>
                  <span style={{ padding: "7px 9px", borderRadius: "8px", background: "var(--f-surface-2)" }}>
                    Open Sans · 800
                  </span>
                  <span style={{ padding: "7px 9px", borderRadius: "8px", background: "var(--f-surface-2)" }}>
                    42px
                  </span>
                  <span style={{ padding: "7px 9px", borderRadius: "8px", background: "var(--f-surface-2)" }}>
                    ימין
                  </span>
                  <span style={{ padding: "7px 9px", borderRadius: "8px", background: "var(--f-surface-2)" }}>
                    #F4EDE1
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--f-green-text)", fontWeight: "700" }}>
                  ניגודיות 13.9:1 ✓
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: "var(--f-surface)", borderInlineStart: "1px solid var(--f-border)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "4px", padding: "10px", borderBottom: "1px solid var(--f-surface-2)" }}>
            <span style={{ flex: "1 1 0%", textAlign: "center", fontSize: "13px", padding: "8px" }}>
              עיצוב
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center", fontSize: "13px", fontWeight: "700", padding: "8px", borderRadius: "999px", background: "var(--f-accent-weak)", color: "var(--f-accent-ink)" }}>
              בדיקות 2
            </span>
            <span style={{ flex: "1 1 0%", textAlign: "center", fontSize: "13px", padding: "8px" }}>
              היסטוריה
            </span>
          </div>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span style={{ color: "var(--f-muted)" }}>
                שגיאות שחוסמות יצוא
              </span>
              <b style={{ color: "var(--f-green-text)" }}>
                0
              </b>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--f-amber-bg)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-amber-ink-strong)" }}>
                ◆ אזהרה
              </span>
              <span style={{ fontSize: "14px", lineHeight: "1.45" }}>
                הלוגו מוסתר. ב־Brand Kit של UMINO הלוגו נדרש בכל סטורי.
              </span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--f-accent-ink)" }}>
                הצג לוגו
              </span>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: "14px", background: "var(--f-bg)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--f-neutral-text)" }}>
                ℹ המלצה
              </span>
              <span style={{ fontSize: "14px", lineHeight: "1.45" }}>
                הצילום הוא מקום שמור. אפשר לשלוח לאישור, אבל לא לתזמן.
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", color: "var(--f-green-text)", fontWeight: "600", paddingTop: "4px" }}>
              <span>
                ✓ הכותרת מחוץ לאזור המוסתר (תוקן בגרסה 3)
              </span>
              <span>
                ✓ יש הנעה לפעולה
              </span>
              <span>
                {"✓ \"19:00–22:00\" אומת במוח העסק"}
              </span>
              <span>
                ✓ אין מספרים ללא מקור
              </span>
              <span>
                ✓ ניגודיות ואיות תקינים
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px", borderTop: "1px solid var(--f-surface-2)" }}>
              <b style={{ fontSize: "14px" }}>
                הערות פתוחות
              </b>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", borderRadius: "12px", background: "var(--f-bg)" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--f-green-bg)", color: "var(--f-green-ink)", fontSize: "12px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                  ✓
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "12.5px", color: "var(--f-muted)" }}>
                    רון · כותרת
                  </span>
                  <span style={{ fontSize: "13.5px", textDecoration: "line-through", color: "var(--f-muted)" }}>
                    להוריד קצת את הכותרת
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--f-green-text)", fontWeight: "700" }}>
                    טופל בגרסה 3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
