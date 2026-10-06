"use client";

import Link from "@/components/focus/ui/link";
import type { ReactNode } from "react";
import type { ApprovalStatus } from "@/lib/focus/contracts/status";
import type { ProposalSummary } from "@/lib/focus/contracts/sales";
import type { ExecState } from "@/lib/focus/state/execution";
import { fmtDayMonth, fmtMoney, fmtTime } from "@/lib/focus/format";
import { ProposalStatusPill } from "./sales-parts";

/**
 * Proposals list (handoff H9): number, client, amount, status (outlined pill), dates, whether it was viewed — only
 * when the system knows, otherwise "לא ידוע" — and ONE next step per row. Table on desktop, cards under 768px.
 * The proposal that waits in the approvals queue takes its live status from the demo store.
 */
export function liveProposal(p: ProposalSummary, approval: ApprovalStatus | undefined, exec: ExecState | undefined): ProposalSummary {
  if (!p.approvalId) return p;
  if (exec?.step === "sent") return { ...p, status: "sent", view: { kind: "unknown", sentAt: new Date(exec.at).toISOString() } };
  if (approval === "changes_requested" || approval === "rejected") return { ...p, status: "draft" };
  return { ...p, status: "pending" };
}

export function viewText(p: ProposalSummary): string {
  switch (p.view.kind) {
    case "none": return p.status === "pending" ? "טרם נשלחה" : "—";
    case "unknown": return `לא ידוע · נשלחה ${fmtTime(p.view.sentAt)}`;
    case "viewed": return `נצפתה ${fmtDayMonth(p.view.at)} · ללא תגובה`;
    case "accepted": return `התקבלה ${fmtDayMonth(p.view.at)}`;
  }
}

export type ProposalRow = { p: ProposalSummary; action: ReactNode };

function ClientCell({ p }: { p: ProposalSummary }) {
  return (
    <span className="f-sl-who">
      {p.href ? <Link href={p.href} className="f-sl-lname">{p.client}</Link> : <b className="f-sl-lname">{p.client}</b>}
      <span className="f-sl-sub">{p.subject}</span>
    </span>
  );
}

export function ProposalTable({ rows }: { rows: ProposalRow[] }) {
  return (
    <div className="f-sl-tablewrap f-sl-only-wide">
      <table className="f-sl-table f-sl-prop-table">
        <caption className="f-sr">הצעות מחיר · {rows.length}</caption>
        <thead>
          <tr>
            <th scope="col" className="f-sl-col-wide">מספר</th>
            <th scope="col">לקוח</th>
            <th scope="col">סכום</th>
            <th scope="col">מצב</th>
            <th scope="col" className="f-sl-col-wide">נוצרה</th>
            <th scope="col" className="f-sl-col-mid">תוקף</th>
            <th scope="col">צפייה / תגובה</th>
            <th scope="col">הבא</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ p, action }) => (
            <tr key={p.id}>
              <td className="f-sl-col-wide f-meta"><bdi dir="ltr">{p.number}</bdi></td>
              <th scope="row"><ClientCell p={p} /></th>
              <td><b className="f-num">{fmtMoney(p.amount.amount)}</b></td>
              <td><ProposalStatusPill status={p.status} /></td>
              <td className="f-sl-col-wide f-meta f-num">{fmtDayMonth(p.createdAt)}</td>
              <td className="f-sl-col-mid f-meta f-num">{p.validUntil ? fmtDayMonth(p.validUntil) : "—"}</td>
              <td className="f-sl-soft f-sl-small">{viewText(p)}</td>
              <td className="f-sl-small">{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProposalCards({ rows }: { rows: ProposalRow[] }) {
  return (
    <ul className="f-sl-cards f-sl-only-narrow" aria-label={`הצעות מחיר · ${rows.length}`}>
      {rows.map(({ p, action }) => (
        <li key={p.id} className="f-sl-card">
          <div className="f-sl-card__top"><ClientCell p={p} /><ProposalStatusPill status={p.status} size="sm" /></div>
          <span className="f-sl-card__meta"><b className="f-num f-sl-ink">{fmtMoney(p.amount.amount)}</b> · <bdi dir="ltr">{p.number}</bdi>{p.validUntil ? ` · בתוקף עד ${fmtDayMonth(p.validUntil)}` : ""}</span>
          <span className="f-sl-card__meta">{viewText(p)}</span>
          <span className="f-sl-card__next">{action}</span>
        </li>
      ))}
    </ul>
  );
}
