"use client";

import Link from "next/link";
import { useState } from "react";
import type { StudioFilter, StudioItem, StudioStage } from "@/lib/focus/contracts/marketing";
import { RECENT_ASSETS, START_FROM, STUDIO_ITEMS } from "@/lib/focus/fixtures/marketing";
import { CLIENTS, personName } from "@/lib/focus/fixtures/people";
import { designById, FORMATS } from "@/lib/focus/fixtures/studio";
import { fmtAgo } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { jobStatus } from "@/lib/focus/state/jobs";
import { DesignThumb, PhotoPlaceholder, PlannedAction, ratioBox, StageTag, Swatch } from "@/components/focus/patterns/marketing/marketing-parts";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { ButtonLink } from "@/components/focus/ui/button";
import { EmptyState } from "@/components/focus/ui/feedback";
import { SelectField } from "@/components/focus/ui/field";
import { PlannedTag } from "@/components/focus/ui/status";
import { Chips } from "@/components/focus/ui/tabs";

/**
 * Studio home (handoff E2): what to create (formats in plain language → the new-design flow), recent work filtered by
 * stage and client, and "start from something existing". Thumbnails render the real design when one exists. The
 * stage of a design under approval is read live from the demo store (decision + Meta scheduling job).
 */
const BUCKET: Record<StudioStage, StudioFilter> = {
  draft: "drafts", changes_requested: "drafts", blocked: "drafts", pending: "pending", approved: "approved",
  exported: "out", scheduled: "out", published: "out",
};
const FILTERS: { key: StudioFilter; label: string }[] = [
  { key: "drafts", label: "טיוטות" }, { key: "pending", label: "ממתין לאישור" }, { key: "approved", label: "מאושר" }, { key: "out", label: "יוצא / פורסם" },
];
/** the design under approval in this demo (E7 publishes it) */
const LIVE: Record<string, { approvalId: string; jobs: string[] }> = {
  "s-sushi": { approvalId: "content-sushi-story", jobs: ["publish-thursday-sushi", "schedule-content-sushi-story"] },
};

export default function MarketingStudioHomeScreen() {
  const { now, approval, state } = useDemo();
  const [filter, setFilter] = useState<StudioFilter>("drafts");
  const [client, setClient] = useState("all");

  const stageOf = (it: StudioItem): StudioStage => {
    const live = LIVE[it.id];
    if (!live) return it.stage;
    const job = state.jobs.filter((j) => live.jobs.includes(j.id) && !j.cancelledAt).sort((a, b) => b.startedAt - a.startedAt)[0];
    if (job && jobStatus(job, state.clock).state === "done") return "scheduled";
    const s = approval(live.approvalId)?.status;
    return s === "approved" ? "approved" : s === "changes_requested" ? "changes_requested" : s === "rejected" || s === "draft" ? "draft" : "pending";
  };
  const items = STUDIO_ITEMS.map((it) => ({ ...it, stage: stageOf(it) })).filter((it) => client === "all" || it.client.id === client);
  const count = (f: StudioFilter) => items.filter((it) => BUCKET[it.stage] === f).length;
  const shown = items.filter((it) => BUCKET[it.stage] === filter);
  const all = STUDIO_ITEMS.map((it) => ({ ...it, stage: stageOf(it) }));
  const inWork = all.filter((it) => BUCKET[it.stage] === "drafts").length;
  const pending = all.filter((it) => BUCKET[it.stage] === "pending").length;

  return (
    <Page className="f-mk-studio">
      <PageHeader
        size="page"
        eyebrow={<nav aria-label="מיקום" className="f-mk-crumb"><Link href={R.marketingPlan}>שיווק ותוכן</Link> › <span>סטודיו תוכן</span></nav>}
        title="סטודיו תוכן"
        status={`${inWork} תכנים בעבודה, ${pending} ממתינים לאישור.`}
        actions={<>
          <PlannedAction className="f-mk-planned--pill">Brand Kits</PlannedAction>
          <ButtonLink href={R.inspiration} variant="outline">השראה ומודבורדים</ButtonLink>
        </>}
      />

      <section className="f-panel f-mk-create" aria-labelledby="create-h">
        <h2 id="create-h" className="f-mk-create__h">מה ליצור?</h2>
        <ul className="f-mk-create__grid">
          {FORMATS.filter((f) => f.key !== "custom").map((f) => (
            <li key={f.key}>
              <Link href={`${R.studioNew}?format=${f.key}`} className="f-mk-format">
                {f.key === "carousel"
                  ? <span className="f-mk-format__slides" aria-hidden><span /><span /><span /></span>
                  : <span className="f-mk-format__shape" style={ratioBox(f.ratio, 86, 60)} aria-hidden />}
                <b>{f.label}</b>
                <span className="f-meta-sm">{f.hint}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href={`${R.studioNew}?format=multi`} className="f-mk-format f-mk-format--multi">
              <b>כמה פורמטים</b>
              <span className="f-meta-sm">בריף אחד, כל הגדלים</span>
            </Link>
          </li>
        </ul>
        <p className="f-meta">וידאו, Reels ואנימציה יגיעו בשלב מאוחר יותר. <PlannedTag /></p>
      </section>

      <div className="f-mk-studio__grid">
        <section className="f-mk-studio__recent" aria-labelledby="recent-h">
          <h2 id="recent-h" className="f-sr">תכנים אחרונים</h2>
          <div className="f-mk-studio__bar">
            <Chips label="סינון לפי שלב" value={filter} onChange={setFilter} items={FILTERS.map((f) => ({ key: f.key, label: f.label, count: count(f.key) }))} />
            <span className="f-grow" />
            <SelectField label="לקוח" labelClassName="f-sr" className="f-mk-studio__client" inputClassName="f-input--sm" value={client} onChange={(e) => setClient(e.target.value)}
              options={[{ value: "all", label: "לקוח: כולם" }, ...Object.values(CLIENTS).map((x) => ({ value: x.id, label: x.name }))]} />
          </div>
          {shown.length === 0 ? (
            <EmptyState title="אין תכנים בשלב הזה" hint={client === "all" ? "כשתוכן יגיע לשלב הזה הוא יופיע כאן." : "נסו לקוח אחר או את כל הלקוחות."} />
          ) : (
            <ul className="f-mk-studio__cards">
              {shown.map((it) => <li key={it.id}><StudioCard it={it} now={now} /></li>)}
            </ul>
          )}
        </section>

        <aside className="f-mk-studio__aside" aria-label="להתחיל ממשהו קיים ונכסים">
          <section className="f-panel f-mk-side" aria-labelledby="from-h">
            <h2 id="from-h" className="f-mk-side__h">להתחיל ממשהו קיים</h2>
            <ul className="f-mk-side__list">
              {START_FROM.map((s) => (
                <li key={s.id}>
                  {s.href
                    ? <Link href={s.href} className="f-mk-side__item">{s.label}{s.detail && ` · ${s.detail}`}</Link>
                    : <span className="f-mk-side__item f-mk-side__item--planned">{s.label}{s.detail && ` · ${s.detail}`} <PlannedTag /></span>}
                </li>
              ))}
            </ul>
          </section>
          <section className="f-panel f-mk-side" aria-labelledby="assets-h">
            <h2 id="assets-h" className="f-mk-side__h">נכסים אחרונים</h2>
            <ul className="f-mk-side__assets">
              {RECENT_ASSETS.items.map((a) => <li key={a.id} title={a.label}><Swatch swatch={a.swatch} className="f-mk-side__asset" /><span className="f-sr">{a.label}</span></li>)}
            </ul>
            <span className="f-meta">{RECENT_ASSETS.note}</span>
          </section>
        </aside>
      </div>
    </Page>
  );
}

function StudioCard({ it, now }: { it: StudioItem; now: string }) {
  const design = it.designId ? designById(it.designId) : undefined;
  const thumb = design ? (
    <div className="f-mk-scard__media f-mk-scard__media--design" style={{ background: design.variants[0].background }}>
      <DesignThumb designId={design.id} format={it.format} fitHeight={150} label={`${it.title} · תצוגה מקדימה`} />
    </div>
  ) : it.format === "banner"
    ? <div className="f-mk-scard__media f-mk-scard__media--wide" aria-hidden><span /></div>
    : <PhotoPlaceholder label={it.thumbLabel ?? FORMATS.find((f) => f.key === it.format)?.label} height={170} align="center" className="f-mk-scard__media" />;
  const body = (
    <>
      {thumb}
      <span className="f-mk-scard__body">
        <b className="f-mk-scard__title">{it.title}</b>
        <span className="f-mk-scard__meta">{it.client.name} · <StageTag stage={it.stage} note={it.note} /> · {it.stage === "blocked" ? personName(it.ownerId) : fmtAgo(it.updatedAt, now)}</span>
      </span>
    </>
  );
  return it.href ? <Link href={it.href} className="f-mk-scard f-mk-scard--link">{body}</Link> : <div className="f-mk-scard">{body}</div>;
}
