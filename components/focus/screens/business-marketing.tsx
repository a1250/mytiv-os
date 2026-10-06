import type { ProjectExecution } from "@/lib/marketing-focus/execution";
import { completionLabel, evidenceStateLabel, reconciledLabel, taskStatusLabel } from "@/lib/marketing/view";
import { fmtDate, fmtDayMonth, fmtTime } from "@/lib/focus/format";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { EmptyState } from "@/components/focus/ui/feedback";
import { Bdi } from "@/components/focus/ui/misc";

/**
 * Campaigns and execution of a real business (read-only), from the Marketing OS contracts imported into Mytiv: C12
 * campaigns, the C7 workboard and the evidence / execution receipts recorded here with the engine's reconciliation.
 * "Done" is the engine's four-state completion, never a board column; unknown stays unknown.
 */
const BUILD: Record<string, string> = { draft: "טיוטה", paused: "מושהה", active: "פעיל", archived: "בארכיון" };
const RECORD: Record<string, string> = { publish_evidence: "ראיית פרסום", outcome_evidence: "ראיית תוצאה", execution_receipt: "קבלת ביצוע", brain_proposal: "הצעה למוח העסק" };
const at = (iso: string) => `${fmtDayMonth(iso)} ${fmtTime(iso)}`;

export default function BusinessMarketingScreen({ projects }: { projects: ProjectExecution[] }) {
  const active = projects.flatMap((p) => p.campaigns?.items ?? []).filter((c) => c.build_state === "active").length;
  return (
    <Page className="f-bmkt">
      <PageHeader title="שיווק · קמפיינים וביצוע" size="page"
        status={projects.length ? `${projects.length} פרויקטים מחוברים למנוע השיווק · ${active} קמפיינים פעילים.` : "אין פרויקט שמחובר למנוע השיווק."} />
      {projects.length === 0 ? <EmptyState glyph="◎" title="אין פרויקט מחובר" hint="בעלי העסק מחברים פרויקט למנוע השיווק במסך הפרויקט במערכת." /> : projects.map((p) => (
        <section key={p.projectId} className="f-panel f-bmkt__proj" aria-labelledby={`mk-${p.projectId}`}>
          <h2 id={`mk-${p.projectId}`} className="f-bmkt__h">{p.projectName}{p.client ? ` · ${p.client}` : ""} <span className="f-meta-sm">· <Bdi>{p.marketingBusiness}</Bdi></span></h2>

          <h3 className="f-bmkt__sub">קמפיינים {p.campaigns && <span className="f-meta-sm">· נכון ל־{at(p.campaigns.asOf)}</span>}</h3>
          {!p.campaigns ? <p className="f-meta">המנוע עוד לא ייצא קמפיינים לפרויקט הזה.</p> : p.campaigns.items.length === 0 ? <p className="f-meta">אין קמפיינים ביצוא האחרון.</p> : (
            <table className="f-bmkt__table">
              <thead><tr><th scope="col">קמפיין</th><th scope="col">מטרה</th><th scope="col">מצב</th><th scope="col">תקציב</th><th scope="col">מדדים</th></tr></thead>
              <tbody>{p.campaigns.items.map((c) => (
                <tr key={c.id}><td><Bdi>{c.id}</Bdi></td><td>{c.objective}</td><td data-build={c.build_state}>{BUILD[c.build_state] ?? c.build_state}</td>
                  <td>{c.budget_envelope.toLocaleString("he-IL")} ₪</td><td>{c.kpis?.length ? c.kpis.join(" · ") : "—"}</td></tr>
              ))}</tbody>
            </table>
          )}
          {p.campaigns && p.campaigns.calendar.length > 0 && <p className="f-meta-sm">לוח תוכן: {p.campaigns.calendar.length} פריטים · הקרוב: {fmtDate([...p.campaigns.calendar].sort((a, b) => a.date.localeCompare(b.date))[0].date)}</p>}

          <h3 className="f-bmkt__sub">משימות ביצוע במנוע {p.workboard && <span className="f-meta-sm">· נכון ל־{at(p.workboard.asOf)}</span>}</h3>
          {!p.workboard ? <p className="f-meta">המנוע עוד לא ייצא לוח עבודה לפרויקט הזה.</p> : p.workboard.tasks.length === 0 ? <p className="f-meta">אין משימות ביצוא האחרון.</p> : (
            <table className="f-bmkt__table">
              <thead><tr><th scope="col">משימה</th><th scope="col">סטטוס</th><th scope="col">השלמה</th><th scope="col">ראיה</th><th scope="col">יעד</th></tr></thead>
              <tbody>{p.workboard.tasks.map((t) => (
                <tr key={t.task_id}><td><Bdi>{t.task_id}</Bdi>{t.stale ? <span className="f-meta-sm"> · לא עודכן זמן רב</span> : null}{t.blockers.length ? <span className="f-meta-sm"> · חסום: {t.blockers.join(", ")}</span> : null}</td>
                  <td>{taskStatusLabel(t.status)}</td><td>{completionLabel(t.completion)}</td><td>{evidenceStateLabel(t.evidence_state)}</td><td>{t.due ? fmtDate(t.due) : "—"}</td></tr>
              ))}</tbody>
            </table>
          )}

          <h3 className="f-bmkt__sub">ראיות וקבלות ביצוע שנרשמו כאן</h3>
          {p.records.length === 0 ? <p className="f-meta">לא נרשמו ראיות או קבלות לפרויקט הזה.</p> : (
            <ul className="f-bmkt__records">{p.records.map((r) => (
              <li key={r.id}><b>{RECORD[r.kind] ?? r.kind}</b> · <Bdi>{r.approvalId ?? r.targetId}</Bdi> · {at(r.createdAt)} · <span data-reconciled={r.reconciledState ?? "none"}>{reconciledLabel(r.reconciledState)}</span></li>
            ))}</ul>
          )}
        </section>
      ))}
    </Page>
  );
}
