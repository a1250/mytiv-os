"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Brief, FormatKey } from "@/lib/focus/contracts/studio";
import { BRIEF_THURSDAY, DIRECTIONS, FORMATS } from "@/lib/focus/fixtures/studio";
import { R } from "@/lib/focus/routes";
import { jobStatus } from "@/lib/focus/state/jobs";
import { FlowTrail, FormatSelector, TagList } from "@/components/focus/patterns/studio/new-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { SelectField, TextField } from "@/components/focus/ui/field";
import { useToast } from "@/components/focus/ui/toast";

/**
 * New content · brief (handoff E3, prototype flow 4). Goal and formats come from the campaign and can be changed
 * here (format selector: plain language, at least one). Message + CTA are required. "✦ צור 3 כיוונים" starts the
 * (simulated) AI jobs and moves to the directions; the brief is kept as a draft and closing with changes asks first.
 */
export const BRIEF_KEY = "studio-brief-thursday";
export const STEPS = ["מטרה", "פורמט", "בריף", "כיוונים", "עריכה"];

export default function StudioNewScreen() {
  const demo = useDemo();
  const toast = useToast();
  const router = useRouter();
  const stored = demo.state.drafts[BRIEF_KEY] as Brief | undefined;
  const [b, setB] = useState<Brief>(stored ?? BRIEF_THURSDAY);
  const [editFormats, setEditFormats] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"message" | "cta" | "formats", string>>>({});
  const [confirmClose, setConfirmClose] = useState(false);
  const dirty = JSON.stringify(b) !== JSON.stringify(stored ?? BRIEF_THURSDAY);
  const aiJob = demo.state.jobs.find((j) => j.id === "ai-brief-draft");
  const aiRunning = aiJob && !aiJob.cancelledAt && jobStatus(aiJob, demo.state.clock).state === "running";

  // when the simulated AI draft settles, fill only the empty fields (never overwrite the user's text)
  const [applied, setApplied] = useState<number | null>(null);
  if (aiJob && !aiRunning && !aiJob.cancelledAt && applied !== aiJob.startedAt) {
    setApplied(aiJob.startedAt);
    setB((x) => ({ ...x, message: x.message || BRIEF_THURSDAY.message, secondary: x.secondary || BRIEF_THURSDAY.secondary, cta: x.cta || BRIEF_THURSDAY.cta }));
  }

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = (p: Partial<Brief>) => { setB((x) => ({ ...x, ...p })); setErrors({}); };
  const save = () => { demo.setDraft(BRIEF_KEY, b); toast.push({ title: "הבריף נשמר", detail: "אפשר לחזור אליו מהסטודיו." }); };

  const createDirections = () => {
    const e: typeof errors = {};
    if (!b.message.trim()) e.message = "מסר מרכזי הוא שדה חובה.";
    if (!b.cta.trim()) e.cta = "הנעה לפעולה היא שדה חובה.";
    if (!b.formats.length) e.formats = "יש לבחור לפחות פורמט אחד.";
    if (Object.keys(e).length) { setErrors(e); if (e.formats) setEditFormats(true); return; }
    demo.setDraft(BRIEF_KEY, b);
    demo.setDraft("studio-direction", undefined);
    const fail = demo.state.failNext; if (fail) demo.setFailNext(false);
    DIRECTIONS.forEach((d, i) => demo.startJob({
      id: `ai-dir-${d.id}`, kind: "ai_directions", label: `יוצר כיוון ${d.name}`, detail: "אפשר לעזוב את המסך. נשלח התראה כשמוכן.",
      durationMs: d.durationMs, outcome: fail && i === 2 ? "failure" : d.outcome, href: R.studioDirections,
    }));
    router.push(R.studioDirections);
  };

  const formatsLabel = FORMATS.filter((f) => b.formats.includes(f.key)).map((f) => f.label);

  return (
    <div className="f-focusmode f-snew">
      <div className="f-focusbar f-snew__bar" role="banner">
        <button type="button" className="f-focusbar__exit" onClick={() => (dirty ? setConfirmClose(true) : router.push(R.studio))}><span aria-hidden>✕</span>&nbsp;סגור</button>
        <h1 className="f-snew__title">תוכן חדש</h1>
        <FlowTrail steps={STEPS} current={2} label="שלבי יצירת התוכן" />
        <span className="f-grow" />
        <span id="snew-save-state" className="f-meta" role="status">{dirty ? "יש שינויים שלא נשמרו" : stored ? "הבריף נשמר · אין שינויים חדשים" : "בריף חדש · אין שינויים לשמור"}</span>
        <Button variant="neutral" size="sm" onClick={save} disabled={!dirty} aria-describedby="snew-save-state">שמור טיוטה</Button>
      </div>

      <div className="f-snew__grid">
        <div className="f-snew__left">
          <section className="f-panel f-snew__card" aria-label="מטרה">
            <div className="f-snew__cardhead"><b className="f-snew__done"><span aria-hidden>✓</span> 1 · מטרה</b><Link href={R.campaign("thursday-sushi")} className="f-link f-hit">שנה</Link></div>
            <span>{b.client} · {b.campaign}</span>
            <span>{b.goal}</span>
            <span className="f-meta">פעולה מהקהל: {b.audienceAction}</span>
          </section>
          <section className="f-panel f-snew__card" aria-label="ערוץ ופורמט">
            <div className="f-snew__cardhead">
              <b className="f-snew__done"><span aria-hidden>✓</span> 2 · ערוץ ופורמט</b>
              <button type="button" className="f-link f-hit" aria-expanded={editFormats} onClick={() => setEditFormats(!editFormats)}>{editFormats ? "סיום" : "שנה"}</button>
            </div>
            {editFormats ? (
              <FormatSelector formats={FORMATS} value={b.formats} onChange={(formats: FormatKey[]) => set({ formats })} error={errors.formats} />
            ) : (
              <>
                <div className="f-snew__fmts">{formatsLabel.length ? formatsLabel.map((l) => <span key={l} className="f-snew__fmt">{l}</span>) : <span className="f-text-risk">לא נבחר פורמט</span>}</div>
                <span className="f-meta">Instagram, Facebook · המידות נקבעות אוטומטית</span>
              </>
            )}
          </section>
          <section className="f-panel f-snew__card" aria-label="Brand Kit">
            <b>Brand Kit</b>
            <div className="f-snew__brand"><span className="f-proj-logo f-snew__logo" aria-hidden>UMINO</span><div><b>UMINO</b><span className="f-meta-sm"> · נבחר לפי הלקוח · טון: חם, עכשווי</span></div></div>
          </section>
        </div>

        <section className="f-panel f-snew__brief" aria-labelledby="brief-h">
          <div className="f-snew__briefhead">
            <h2 id="brief-h" className="f-snew__h">3 · תוכן ובריף</h2>
            <Button variant="secondary" loading={!!aiRunning} loadingLabel="מכין טיוטה…" onClick={() => demo.startJob({ id: "ai-brief-draft", kind: "ai_directions", label: "מכין טיוטת בריף", detail: "", durationMs: 1200, outcome: "success" })}>✦ הכן טיוטה בעזרת AI</Button>
          </div>
          <TextField label="מסר מרכזי" value={b.message} onChange={(e) => set({ message: e.target.value })} error={errors.message} required />
          <div className="f-snew__two">
            <TextField label="טקסט משני" value={b.secondary} onChange={(e) => set({ secondary: e.target.value })} />
            <TextField label="הנעה לפעולה" value={b.cta} onChange={(e) => set({ cta: e.target.value })} error={errors.cta} required />
          </div>
          <div className="f-snew__two">
            <TextField label="מבצע" value={b.promo?.text ?? ""} onChange={(e) => set({ promo: e.target.value ? { text: e.target.value, verified: e.target.value === BRIEF_THURSDAY.promo?.text ? BRIEF_THURSDAY.promo.verified : null } : null })}
              help={b.promo?.verified ? `✓ ${b.promo.verified}` : b.promo ? "○ לא אומת — לא ייכלל עד לאישור" : "אין מבצע"} />
            <SelectField label="שפה" value={b.language} onChange={(e) => set({ language: e.target.value as Brief["language"] })} options={[{ value: "he", label: "עברית" }, { value: "en", label: "English" }]} />
          </div>
          <TagList label="מידע שחייב להופיע" items={b.mustInclude} onChange={(mustInclude) => set({ mustInclude })} />
          <TagList label="אסור להמציא" items={b.mustNotInvent} onChange={(mustNotInvent) => set({ mustNotInvent })} tone="risk" />
          <div className="f-field">
            <span className="f-field__label">חומרים</span>
            <div className="f-snew__mats"><span className="f-snew__mat f-snew__mat--dark" aria-label="לוגו UMINO" role="img" /><span className="f-snew__mat f-snew__mat--ph" aria-label="מקום שמור לצילום" role="img" /><Link href={R.inspiration} className="f-snew__mat f-snew__mat--add">מהספרייה או העלאה</Link></div>
            <span className="f-field__help">{b.materialsNote}</span>
          </div>
        </section>

        <div className="f-snew__right">
          <section className="f-panel f-aside-card">
            <h2 className="f-aside-card__h f-aside-card__h--lg">מה AI יעשה בשלב הבא</h2>
            <span className="f-snew__p">ייצור 3 כיוונים שונים בגישה, ל{formatsLabel.length ? `פורמטים: ${formatsLabel.join(", ")}` : "פורמטים שייבחרו"}, לפי הבריף וה־Brand Kit.</span>
            <b className="f-snew__sub">מה הוא לא יעשה</b>
            <span className="f-aside-card__soft">לא יוסיף מחירים, ציטוטים או נתונים. לא יפרסם ולא ישלח לאישור.</span>
            <b className="f-snew__sub">כמה זמן</b>
            <span className="f-aside-card__soft">כדקה. אפשר לעזוב את המסך ולקבל התראה.</span>
          </section>
          <section className="f-facts__box f-facts__box--ok">
            <b className="f-facts__h">✓ עובדות זמינות מהמוח של UMINO</b>
            <span className="f-facts__basis">שעות פעילות · תפריט 28.9 · כתובת · טון כתיבה</span>
          </section>
        </div>
      </div>

      <div className="f-snew__foot">
        <Link href={R.campaign("thursday-sushi")} className="f-btn f-btn--neutral"><span aria-hidden>→</span>&nbsp;חזרה</Link>
        <span className="f-grow" />
        <span className="f-meta">{b.message.trim() && b.cta.trim() ? "שדות חובה: מסר מרכזי, הנעה לפעולה ✓" : "שדות חובה: מסר מרכזי, הנעה לפעולה"}</span>
        <Button variant="primary" size="lg" onClick={createDirections}>✦ צור 3 כיוונים</Button>
      </div>

      <Dialog open={confirmClose} onClose={() => setConfirmClose(false)} label="יש שינויים שלא נשמרו">
        <div className="f-confirm">
          <h2 className="f-confirm__h">יש שינויים שלא נשמרו בבריף</h2>
          <p className="f-meta">אפשר לשמור טיוטה ולחזור אליה מהסטודיו.</p>
          <div className="f-confirm__actions">
            <Button variant="primary" onClick={() => { demo.setDraft(BRIEF_KEY, b); router.push(R.studio); }}>שמור וצא</Button>
            <Button variant="neutral" onClick={() => router.push(R.studio)}>צא בלי לשמור</Button>
            <Button variant="quiet" onClick={() => setConfirmClose(false)}>המשך לערוך</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
