"use client";

import Link, { useFocusRouter } from "@/components/focus/ui/link";
import { useEffect, useState } from "react";
import type { Brief, Direction, FormatVariant } from "@/lib/focus/contracts/studio";
import { BRIEF_THURSDAY, designById, DIRECTIONS } from "@/lib/focus/fixtures/studio";
import { R } from "@/lib/focus/routes";
import { jobStatus } from "@/lib/focus/state/jobs";
import { DesignPreview } from "@/components/focus/patterns/studio/design-preview";
import { FlowTrail } from "@/components/focus/patterns/studio/new-parts";
import { useDemo, useTicker } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { OriginTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";
import { BRIEF_KEY, STEPS } from "./studio-new";

/**
 * Directions (handoff E4, prototype flow 4): each AI direction is a processing job — running (progress, time left,
 * cancel), done (preview + "בחר וערוך"), failed or cancelled (the others are kept; retry). The user may leave and is
 * notified when a direction is ready. Previews are rendered from the brief + the design fixture.
 */
function variantFor(base: FormatVariant, d: Direction, brief: Brief): FormatVariant {
  const layers = base.layers.map((l) => l.id === "headline" ? { ...l, text: d.style === "direct" ? d.headline.replace(". ", ".\n") : brief.message.replace(" מתחיל", "\nמתחיל") }
    : l.id === "cta" ? { ...l, text: brief.cta } : l.id === "sub" ? { ...l, text: `${brief.secondary} · 19:00–22:00` } : l);
  if (d.style === "direct") return { ...base, background: "#c4462e", layers: layers.map((l) => (l.id === "photo" ? { ...l, style: { ...l.style, pattern: ["#d8604a", "#c4462e"] as [string, string] } } : l)) };
  return { ...base, layers };
}

export default function StudioDirectionsScreen() {
  const demo = useDemo();
  const toast = useToast();
  const router = useFocusRouter();
  const brief = (demo.state.drafts[BRIEF_KEY] as Brief | undefined) ?? BRIEF_THURSDAY;
  const design = designById("thursday-sushi")!;
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const jobs = DIRECTIONS.map((d) => demo.state.jobs.find((j) => j.id === `ai-dir-${d.id}`));
  const anyRunning = jobs.some((j) => j && !j.cancelledAt && jobStatus(j, demo.state.clock).state === "running");
  const tick = Math.max(useTicker(anyRunning, 500), demo.state.clock);

  // arriving without a run (deep link): start the simulated generation once
  const missing = demo.hydrated && jobs.every((j) => !j);
  useEffect(() => {
    if (!missing) return;
    DIRECTIONS.forEach((d) => demo.startJob({ id: `ai-dir-${d.id}`, kind: "ai_directions", label: `יוצר כיוון ${d.name}`, detail: "", durationMs: d.durationMs, outcome: d.outcome, href: R.studioDirections }));
  }, [missing, demo]);

  const retry = (d: Direction) => demo.startJob({ id: `ai-dir-${d.id}`, kind: "ai_directions", label: `יוצר כיוון ${d.name}`, detail: "", durationMs: Math.min(d.durationMs, 4000), outcome: "success", href: R.studioDirections });
  const choose = (d: Direction) => { demo.setDraft("studio-direction", d.id); toast.push({ title: `נבחר כיוון: ${d.name}`, detail: "ממשיכים לעריכה בכל הפורמטים." }); router.push(R.design("thursday-sushi")); };

  return (
    <div className="f-focusmode f-snew f-sdir">
      <div className="f-focusbar f-snew__bar" role="banner">
        <Link href={R.studio} className="f-focusbar__exit"><span aria-hidden>✕</span>&nbsp;סגור</Link>
        <b className="f-snew__title">{design.title}</b>
        <FlowTrail steps={STEPS} current={3} label="שלבי יצירת התוכן" />
        <span className="f-grow" />
      </div>
      <div className="f-sdir__body">
        <div className="f-sdir__head">
          <div>
            <h1 className="f-sdir__h">שלושה כיוונים</h1>
            <p className="f-meta f-sdir__lead">כל כיוון שונה בגישה, לא רק בצבע. בוחרים אחד וממשיכים לעריכה, או מבקשים גרסה דומה.</p>
          </div>
          <Link href={R.studioNew} className="f-btn f-btn--neutral f-btn--sm">ערוך בריף</Link>
        </div>
        <div className="f-sdir__grid">
          {DIRECTIONS.map((d, i) => {
            const j = jobs[i];
            const st = j ? (j.cancelledAt ? { state: "cancelled" as const } : jobStatus(j, tick)) : { state: "running" as const, progress: 0, step: 0 };
            const story = variantFor(design.variants[0], d, brief);
            if (st.state === "running") {
              const left = j ? Math.max(1, Math.ceil((j.startedAt + j.durationMs - tick) / 1000)) : null;
              return (
                <article key={d.id} className="f-panel f-sdir__card f-sdir__card--busy" aria-busy="true" aria-labelledby={`dir-${d.id}`}>
                  <div className="f-sdir__busy" role="status">
                    <span className="f-sdir__spinner" aria-hidden />
                    <b>⟳ יוצר כיוון · {d.name}</b>
                    <span className="f-meta">יסתמך על: {d.basis}{left ? ` עוד כ־${left} שניות.` : ""}</span>
                    <span className="f-meta-sm">אפשר להמשיך לעבוד על הכיוונים האחרים. אם זה ייכשל, האחרים נשמרים.</span>
                    {j && <Button variant="neutral" size="sm" onClick={() => demo.cancelJob(j.id)}>בטל כיוון זה</Button>}
                  </div>
                  <h2 id={`dir-${d.id}`} className="f-sdir__name">{d.name}</h2>
                </article>
              );
            }
            if (st.state === "failed" || st.state === "cancelled") {
              return (
                <article key={d.id} className="f-panel f-sdir__card f-sdir__card--fail" aria-labelledby={`dir-${d.id}`}>
                  <div className="f-sdir__busy" role={st.state === "failed" ? "alert" : "status"}>
                    <b>{st.state === "failed" ? "! הכיוון לא נוצר" : "הכיוון בוטל"}</b>
                    <span className="f-meta">{st.state === "failed" ? "הבריף והכיוונים האחרים נשמרו." : "שני הכיוונים האחרים זמינים."}</span>
                    <Button variant="secondary" size="sm" onClick={() => retry(d)}>נסה שוב</Button>
                  </div>
                  <h2 id={`dir-${d.id}`} className="f-sdir__name">{d.name}</h2>
                </article>
              );
            }
            return (
              <article key={d.id} className={cx("f-panel", "f-sdir__card", i === 1 && "f-sdir__card--pick")} aria-labelledby={`dir-${d.id}`}>
                <div className="f-sdir__previews">
                  <DesignPreview variant={story} scale={0.4} label={`${d.name} · סטורי`} />
                  <DesignPreview variant={{ ...design.variants[1], background: story.background, layers: design.variants[1].layers.map((l) => l.id === "headline" ? { ...l, text: d.headline } : l) }} scale={0.56} label={`${d.name} · פוסט אנכי`} />
                </div>
                <div className="f-sdir__meta">
                  <h2 id={`dir-${d.id}`} className="f-sdir__name">{d.name}</h2>
                  <OriginTag origin="ai_concept" size="sm" />
                </div>
                <p className="f-meta">הסתמך על: {d.basis}</p>
                <div className="f-sdir__actions">
                  <Button variant={i === 1 ? "primary" : "secondary"} onClick={() => choose(d)}>בחר וערוך</Button>
                  <Button variant="neutral" onClick={() => { retry(d); toast.push({ title: `מכין גרסה דומה ל"${d.name}"`, detail: "הכיוון הנוכחי יוחלף כשהגרסה תהיה מוכנה." }); }}>גרסה דומה</Button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="f-sdir__note">
          <span><b>מה AI לא עשה:</b> לא הוסיף מחירים, מבצעים או ציטוטים. התמונות הן מקום שמור לצילום אמיתי מהספרייה.</span>
          <span className="f-grow" />
          <span className="f-meta">משוב על הכיוונים:</span>
          <div className="f-aside-card__fb" role="group" aria-label="משוב על הכיוונים">
            <button type="button" className="f-chip-sm" aria-pressed={feedback === "up"} onClick={() => setFeedback(feedback === "up" ? null : "up")}>מתאים</button>
            <button type="button" className="f-chip-sm" aria-pressed={feedback === "down"} onClick={() => setFeedback(feedback === "down" ? null : "down")}>לא מתאים</button>
          </div>
        </div>
      </div>
    </div>
  );
}
