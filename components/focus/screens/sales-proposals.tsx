"use client";

import Link from "@/components/focus/ui/link";
import { useState, type ReactNode } from "react";
import type { ProposalSummary } from "@/lib/focus/contracts/sales";
import { PROPOSALS, PROPOSALS_NOTE } from "@/lib/focus/fixtures/sales";
import { fmtDayMonth, fmtMoney } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { liveProposal, ProposalCards, ProposalTable, type ProposalRow } from "@/components/focus/patterns/sales/proposal-list";
import { PlannedDialog } from "@/components/focus/patterns/sales/sales-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { EmptyState } from "@/components/focus/ui/feedback";
import { Chips } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Proposals (handoff H9): status as an outlined pill, follow-up, "viewed" only when known, real filters, and one next
 * step per row. The proposal waiting in the approvals queue is live (pending → sent once Gmail confirmed). A reminder
 * to the client is external and planned; the real alternative is a follow-up task.
 */
type Filter = "all" | "open" | "draft" | "accepted";
const IN: Record<Filter, (p: ProposalSummary) => boolean> = {
  all: () => true,
  open: (p) => p.status === "pending" || p.status === "sent",
  draft: (p) => p.status === "draft",
  accepted: (p) => p.status === "accepted",
};

export default function SalesProposalsScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { state } = demo;
  const [filter, setFilter] = useState<Filter>("all");
  const [planned, setPlanned] = useState<null | "reminder" | "new" | "templates">(null);
  const [reminderFor, setReminderFor] = useState<ProposalSummary | null>(null);

  const list = PROPOSALS.map((p) => liveProposal(p, p.approvalId ? demo.approval(p.approvalId)?.status : undefined, p.approvalId ? state.executions[p.approvalId] : undefined));
  const open = list.filter(IN.open);
  const sum = open.reduce((a, p) => a + p.amount.amount, 0);
  const pending = list.filter((p) => p.status === "pending").length;
  const notViewed = list.filter((p) => p.status === "sent" && p.view.kind === "unknown").length;
  const status = `${open.length} פתוחות בסך ${fmtMoney(sum)}.${pending ? ` ${pending === 1 ? "אחת ממתינה" : `${pending} ממתינות`} לאישור שלך.` : ""}${notViewed ? ` ${notViewed === 1 ? "על אחת לא ידוע אם נצפתה" : `על ${notViewed} לא ידוע אם נצפו`}.` : ""}`;

  /** a follow-up task created from this list (demo ids "t-new-…") */
  const taskFor = (p: ProposalSummary) => state.tasks.find((t) => t.links.proposalId === p.id && t.id.startsWith("t-new-") && t.status !== "done");
  const createTask = (p: ProposalSummary, title: string) => {
    const t = demo.createTask({ title, dueDate: null, priority: "medium", links: { proposalId: p.id }, context: { client: "מכירות", project: p.client } });
    toast.push({ title: "המשימה נוצרה", detail: `${title} · מופיעה בעבודה שלי`, undo: { onUndo: () => demo.removeTask(t.id) } });
  };

  const action = (p: ProposalSummary): ReactNode => {
    if (p.status === "pending" && p.approvalId) return <Link href={R.approval(p.approvalId)} className="f-sl-act">בדוק ושלח</Link>;
    if (p.status === "accepted") return <Link href={R.projects} className="f-sl-act">לפרויקטים</Link>;
    const task = taskFor(p);
    if (task) return <Link href={R.task(task.id)} className="f-sl-act">משימה פתוחה</Link>;
    if (p.status === "draft") {
      return p.href
        ? <Link href={p.href} className="f-sl-act">השלם ושלח</Link>
        : <Button variant="link" size="sm" onClick={() => createTask(p, `להשלים הצעה ${p.number} · ${p.client}`)}>צור משימה להשלמה</Button>;
    }
    if (p.status === "sent" && p.view.kind === "viewed") {
      return <Button variant="link" size="sm" aria-haspopup="dialog" onClick={() => { setReminderFor(p); setPlanned("reminder"); }}>שלח תזכורת</Button>;
    }
    if (p.followUp) return <span className="f-sl-ink f-sl-strong">מעקב {fmtDayMonth(p.followUp)}</span>;
    return <span className="f-meta">—</span>;
  };

  const rows: ProposalRow[] = list.filter(IN[filter]).map((p) => ({ p, action: action(p) }));
  const count = (f: Filter) => list.filter(IN[f]).length;

  return (
    <Page className="f-sl-page f-sl-props">
      <PageHeader
        eyebrow={<span className="f-sl-crumb"><Link href={R.sales} className="f-sl-crumb__a">מכירות</Link> <span aria-hidden>›</span> הצעות מחיר</span>}
        title="הצעות מחיר" size="entity" status={status}
        actions={<>
          <Button variant="neutral" onClick={() => setPlanned("templates")} aria-haspopup="dialog">תבניות</Button>
          <Button variant="primary" onClick={() => setPlanned("new")} aria-haspopup="dialog">+ הצעה חדשה</Button>
        </>}
      />
      <Chips label="סינון הצעות" value={filter} onChange={setFilter} items={[
        { key: "all", label: "הכול", count: count("all") }, { key: "open", label: "פתוחות", count: count("open") },
        { key: "draft", label: "טיוטות", count: count("draft") }, { key: "accepted", label: "התקבלו", count: count("accepted") },
      ]} />
      {rows.length === 0
        ? <EmptyState title="אין הצעות בסינון הזה" hint="נסה סינון אחר." action={<Button variant="neutral" size="sm" onClick={() => setFilter("all")}>הצג הכול</Button>} />
        : <><ProposalTable rows={rows} /><ProposalCards rows={rows} /></>}
      <p className="f-meta">{PROPOSALS_NOTE}</p>

      <PlannedDialog open={planned === "reminder"} onClose={() => setPlanned(null)} id="sl-remind" title={`תזכורת ל${reminderFor?.client ?? ""}`}
        what="שליחת תזכורת קצרה ללקוח מ־Gmail, אחרי שתאשר את הנוסח. שום דבר לא יישלח בלי אישור."
        meanwhile="אפשר ליצור משימת מעקב, והיא תופיע בעבודה שלי.">
        <Button variant="secondary" onClick={() => { if (reminderFor) createTask(reminderFor, `לשלוח תזכורת על הצעה ${reminderFor.number} · ${reminderFor.client}`); setPlanned(null); }}>צור משימת מעקב</Button>
      </PlannedDialog>
      <PlannedDialog open={planned === "new"} onClose={() => setPlanned(null)} id="sl-newprop" title="הצעה חדשה"
        what="יצירת הצעה חדשה מתבנית, ישירות מהרשימה."
        meanwhile="הצעה נוצרת מדף הליד, בכפתור ״צור הצעת מחיר״.">
        <ButtonLink variant="secondary" href={R.sales}>ללידים</ButtonLink>
      </PlannedDialog>
      <PlannedDialog open={planned === "templates"} onClose={() => setPlanned(null)} id="sl-templates" title="ניהול תבניות"
        what="עריכת תבניות ההצעה: שירותים, מחירים מהתפריט ותנאי תשלום."
        meanwhile="בעורך ההצעה אפשר לבחור תבנית ולהחליף אותה (עם ביטול).">
        <ButtonLink variant="secondary" href={R.proposal("corporate-hosting")}>לעורך ההצעה</ButtonLink>
      </PlannedDialog>
    </Page>
  );
}
