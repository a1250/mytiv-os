"use client";

import { useState } from "react";
import type { Lead, LeadFilter, LeadNext, LeadSort } from "@/lib/focus/contracts/sales";
import { LEAD_VALUE_NOTE } from "@/lib/focus/fixtures/sales";
import { daysBetween } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { NewLeadDialog, NextActionDialog } from "@/components/focus/patterns/sales/lead-forms";
import { LeadCards, LeadTable } from "@/components/focus/patterns/sales/lead-list";
import { isOpen, nextText, STAGE } from "@/components/focus/patterns/sales/sales-parts";
import { addLead, patchLead, removeLead, restoreLead, useSales } from "@/components/focus/patterns/sales/sales-store";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { EmptyState } from "@/components/focus/ui/feedback";
import { SelectField } from "@/components/focus/ui/field";
import { Icon } from "@/components/focus/ui/icon";
import { Chips } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Leads (handoff F1, mobile M7 phone 1): stage filters and sort that work, value with its certainty, the next action
 * per lead — or a red "ללא פעולה הבאה" with an action that sets one (undo) — and "+ ליד חדש" in a validated dialog.
 */
const SORTS: { value: LeadSort; label: string }[] = [
  { value: "activity", label: "מיון: פעילות אחרונה" },
  { value: "next", label: "מיון: הפעולה הבאה" },
  { value: "value", label: "מיון: שווי" },
  { value: "name", label: "מיון: שם" },
];

const activityAt = (l: Lead) => l.lastContact ?? l.createdAt;
const amount = (l: Lead) => (l.value.kind === "known" || l.value.kind === "estimated" ? l.value.value : -1);
const nextRank = (l: Lead) => (!isOpen(l.stage) ? 3 : !l.next ? 0 : l.next.due ? 1 : 2);

function sortLeads(list: Lead[], sort: LeadSort) {
  const xs = [...list];
  switch (sort) {
    case "activity": return xs.sort((a, b) => activityAt(b).localeCompare(activityAt(a)));
    case "next": return xs.sort((a, b) => nextRank(a) - nextRank(b) || (a.next?.due ?? "").localeCompare(b.next?.due ?? ""));
    case "value": return xs.sort((a, b) => amount(b) - amount(a));
    case "name": return xs.sort((a, b) => a.name.localeCompare(b.name, "he"));
  }
}

const matches = (l: Lead, f: LeadFilter) => (f === "all" ? true : f === "no_next" ? isOpen(l.stage) && !l.next : l.stage === f);

export default function SalesLeadsScreen() {
  const { now, viewer } = useDemo();
  const toast = useToast();
  const { leads } = useSales();
  const [filter, setFilter] = useState<LeadFilter>("all");
  const [sort, setSort] = useState<LeadSort>("activity");
  const [adding, setAdding] = useState<Lead | null>(null);
  const [creating, setCreating] = useState(false);
  const today = now.slice(0, 10);

  const count = (f: LeadFilter) => leads.filter((l) => matches(l, f)).length;
  const list = sortLeads(leads.filter((l) => matches(l, filter)), sort);
  const newThisWeek = leads.filter((l) => l.stage === "new" && daysBetween(l.createdAt, now) < 7).length;
  const noNext = count("no_next");

  const chip = (key: LeadFilter, label: string) => ({ key, label, count: count(key) });
  const desktopChips = [chip("all", "הכול"), ...(["new", "in_progress", "waiting", "meeting", "proposal_sent", "won"] as const).map((s) => chip(s, STAGE[s])), chip("no_next", "ללא פעולה הבאה")];
  const mobileChips = [chip("all", "הכול"), chip("new", STAGE.new), chip("no_next", "ללא פעולה"), ...(["meeting", "in_progress", "waiting", "proposal_sent", "won"] as const).map((s) => chip(s, STAGE[s]))];

  const saveNext = (lead: Lead, next: LeadNext) => {
    const prev = patchLead(lead.id, { next });
    setAdding(null);
    if (prev) toast.push({ title: `נקבעה פעולה הבאה: ${nextText(next)}`, detail: lead.name, undo: { onUndo: () => restoreLead(prev) } });
  };

  const create = (d: { name: string; company: string; source: string; ownerId: string; value: number | null; email: string; next: LeadNext | null }) => {
    const lead: Lead = {
      id: `lead-${Date.now()}`, name: d.name, company: d.company || "—", source: d.source, stage: "new",
      value: d.value == null ? { kind: "unknown", reason: "טרם הוערך" } : { kind: "estimated", value: d.value, basis: "הערכת האחראי" },
      ownerId: d.ownerId, next: d.next, lastContact: null, createdAt: now,
      quality: d.email ? { state: "unverified", label: "לא מאומת" } : { state: "partial", label: "חסר מייל" },
      email: d.email || undefined, href: null,
    };
    addLead(lead);
    setCreating(false);
    if (filter !== "all" && !matches(lead, filter)) setFilter("all");
    toast.push({ title: `הליד נוסף: ${lead.name}`, detail: lead.next ? `הבא: ${nextText(lead.next)}` : "אין לו עדיין פעולה הבאה.", undo: { onUndo: () => removeLead(lead.id) } });
  };

  const status = (
    <>
      <span className="f-only-desktop">
        {newThisWeek === 1 ? "ליד חדש אחד השבוע." : `${newThisWeek} לידים חדשים השבוע.`}{" "}
        {noNext === 0 ? "לכולם יש פעולה הבאה." : noNext === 1 ? "לאחד אין פעולה הבאה." : `ל־${noNext} אין פעולה הבאה.`}
      </span>
      <span className="f-only-mobile">{newThisWeek} חדשים · {noNext} ללא פעולה הבאה</span>
    </>
  );

  return (
    <Page className="f-sl-page f-sl-leads f-own-mhead">
      <PageHeader
        eyebrow={<span className="f-sl-crumb">מכירות <span aria-hidden>›</span> לידים</span>}
        title="לידים" size="page" status={status}
        actions={<>
          <ButtonLink variant="outline" href={R.discovery} className="f-sl-hide-narrow">גילוי לידים</ButtonLink>
          <Button variant="primary" className="f-sl-hide-narrow" onClick={() => setCreating(true)}>+ ליד חדש</Button>
          <button type="button" className="f-sl-fab" aria-label="ליד חדש" onClick={() => setCreating(true)}><Icon name="plus" size={24} /></button>
        </>}
      />
      <div className="f-sl-bar">
        <Chips label="סינון לפי שלב" value={filter} onChange={setFilter} items={desktopChips} className="f-sl-hide-narrow" />
        <Chips label="סינון לפי שלב" value={filter} onChange={setFilter} items={mobileChips} className="f-sl-chips-scroll f-sl-only-narrow" />
        <span className="f-grow f-sl-hide-narrow" />
        <SelectField label="מיון" labelClassName="f-sr" className="f-sl-sort f-sl-hide-narrow" inputClassName="f-input--sm" value={sort}
          onChange={(e) => setSort(e.target.value as LeadSort)} options={SORTS} />
      </div>
      {list.length === 0 ? (
        <EmptyState glyph="✓" title="אין לידים בסינון הזה" hint={filter === "no_next" ? "לכל ליד פתוח יש פעולה הבאה." : "נסה סינון אחר."}
          action={<Button variant="neutral" size="sm" onClick={() => setFilter("all")}>הצג הכול</Button>} />
      ) : (
        <>
          <LeadTable leads={list} now={now} onAddNext={setAdding} />
          <LeadCards leads={list} now={now} onAddNext={setAdding} />
        </>
      )}
      <p className="f-meta f-sl-hide-narrow">{LEAD_VALUE_NOTE}</p>
      <NextActionDialog lead={adding} today={today} onClose={() => setAdding(null)} onSave={saveNext} />
      <NewLeadDialog open={creating} today={today} viewerId={viewer.id} onClose={() => setCreating(false)} onCreate={create} />
    </Page>
  );
}
