"use client";

import Link from "@/components/focus/ui/link";
import { useState } from "react";
import type { Connection } from "@/lib/focus/contracts/reports";
import type { WorkRole } from "@/lib/focus/contracts/work";
import { PEOPLE } from "@/lib/focus/fixtures/people";
import { CONNECTIONS, SETTINGS_NAV } from "@/lib/focus/fixtures/reports";
import { fmtAgo, fmtDayMonth } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { RECONNECT_ID, useJob } from "@/components/focus/patterns/reports/connection";
import { KvList, PlannedAction, StateTag, fmtStamp } from "@/components/focus/patterns/reports/report-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Bdi } from "@/components/focus/ui/misc";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Banner } from "@/components/focus/ui/feedback";
import { SelectField } from "@/components/focus/ui/field";
import { CountPill, PlannedTag, SystemLine } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * הגדרות › חיבורים (handoff G6, flow 7). A failed connection says since when, what is affected and what is kept.
 * "התחבר מחדש" (owner only) runs a reconnect job: running → done ("מחובר · עודכן עכשיו") or failed (data kept,
 * retry). Success is shown only after the job settles. Other roles see "בקש מרון לחבר מחדש".
 */
const OWNER = PEOPLE.ron;
const ROLES: { value: WorkRole; label: string }[] = [
  { value: "owner", label: "בעלים" }, { value: "admin", label: "מנהל" }, { value: "member", label: "צוות" }, { value: "viewer", label: "צפייה בלבד" },
];

export default function ReportsConnectionsScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { now, state } = demo;
  const [selectedId, setSelectedId] = useState(CONNECTIONS[0].id);
  const [asked, setAsked] = useState(false);
  const reconnect = useJob(RECONNECT_ID);
  const selected = CONNECTIONS.find((c) => c.id === selectedId)!;
  const check = useJob(`check-${selected.id}`);
  const rs = reconnect?.status.state;
  const igOk = rs === "done";
  const isOwner = state.role === "owner";

  const effective = (c: Connection): Connection["state"] => (c.id === "instagram" && igOk ? "connected" : c.state);
  const failedCount = CONNECTIONS.filter((c) => effective(c) === "failed").length;

  const startReconnect = () => {
    const fail = state.failNext;
    if (fail) demo.setFailNext(false);
    demo.startJob({
      id: RECONNECT_ID, kind: "reconnect", label: "בודק חיבור ומסנכרן מ־27.9",
      detail: "אפשר לעזוב את המסך. נשלח התראה כשמוכן. הנתונים הקיימים נשמרים בכל מקרה.",
      durationMs: 2500, outcome: fail ? "failure" : "success",
      steps: ["בודק את ההרשאה החדשה", "מסנכרן נתונים מ־27.9", "מעדכן את ההתראה ל״טופל״"], href: R.settings,
    });
  };
  const startCheck = (c: Connection) => {
    const ok = c.id === "instagram" ? igOk : effective(c) === "connected";
    demo.startJob({ id: `check-${c.id}`, kind: "reconnect", label: `בודק חיבור · ${c.name}`, detail: "", durationMs: 1200, outcome: ok ? "success" : "failure", href: R.settings });
  };
  const askOwner = () => {
    setAsked(true);
    toast.push({ title: `הבקשה נרשמה אצל ${OWNER.name}`, detail: "תופיע אצלו בהיום שלי. אתה תקבל התראה כשהחיבור יחודש.", undo: { onUndo: () => setAsked(false) } });
  };

  const statusTag = (c: Connection, size: "sm" | "md" = "sm") => {
    const st = effective(c);
    if (c.id === "instagram" && rs === "running") return <StateTag status="processing" size={size}>מתחבר מחדש…</StateTag>;
    if (c.id === "instagram" && igOk) return <StateTag status="done" size={size}>מחובר · עודכן עכשיו</StateTag>;
    if (st === "failed") return <StateTag status="failed" size={size}>נכשל · {c.failure?.reason}</StateTag>;
    if (st === "connected") return <StateTag status="done" size={size}>מחובר</StateTag>;
    return <StateTag status="unavailable" size={size}>לא מחובר</StateTag>;
  };
  const lastText = (c: Connection) => {
    if (c.id === "instagram" && igOk) return "עכשיו";
    if (effective(c) === "failed" && c.lastSync) return `אחרון: ${fmtDayMonth(c.failure?.since ?? c.lastSync)}`;
    return c.lastSync ? fmtAgo(c.lastSync, now) : "—";
  };

  const reconnectPanel = () => {
    if (!reconnect) return null;
    const st = reconnect.status;
    if (st.state === "running") {
      const steps = reconnect.job.steps ?? [];
      return (
        <Banner kind="processing" title={reconnect.job.label} detail={<>
          <ol className="f-rp-steps">
            {steps.map((s, i) => <li key={s} className={cx(i < st.step && "f-rp-steps__done", i === st.step && "f-rp-steps__now")} aria-current={i === st.step ? "step" : undefined}>{s}</li>)}
          </ol>
          <span>{reconnect.job.detail}</span>
        </>} action={<Button variant="neutral" size="sm" onClick={() => demo.cancelJob(RECONNECT_ID)}>עצור</Button>} />
      );
    }
    if (st.state === "done") return <Banner kind="done" title="מחובר · עודכן עכשיו" detail="הנתונים מ־27.9 סונכרנו וההתראה סומנה ״טופל״." />;
    if (st.state === "failed") return (
      <Banner kind="error" title="החיבור מחדש נכשל" detail="Instagram לא אישר את ההרשאה. הנתונים עד 27.9 נשמרו — דבר לא נמחק."
        action={isOwner ? <Button variant="neutral" size="sm" onClick={startReconnect}>נסה שוב</Button> : undefined} />
    );
    return null;
  };

  const checkLine = () => {
    if (!check) return null;
    const st = check.status.state;
    if (st === "running") return <SystemLine status="processing">בודק חיבור…</SystemLine>;
    if (st === "done") return <SystemLine status="done">החיבור תקין · נבדק עכשיו</SystemLine>;
    if (st === "failed") return <SystemLine status="failed">הבדיקה נכשלה · {selected.failure?.reason ?? "אין תשובה מהשירות"}</SystemLine>;
    return null;
  };

  const ig = selected.id === "instagram";
  const running = rs === "running";

  return (
    <div className="f-rp-settings">
      <nav className="f-rp-side" aria-label="הגדרות">
        <span className="f-rp-side__title" aria-hidden>הגדרות</span>
        <ul className="f-rp-side__list">
          {SETTINGS_NAV.map((n) => (
            <li key={n.id}>
              {n.href ? (
                <Link href={n.href} className="f-rp-side__item" aria-current={n.href === R.settings ? "page" : undefined}>
                  <span>{n.label}</span>
                  {n.id === "connections" && failedCount > 0 && <CountPill n={failedCount} tone="risk" label="חיבורים שנכשלו" />}
                </Link>
              ) : (
                <span className="f-rp-side__item f-rp-side__item--planned"><span>{n.label}</span><PlannedTag /></span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <section className="f-rp-conns" aria-labelledby="conn-h">
        <div className="f-rp-conns__head">
          <h1 id="conn-h" className="f-rp-conns__title">חיבורים</h1>
          <p className="f-rp-conns__status">{failedCount === 0 ? "כל החיבורים פעילים." : failedCount === 1 ? "חיבור אחד נכשל. שאר החיבורים פעילים." : `${failedCount} חיבורים נכשלו.`}</p>
        </div>
        <ul className="f-rp-conns__list">
          {CONNECTIONS.map((c) => (
            <li key={c.id}>
              <button type="button" className={cx("f-rp-conn", effective(c) === "failed" && "f-rp-conn--failed")} aria-pressed={c.id === selectedId} onClick={() => setSelectedId(c.id)}>
                <span className="f-rp-conn__main">
                  <b className="f-rp-conn__name">{c.name}</b>
                  <span className="f-meta">{c.handle && <><Bdi>{c.handle}</Bdi> · </>}{c.account}</span>
                </span>
                <span className="f-rp-conn__state">{statusTag(c)}{c.planned && <PlannedTag />}</span>
                <span className="f-rp-conn__last f-num">{lastText(c)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="f-panel f-rp-cdetail" aria-labelledby="cd-title">
        <div className="f-rp-cdetail__head">
          <h2 id="cd-title" className="f-rp-cdetail__title">{selected.name}</h2>
          {statusTag(selected, "md")}
        </div>
        <div className="f-rp-cdetail__body">
          {ig && reconnectPanel()}
          {effective(selected) === "failed" && selected.failure ? (
            <KvList className="f-rp-kv--stack" rows={[
              { label: "ממתי", value: <><span className="f-num">{fmtStamp(selected.failure.since)}</span>. {selected.failure.detail}</> },
              { label: "מה מושפע", value: <>{selected.failure.affected}{" "}<span className="f-rp-inline-links f-rp-inline-links--inline">{selected.failure.affectedLinks.map((l) => <Link key={l.label} href={l.href} className="f-link">{l.label}</Link>)}</span></> },
              { label: "מה נשמר", value: selected.failure.kept },
              { label: "הרשאות החיבור", value: selected.permissions },
            ]} />
          ) : (
            <KvList className="f-rp-kv--stack" rows={[
              { label: "חשבון", value: <>{selected.handle && <><Bdi>{selected.handle}</Bdi> · </>}{selected.account}</> },
              { label: "עדכון אחרון", value: ig && igOk ? "עכשיו" : selected.lastSync ? <span className="f-num">{fmtStamp(selected.lastSync)}</span> : "—" },
              { label: "הרשאות החיבור", value: selected.permissions },
            ]} />
          )}
          {selected.afterReconnect && effective(selected) === "failed" && !running && (
            <div className="f-inset f-rp-cdetail__after">
              <h3 className="f-rp-cdetail__h3">אחרי החיבור מחדש</h3>
              <ol className="f-rp-steps f-rp-steps--plain">{selected.afterReconnect.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          )}
          {checkLine()}
        </div>
        <div className="f-rp-cdetail__foot">
          {selected.planned ? <PlannedAction label="חבר" /> : (
            <>
              {effective(selected) === "failed" && (isOwner
                ? <Button variant="primary" onClick={startReconnect} loading={running} loadingLabel="מתחבר…">התחבר מחדש</Button>
                : <Button variant="primary" onClick={askOwner} disabled={asked} id="ask-owner" disabledReason={asked ? `הבקשה כבר אצל ${OWNER.name}` : undefined}>בקש מ{OWNER.name} לחבר מחדש</Button>)}
              <Button variant="neutral" onClick={() => startCheck(selected)} loading={check?.status.state === "running"} loadingLabel="בודק…" disabled={running}>בדיקת חיבור</Button>
              <span className="f-grow" />
              {isOwner && <PlannedAction label="נתק" variant="outline" size="sm" />}
            </>
          )}
        </div>
        {effective(selected) === "failed" && (
          <p className="f-rp-cdetail__note">
            {isOwner ? `מנהל רואה את אותו פירוט, ובמקום "התחבר מחדש" מופיע "בקש מ${OWNER.name} לחבר מחדש".` : `רק ${OWNER.name} (בעלים) יכול לחבר מחדש. הנתונים הקיימים נשמרים בינתיים.`}
          </p>
        )}
        <fieldset className="f-rp-demo">
          <legend>דמו</legend>
          <SelectField label="צפה כ־" className="f-rp-demo__role" value={state.role} onChange={(e) => demo.setRole(e.target.value as WorkRole)} options={ROLES} />
          <label className="f-rp-demo__fail">
            <input type="checkbox" checked={state.failNext} onChange={(e) => demo.setFailNext(e.target.checked)} />
            <span>הדמה כשל בחיבור מחדש הבא</span>
          </label>
        </fieldset>
      </aside>
    </div>
  );
}
