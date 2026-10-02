"use client";

import Link from "next/link";
import { useState } from "react";
import type { Brief, FormatKey } from "@/lib/focus/contracts/studio";
import { BRIEF_THURSDAY, designById, DIRECTIONS, FORMATS } from "@/lib/focus/fixtures/studio";
import { fmtAgo } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { jobStatus } from "@/lib/focus/state/jobs";
import { DesignPreview } from "@/components/focus/patterns/studio/design-preview";
import { FlowTrail } from "@/components/focus/patterns/studio/new-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { TextAreaField } from "@/components/focus/ui/field";
import { PlannedTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";
import { BRIEF_KEY } from "./studio-new";

/**
 * All formats (handoff E5): the same content composed per format. Chosen formats are ready (or carry a warning that
 * can be fixed here); others can be adapted with a processing job. Checks: a warning never blocks, only an error.
 * "שלח לאישור" sends the chosen formats as ONE approval item — nothing is published before approval.
 */
type Fix = { id: string; format: FormatKey; text: string; fixLabel: string };
const WARNINGS: Fix[] = [{ id: "w-post-size", format: "post", text: "הטקסט המשני בגודל 11px. קשה לקרוא בפיד.", fixLabel: "הגדל ל־14px" }];

export default function StudioFormatsScreen() {
  const demo = useDemo();
  const toast = useToast();
  const design = designById("thursday-sushi")!;
  const brief = (demo.state.drafts[BRIEF_KEY] as Brief | undefined) ?? BRIEF_THURSDAY;
  const chosenDirection = (demo.state.drafts["studio-direction"] as string | undefined) ?? "typo";
  const [fixed, setFixed] = useState<string[]>([]);
  const [caption, setCaption] = useState("חמישי בערב ב־UMINO. סושי, קוקטיילים וחברים, מ־19:00 ועד 22:00. הזמנת שולחן בקישור.");
  const [sent, setSent] = useState(false);
  const warnings = WARNINGS.filter((w) => brief.formats.includes(w.format) && !fixed.includes(w.id));
  const adaptJob = (k: FormatKey) => demo.state.jobs.find((j) => j.id === `adapt-${k}`);

  const card = (k: FormatKey) => {
    const f = FORMATS.find((x) => x.key === k)!;
    const v = design.variants.find((x) => x.format === k);
    const chosen = brief.formats.includes(k);
    const job = adaptJob(k);
    const js = job && !job.cancelledAt ? jobStatus(job, demo.state.clock) : null;
    const adapted = js?.state === "done";
    const warn = warnings.find((w) => w.format === k);
    return (
      <article key={k} className={cx("f-sfmt__card", (chosen || adapted) && "f-sfmt__card--on")} aria-labelledby={`fmt-${k}`}>
        <div className="f-sfmt__stage">
          {(chosen || adapted) && v ? (
            k === "story"
              ? (
                <div className="f-sfmt__storywrap">
                  <nav className="f-sfmt__tools" aria-label="כלי עריכה לסטורי">
                    {["טקסט", "צבע", "יישור", "חיתוך"].map((x) => <Link key={x} href={R.designEdit(design.id)} className="f-sfmt__tool">{x}</Link>)}
                  </nav>
                  <Link href={R.designEdit(design.id)} className="f-sfmt__open" aria-label="פתח את הסטורי בעורך"><DesignPreview variant={v} scale={0.8} label={`${f.label} · ${design.title}`} /></Link>
                </div>
              )
              : <DesignPreview variant={v} scale={0.72} label={`${f.label} · ${design.title}`} />
          ) : (chosen || adapted) ? (
            <span className="f-sfmt__ph f-sfmt__ph--ready" style={{ aspectRatio: `${f.ratio.w} / ${f.ratio.h}` }}>{brief.message}</span>
          ) : (
            <span className="f-sfmt__ph" style={{ aspectRatio: `${f.ratio.w} / ${f.ratio.h}` }} aria-hidden />
          )}
        </div>
        <b id={`fmt-${k}`} className="f-sfmt__name">{f.label}</b>
        <span className="f-meta-sm">{f.hint}</span>
        {chosen || adapted ? (
          warn ? <span className="f-sfmt__warn"><span aria-hidden>◆</span> אזהרה 1</span> : <span className="f-sfmt__ok"><span aria-hidden>✓</span> מוכן</span>
        ) : js?.state === "running" ? (
          <span className="f-sfmt__busy" role="status"><span className="f-spin" aria-hidden>⟳</span> יוצר התאמה…</span>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => demo.startJob({ id: `adapt-${k}`, kind: "ai_directions", label: `יוצר התאמה ל${f.label}`, detail: "", durationMs: 1600, outcome: "success", href: R.design(design.id) })}>
            {js?.state === "failed" ? "נסה שוב" : "צור התאמה"}
          </Button>
        )}
      </article>
    );
  };

  return (
    <div className="f-focusmode f-snew f-sfmt">
      <div className="f-focusbar f-snew__bar" role="banner">
        <Link href={R.studio} className="f-focusbar__exit"><span aria-hidden>✕</span>&nbsp;סגור</Link>
        <b className="f-snew__title">{design.title}</b>
        <FlowTrail steps={["מטרה", "פורמט", "בריף", "כיוון", "עריכה"]} current={4} label="שלבי יצירת התוכן" />
        <span className="f-grow" />
        <span className="f-meta">נשמר {fmtAgo(design.savedAt, demo.now)} · גרסה {design.version - 1}</span>
        <span className="f-sfmt__export">יצוא <PlannedTag /></span>
      </div>
      <div className="f-sfmt__grid">
        <aside className="f-sfmt__left" aria-label="בריף וכיוון">
          <section className="f-panel f-aside-card">
            <h2 className="f-aside-card__h f-aside-card__h--lg">הבריף</h2>
            <p className="f-sfmt__line"><b>מטרה:</b> {brief.goal}</p>
            <p className="f-sfmt__line"><b>הנעה לפעולה:</b> {brief.cta}</p>
            <p className="f-sfmt__line"><b>אסור להמציא:</b> {brief.mustNotInvent.join(", ")}</p>
            <Link href={R.studioNew} className="f-link">ערוך בריף</Link>
          </section>
          <section className="f-panel f-aside-card">
            <h2 className="f-aside-card__h f-aside-card__h--lg">כיוון</h2>
            <div className="f-sfmt__dirs" role="radiogroup" aria-label="כיוון">
              {DIRECTIONS.map((d) => (
                <button key={d.id} type="button" role="radio" aria-checked={chosenDirection === d.id} className="f-sfmt__dir" onClick={() => demo.setDraft("studio-direction", d.id)}>
                  {d.name}{chosenDirection === d.id ? " · נבחר" : ""}
                </button>
              ))}
            </div>
            <p className="f-meta-sm">Brand Kit: <b>UMINO</b> · נבחר לפי הלקוח</p>
            <p className="f-meta-sm">מקור התוכן: קונספט שנוצר ב־AI, הטקסט נערך ע״י דנה</p>
          </section>
        </aside>
        <section className="f-sfmt__center" aria-labelledby="sfmt-h">
          <h1 id="sfmt-h" className="f-sfmt__h">אותו תוכן, בכל מקום שצריך</h1>
          <p className="f-meta">כל פורמט קיבל קומפוזיציה משלו. לחיצה על הסטורי פותחת אותו לעריכה.</p>
          <div className="f-sfmt__formats">{(["story", "post", "square", "banner"] as FormatKey[]).map(card)}</div>
        </section>
        <aside className="f-sfmt__right" aria-label="בדיקות לפני שליחה">
          <section className="f-panel f-aside-card">
            <h2 className="f-aside-card__h f-aside-card__h--lg">לפני שליחה לאישור</h2>
            <span className="f-sfmt__zero">0 חוסמים</span>
            {warnings.map((w) => (
              <div key={w.id} className="f-checkbox f-checkbox--warn">
                <span className="f-checkbox__l">◆ אזהרה · {FORMATS.find((f) => f.key === w.format)?.label}</span>
                <span className="f-checkbox__t">{w.text}</span>
                <button type="button" className="f-checkbox__fix" onClick={() => { setFixed((x) => [...x, w.id]); toast.push({ title: "הטקסט המשני הוגדל ל־14px", detail: "פוסט אנכי", undo: { onUndo: () => setFixed((x) => x.filter((y) => y !== w.id)) } }); }}>{w.fixLabel}</button>
              </div>
            ))}
            <div className="f-checkbox f-checkbox--info"><span className="f-checkbox__l">ℹ המלצה</span><span className="f-checkbox__t">הצילום הוא מקום שמור. אפשר לשלוח לאישור, אבל לא לתזמן.</span></div>
            <ul className="f-checks__pass"><li>✓ יש הנעה לפעולה</li><li>✓ הטקסט בתוך האזור הבטוח</li><li>✓ &quot;19:00–22:00&quot; מאומת במוח העסק</li><li>✓ ניגודיות ואיות תקינים</li></ul>
          </section>
          <section className="f-panel f-aside-card">
            <TextAreaField label="טקסט נלווה" value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} help={`${caption.length} תווים`} />
          </section>
        </aside>
      </div>
      <div className="f-snew__foot">
        <span className="f-sfmt__summary"><b>יישלחו לאישור של רון:</b> {FORMATS.filter((f) => brief.formats.includes(f.key) || adaptJob(f.key)).map((f) => f.label).join(", ")} · טקסט נלווה · מועד מתוכנן: חמישי 18:00</span>
        <span className="f-grow" />
        <span className="f-meta">לא יפורסם דבר לפני אישור</span>
        {sent
          ? <Link href={R.approval("content-sushi-story")} className="f-btn f-btn--secondary"><span aria-hidden>…</span> ממתין לאישור · פתח</Link>
          : <Button variant="primary" size="lg" onClick={() => { setSent(true); toast.push({ title: "נשלח לאישור של רון", detail: "כפריט אחד. דבר לא יפורסם לפני אישור.", undo: { onUndo: () => setSent(false), label: "בטל שליחה" } }); }}>שלח לאישור</Button>}
      </div>
    </div>
  );
}
