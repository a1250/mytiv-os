"use client";

import { useFocusRouter } from "@/components/focus/ui/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { CREATE_MOVE_NEEDS, PLAN_OCTOBER } from "@/lib/focus/fixtures/plan";
import { fmtMoney } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { unscopedPath } from "@/lib/focus/scope";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { cx } from "@/components/focus/ui/cx";
import { useToast } from "@/components/focus/ui/toast";
import { useFocusScope } from "@/components/focus/shell/scope";
import { Num } from "./plan-parts";
import { priorityOf } from "./plan-view";
import { usePlan } from "./use-plan";

/**
 * Create Move (design package #s8): opened from a Plan need, never from a blank form. The person picks a channel —
 * each option with its reason and expected contribution — sees what the builder already knows (Plan, Brain, Asset
 * Library, earlier moves), and either saves the move as planned or asks Mytiv to prepare a full proposal in that
 * channel's builder. Nothing goes live from here.
 */
const FLOW = ["נושא", "יעד", "צורך בתוכנית", "יצירת מהלך", "בחירת ערוץ", "בונה", "בדיקה", "אישור", "מוכן"];

export function CreateMovePanel({ view }: { view: "overview" | "moves" }) {
  const sp = useSearchParams();
  const needId = sp.get("create");
  const need = CREATE_MOVE_NEEDS.find((n) => n.needId === needId);
  const router = useFocusRouter();
  const path = unscopedPath(useFocusScope().base, usePathname());
  const close = () => {
    const q = new URLSearchParams(sp.toString());
    q.delete("create");
    const s = q.toString();
    router.replace(s ? `${path}?${s}` : path);
  };
  return (
    <Dialog open={!!need} onClose={close} variant="drawer" labelledBy="cm-title" className="f-pl-panel f-pl-panel--create" initialFocus="input[type=radio]:checked">
      {need && <Body key={need.needId} needId={need.needId} onClose={close} view={view} />}
    </Dialog>
  );
}

function Body({ needId, onClose, view }: { needId: string; onClose: () => void; view: "overview" | "moves" }) {
  const need = CREATE_MOVE_NEEDS.find((n) => n.needId === needId)!;
  const plan = usePlan();
  const toast = useToast();
  const router = useFocusRouter();
  const pp = PLAN_OCTOBER.priorities.find((p) => p.needs.some((n) => n.id === needId))!;
  const [choice, setChoice] = useState(need.options.find((o) => o.recommended)?.moveId ?? need.options[0].moveId);
  const [details, setDetails] = useState(false);
  const [others, setOthers] = useState(false);
  const id = useId();
  const opt = need.options.find((o) => o.moveId === choice)!;
  const already = plan.f.proposed.find((m) => m.id === opt.moveId);
  const inPlanAlready = already && plan.overlay.moveStates[opt.moveId];

  const savePlanned = () => {
    if (!plan.setMoveState(opt.moveId, "planned")) { toast.push({ kind: "error", title: "המהלך כבר בתוכנית", detail: "אפשר להמשיך אותו מהמפה." }); return; }
    toast.push({ kind: "success", title: `${opt.label} נשמר כמתוכנן`, detail: `${priorityOf(pp.priorityId).name} · כיסוי מתוכנן עודכן` });
    onClose();
  };
  const prepare = () => {
    if (!opt.builderId) return;
    plan.setMoveState(opt.moveId, "building");
    router.push(R.planBuilder(opt.builderId));
  };

  return (
    <div className="f-pl-panel__wrap">
      <div className="f-pl-panel__head">
        <div className="f-pl-panel__crumbrow">
          <span className="f-pl-meta">תוכנית אוקטובר › {priorityOf(pp.priorityId).name}</span>
          <button type="button" className="f-pl-x f-hit" aria-label="סגירה" onClick={onClose}>×</button>
        </div>
        <h2 id="cm-title" className="f-pl-panel__title">{need.title}</h2>
        <p className="f-pl-panel__lead">{need.lead}</p>
        <ol className="f-pl-flow" aria-label="שלבי יצירת מהלך">
          {FLOW.map((s, i) => <li key={s} className={cx(i === 3 || i === 4 ? "f-pl-flow__now" : i < 3 ? "f-pl-flow__done" : undefined)} aria-current={i === 4 ? "step" : undefined}>{s}</li>)}
        </ol>
      </div>
      <div className="f-pl-panel__body">
        <fieldset className="f-pl-opts">
          <legend className="f-sr">בחירת ערוץ</legend>
          {need.options.map((o) => (
            <label key={o.moveId} className={cx("f-pl-opt", choice === o.moveId && "f-pl-opt--on")}>
              <input type="radio" name={`${id}-ch`} value={o.moveId} checked={choice === o.moveId} onChange={() => setChoice(o.moveId)} className="f-pl-opt__radio" />
              <span className="f-pl-opt__main">
                <span className="f-pl-opt__title"><b>{o.label}</b>{o.recommended && <span className="f-pl-chip f-pl-chip--accent">מומלץ</span>}</span>
                <span className="f-pl-meta">{o.why}</span>
              </span>
              <span className="f-pl-opt__est"><b><Num>~{o.expected}</Num> הזמנות</b><span className="f-pl-meta">~<Num>{fmtMoney(o.cost)}</Num></span></span>
            </label>
          ))}
          <button type="button" className="f-pl-linkbtn f-hit" aria-expanded={others} onClick={() => setOthers((v) => !v)}>ערוץ אחר <span aria-hidden>▾</span> <span className="f-pl-meta">· {need.others.join(", ")}</span></button>
          {others && <p className="f-pl-meta f-pl-others">ל־{need.others.join(", ")} אין עדיין בונה (V1). אפשר להוסיף אותם כמהלך מתוכנן מתוך מפת המהלכים בהמשך; ההצעות למעלה כבר מוכנות.</p>}
        </fieldset>

        <section className="f-pl-knows" aria-labelledby={`${id}-k`}>
          <div className="f-pl-knows__head"><b id={`${id}-k`}>מה הבונה כבר יודע</b><button type="button" className="f-pl-linkbtn f-hit" aria-expanded={details} onClick={() => setDetails((v) => !v)}>פרטים <span aria-hidden>▾</span></button></div>
          <dl className="f-pl-knows__grid">
            <dt>תוכנית</dt><dd>{need.inherited.plan}</dd>
            <dt>מוח העסק</dt><dd>{need.inherited.brain}</dd>
            <dt>ספריית נכסים</dt><dd>{need.inherited.assets}</dd>
            <dt>מהלכים קודמים</dt><dd>{need.inherited.earlier}</dd>
            {details && <>
              <dt>סוג</dt><dd>{need.autoFilled.type}</dd>
              <dt>מטרה</dt><dd>{need.autoFilled.purpose}</dd>
              <dt>תאריכים</dt><dd>{need.autoFilled.dates}</dd>
              <dt>בעלים</dt><dd>{need.autoFilled.owner}</dd>
            </>}
          </dl>
        </section>

        {need.approvalNote && opt.cost > 0 && <p className="f-pl-note f-pl-note--amber"><span aria-hidden>● </span>{need.approvalNote}</p>}
        {inPlanAlready && <p className="f-pl-note">המהלך כבר בתוכנית ({inPlanAlready === "planned" ? "מתוכנן" : "בבנייה"}).</p>}
      </div>
      <div className="f-pl-panel__foot">
        <span className="f-pl-meta f-pl-panel__footnote">Mytiv יכין הצעה מלאה. שום דבר לא יעלה בלי אישור.</span>
        <Button variant="quiet" onClick={savePlanned}>שמור כמתוכנן</Button>
        {opt.builderId
          ? <Button variant="strong" onClick={prepare}>הכן הצעה ב־{opt.channelWord}</Button>
          : <Button variant="strong" disabled disabledReason="אין עדיין בונה לערוץ הזה · שמור כמתוכנן">הכן הצעה</Button>}
      </div>
      <span className="f-sr">{view === "moves" ? "נפתח ממפת המהלכים" : "נפתח מסקירת התוכנית"}</span>
    </div>
  );
}
