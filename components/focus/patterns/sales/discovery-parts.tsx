"use client";

import type { ReactNode } from "react";
import type { DiscoveryContact, DiscoveryResult } from "@/lib/focus/contracts/sales";
import { Skeleton } from "@/components/focus/ui/feedback";
import { Bdi } from "@/components/focus/ui/misc";
import { ConfidencePill } from "./sales-parts";

/**
 * Lead discovery results (handoff H8): business, sources, contact details — a guess is labelled "משוער · לא אומת" and
 * never shown as a fact — match confidence and ONE action. Table on desktop/tablet, cards under 768px.
 */
export function ContactText({ c }: { c: DiscoveryContact }) {
  switch (c.kind) {
    case "found": return <span><Bdi>{c.text}</Bdi> · {c.source}</span>;
    case "estimated": return <span className="f-sl-guess" title={c.basis}><Bdi>{c.text}</Bdi> · <b>משוער · לא אומת</b><span className="f-sr"> ({c.basis})</span></span>;
    case "none": return <span className="f-meta">לא נמצא</span>;
    case "existing": return <span>כבר ליד אצלך</span>;
  }
}

export type DiscoveryRow = { r: DiscoveryResult; contact: DiscoveryContact; action: ReactNode };

export function DiscoveryTable({ rows }: { rows: DiscoveryRow[] }) {
  return (
    <div className="f-sl-tablewrap f-sl-only-wide">
      <table className="f-sl-table f-sl-disc-table">
        <caption className="f-sr">תוצאות חיפוש · {rows.length}</caption>
        <thead>
          <tr><th scope="col">עסק</th><th scope="col" className="f-sl-col-wide">מקורות</th><th scope="col">פרטי קשר</th><th scope="col">ביטחון בהתאמה</th><th scope="col"><span className="f-sr">פעולה</span></th></tr>
        </thead>
        <tbody>
          {rows.map(({ r, contact, action }) => (
            <tr key={r.id}>
              <th scope="row"><span className="f-sl-who"><b className="f-sl-lname">{r.name}</b><span className="f-sl-sub">{r.meta}</span></span></th>
              <td className="f-sl-col-wide f-sl-soft f-sl-small">{r.sources.join(", ")}</td>
              <td className="f-sl-small"><ContactText c={contact} /></td>
              <td><ConfidencePill level={r.confidence} /></td>
              <td className="f-sl-small">{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DiscoveryCards({ rows }: { rows: DiscoveryRow[] }) {
  return (
    <ul className="f-sl-cards f-sl-only-narrow" aria-label={`תוצאות חיפוש · ${rows.length}`}>
      {rows.map(({ r, contact, action }) => (
        <li key={r.id} className="f-sl-card">
          <div className="f-sl-card__top"><b className="f-sl-lname">{r.name}</b><ConfidencePill level={r.confidence} /></div>
          <span className="f-sl-card__meta">{r.meta} · {r.sources.join(", ")}</span>
          <span className="f-sl-card__meta"><ContactText c={contact} /></span>
          <span className="f-sl-card__next">{action}</span>
        </li>
      ))}
    </ul>
  );
}

/** Loading rows in the final structure while the search runs. */
export function DiscoverySkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="f-sl-tablewrap f-sl-skelrows" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="f-sl-skelrow"><Skeleton h={14} w="38%" /><Skeleton h={12} w="22%" /><Skeleton h={12} w="16%" /></div>
      ))}
    </div>
  );
}
