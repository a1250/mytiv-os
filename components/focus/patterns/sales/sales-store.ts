"use client";

import { useSyncExternalStore } from "react";
import type { ContactSuggestion, Lead, ProposalDraft, TimelineEvent } from "@/lib/focus/contracts/sales";
import { LEADS } from "@/lib/focus/fixtures/sales";

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
