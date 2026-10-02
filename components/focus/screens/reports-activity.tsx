"use client";

import Link from "next/link";
import { useState } from "react";
import type { ActivityEntry } from "@/lib/focus/contracts/reports";
import { PEOPLE, personName } from "@/lib/focus/fixtures/people";
import { ACTIVITY, ROLE_LABEL } from "@/lib/focus/fixtures/reports";
import { R } from "@/lib/focus/routes";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useInstagramConnected, useJob } from "@/components/focus/patterns/reports/connection";
import { StateTag, fmtWhen } from "@/components/focus/patterns/reports/report-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { EmptyState } from "@/components/focus/ui/feedback";
import { SelectField, TextField } from "@/components/focus/ui/field";
import { OriginTag, SystemLine, WorkStatusTag } from "@/components/focus/ui/status";
import { Chips } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * יומן פעולות (handoff G4): who did what, when, before → after, and what can be undone. "בטל" on a reversible row
 * really reverts the row (and can be redone); irreversible rows say why; a failed sync can be retried as a job that
 * succeeds only after Instagram was reconnected (G6). Filter chips, a person filter and search narrow the list.
 */
type Filter = "all" | "mine" | "decision" | "external" | "failed" | "ai";

const RETRY_ID = "retry-instagram-read";

const actorName = (e: ActivityEntry) => (e.actor.kind === "person" ? personName(e.actor.personId) : e.actor.label);

export default function ReportsActivityScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { now, viewer } = demo;
  const [filter, setFilter] = useState<Filter>("all");
  const [person, setPerson] = useState("all");
  const [q, setQ] = useState("");
  const [undone, setUndone] = useState<Record<string, boolean>>({});
  const connected = useInstagramConnected();
  const retry = useJob(RETRY_ID);

  const failedCount = ACTIVITY.filter((e) => e.result === "failed" && !(e.reversal.kind === "retry" && retry?.status.state === "done")).length;
  const match = (e: ActivityEntry) => {
    if (filter === "mine" && !(e.actor.kind === "person" && e.actor.personId === viewer.id)) return false;
    if (filter === "decision" && !e.categories.includes("decision")) return false;
    if (filter === "external" && !e.categories.includes("external")) return false;
    if (filter === "ai" && e.actor.kind !== "ai") return false;
    if (filter === "failed" && e.result !== "failed") return false;
    if (person !== "all") {
      if (person === "system" && e.actor.kind !== "system") return false;
      if (person === "ai" && e.actor.kind !== "ai") return false;
      if (person !== "system" && person !== "ai" && !(e.actor.kind === "person" && e.actor.personId === person)) return false;
    }
    const needle = q.trim();
    if (needle) {
      const hay = [e.text, e.context, e.before, e.after, actorName(e)].filter(Boolean).join(" ");
      if (!hay.includes(needle)) return false;
    }
    return true;
  };
  const list = ACTIVITY.filter(match);

  const setRow = (e: ActivityEntry, value: boolean) => setUndone((u) => ({ ...u, [e.id]: value }));
  const undo = (e: ActivityEntry) => {
    if (e.reversal.kind !== "undo") return;
    setRow(e, true);
    toast.push({ title: "בוטל", detail: e.reversal.undoneText, undo: { label: "בצע שוב", onUndo: () => setRow(e, false) } });
  };
  const redo = (e: ActivityEntry) => {
    setRow(e, false);
    toast.push({ title: "בוצע שוב", detail: e.text, undo: { onUndo: () => setRow(e, true) } });
  };
  const runRetry = () => {
    demo.startJob({
      id: RETRY_ID, kind: "reconnect", label: "מנסה שוב לקרוא מדדי Instagram", detail: "", durationMs: 1500,
      outcome: connected ? "success" : "failure", href: R.activity,
    });
  };

  const resultCell = (e: ActivityEntry) => {
    const isUndone = undone[e.id];
    if (e.reversal.kind === "retry") {
      const st = retry?.status.state;
      if (st === "running") return <SystemLine status="processing">מנסה שוב…</SystemLine>;
      if (st === "done") return <StateTag status="done">הסנכרון הצליח</StateTag>;
      return (
        <>
          <StateTag status="failed">{st === "failed" ? "נכשל שוב" : "נכשל"}</StateTag>
          {st === "failed" && <span className="f-rp-act__why">עדיין {e.failure}. צריך לחבר מחדש.</span>}
          <Button variant="link" className="f-rp-act__btn" onClick={runRetry}>{e.reversal.label}</Button>
          {st === "failed" && <Link href={R.settings} className="f-rp-act__btn f-link">לתיקון החיבור</Link>}
        </>
      );
    }
    if (isUndone) {
      return (
        <>
          <WorkStatusTag status="cancelled" label={`בוטל ע״י ${viewer.name}`} />
          <Button variant="link" className="f-rp-act__btn" onClick={() => redo(e)}>בצע שוב</Button>
        </>
      );
    }
    return (
      <>
        {e.result === "done" ? <StateTag status="done">בוצע</StateTag> : <StateTag status="failed">נכשל</StateTag>}
        {e.reversal.kind === "undo" && <Button variant="link" className="f-rp-act__btn" onClick={() => undo(e)}>{e.reversal.label}<span className="f-sr">: {e.text}</span></Button>}
        {e.reversal.kind === "none" && <span className="f-rp-act__none"><b>לא ניתן לבטל</b><span>{e.reversal.why}</span></span>}
        {e.reversal.kind === "open" && <Link href={e.reversal.href} className="f-rp-act__btn f-link">{e.reversal.label}</Link>}
      </>
    );
  };

  return (
    <Page className="f-rp-act">
      <PageHeader
        eyebrow={<nav aria-label="נתיב" className="f-crumbs"><Link href={R.reports}>דוחות ובקרה</Link> <span aria-hidden>›</span> יומן פעולות</nav>}
        title="יומן פעולות"
        size="entity"
        status="מי עשה מה, מתי, ומה אפשר לבטל."
        actions={
          <TextField
            label="חיפוש ביומן" labelClassName="f-sr" type="search" placeholder="חיפוש ביומן" className="f-rp-act__search"
            value={q} onChange={(e) => setQ(e.target.value)}
          />
        }
      />
      <div className="f-rp-act__bar">
        <Chips label="סינון היומן" value={filter} onChange={setFilter} items={[
          { key: "all", label: "הכול" },
          { key: "mine", label: "בוצע בשמי" },
          { key: "decision", label: "החלטות" },
          { key: "external", label: "פעולות חיצוניות" },
          { key: "failed", label: <>נכשלו <b className={cx(failedCount > 0 && "f-rp-act__failn")}>{failedCount}</b></>, ariaLabel: `נכשלו: ${failedCount}` },
          { key: "ai", label: "AI" },
        ]} />
        <SelectField
          label="אדם" labelClassName="f-sr" className="f-rp-act__person"
          value={person} onChange={(e) => setPerson(e.target.value)}
          options={[
            { value: "all", label: "אדם: כולם" },
            ...[PEOPLE.ron, PEOPLE.dana, PEOPLE.yoav].map((p) => ({ value: p.id, label: p.name })),
            { value: "system", label: "סנכרון אוטומטי" }, { value: "ai", label: "מנוע השיווק (AI)" },
          ]}
        />
      </div>

      <section className="f-panel f-rp-tablewrap" aria-label="פעולות">
        {list.length === 0 ? (
          <EmptyState title="אין פעולות שמתאימות לסינון" hint="אפשר לנקות את הסינון או לחפש מילה אחרת."
            action={<Button variant="neutral" onClick={() => { setFilter("all"); setPerson("all"); setQ(""); }}>נקה סינון</Button>} />
        ) : (
          <table className="f-rp-table f-rp-table--act">
            <caption className="f-sr">יומן פעולות · {list.length} פעולות</caption>
            <thead><tr><th scope="col">מתי ומי</th><th scope="col">מה נעשה</th><th scope="col">לפני ← אחרי</th><th scope="col">תוצאה</th></tr></thead>
            <tbody>
              {list.map((e) => {
                const isUndone = undone[e.id];
                return (
                  <tr key={e.id} className={cx(isUndone && "f-rp-row--undone")}>
                    <td data-label="מתי ומי">
                      <span className="f-rp-act__who">
                        <b className="f-num">{fmtWhen(e.at, now)}</b>
                        <span className="f-meta">
                          {e.actor.kind === "ai" ? <OriginTag origin="ai_suggested" label={e.actor.label} size="sm" /> : e.actor.kind === "person" ? `${actorName(e)} · ${ROLE_LABEL[e.actor.personId] ?? ""}` : e.actor.label}
                        </span>
                      </span>
                    </td>
                    <th scope="row" data-label="מה נעשה">
                      <span className="f-rp-act__what">
                        {e.href ? <Link href={e.href} className="f-rp-act__text">{e.text}</Link> : <span className="f-rp-act__text">{e.text}</span>}
                        <span className="f-meta">{e.context}</span>
                        <details className="f-rp-adv">
                          <summary>פרטים מתקדמים</summary>
                          <code dir="ltr">{e.tech}</code>
                        </details>
                      </span>
                    </th>
                    <td data-label="לפני ← אחרי">
                      {e.before && e.after ? (
                        <span className="f-rp-act__ba">
                          {isUndone ? <>{e.after} <span aria-hidden>←</span><span className="f-sr"> חזר ל־</span> {e.before}</> : <>{e.before} <span aria-hidden>←</span><span className="f-sr"> הפך ל־</span> {e.after}</>}
                        </span>
                      ) : <span className="f-value--unavailable" aria-label="אין שינוי ערך">—</span>}
                    </td>
                    <td data-label="תוצאה"><span className="f-rp-act__res">{resultCell(e)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      <p className="f-meta">מזהים טכניים, גרסת תוכנית וקוד שגיאה מוצגים רק ב&quot;פרטים מתקדמים&quot; של כל אירוע.</p>
      <p className="f-sr" aria-live="polite">{retry?.status.state === "done" ? "הסנכרון של Instagram הצליח." : retry?.status.state === "failed" ? "הניסיון החוזר נכשל." : ""}</p>
    </Page>
  );
}
