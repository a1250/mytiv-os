"use client";

import Link from "next/link";
import { useState } from "react";
import type { Opportunity } from "@/lib/focus/contracts/marketing";
import { OPPORTUNITIES } from "@/lib/focus/fixtures/marketing";
import { fmtDayMonth, fmtRelativeDay, fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { jobStatus } from "@/lib/focus/state/jobs";
import { ConfidenceTag, PlannedAction } from "@/components/focus/patterns/marketing/marketing-parts";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { EmptyState, LoadableView } from "@/components/focus/ui/feedback";
import { SystemLine } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Opportunities & trends (handoff H7): each item says why it is relevant and how confident the match is (symbol +
 * word + basis). "צור רעיון תוכן" opens the studio's new-design flow; "שמור כהשראה" and "לא רלוונטי" are real, with
 * undo; dismissed items can be restored. "רענן" runs as a job (running → done) — never an instant fake.
 */
const FEED = OPPORTUNITIES;
const REFRESH_JOB = "trends-refresh";

export default function MarketingTrendsScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { now, state } = demo;
  const [saved, setSaved] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  const job = state.jobs.find((j) => j.id === REFRESH_JOB && !j.cancelledAt);
  const js = job ? jobStatus(job, state.clock) : null;
  const all = FEED.items.state === "ready" ? FEED.items.data : [];
  const visible = all.filter((o) => !hidden.includes(o.id));
  const hiddenItems = all.filter((o) => hidden.includes(o.id));

  const updated = `עודכן ${fmtRelativeDay(FEED.updatedAt, now)} ${fmtTime(FEED.updatedAt)} מ־${FEED.sourceCount} מקורות.`;

  const toggleSave = (o: Opportunity) => {
    const was = saved.includes(o.id);
    setSaved((xs) => (was ? xs.filter((x) => x !== o.id) : [...xs, o.id]));
    toast.push({
      title: was ? "הוסר מההשראה" : "נשמר כהשראה",
      detail: was ? o.title : `${o.title} · יופיע בהשראה של ${o.client.name}`,
      undo: { onUndo: () => setSaved((xs) => (was ? [...xs, o.id] : xs.filter((x) => x !== o.id))) },
    });
  };
  const dismiss = (o: Opportunity) => {
    setHidden((xs) => [...xs, o.id]);
    toast.push({ title: "סומן כלא רלוונטי", detail: `${o.title} · הוסתר מהרשימה. מנוע השיווק ילמד מזה.`, undo: { onUndo: () => setHidden((xs) => xs.filter((x) => x !== o.id)) } });
  };
  const restore = (o: Opportunity) => setHidden((xs) => xs.filter((x) => x !== o.id));

  return (
    <Page width="narrow" className="f-mk-trends">
      <PageHeader
        size="entity"
        eyebrow={<nav aria-label="מיקום" className="f-mk-crumb"><Link href={R.marketingPlan}>שיווק ותוכן</Link> › <span>הזדמנויות ומגמות</span></nav>}
        title="הזדמנויות השבוע"
        status={<>{visible.length} פריטים חדשים. {updated}</>}
        actions={<>
          {js?.state === "running" && <SystemLine status="processing">בודק מקורות…</SystemLine>}
          {js?.state === "done" && <SystemLine status="done">נבדק ב־{fmtTime(new Date(js.at).toISOString())} · אין פריטים חדשים</SystemLine>}
          {js?.state === "failed" && <SystemLine status="failed">הרענון נכשל. הרשימה הקודמת נשמרה.</SystemLine>}
          <Button variant="neutral" loading={js?.state === "running"} loadingLabel="מרענן…"
            onClick={() => demo.startJob({ id: REFRESH_JOB, kind: "reconnect", label: "בודק מקורות להזדמנויות", detail: "", durationMs: 1600, outcome: "success", href: R.trends })}>
            רענן
          </Button>
        </>}
      />

      <LoadableView value={FEED.items} label="הזדמנויות">
        {() => visible.length === 0 ? (
          <EmptyState title="אין הזדמנויות פתוחות" hint="כל הפריטים סומנו כלא רלוונטיים. אפשר להחזיר אותם למטה." />
        ) : (
          <ul className="f-mk-opps">
            {visible.map((o) => {
              const isSaved = saved.includes(o.id);
              return (
                <li key={o.id} className="f-panel f-mk-opp">
                  <article className="f-mk-opp__body" aria-labelledby={`opp-${o.id}`}>
                    <span className="f-mk-opp__src">{o.source} · {fmtDayMonth(o.publishedAt)}</span>
                    <h2 id={`opp-${o.id}`} className="f-mk-opp__title">{o.title}</h2>
                    <p className="f-mk-opp__why"><b>למה זה רלוונטי:</b> {o.why}</p>
                    <div className="f-mk-opp__tags">
                      <span className="f-mk-opp__client">{o.client.name}</span>
                      <ConfidenceTag level={o.confidence} basis={o.basis} />
                      <span className="f-meta-sm">{o.basis}</span>
                    </div>
                  </article>
                  <div className="f-mk-opp__actions" role="group" aria-label={`פעולות: ${o.title}`}>
                    <ButtonLink href={`${R.studioNew}?from=trend:${o.id}`} variant="secondary" size="sm"><span aria-hidden>✦</span> צור רעיון תוכן</ButtonLink>
                    <PlannedAction className="f-mk-planned--pill f-mk-planned--sm">הוסף לקמפיין</PlannedAction>
                    <Button variant={isSaved ? "secondary" : "neutral"} size="sm" aria-pressed={isSaved} onClick={() => toggleSave(o)}>
                      {isSaved ? <><span aria-hidden>✓</span> נשמר כהשראה</> : "שמור כהשראה"}
                    </Button>
                    <Button variant="quiet" size="sm" className="f-mk-opp__dismiss" onClick={() => dismiss(o)}>לא רלוונטי</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </LoadableView>

      {hiddenItems.length > 0 && (
        <section className="f-mk-opps__hidden" aria-label="פריטים שהוסתרו">
          <Button variant="quiet" size="sm" aria-expanded={showHidden} onClick={() => setShowHidden(!showHidden)}>
            {showHidden ? "הסתר" : "הצג"} {hiddenItems.length} פריטים שסומנו כלא רלוונטיים
          </Button>
          {showHidden && (
            <ul className="f-mk-opps__hlist">
              {hiddenItems.map((o) => (
                <li key={o.id}><span>{o.title}</span><Button variant="link" size="sm" onClick={() => restore(o)}>החזר לרשימה</Button></li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Page>
  );
}
