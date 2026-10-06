"use client";

import Link from "@/components/focus/ui/link";
import { useState } from "react";
import type { Metric } from "@/lib/focus/contracts/common";
import type { ManagerColumn, ManagerItem } from "@/lib/focus/contracts/comms";
import { dataOf, ready, type Loadable } from "@/lib/focus/contracts/loadable";
import type { TimeColumn } from "@/lib/focus/contracts/today";
import { MANAGER_TODAY } from "@/lib/focus/fixtures/comms";
import { PEOPLE_BY_ID, personName } from "@/lib/focus/fixtures/people";
import { STUCK } from "@/lib/focus/fixtures/today";
import { daysBetween, fmtAgo, fmtLongDate, fmtShortLongDate, fmtTime, fmtWaiting } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { jobStatus, type JobStatus } from "@/lib/focus/state/jobs";
import { ManagerCard } from "@/components/focus/patterns/comms/manager";
import { MetricGrid } from "@/components/focus/patterns/metrics";
import { Page, PageHeader, ViewOnlyStrip } from "@/components/focus/patterns/page";
import { StuckPanel } from "@/components/focus/patterns/stuck-panel";
import { TimeBoard } from "@/components/focus/patterns/time-board";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { Banner, EmptyState, LoadableView } from "@/components/focus/ui/feedback";
import { SystemLine } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * "היום שלי" for a manager (handoff D8, Dana): the same time board and cards as D1 with her data, a partial ClickUp
 * read (counts that depend on it stay hidden — never a short number) with a real "נסה לטעון הכול" job, assign-to-me
 * with undo + ClickUp sync, a confirmed in-app reminder to the owner, an empty "now" column, and the view-only preview.
 */
const COLUMNS: { key: ManagerColumn; board: TimeColumn; title: string; short?: string; note?: string }[] = [
  { key: "now", board: "now", title: "עכשיו", note: "לפני 12:00" },
  { key: "today", board: "today", title: "עד סוף היום", short: "היום" },
  { key: "others", board: "week", title: "ממתין לאחרים", short: "ממתין" },
];
const SYNC_MS = 1500;
const REMIND_MS = 1200;

export default function CommsTodayManagerScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { now, state } = demo;
  const M = MANAGER_TODAY;
  const me = M.person;
  const items = dataOf(M.items) ?? [];
  const [loads, setLoads] = useState(0);
  const [reminds, setReminds] = useState<Record<string, number>>({});
  const [confirmRemind, setConfirmRemind] = useState<ManagerItem | null>(null);

  const status = (id: string): JobStatus | null => {
    const j = state.jobs.find((x) => x.id === id);
    return j && !j.cancelledAt ? jobStatus(j, state.clock) : null;
  };

  // ---- partial read → full read ----
  const load = loads ? status(`mgr-full-${loads}`) : null;
  const full = load?.state === "done";
  const metrics: Loadable<Metric[]> = full && M.metrics.state === "ready"
    ? ready(M.metrics.data.map((m) => (m.id === M.fullRead.metricId ? M.fullRead.metric : m)))
    : M.metrics;
  const retryLoad = () => {
    const fail = state.failNext;
    if (fail) demo.setFailNext(false);
    const n = loads + 1;
    setLoads(n);
    demo.startJob({ id: `mgr-full-${n}`, kind: "sync_clickup", label: "טוען את כל המשימות מ־ClickUp", detail: "", durationMs: M.partial?.retryMs ?? SYNC_MS, outcome: fail ? "failure" : "success", href: R.todayManager });
  };

  // ---- actions ----
  const assignMe = (it: ManagerItem) => {
    const t = state.tasks.find((x) => x.id === it.taskId);
    if (!t) return;
    const r = demo.patchTask(t.id, { assigneeId: me.id }, t.version);
    if (!r.ok) { toast.push({ kind: "error", title: "לא הוקצה", detail: "refused" in r ? r.refused : "המשימה עודכנה במקביל. רענן ונסה שוב." }); return; }
    if (t.source === "clickup") demo.startJob({ id: `sync-${t.id}`, kind: "sync_clickup", label: "מסנכרן ל־ClickUp", detail: "", durationMs: SYNC_MS, outcome: "success", href: R.todayManager });
    toast.push({ title: `"${t.title}" הוקצתה לך`, detail: t.source === "clickup" ? "\"סונכרן\" יוצג רק אחרי ש־ClickUp יאשר." : undefined, undo: { onUndo: () => { demo.cancelJob(`sync-${t.id}`); demo.restoreTask({ ...r.previous!, version: r.task.version + 1 }); } } });
  };
  const sendRemind = (it: ManagerItem) => {
    setConfirmRemind(null);
    const n = (reminds[it.id] ?? 0) + 1;
    setReminds((x) => ({ ...x, [it.id]: n }));
    const fail = state.failNext;
    if (fail) demo.setFailNext(false);
    const to = it.action.kind === "remind" ? personName(it.action.personId) : "";
    demo.startJob({ id: `remind-${it.id}-${n}`, kind: "reconnect", label: `תזכורת ל${to}`, detail: "", durationMs: REMIND_MS, outcome: fail ? "failure" : "success", href: R.todayManager });
  };

  const waitingLabel = (since: string) => (daysBetween(since, now) === 0 ? fmtAgo(since, now).replace(/^לפני /, "") : fmtWaiting(since, now));

  const footer = (it: ManagerItem) => {
    const a = it.action;
    if (a.kind === "link") return <Link href={a.href} className={`f-btn ${it.primary ? "f-btn--primary" : "f-btn--secondary"} f-btn--block f-acard__cta`}>{a.label}</Link>;
    if (a.kind === "assign_me") {
      const t = state.tasks.find((x) => x.id === it.taskId);
      if (t?.assigneeId === me.id) {
        const sync = status(`sync-${t.id}`);
        return (
          <div className="f-acard__result" role="status">
            <b className="f-acard__state f-acard__state--done"><span aria-hidden>✓</span> הוקצתה לך</b>
            {t.source === "clickup" && (sync?.state === "running" ? <SystemLine status="processing">מסנכרן ל־ClickUp…</SystemLine>
              : sync?.state === "failed" ? <SystemLine status="failed">ClickUp לא אישר. ההקצאה נשמרה ב־Mytiv.</SystemLine>
              : <SystemLine status="done">סונכרן ל־ClickUp</SystemLine>)}
            <Link href={R.task(t.id)} className="f-link f-hit">פתח משימה</Link>
          </div>
        );
      }
      return <Button variant="secondary" block className="f-acard__cta" onClick={() => assignMe(it)}>{a.label}</Button>;
    }
    const n = reminds[it.id];
    const st = n ? status(`remind-${it.id}-${n}`) : null;
    const to = personName(a.personId);
    if (st?.state === "running") return <span className="f-acard__state f-acard__state--working" role="status"><span className="f-spin" aria-hidden>⟳</span> שולח תזכורת ל{to}…</span>;
    if (st?.state === "done") return <div className="f-acard__result" role="status"><b className="f-acard__state f-acard__state--done"><span aria-hidden>✓</span> התזכורת נשלחה ל{to} ב־{fmtTime(new Date(st.at).toISOString())}</b><span className="f-acard__why">{to} יקבל/תקבל התראה ב־Mytiv.</span></div>;
    if (st?.state === "failed") return <div className="f-acard__result" role="alert"><b className="f-acard__state f-acard__state--failed"><span aria-hidden>!</span> התזכורת לא נשלחה</b><Button variant="secondary" size="sm" onClick={() => sendRemind(it)}>נסה שוב</Button></div>;
    return <Button variant="neutral" block className="f-acard__cta" onClick={() => setConfirmRemind(it)}>{a.label}</Button>;
  };

  const byCol = (c: ManagerColumn) => items.filter((it) => it.column === c);
  const viewerOnly = state.role === "viewer";
  const columns = COLUMNS.map((c) => {
    const list = byCol(c.key);
    return {
      key: c.board, title: c.title, short: c.short, note: c.note, count: list.length,
      content: (
        <div className="f-stack-12">
          {list.length === 0 && c.key === "now" && (
            <EmptyState className="f-cm-tm__empty" glyph="✓" title="אין פריטים דחופים" hint="מה שנכנס עד 12:00 או עם יעד היום יופיע כאן." />
          )}
          {list.map((it) => {
            const t = it.taskId ? state.tasks.find((x) => x.id === it.taskId) : undefined;
            const ctx = it.action.kind === "assign_me" && t ? `${it.context} · ${t.assigneeId ? personName(t.assigneeId) : "ללא אחראי"}` : it.context;
            return <ManagerCard key={it.id} tag={it.tag} waiting={waitingLabel(it.waitingSince)} title={it.title} context={ctx} note={it.note} footer={footer(it)} />;
          })}
          {c.key === "others" && full && <StuckPanel stuck={STUCK} />}
        </div>
      ),
    };
  });

  const nowN = byCol("now").length;
  const todayN = byCol("today").length;
  const others = byCol("others");
  const waitingOn = others[0]?.action.kind === "remind" ? PEOPLE_BY_ID[others[0].action.personId]?.name : undefined;
  const statusLine = `${nowN ? `${nowN} פריטים דחופים.` : "אין כרגע משהו דחוף."} ${todayN} פריטים להיום${others.length === 1 && waitingOn ? `, ואחד ממתין ל${waitingOn}.` : others.length ? `, ו־${others.length} ממתינים לאחרים.` : "."}`;

  return (
    <Page className="f-cm-tm">
      <PageHeader
        eyebrow={<><span className="f-only-desktop">{fmtLongDate(now)}</span><span className="f-only-mobile">{fmtShortLongDate(now)}</span></>}
        title={`בוקר טוב, ${me.name}`}
        status={statusLine}
      />

      {M.partial && !full && (
        load?.state === "running" ? (
          <Banner kind="processing" title={`טוען את כל המשימות מ־${M.partial.source.label}…`} detail="המספרים יוצגו רק כשהקריאה תושלם." />
        ) : load?.state === "failed" ? (
          <Banner kind="error" title={`הטעינה מ־${M.partial.source.label} נכשלה`} detail="מוצג רק מה שהתקבל. שום מספר חסר לא מוצג כאילו הוא מלא." action={<Button variant="onaccent" size="sm" onClick={retryLoad}>נסה שוב</Button>} />
        ) : (
          <Banner kind="partial" className="f-cm-tm__partial" title={M.partial.title} detail={M.partial.detail} action={<Button variant="onaccent" className="f-cm-tm__retry" onClick={retryLoad}>נסה לטעון הכול</Button>} />
        )
      )}
      {full && <Banner kind="done" title={`כל המשימות נטענו מ־${M.partial?.source.label ?? "ClickUp"}`} detail={'"מה תקוע" ומשימות באיחור מוצגים עכשיו במלואם.'} />}

      {viewerOnly && <ViewOnlyStrip who={M.viewerPreview.who} />}

      <div className="f-cm-tm__main">
        {viewerOnly ? (
          <p className="f-meta">בתפקיד צופה אין עמודות &quot;עכשיו&quot; ו&quot;היום&quot;. מוצגים רק מדדים ודוחות.</p>
        ) : (
          <LoadableView value={M.items} label="פריטים">
            {() => <TimeBoard columns={columns} label="הפריטים של היום לפי זמן" />}
          </LoadableView>
        )}
        <div className="f-cm-tm__side">
          <MetricGrid metrics={metrics} now={now} columns={2} label="מדדים" />
          {M.connection && (
            <Banner kind="unavailable" className="f-cm-tm__conn" title={M.connection.title} detail={M.connection.detail}
              action={<Link href={M.connection.href} className="f-link f-hit">{M.connection.linkLabel}</Link>} />
          )}
        </div>
      </div>

      <div className="f-cm-tm__previews">
        <section className="f-cm-tm__preview" aria-labelledby="cm-tm-viewer">
          <h2 id="cm-tm-viewer" className="f-cm-tm__ptitle">{M.viewerPreview.title}</h2>
          <ViewOnlyStrip who={M.viewerPreview.who} />
          <p className="f-cm-tm__ptext">{M.viewerPreview.detail}</p>
        </section>
        <section className="f-cm-tm__preview" aria-labelledby="cm-tm-done">
          <h2 id="cm-tm-done" className="f-cm-tm__ptitle">{M.allDonePreview.title}</h2>
          <p className="f-cm-tm__headline">{M.allDonePreview.headline}</p>
          <p className="f-meta">{M.allDonePreview.detail}</p>
        </section>
      </div>

      <Dialog open={!!confirmRemind} onClose={() => setConfirmRemind(null)} labelledBy="cm-remind-title" className="f-cm-modal">
        {confirmRemind && confirmRemind.action.kind === "remind" && (
          <div className="f-cm-dlg">
            <h2 id="cm-remind-title" className="f-cm-dlg__title">לשלוח תזכורת ל{personName(confirmRemind.action.personId)}?</h2>
            <dl className="f-cm-review">
              <div className="f-cm-review__row"><dt>אל</dt><dd>{personName(confirmRemind.action.personId)} · התראה בתוך Mytiv</dd></div>
              <div className="f-cm-review__row"><dt>מה יישלח</dt><dd>{me.name} מזכירה: &quot;{confirmRemind.title}&quot; ממתין להחלטה שלך {fmtWaiting(confirmRemind.waitingSince, now)}.</dd></div>
            </dl>
            <p className="f-cm-dlg__text">לא נשלח מייל. &quot;נשלחה&quot; יוצג רק אחרי ש־Mytiv יאשר שההתראה נמסרה.</p>
            <div className="f-cm-dlg__actions">
              <Button variant="primary" onClick={() => sendRemind(confirmRemind)}>שלח תזכורת</Button>
              <Button variant="neutral" onClick={() => setConfirmRemind(null)}>ביטול</Button>
            </div>
          </div>
        )}
      </Dialog>
    </Page>
  );
}
