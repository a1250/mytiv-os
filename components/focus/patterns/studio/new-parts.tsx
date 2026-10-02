"use client";

import { useId, useState } from "react";
import type { FormatDef, FormatKey } from "@/lib/focus/contracts/studio";
import { cx } from "@/components/focus/ui/cx";

/**
 * New-content building blocks (handoff E3–E5, §6.12): the step trail of the flow, the format selector (plain
 * language, not dimensions; several allowed; at least one required) and an editable tag list.
 */
export function FlowTrail({ steps, current, label }: { steps: string[]; current: number; label: string }) {
  return (
    <ol className="f-flowtrail" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s} className={cx("f-flowtrail__s", i < current && "f-flowtrail__s--done", i === current && "f-flowtrail__s--now")} aria-current={i === current ? "step" : undefined}>
          {i < current ? <><span aria-hidden>✓</span> {s}<span className="f-sr"> · הושלם</span></> : <>{i + 1} {s}</>}
        </li>
      ))}
    </ol>
  );
}

/** Format selector — toggle buttons (aria-pressed); the shape icon shows the ratio. */
export function FormatSelector({ formats, value, onChange, error }: { formats: FormatDef[]; value: FormatKey[]; onChange: (v: FormatKey[]) => void; error?: string | null }) {
  const id = useId();
  return (
    <div className="f-fmt" role="group" aria-labelledby={`${id}-l`} aria-describedby={error ? `${id}-e` : `${id}-h`}>
      <span id={`${id}-l`} className="f-sr">פורמטים</span>
      <div className="f-fmt__grid">
        {formats.map((f) => {
          const on = value.includes(f.key);
          const h = 44, w = Math.round((f.ratio.w / f.ratio.h) * h);
          return (
            <button key={f.key} type="button" aria-pressed={on} className={cx("f-fmt__card", on && "f-fmt__card--on")}
              onClick={() => onChange(on ? value.filter((x) => x !== f.key) : [...value, f.key])}>
              <span className="f-fmt__shape" style={{ width: Math.min(w, 62), height: Math.min(h, 48) }} aria-hidden />
              <b className="f-fmt__label">{f.label}{on && <span aria-hidden> ✓</span>}</b>
              <span className="f-fmt__hint">{f.hint}</span>
            </button>
          );
        })}
      </div>
      {error ? <span id={`${id}-e`} className="f-field__error" role="alert"><span aria-hidden>!</span>{error}</span>
        : <span id={`${id}-h`} className="f-field__help">נבחרו: {value.length ? formats.filter((f) => value.includes(f.key)).map((f) => f.label).join(", ") : "לא נבחר פורמט"} · המידות נקבעות אוטומטית</span>}
    </div>
  );
}

/** Removable tags with an add field (e.g. "חייב להופיע", "אסור להמציא"). */
export function TagList({ label, items, onChange, tone = "neutral", addLabel = "+ הוסף" }: { label: string; items: string[]; onChange: (v: string[]) => void; tone?: "neutral" | "risk"; addLabel?: string }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const id = useId();
  return (
    <div className="f-field">
      <span className="f-field__label" id={`${id}-l`}>{label}</span>
      <ul className="f-tags" aria-labelledby={`${id}-l`}>
        {items.map((t) => (
          <li key={t} className={cx("f-tag", tone === "risk" && "f-tag--risk")}>
            {t}
            <button type="button" className="f-tag__x" aria-label={`הסר: ${t}`} onClick={() => onChange(items.filter((x) => x !== t))}>✕</button>
          </li>
        ))}
        <li>
          {adding ? (
            <form className="f-tags__add" onSubmit={(e) => { e.preventDefault(); const v = text.trim(); if (v && !items.includes(v)) onChange([...items, v]); setText(""); setAdding(false); }}>
              <label htmlFor={`${id}-i`} className="f-sr">{label} · פריט חדש</label>
              <input id={`${id}-i`} className="f-input f-input--sm" autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { setAdding(false); setText(""); } }} />
              <button type="submit" className="f-btn f-btn--neutral f-btn--sm">הוסף</button>
            </form>
          ) : (
            <button type="button" className="f-tag f-tag--add" onClick={() => setAdding(true)}>{addLabel}</button>
          )}
        </li>
      </ul>
    </div>
  );
}
