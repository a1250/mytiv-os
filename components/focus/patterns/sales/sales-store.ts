"use client";

import { useSyncExternalStore } from "react";
import type { ContactSuggestion, Lead, ProposalDraft, TimelineEvent } from "@/lib/focus/contracts/sales";
import type { Approval } from "@/lib/focus/contracts/approvals";
import { LEADS, PROPOSAL_CORPORATE } from "@/lib/focus/fixtures/sales";
import { fmtMoney } from "@/lib/focus/format";
import { savedTotal } from "./proposal-editor";

/**
 * Sales demo state shared by the sales screens (leads list ↔ lead page ↔ discovery ↔ proposal editor ↔ outreach), so
 * a lead added in discovery or a stage changed on the lead page shows in the list too. A stand-in for the sales API,
 * like the demo store: kept in sessionStorage, the server render (and the first client render) are the fixtures.
 */
export type SalesState = {
  leads: Lead[];
  /** events added on a lead page (notes), newest first */
  events: Record<string, TimelineEvent[]>;
  /** contacts the user approved from the background search */
  contacts: Record<string, ContactSuggestion[]>;
  /** the saved proposal draft (null = the fixture) */
  proposal: Pick<ProposalDraft, "lines" | "notes" | "templateId" | "validityDays"> | null;
  outreach: { subject: string; body: string; purpose: string; tone: string } | null;
  /** the last discovery search started (its results appear when the job settles) */
  discovery: { query: string; category: string } | null;
};

const KEY = "mytiv-focus-sales-v1";
const INITIAL: SalesState = { leads: LEADS, events: {}, contacts: {}, proposal: null, outreach: null, discovery: null };

let current: SalesState | null = null;
const listeners = new Set<() => void>();

function snapshot(): SalesState {
  if (current) return current;
  try {
    const raw = sessionStorage.getItem(KEY);
    current = raw ? { ...INITIAL, ...(JSON.parse(raw) as Partial<SalesState>) } : INITIAL;
  } catch {
    current = INITIAL;
  }
  return current;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useSales(): SalesState {
  return useSyncExternalStore(subscribe, snapshot, () => INITIAL);
}

/** The committed sales state, for code that runs outside render (the send guard in the demo store). */
export function getSales(): SalesState {
  return snapshot();
}

/**
 * A proposal is sent at the amount that was approved. If the saved draft changed since, the send (and any retry) is
 * blocked — this is the reason, or undefined when the send may go. Checked by the store on every submit / retry and
 * shown by the summary screen; one function, so the two can never disagree.
 */
export function proposalSendBlock(a: Approval, proposal: SalesState["proposal"]): string | undefined {
  if (a.id !== PROPOSAL_CORPORATE.approvalId || !proposal) return undefined;
  const approved = a.execution?.payload.amount?.amount;
  const draft = savedTotal(proposal.lines, PROPOSAL_CORPORATE.vatRate);
  if (approved == null || draft === approved) return undefined;
  return `ההצעה נערכה אחרי האישור: הסכום בטיוטה ${fmtMoney(draft)}, ואושר ${fmtMoney(approved)}. חזרו להצעה והחזירו אותה לגרסה שאושרה, או אשרו גרסה חדשה.`;
}

export function updateSales(fn: (s: SalesState) => SalesState) {
  current = fn(snapshot());
  try { sessionStorage.setItem(KEY, JSON.stringify(current)); } catch { /* blocked storage: the demo still works in memory */ }
  listeners.forEach((l) => l());
}

/* ---------- actions (each returns what undo needs) ---------- */

export function patchLead(id: string, patch: Partial<Lead>): Lead | null {
  const prev = snapshot().leads.find((l) => l.id === id) ?? null;
  if (prev) updateSales((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  return prev;
}

export function restoreLead(lead: Lead) {
  updateSales((s) => ({ ...s, leads: s.leads.map((l) => (l.id === lead.id ? lead : l)) }));
}

export function addLead(lead: Lead) {
  updateSales((s) => ({ ...s, leads: [lead, ...s.leads.filter((l) => l.id !== lead.id)] }));
}

export function removeLead(id: string) {
  updateSales((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }));
}

export function addEvent(leadId: string, ev: TimelineEvent) {
  updateSales((s) => ({ ...s, events: { ...s.events, [leadId]: [ev, ...(s.events[leadId] ?? [])] } }));
}

export function removeEvent(leadId: string, id: string) {
  updateSales((s) => ({ ...s, events: { ...s.events, [leadId]: (s.events[leadId] ?? []).filter((e) => e.id !== id) } }));
}

export function setContacts(leadId: string, list: ContactSuggestion[]) {
  updateSales((s) => ({ ...s, contacts: { ...s.contacts, [leadId]: list } }));
}

export function saveProposal(p: SalesState["proposal"]) {
  updateSales((s) => ({ ...s, proposal: p }));
}

export function saveOutreach(o: SalesState["outreach"]) {
  updateSales((s) => ({ ...s, outreach: o }));
}

export function setDiscovery(d: SalesState["discovery"]) {
  updateSales((s) => ({ ...s, discovery: d }));
}
