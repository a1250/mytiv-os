"use client";

import { useId, useState } from "react";
import type { BuilderProposal, RefineKey } from "@/lib/focus/contracts/plan";
import { REFINE_WORD, copyState, directionFlags, variantConforms } from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { DemoNote } from "./plan-parts";
import type { PlanApi } from "./use-plan";

/**
 * The Copy Builder (spec §8): three genuinely different Move Message Directions — core promise, proof points, tone,
 * CTA intent and a one-line why — compared side by side. The user chooses one; the variants beneath it (Meta: warm /
 * lookalike / cold; Google: per ad group) adapt hook, proof, wording and CTA but never the promise. Refine with plain
 * controls, ask for three new directions, or combine a part of another direction. No prompt box, no dozens of drafts.
 * V1: the directions and variants are fixtures; nothing calls a model.
 */
const REFINES: RefineKey[] = ["shorter", "warmer", "more_proof", "lead_offer"];

export function CopyDirections({ b, plan, editable }: { b: BuilderProposal; plan: PlanApi; editable: boolean }) {
  const id = useId();
  const cs = copyState(b, plan.overlay);
  const [open, setOpen] = useState(false);
  return (
    <section id="copy" className="f-pl-dcard f-pl-dcard--copy" aria-labelledby={`${id}-h`} tabIndex={-1}>
      <div className="f-pl-creative__head">
        <h2 id={`${id}-h`} className="f-pl-dcard__label">איזה מסר · {cs.chosen ? `נבחר: ${cs.chosen.name}` : "בחרו כיוון אחד מתוך שלושה"}</h2>
        {!cs.chosen && <span className="f-pl-amber">לא נבחר כיוון</span>}
      </div>
      <ul className="f-pl-dirs" aria-label="שלושה כיווני מסר">
        {cs.directions.map((d) => {
          const chosen = cs.chosen?.id === d.id;
          const flags = directionFlags(d);
          return (
            <li key={d.id} className={cx("f-pl-dir", chosen && "f-pl-dir--on")}>
              <div className="f-pl-dir__head">
                <b className="f-pl-dir__name">{d.name}</b>
                {chosen && <span className="f-pl-chip f-pl-chip--accent f-pl-chip--sm">נבחר</span>}
              </div>
              <p className="f-pl-dir__promise">{d.promise}</p>
              <dl className="f-pl-dir__spine">
                <dt>הוכחה</dt><dd>{d.proof.join(" · ")}</dd>
                <dt>טון</dt><dd>{d.tone}</dd>
                <dt>קריאה לפעולה</dt><dd>{d.cta}</dd>
              </dl>
              <p className="f-pl-meta f-pl-dir__why"><b>למה:</b> {d.why}</p>
              {flags.map((f) => <p key={f} className="f-pl-note f-pl-note--amber f-pl-dir__flag"><b>לאימות:</b> {f}</p>)}
              <div className="f-pl-dir__acts">
                {editable
                  ? <Button size="sm" variant={chosen ? "secondary" : "strong"} block onClick={() => plan.chooseDirection(b.id, d.id)} disabled={chosen} disabledReason={chosen ? "זה הכיוון שנבחר" : undefined}>{chosen ? "נבחר" : "בחר כיוון זה"}</Button>
                  : <span className="f-pl-meta">{chosen ? "הכיוון שנבחר" : "לא נבחר"}</span>}
                {editable && cs.chosen && !chosen && (
                  <button type="button" className="f-pl-linkbtn f-hit" onClick={() => plan.combineInto(b.id, `${d.name}: ${d.proof[0]}`)} aria-pressed={cs.combined.includes(`${d.name}: ${d.proof[0]}`)}>
                    {cs.combined.includes(`${d.name}: ${d.proof[0]}`) ? "הוסר שילוב" : "שלב את ההוכחה"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {editable && (
        <div className="f-pl-dir__tools">
          <Button size="sm" variant="quiet" onClick={() => plan.askNewDirections(b.id)} disabled={!cs.canAskNew} disabledReason={cs.canAskNew ? undefined : "אין כיוונים נוספים בהדגמה זו"}>
            {plan.overlay.copy[b.id]?.set === "alt" ? "חזרה לשלושת הכיוונים הראשונים" : "3 כיוונים חדשים"}
          </Button>
          {cs.chosen && (
            <div className="f-pl-chips" role="group" aria-label="חידוד הכיוון שנבחר">
              {REFINES.map((k) => (
                <button key={k} type="button" className={cx("f-pl-kw", "f-pl-kw--btn", cs.refinements.includes(k) && "f-pl-kw--on")} aria-pressed={cs.refinements.includes(k)} onClick={() => plan.toggleRefine(b.id, k)}>{REFINE_WORD[k]}</button>
              ))}
            </div>
          )}
          <DemoNote>הכיוונים והגרסאות הם נתוני הדגמה; שום מודל לא נקרא ואין תיבת פרומפט</DemoNote>
        </div>
      )}
      {cs.chosen && (
        <div className="f-pl-variants">
          <button type="button" className="f-pl-details__row f-hit f-pl-variants__toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <span><b>הגרסאות מתחת לכיוון</b> <span className="f-pl-meta">· {cs.variants.length} {b.channel === "meta" ? "לפי קרבת הקהל" : "לפי קבוצת מודעות"}</span></span>
            <span className="f-pl-meta" aria-hidden>{open ? "▾" : "›"}</span>
          </button>
          {cs.combined.length > 0 && <p className="f-pl-meta">משולב: {cs.combined.join(" · ")} — ההבטחה של הכיוון שנבחר נשמרת.</p>}
          {open && (
            <ul className="f-pl-variants__list">
              {cs.variants.map((v) => {
                const c = variantConforms(v, cs.chosen!);
                return (
                  <li key={v.id} className="f-pl-variant">
                    <div className="f-pl-variant__head"><b>{v.slotLabel}</b><span className="f-pl-meta">{v.audience}</span></div>
                    <p className="f-pl-variant__hook">{v.hook}</p>
                    <p className="f-pl-variant__body">{v.body}</p>
                    <p className="f-pl-meta">כותרת: {v.headline} · כפתור: {v.cta}</p>
                    {!c.ok && <p className="f-pl-red">{c.reason}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
