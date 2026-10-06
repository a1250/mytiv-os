"use client";

import { useId, useState } from "react";
import type { MilestoneDraft, NewProjectDraft, WizardStepKey } from "@/lib/focus/contracts/clients";
import type { Person } from "@/lib/focus/contracts/common";
import { cx } from "@/components/focus/ui/cx";
import { Icon } from "@/components/focus/ui/icon";

/**
 * New-project wizard parts (handoff H3): the step rail, chip lists (team, deliverables) and the milestone rows, plus
 * the pure per-step validation. Errors are keyed by field name; the screen shows each error in place of its help text.
 */
export type WizardErrors = Partial<Record<string, string>>;

const POSITIVE = /^\d+(\.\d+)?$/;

export function validateStep(key: WizardStepKey, d: NewProjectDraft): WizardErrors {
  const e: WizardErrors = {};
  if (key === "basics") {
    if (!d.clientId) e.clientId = "בחר לקוח.";
    if (!d.name.trim()) e.name = "תן לפרויקט שם.";
    else if (d.name.trim().length > 80) e.name = "עד 80 תווים.";
  }
  if (key === "goals") {
    if (!d.goal.trim()) e.goal = "כתוב במשפט אחד מה נחשב הצלחה.";
    if (d.deliverables.length === 0) e.deliverables = "הוסף לפחות תוצר אחד.";
  }
  if (key === "dates") {
    if (!d.ownerId) e.ownerId = "בחר אחראי ראשי. זה השדה היחיד שחובה בשלב הזה.";
    if (d.startDate && d.dueDate && d.dueDate < d.startDate) e.dueDate = "תאריך היעד מוקדם מתאריך ההתחלה.";
    for (const m of d.milestones) {
      if (!m.title.trim() && !m.date) continue;
      if (!m.title.trim()) e[`ms-${m.id}`] = "חסר שם לאבן הדרך.";
      else if (!m.date) e[`ms-${m.id}`] = "חסר תאריך לאבן הדרך.";
      else if (d.startDate && m.date < d.startDate) e[`ms-${m.id}`] = "אבן הדרך לפני תחילת הפרויקט.";
      else if (d.dueDate && m.date > d.dueDate) e[`ms-${m.id}`] = "אבן הדרך אחרי תאריך היעד.";
    }
  }
  if (key === "budget") {
    if (d.hoursBudget.trim() && (!POSITIVE.test(d.hoursBudget.trim()) || Number(d.hoursBudget) <= 0)) e.hoursBudget = "מספר שעות חיובי, או להשאיר ריק.";
    if (d.moneyBudget.trim() && (!POSITIVE.test(d.moneyBudget.trim()) || Number(d.moneyBudget) <= 0)) e.moneyBudget = "סכום חיובי בשקלים, או להשאיר ריק.";
  }
  return e;
}

export type RailStep = { key: WizardStepKey; title: string; hint: string };

/** Step rail: done steps are buttons (go back and edit), the current one is marked, later ones are plain text. */
export function StepRail({ steps, current, reached, onGo }: { steps: RailStep[]; current: number; reached: number; onGo: (i: number) => void }) {
  return (
    <nav className="f-cl-rail" aria-label="שלבי יצירת הפרויקט">
      <ol className="f-cl-rail__list">
        {steps.map((s, i) => {
          const state = i === current ? "current" : i < reached ? "done" : "upcoming";
          const body = (
            <>
              <span className={cx("f-cl-rail__num", `f-cl-rail__num--${state}`)} aria-hidden>{state === "done" ? "✓" : i + 1}</span>
              <span className="f-cl-rail__text">
                <b className="f-cl-rail__title">{s.title}</b>
                <span className="f-cl-rail__hint">{state === "current" ? "עכשיו" : s.hint}</span>
              </span>
              <span className="f-sr">{state === "done" ? " · הושלם" : state === "current" ? " · השלב הנוכחי" : " · עוד לא"}</span>
            </>
          );
          return (
            <li key={s.key} aria-current={i === current ? "step" : undefined}>
              {state === "done"
                ? <button type="button" className="f-cl-rail__item f-cl-rail__item--done" onClick={() => onGo(i)}>{body}</button>
                : <span className={cx("f-cl-rail__item", state === "current" && "f-cl-rail__item--current")}>{body}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** A group of removable chips with an "add" control (native select of the remaining options). */
export function PeopleChips({ label, note, people, selected, onAdd, onRemove, help }: {
  label: string; note?: string; people: Person[]; selected: string[]; onAdd: (id: string) => void; onRemove: (id: string) => void; help?: string;
}) {
  const id = useId();
  const rest = people.filter((p) => !selected.includes(p.id));
  return (
    <fieldset className="f-cl-fieldset" aria-describedby={help ? `${id}-help` : undefined}>
      <legend className="f-field__label">{label}{note && <> <span className="f-field__label-note">{note}</span></>}</legend>
      <div className="f-cl-chips">
        {selected.map((pid) => {
          const p = people.find((x) => x.id === pid);
          return (
            <button key={pid} type="button" className="f-cl-chip f-hit" onClick={() => onRemove(pid)} aria-label={`הסר את ${p?.name ?? pid} מהצוות`}>
              {p?.name ?? pid} <Icon name="x" size={14} />
            </button>
          );
        })}
        {rest.length > 0 && (
          <span className="f-cl-chipadd">
            <select aria-label="הוסף איש צוות" value="" onChange={(e) => { if (e.target.value) onAdd(e.target.value); }} className="f-cl-chipadd__select">
              <option value="">+ הוסף</option>
              {rest.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </span>
        )}
      </div>
      {help && <span id={`${id}-help`} className="f-field__help">{help}</span>}
    </fieldset>
  );
}

/** Free-text chips (deliverables) with suggestions. */
export function TextChips({ label, note, values, suggestions, onChange, error, help, name }: {
  label: string; note?: string; values: string[]; suggestions: string[]; onChange: (v: string[]) => void; error?: string; help: string; name: string;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const add = (v: string) => { const t = v.trim(); if (t && !values.includes(t)) onChange([...values, t]); setText(""); };
  const left = suggestions.filter((s) => !values.includes(s));
  return (
    <fieldset className="f-cl-fieldset" aria-describedby={error ? `${id}-err` : `${id}-help`}>
      <legend className="f-field__label">{label}{note && <> <span className="f-field__label-note">{note}</span></>}</legend>
      {values.length > 0 && (
        <ul className="f-cl-chips" aria-label="תוצרים שנוספו">
          {values.map((v) => (
            <li key={v}><button type="button" className="f-cl-chip f-hit" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`הסר: ${v}`}>{v} <Icon name="x" size={14} /></button></li>
          ))}
        </ul>
      )}
      <div className="f-cl-addrow">
        <input
          name={name} value={text} onChange={(e) => setText(e.target.value)} aria-label="תוצר חדש" aria-invalid={error ? true : undefined}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(e.currentTarget.value); } }}
          placeholder="למשל: סדרת סטוריז" className="f-input f-cl-addrow__input"
        />
        <button type="button" className="f-btn f-btn--neutral" onClick={() => add(text)} disabled={!text.trim()}>הוסף</button>
      </div>
      {left.length > 0 && (
        <div className="f-cl-suggest">
          <span className="f-meta-sm">הצעות:</span>
          {left.map((s) => <button key={s} type="button" className="f-cl-suggest__btn f-hit" onClick={() => add(s)}>+ {s}</button>)}
        </div>
      )}
      {error
        ? <span id={`${id}-err`} className="f-field__error" role="alert"><span aria-hidden>!</span>{error}</span>
        : <span id={`${id}-help`} className="f-field__help">{help}</span>}
    </fieldset>
  );
}

export function MilestoneRows({ rows, errors, min, max, onChange, onAdd, onRemove }: {
  rows: MilestoneDraft[]; errors: WizardErrors; min?: string; max?: string;
  onChange: (id: string, patch: Partial<MilestoneDraft>) => void; onAdd: () => void; onRemove: (id: string) => void;
}) {
  const id = useId();
  return (
    <fieldset className="f-cl-fieldset" aria-describedby={`${id}-help`}>
      <legend className="f-field__label">אבני דרך <span className="f-field__label-note">(לא חובה)</span></legend>
      {rows.length > 0 && (
        <ol className="f-cl-miles">
          {rows.map((m, i) => {
            const err = errors[`ms-${m.id}`];
            return (
              <li key={m.id} className="f-cl-miles__row">
                <div className="f-cl-miles__fields">
                  <input name={`ms-${m.id}`} value={m.title} onChange={(e) => onChange(m.id, { title: e.target.value })} aria-label={`שם אבן דרך ${i + 1}`} aria-invalid={err ? true : undefined} aria-describedby={err ? `${id}-${m.id}-err` : undefined} placeholder="למשל: תוכנית שיווק לאישור" className="f-input f-cl-miles__title" />
                  <input type="date" value={m.date} min={min || undefined} max={max || undefined} onChange={(e) => onChange(m.id, { date: e.target.value })} aria-label={`תאריך אבן דרך ${i + 1}`} aria-invalid={err ? true : undefined} className="f-input f-cl-miles__date" />
                  <button type="button" className="f-iconbtn f-iconbtn--surface" onClick={() => onRemove(m.id)} aria-label={`הסר אבן דרך ${i + 1}`} title="הסר"><Icon name="x" size={16} /></button>
                </div>
                {err && <span id={`${id}-${m.id}-err`} className="f-field__error" role="alert"><span aria-hidden>!</span>{err}</span>}
              </li>
            );
          })}
        </ol>
      )}
      <button type="button" className="f-cl-addlink f-hit" onClick={onAdd}>+ אבן דרך</button>
      <span id={`${id}-help`} className="f-field__help">כל אבן דרך עם שם ותאריך, בין ההתחלה ליעד.</span>
    </fieldset>
  );
}
