"use client";

import { CLIENT_UMINO, PORTFOLIO } from "@/lib/focus/fixtures/clients";
import { R } from "@/lib/focus/routes";
import { BrainCard, ClientHeader, ClientProjectRow, ConnectionsCard, ContactsCard } from "@/components/focus/patterns/clients/client-parts";
import { byUrgency } from "@/components/focus/patterns/clients/portfolio";
import { toPortfolio, useSessionProjects } from "@/components/focus/patterns/clients/session-projects";
import { MetricGrid } from "@/components/focus/patterns/metrics";
import { SectionHead } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { ButtonLink } from "@/components/focus/ui/button";
import { EmptyState } from "@/components/focus/ui/feedback";

/**
 * Client page · UMINO (handoff H2): who the client is, its projects (the autumn launch opens the project environment),
 * campaign results with source and certainty, contacts, the business-brain summary and the client's connections.
 * Projects created in the wizard for this client this session appear in the list (demo only).
 */
export default function ClientsClientScreen() {
  const { now } = useDemo();
  const session = useSessionProjects();
  const c = CLIENT_UMINO;
  const projects = [...PORTFOLIO, ...session.map(toPortfolio)].filter((p) => p.client.id === c.client.id).sort(byUrgency);
  return (
    <div className="f-cl-client">
      <ClientHeader
        c={c}
        actions={<>
          <ButtonLink href={R.studio} variant="neutral">Brand Kit</ButtonLink>
          <ButtonLink href={R.clientBrain(c.slug)} variant="neutral">מוח העסק</ButtonLink>
          <ButtonLink href={`${R.newProject}?client=${c.slug}`} variant="primary">+ פרויקט ל־{c.client.name}</ButtonLink>
        </>}
      />
      <div className="f-cl-client__body">
        <div className="f-cl-client__main">
          <SectionHead title={`פרויקטים · ${projects.length}`} size="lg" className="f-cl-client__h" />
          {projects.length === 0
            ? <EmptyState title="אין עדיין פרויקטים ללקוח" hint="פרויקט חדש מתחיל באשף." />
            : <ul className="f-cl-crows">{projects.map((p) => <ClientProjectRow key={p.id} p={p} />)}</ul>}
          <SectionHead title="קמפיינים · תוצאות" size="lg" className="f-cl-client__h" />
          <MetricGrid metrics={c.results} now={now} columns={3} label="תוצאות הלקוח" className="f-cl-client__metrics" />
        </div>
        <aside className="f-cl-client__aside" aria-label="על הלקוח">
          <ContactsCard contacts={c.contacts} />
          <BrainCard brain={c.brain} href={R.clientBrain(c.slug)} />
          <ConnectionsCard connections={c.connections} />
        </aside>
      </div>
    </div>
  );
}
