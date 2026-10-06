"use client";

import Link from "@/components/focus/ui/link";
import type { ReactNode } from "react";
import type { BrainSummary, ClientConnection, ClientContact, ClientProfile, PortfolioProject } from "@/lib/focus/contracts/clients";
import type { Loadable } from "@/lib/focus/contracts/loadable";
import { fmtDayMonth, fmtMonthYear } from "@/lib/focus/format";
import { personName } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { ButtonLink } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { LoadableView } from "@/components/focus/ui/feedback";
import { Bdi } from "@/components/focus/ui/misc";
import { SystemLine } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";
import { HealthPill } from "../project-card";
import { healthReason, HoursText, nextText, ProjectName } from "./portfolio";

/**
 * Client page parts (handoff H2): entity header, project rows, contacts, the business-brain summary and the client's
 * connections. Every block takes a Loadable, so an unavailable source is a banner — never an empty card or a zero.
 */
export function ClientHeader({ c, actions }: { c: ClientProfile; actions: ReactNode }) {
  return (
    <header className="f-cl-chead">
      <span className="f-cl-chead__logo" aria-hidden style={{ background: c.logo.bg, color: c.logo.fg }}>{c.logo.text}</span>
      <div className="f-cl-chead__titles">
        <nav className="f-crumbs" aria-label="נתיב"><Link href={R.projects}>לקוחות ופרויקטים</Link> <span aria-hidden>›</span> לקוחות</nav>
        <h1 className="f-cl-chead__title">{c.client.name}</h1>
        <p className="f-cl-chead__meta">{c.kind} · לקוח מאז {fmtMonthYear(c.since)} · איש קשר: {c.primaryContact} · אחראית: {personName(c.ownerId)}</p>
      </div>
      <div className="f-cl-chead__actions">{actions}</div>
    </header>
  );
}

export function ClientProjectRow({ p }: { p: PortfolioProject }) {
  return (
    <li className="f-cl-crow">
      <div className="f-cl-crow__main">
        <h3 className="f-cl-crow__name"><ProjectName p={p} /></h3>
        <span className="f-cl-crow__sub">{p.health.state === "done" ? healthReason(p) : `${p.health.state === "at_risk" ? `${p.health.blockers} חסימות · ` : ""}הבא: ${nextText(p)}`}</span>
      </div>
      <span className="f-cl-crow__health"><HealthPill health={p.health} /></span>
      <HoursText hours={p.hours} className="f-cl-crow__val" />
      <span className="f-cl-crow__val f-num">{p.ongoing ? "יעד שוטף" : p.dueDate ? (p.health.state === "done" ? `נסגר ${fmtDayMonth(p.dueDate)}` : `יעד ${fmtDayMonth(p.dueDate)}`) : "ללא יעד"}</span>
    </li>
  );
}

function Panel({ title, link, children, className }: { title: string; link?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("f-cl-side", className)} aria-label={title}>
      <div className="f-cl-side__head"><h2 className="f-cl-side__title">{title}</h2>{link}</div>
      {children}
    </section>
  );
}

export function ContactsCard({ contacts }: { contacts: Loadable<ClientContact[]> }) {
  const toast = useToast();
  const copy = async (c: ClientContact) => {
    try {
      await navigator.clipboard.writeText(c.email);
      toast.push({ title: "הכתובת הועתקה", detail: `${c.role} · ${c.email}` });
    } catch {
      toast.push({ kind: "error", title: "לא הצלחנו להעתיק", detail: `הכתובת: ${c.email}` });
    }
  };
  return (
    <Panel title="אנשי קשר">
      <LoadableView value={contacts} label="אנשי קשר" compact>
        {(list) => (
          <ul className="f-cl-contacts">
            {list.map((c) => (
              <li key={c.id} className="f-cl-contacts__row">
                <span className="f-cl-contacts__who">{c.role} · {c.scope}<Bdi className="f-cl-contacts__mail">{c.email}</Bdi></span>
                <button type="button" className="f-cl-contacts__copy f-hit" onClick={() => copy(c)} aria-label={`העתק את המייל של ${c.role}`}>העתק מייל</button>
              </li>
            ))}
          </ul>
        )}
      </LoadableView>
    </Panel>
  );
}

export function BrainCard({ brain, href }: { brain: Loadable<BrainSummary>; href: string }) {
  return (
    <Panel title="מוח העסק" link={<Link href={href} className="f-cl-side__link">פתח</Link>}>
      <LoadableView value={brain} label="מוח העסק" compact>
        {(b) => {
          const total = b.verified + b.partial + b.missing;
          return (
            <>
              <span className="f-cl-brainbar" aria-hidden>
                <span className="f-cl-brainbar__seg f-cl-brainbar__seg--ok" style={{ flexGrow: b.verified }} />
                <span className="f-cl-brainbar__seg f-cl-brainbar__seg--partial" style={{ flexGrow: b.partial }} />
                <span className="f-cl-brainbar__seg f-cl-brainbar__seg--missing" style={{ flexGrow: b.missing }} />
              </span>
              <p className="f-cl-side__text">{b.verified} נושאים אומתו · {b.partial} חלקית · {b.missing} חסר <span className="f-sr">מתוך {total}</span></p>
              {b.stale.map((s) => <SystemLine key={s.id} status="stale">{s.text}</SystemLine>)}
            </>
          );
        }}
      </LoadableView>
    </Panel>
  );
}

const CONN_STATUS = { ok: "done", expired: "failed", error: "failed" } as const;

export function ConnectionsCard({ connections }: { connections: Loadable<ClientConnection[]> }) {
  return (
    <Panel title="חיבורים של הלקוח" link={<Link href={R.settings} className="f-cl-side__link">נהל</Link>}>
      <LoadableView value={connections} label="חיבורים" compact>
        {(list) => (
          <ul className="f-cl-conns">
            {list.map((c) => (
              <li key={c.id}>
                <SystemLine status={CONN_STATUS[c.state]} className="f-cl-conns__line">
                  {c.label} · {c.detail}{c.since ? ` · מ־${fmtDayMonth(c.since)}` : ""}
                </SystemLine>
                {c.state !== "ok" && <ButtonLink href={R.settings} variant="link" size="sm" className="f-cl-conns__fix">חבר מחדש בהגדרות</ButtonLink>}
              </li>
            ))}
          </ul>
        )}
      </LoadableView>
    </Panel>
  );
}
