"use client";

import { useId, useState } from "react";
import type { BrainFact } from "@/lib/focus/contracts/reports";
import { daysBetween, fmtDate } from "@/lib/focus/format";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { Banner } from "@/components/focus/ui/feedback";
import { TextAreaField, TextField } from "@/components/focus/ui/field";
import { DrawerHead } from "./report-parts";

/**
 * Business-brain fact editor (G5): a drawer form with visible labels, help text, an error that replaces the help,
 * required-field validation, and a guard before closing with unsaved edits. Changing the value resets verification.
 */
export type FactDraft = { title: string; value: string; source: string; recheck: string };

type Errors = Partial<Record<keyof FactDraft, string>>;

export function validateFact(d: FactDraft, now: string): Errors {
  const e: Errors = {};
  if (!d.title.trim()) e.title = "חובה לתת שם לפריט.";
  else if (d.title.trim().length > 80) e.title = "עד 80 תווים.";
  if (d.value.trim() && !d.source.trim()) e.source = "ערך בלי מקור לא נשמר. כתבו מאיפה הוא הגיע.";
  if (d.recheck && daysBetween(now, d.recheck) <= 0) e.recheck = `התאריך צריך להיות אחרי היום (${fmtDate(now)}).`;
  return e;
}

export const draftOf = (f: BrainFact | null): FactDraft => ({
  title: f?.title ?? "", value: f?.value ?? "", source: f?.source ?? "", recheck: f?.recheck?.date ?? "",
});

export function FactEditor({
  open, fact, sectionLabel, now, focusSource, onClose, onSave,
}: {
  open: boolean; fact: BrainFact | null; sectionLabel: string; now: string; focusSource?: boolean;
  onClose: () => void; onSave: (d: FactDraft) => void;
}) {
  const hid = useId();
  const [d, setD] = useState<FactDraft>(() => draftOf(fact));
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const initial = draftOf(fact);
  const dirty = (Object.keys(d) as (keyof FactDraft)[]).some((k) => d[k].trim() !== initial[k].trim());
  const valueChanged = fact != null && d.value.trim() !== (fact.value ?? "").trim();

  const set = (k: keyof FactDraft, v: string) => {
    const next = { ...d, [k]: v };
    setD(next);
    if (tried) setErrors(validateFact(next, now));
  };
  const requestClose = () => { if (dirty) setConfirmClose(true); else onClose(); };
  const submit = () => {
    setTried(true);
    const e = validateFact(d, now);
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave(d);
  };

  return (
    <Dialog open={open} onClose={requestClose} variant="drawer" labelledBy={hid} className="f-rp-drawer" initialFocus={focusSource ? "[data-field=source]" : "[data-field=title]"}>
      <DrawerHead id={hid} title={fact ? `עריכת פריט · ${sectionLabel}` : `פריט חדש · ${sectionLabel}`} onClose={requestClose} />
      <form className="f-rp-drawer__body f-rp-form" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {tried && Object.keys(errors).length > 0 && <Banner kind="error" title="יש שדות שצריך לתקן." detail="הפרטים מסומנים ליד כל שדה." />}
        <TextField label="שם הפריט" note="(חובה)" required data-field="title" value={d.title} onChange={(e) => set("title", e.target.value)} help="מה הלקוח או הצוות צריכים לדעת, במילים קצרות." error={errors.title} />
        <TextAreaField label="ערך" value={d.value} rows={3} onChange={(e) => set("value", e.target.value)} help="השאירו ריק אם הערך עדיין לא ידוע — הפריט יסומן ״חסר״, לא 0." error={errors.value} />
        <TextField label="מקור" data-field="source" value={d.source} onChange={(e) => set("source", e.target.value)} help="קובץ, שיחה או החלטה. ערך בלי מקור לא יוצג כמאומת." error={errors.source} />
        <TextField label="לבדוק שוב ב־" type="date" value={d.recheck} onChange={(e) => set("recheck", e.target.value)} help="אופציונלי. מתי הערך עלול להשתנות." error={errors.recheck} />
        {valueChanged && <p className="f-rp-note f-rp-note--est">שינוי הערך מאפס את האימות. הפריט יסומן ״לא אומת״ עד שמישהו יבדוק אותו.</p>}
        {confirmClose && (
          <Banner kind="warning" title="יש שינויים שלא נשמרו." detail="אם תסגרו עכשיו הם יימחקו."
            action={<span className="f-rp-form__confirm">
              <Button variant="neutral" size="sm" onClick={() => setConfirmClose(false)}>המשך לערוך</Button>
              <Button variant="outline" size="sm" onClick={onClose}>סגור בלי לשמור</Button>
            </span>} />
        )}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
      <div className="f-rp-drawer__foot">
        <Button variant="primary" onClick={submit}>שמור</Button>
        <Button variant="neutral" onClick={requestClose}>ביטול</Button>
      </div>
    </Dialog>
  );
}
