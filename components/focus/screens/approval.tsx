"use client";

import { useFocusRouter } from "@/components/focus/ui/link";
import { useCallback, useEffect, useState } from "react";
import type { Approval, DecisionOutcome } from "@/lib/focus/contracts/approvals";
import { designById } from "@/lib/focus/fixtures/studio";
import { fmtAgo, fmtDayMonth, fmtTime, fmtWaiting, fmtWeekday } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { initialExec } from "@/lib/focus/state/execution";
import { plainShortcut } from "@/lib/focus/state/keyboard";
import { ApprovalHead, ChangeTable, FactLines, FactsSplit, ImpactTiles, MobileSummary, QueueSide, WhyBlock, type QueueEntry } from "@/components/focus/patterns/approval/approval-parts";
import { ContentReviewPanel } from "@/components/focus/patterns/approval/content-review";
import { DecisionBlock, type DecisionResult } from "@/components/focus/patterns/approval/decision-block";
import { PreExecSummary } from "@/components/focus/patterns/approval/pre-exec";
import { DesignPreview } from "@/components/focus/patterns/studio/design-preview";
import { savedTotal } from "@/components/focus/patterns/sales/proposal-editor";
import { useSales } from "@/components/focus/patterns/sales/sales-store";
import { PROPOSAL_CORPORATE } from "@/lib/focus/fixtures/sales";
import { fmtMoney } from "@/lib/focus/format";
import { useDemo } from "@/components/focus/shell/demo-store";
import { FocusBar } from "@/components/focus/shell/focus-bar";
import { useQueue } from "@/components/focus/shell/use-queue";
import { cx } from "@/components/focus/ui/cx";
import { Chips } from "@/components/focus/ui/tabs";
import { ApprovalPill, OriginTag, riskText, RiskPill } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";
import { useNavGuard, useNavGuardAttempt } from "@/components/focus/shell/nav-guard";

/**
 * Approval in focus mode (handoff D5 medium decision · D6 pre-execution summary · D7 content review; mobile M3/M4/M8).
 * One item at a time: progress "אישור N מתוך M", the queue beside it, exit at any moment (decided items stay decided,
 * the rest stay in the queue), J = next. Decisions, sending and undo all run on the demo store.
 */
export default function ApprovalScreen({ id }: { id: string }) {
  const demo = useDemo();
  const toast = useToast();
  const router = useFocusRouter();
  const q = useQueue();
  const a = demo.approval(id)!;
  const ordered = q.ordered;
  const idx = ordered.findIndex((x) => x.id === id);
  const done = ordered.filter((x) => x.status !== "pending").length;
  const nextPending = ordered.slice(idx + 1).concat(ordered.slice(0, idx)).find((x) => x.status === "pending" && x.id !== id) ?? null;
  const nextHref = nextPending ? R.approval(nextPending.id) : null;

  // an unsaved reason: every way out asks first — exit, skip, J, search, Back, closing the tab (NavGuardProvider)
  const [dirty, setDirty] = useState(false);
  const onDirty = useCallback((d: boolean) => setDirty(d), []);
  useNavGuard({ dirty, what: "כתבת נימוק, אבל ההחלטה עוד לא נרשמה. אם תצא עכשיו, הנימוק יימחק והפריט יישאר בתור." });
  const attempt = useNavGuardAttempt();

  // J = next item (never while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (plainShortcut(e, ["j", "J"]) && nextHref) { e.preventDefault(); if (attempt(nextHref)) router.push(nextHref); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextHref, router, attempt]);

  const handled: QueueEntry[] = ordered.filter((x) => x.status !== "pending" && x.id !== id).map((x) => {
    const d = demo.state.decisions[x.id];
    const sent = demo.state.executions[x.id]?.step === "sent";
    const status = x.status === "approved"
      ? { glyph: "✓", text: `${sent ? "נשלח" : "אושר"}${d ? ` · ${fmtTime(d.decidedAt)}` : ""}`, tone: "done" as const }
      : x.status === "changes_requested" ? { glyph: "↺", text: "נשלח לתיקון", tone: "changes" as const } : { glyph: "✕", text: "נדחה", tone: "rejected" as const };
    return { id: x.id, title: x.title, meta: sent && x.execution ? `${x.execution.target.label} אישר את השליחה` : d?.reason ? `"${d.reason}"` : x.summary, href: R.approval(x.id), status };
  });
  const next: QueueEntry[] = ordered.filter((x) => x.status === "pending" && x.id !== id).map((x, i, arr) => ({
    id: x.id, title: x.title, meta: `${x.client?.name ?? "מכירות"} · ${riskText(x.risk)}`, href: R.approval(x.id), dim: i === arr.length - 1 && arr.length > 2,
  }));

  const decision = demo.state.decisions[id];
  const result: DecisionResult | null = decision ? {
    outcome: decision.outcome, reason: decision.reason, at: fmtTime(decision.decidedAt), undoable: a.impact.reversibility.kind !== "none",
  } : null;

  const onDecide = (o: DecisionOutcome, reason: string) => {
    const r = demo.decide(id, o, reason);
    if (r.ok && o === "defer") { router.push(nextHref ?? R.approvals); return r; }
    if (r.ok) {
      const what = o === "approve" ? "אושר" : o === "request_changes" ? "נשלח לתיקון" : "נדחה";
      toast.push({ title: `${what}: ${a.title}`, detail: o === "approve" && reason ? "הנימוק נשמר במוח העסק." : "ההחלטה נרשמה ביומן הפעולות.", undo: a.impact.reversibility.kind !== "none" ? { onUndo: () => q.undo(id, r.decidedAt) } : undefined });
    }
    return r;
  };

  const mode = a.execution ? "summary" : a.content ? "content" : "decision";
  return (
    <div className={cx("f-focusmode", "f-afocus", `f-afocus--${mode}`)}>
      <FocusBar
        exitHref={R.approvals}
        progress={{ index: Math.max(0, idx), total: ordered.length, done, label: "אישור" }}
        skipHref={nextHref}
      />
      {mode === "summary" && <SummaryLayout a={a} next={next} nextHref={nextHref} />}
      {mode === "content" && <ContentLayout a={a} result={result} onDecide={onDecide} nextHref={nextHref} onUndo={() => q.undo(id)} onDirty={onDirty} onComment={(n) => toast.push({ title: `${n} הערות נשמרו לגרסה ${a.version}`, detail: "ההחלטה עדיין פתוחה והפריט נשאר בתור." })} />}
      {mode === "decision" && (
        <div className="f-afocus__grid">
          <QueueSide handled={handled} next={next} />
          <article className="f-acardx" aria-labelledby="approval-title">
            <div className="f-acardx__head">
              <ApprovalHead
                context={a.context}
                title={a.title}
                chips={<>
                  <RiskPill level={a.risk} size="lg" label={`${riskText(a.risk, true).slice(2)}${a.riskNote ? ` · ${a.riskNote}` : ""}`} />
                  <ApprovalPill status={a.status} />
                  <OriginTag origin={a.origin} label={a.originLabel} />
                </>}
                meta={`${a.trigger ? `${a.trigger} · ` : ""}ממתין ${fmtWaiting(a.requestedAt, demo.now)}`}
              />
            </div>
            <div className="f-acardx__body f-desk-only">
              {a.changes.length > 0 && <ChangeTable rows={a.changes} />}
              {a.why && <WhyBlock>{a.why}</WhyBlock>}
              {a.facts.length > 0 && <FactsSplit facts={a.facts} />}
              <ImpactTiles effect={a.impact.effect || "—"} whyRisk={a.impact.whyRisk} whyRiskLabel={`למה ${riskText(a.risk).slice(2)}`} reversibility={a.impact.reversibility} />
            </div>
            <div className="f-acardx__body f-mob-only">
              <MobileSummary rows={[
                { label: "מה ישתנה", value: a.short?.what ?? a.changes[0]?.after ?? "—" },
                { label: "למה", value: a.short?.why ?? a.why },
                { label: "חזרה אחורה", value: <><span aria-hidden>↺</span> {a.impact.reversibility.label}</>, tone: "ok" },
              ]} />
              <FactLines facts={a.facts} />
            </div>
            <DecisionBlock
              risk={a.risk}
              hint={a.reasonHint}
              onDecide={onDecide}
              result={result}
              onUndo={() => q.undo(id)}
              nextHref={nextHref}
              deferHref={nextHref ?? R.approvals}
              managerNote={undefined}
              onDirtyChange={onDirty}
            />
          </article>
          <aside className="f-afocus__aside" aria-label="הקשר">
            {a.history.length > 0 && (
              <section className="f-panel f-aside-card">
                <h2 className="f-aside-card__h">היסטוריה</h2>
                {a.history.map((h) => <p key={h.at} className="f-aside-card__line">{fmtDayMonth(h.at)} · {h.text}</p>)}
                <details className="f-aside-card__more"><summary>פרטים מתקדמים</summary><p className="f-meta">מזהה: {a.id} · נוצר {fmtAgo(a.requestedAt, demo.now)}{a.managerNote ? ` · ${a.managerNote}` : ""}</p></details>
              </section>
            )}
            {a.aiNote && <AiNote text={a.aiNote} />}
            <p className="f-shortcuts"><b className="f-kbd" dir="ltr">A</b> אשר · <b className="f-kbd" dir="ltr">R</b> בקש שינוי · <b className="f-kbd" dir="ltr">J</b> הבא</p>
          </aside>
        </div>
      )}
    </div>
  );
}

function AiNote({ text }: { text: string }) {
  const [fb, setFb] = useState<"up" | "down" | null>(null);
  return (
    <section className="f-panel f-aside-card">
      <h2 className="f-aside-card__h"><span aria-hidden>✦</span> על ה־AI בהצעה הזו</h2>
      <p className="f-aside-card__soft">{text}</p>
      <div className="f-aside-card__fb" role="group" aria-label="משוב על ההצעה">
        <button type="button" className="f-chip-sm" aria-pressed={fb === "up"} onClick={() => setFb(fb === "up" ? null : "up")}>ההצעה מועילה</button>
        <button type="button" className="f-chip-sm" aria-pressed={fb === "down"} onClick={() => setFb(fb === "down" ? null : "down")}>לא מתאימה</button>
      </div>
      {fb && <span className="f-meta" role="status">תודה. המשוב נשמר למנוע השיווק.</span>}
    </section>
  );
}

function SummaryLayout({ a, next, nextHref }: { a: Approval; next: QueueEntry[]; nextHref: string | null }) {
  const demo = useDemo();
  const st = demo.state.executions[a.id] ?? initialExec;
  // a proposal is sent at the amount that was approved: if the saved draft changed since, the send is blocked
  const sales = useSales();
  const approved = a.execution?.payload.amount?.amount;
  const draftTotal = a.id === PROPOSAL_CORPORATE.approvalId && sales.proposal ? savedTotal(sales.proposal.lines, PROPOSAL_CORPORATE.vatRate) : null;
  const blockedReason = draftTotal != null && approved != null && draftTotal !== approved
    ? `ההצעה נערכה אחרי האישור: הסכום בטיוטה ${fmtMoney(draftTotal)}, ואושר ${fmtMoney(approved)}. חזרו להצעה והחזירו אותה לגרסה שאושרה, או אשרו גרסה חדשה.`
    : undefined;
  return (
    <div className="f-afocus__grid f-afocus__grid--summary">
      <QueueSide handled={[]} next={next} note="הסדר בתור: סיכון גבוה קודם, ואז לפי מועד היעד." />
      <PreExecSummary
        action={a.execution!}
        title={a.title}
        context={a.context}
        impact={a.impact.effect}
        state={st}
        onToggle={() => demo.exec(a.id, { type: "toggleConfirm" })}
        onSubmit={() => demo.exec(a.id, { type: "submit", now: Date.now() })}
        onRetry={() => demo.exec(a.id, { type: "retry", now: Date.now() })}
        blockedReason={blockedReason}
        backHref={R.proposal("corporate-hosting")}
        activityHref={R.activity}
        nextHref={nextHref}
      />
      <aside className="f-afocus__aside" aria-label="מה יקרה אחרי">
        <h2 className="f-qside__h">איך זה ייראה אחרי</h2>
        <div className="f-after f-after--ok">
          <b><span aria-hidden>✓</span> {a.execution!.successTitle}</b>
          <span>{a.execution!.target.label} יאשר, ורק אז ההצעה תסומן כנשלחה. משימת מעקב תיווצר ל־4.10.</span>
        </div>
        <div className="f-after">
          <b className="f-after__wait"><span aria-hidden>⧗</span> ממתין לאישור {a.execution!.target.label}</b>
          <span className="f-meta">אם אין תשובה תוך דקה, ההצעה נשמרת כטיוטה בדואר ולא מסומנת כנשלחה.</span>
        </div>
        <label className="f-demo-toggle">
          <input type="checkbox" checked={demo.state.failNext} onChange={(e) => demo.setFailNext(e.target.checked)} />
          <span>דמו: הדמה כשל של {a.execution!.target.label} בשליחה הבאה</span>
        </label>
      </aside>
    </div>
  );
}

function ContentLayout({ a, result, onDecide, nextHref, onUndo, onComment, onDirty }: {
  a: Approval; result: DecisionResult | null; onDecide: (o: DecisionOutcome, r: string) => ReturnType<ReturnType<typeof useDemo>["decide"]>;
  nextHref: string | null; onUndo: () => void; onComment: (n: number) => void; onDirty: (d: boolean) => void;
}) {
  const c = a.content!;
  const design = designById(c.designId)!;
  const [fmt, setFmt] = useState<"all" | string>("all");
  const [compare, setCompare] = useState(false);
  const shown = design.variants.filter((v) => (fmt === "all" ? c.formats.some((f) => f.key === v.format) : v.format === fmt));
  const pins = c.annotations.filter((n) => n.format).map((n) => ({ n: n.n, layerId: "headline" }));
  return (
    <div className="f-afocus__grid f-afocus__grid--content">
      <article className="f-acardx" aria-labelledby="approval-title">
        <div className="f-acardx__head f-acardx__head--content">
          <ApprovalHead
            size="md"
            context={a.context}
            title={a.title}
            chips={<>
              <RiskPill level={a.risk} size="lg" />
              <ApprovalPill status={a.status} label={`ממתין לאישור · גרסה ${a.version}`} />
              <OriginTag origin={a.origin} label={a.originLabel} />
            </>}
          />
        </div>
        <div className="f-cformats">
          <Chips label="פורמט" value={fmt} onChange={setFmt} items={[{ key: "all", label: "כל הפורמטים" }, ...c.formats.map((f) => ({ key: f.key, label: f.label }))]} />
          <span className="f-grow" />
          <button type="button" className="f-btn f-btn--secondary f-btn--sm f-compare-btn" aria-pressed={compare} onClick={() => setCompare(!compare)}>השווה לגרסה 1</button>
        </div>
        {compare && <p className="f-compare" role="status">גרסה 1: הכותרת נגעה באזור שם החשבון, ו־&quot;1+1&quot; הופיע בכותרת המשנית. בגרסה {a.version}: {a.changes[0]?.after}.</p>}
        <div className="f-cstage">
          {shown.map((v) => {
            const f = c.formats.find((x) => x.key === v.format)!;
            return (
              <figure key={v.format} className="f-cstage__item">
                <DesignPreview variant={v} scale={v.format === "story" ? 0.65 : 1} pins={v.format === "story" ? pins : undefined} label={`${f.label} · ${design.title}`} className="f-cstage__design" />
                <figcaption className="f-meta">{f.label} · {f.where}</figcaption>
              </figure>
            );
          })}
        </div>
        <dl className="f-cmeta">
          <div><dt>ערוץ</dt><dd>{c.channel}</dd></div>
          <div><dt>מועד מתוכנן</dt><dd>{fmtWeekday(c.scheduledAt)} {fmtDayMonth(c.scheduledAt)}, {fmtTime(c.scheduledAt)}</dd></div>
          <div><dt>יצרה · ערכה</dt><dd>{c.createdBy} · {c.editedBy}</dd></div>
          <div><dt>{a.changes[0]?.what}</dt><dd>{a.changes[0]?.after}</dd></div>
        </dl>
      </article>
      <aside className="f-afocus__aside f-afocus__aside--content" aria-label="טקסט, עובדות ובדיקה">
        <section className="f-panel f-aside-card">
          <h2 className="f-aside-card__h f-aside-card__h--lg">טקסט נלווה</h2>
          <p className="f-caption">{c.caption.before}<mark className="f-caption__flag" title="עובדה שלא אומתה">{c.caption.flagged}</mark>{c.caption.after}</p>
        </section>
        <section className="f-panel f-aside-card">
          <h2 className="f-aside-card__h f-aside-card__h--lg">עובדות בתוכן</h2>
          {a.facts.map((f) => (
            <div key={f.id} className="f-factrow">
              <span dir={/^\d/.test(f.text) ? "ltr" : undefined}>{f.text}</span>
              <span className={f.verification === "verified" ? "f-factrow__ok" : "f-factrow__no"}><span aria-hidden>{f.verification === "verified" ? "✓" : "○"}</span> {f.verification === "verified" ? `אומת · ${f.basis}` : f.basis}</span>
            </div>
          ))}
        </section>
        <ContentReviewPanel content={c} hint={a.reasonHint} onDecide={onDecide} result={result} onUndo={onUndo} nextHref={nextHref} onCommentOnly={onComment} onDirtyChange={onDirty} />
      </aside>
    </div>
  );
}
