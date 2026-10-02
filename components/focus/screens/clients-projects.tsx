"use client";

import { useMemo, useState } from "react";
import type { PortfolioProject, PortfolioRisk, ProjectPhase } from "@/lib/focus/contracts/clients";
import { PORTFOLIO } from "@/lib/focus/fixtures/clients";
import { PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { byUrgency, FilterSelect, healthReason, PortfolioCard, PortfolioTable, riskOf } from "@/components/focus/patterns/clients/portfolio";
import { toPortfolio, useSessionProjects } from "@/components/focus/patterns/clients/session-projects";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { EmptyState } from "@/components/focus/ui/feedback";
import { Icon } from "@/components/focus/ui/icon";
import { Tabs } from "@/components/focus/ui/tabs";

/**
 * All projects (handoff H1). Cards or a table (the segmented control really switches), filters by client, owner,
 * phase and risk, free-text search and sorting. Projects created in the wizard this session are listed too (marked as
 * demo-only). Health always carries its written reason; hours carry their certainty.
 */
type View = "cards" | "list";
type Sort = "urgency" | "due" | "updated";

const PHASE_LABEL: Record<ProjectPhase, string> = { planning: "בתכנון", active: "פעיל", done: "הושלם" };
const RISK_LABEL: Record<PortfolioRisk, string> = { high: "▲ גבוה", medium: "◆ בינוני", low: "● נמוך", none: "✓ הושלם" };

const count = (n: number, one: string, many: string) => (n === 1 ? one : `${n} ${many}`);

export default function ClientsProjectsScreen() {
  const { now } = useDemo();
  const session = useSessionProjects();
  const all = useMemo(() => [...PORTFOLIO, ...session.map(toPortfolio)], [session]);

  const [view, setView] = useState<View>("cards");
  const [q, setQ] = useState("");
  const [client, setClient] = useState("all");
  const [owner, setOwner] = useState("all");
  const [phase, setPhase] = useState("all");
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState<Sort>("urgency");

  const clients = [...new Map(all.map((p) => [p.client.id, p.client])).values()];
  const owners = [...new Set(all.map((p) => p.ownerId))].filter(Boolean);

  const needle = q.trim().toLowerCase();
  const shown = all
    .filter((p) => client === "all" || p.client.id === client)
    .filter((p) => owner === "all" || p.ownerId === owner)
    .filter((p) => phase === "all" || p.phase === phase)
    .filter((p) => risk === "all" || riskOf(p) === risk)
    .filter((p) => !needle || `${p.client.name} ${p.name} ${healthReason(p)}`.toLowerCase().includes(needle))
    .sort(sort === "urgency" ? byUrgency
      : sort === "due" ? (a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
      : (a, b) => b.updated.at.localeCompare(a.updated.at));

  const filtered = q !== "" || [client, owner, phase, risk].some((v) => v !== "all");
  const clear = () => { setQ(""); setClient("all"); setOwner("all"); setPhase("all"); setRisk("all"); };

  const active = all.filter((p) => p.phase !== "done");
  const activeClients = new Set(active.map((p) => p.client.id)).size;
  const atRisk = active.filter((p) => p.health.state === "at_risk").length;
  const riskLine = atRisk === 0 ? "אין פרויקט בסיכון." : atRisk === 1 ? "אחד בסיכון." : `${atRisk} בסיכון.`;
  const status = `${count(active.length, "פרויקט פעיל אחד", "פרויקטים פעילים")} אצל ${count(activeClients, "לקוח אחד", "לקוחות")}. ${riskLine}`;

  const cards = (list: PortfolioProject[]) => (
    <div className="f-cl-pgrid">{list.map((p) => <PortfolioCard key={p.id} p={p} now={now} />)}</div>
  );

  return (
    <Page className="f-cl-projects">
      <PageHeader
        eyebrow="לקוחות ופרויקטים"
        title="פרויקטים"
        size="page"
        status={status}
        aside={<Tabs label="תצוגה" value={view} onChange={setView} idBase="f-cl-view" size="sm" className="f-cl-toggle" items={[{ key: "cards", label: "כרטיסים" }, { key: "list", label: "רשימה" }]} />}
        actions={<ButtonLink href={R.newProject} variant="primary">+ פרויקט חדש</ButtonLink>}
      />

      <div className="f-cl-toolbar" role="search" aria-label="סינון פרויקטים">
        <label className="f-cl-search">
          <span className="f-sr">חיפוש פרויקט או לקוח</span>
          <Icon name="search" size={16} className="f-cl-search__icon" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש פרויקט או לקוח" className="f-cl-search__input" />
        </label>
        <FilterSelect label="לקוח" value={client} onChange={(e) => setClient(e.target.value)} options={[{ value: "all", label: "הכול" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]} />
        <FilterSelect label="אחראי" value={owner} onChange={(e) => setOwner(e.target.value)} options={[{ value: "all", label: "הכול" }, ...owners.map((id) => ({ value: id, label: PEOPLE_BY_ID[id]?.name ?? id }))]} />
        <FilterSelect label="מצב" value={phase} onChange={(e) => setPhase(e.target.value)} options={[{ value: "all", label: "הכול" }, ...(Object.keys(PHASE_LABEL) as ProjectPhase[]).map((k) => ({ value: k, label: PHASE_LABEL[k] }))]} />
        <FilterSelect label="סיכון" value={risk} onChange={(e) => setRisk(e.target.value)} options={[{ value: "all", label: "הכול" }, ...(Object.keys(RISK_LABEL) as PortfolioRisk[]).map((k) => ({ value: k, label: RISK_LABEL[k] }))]} />
        <span className="f-grow" />
        <FilterSelect label="מיון" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="f-cl-filter--quiet" options={[{ value: "urgency", label: "דחיפות" }, { value: "due", label: "יעד" }, { value: "updated", label: "עודכן לאחרונה" }]} />
      </div>

      <p className="f-sr" aria-live="polite">מוצגים {shown.length} מתוך {all.length} פרויקטים.</p>
      {filtered && shown.length > 0 && (
        <p className="f-cl-result">מוצגים {shown.length} מתוך {all.length} פרויקטים. <Button variant="link" size="sm" onClick={clear}>נקה סינון</Button></p>
      )}

      <div role="tabpanel" id={`f-cl-view-panel-${view}`} aria-labelledby={`f-cl-view-tab-${view}`}>
        {shown.length === 0 ? (
          <EmptyState title="אין פרויקטים שמתאימים לסינון" hint="נסה מילה אחרת או נקה את הסינון." action={<Button variant="secondary" onClick={clear}>נקה סינון</Button>} />
        ) : view === "cards" ? cards(shown) : (
          <>
            <PortfolioTable projects={shown} now={now} caption="כל הפרויקטים" />
            <div className="f-cl-only-mobile">{cards(shown)}</div>
          </>
        )}
      </div>
    </Page>
  );
}
