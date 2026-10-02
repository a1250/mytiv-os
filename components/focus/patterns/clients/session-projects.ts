"use client";

import { useSyncExternalStore } from "react";
import type { PortfolioProject, SessionProject } from "@/lib/focus/contracts/clients";
import { CLIENTS } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";

/**
 * Projects created in the new-project wizard (H3). They live in sessionStorage only — the demo has no backend, so
 * nothing is sent anywhere. Read through useSyncExternalStore (server snapshot = none, so hydration never mismatches).
 * If storage is blocked the list is kept in memory for the page's lifetime.
 */
const KEY = "mytiv-focus-new-projects-v1";
const EVENT = "f-cl-session-projects";
const EMPTY: SessionProject[] = [];

let memory: SessionProject[] = EMPTY;
let cacheRaw: string | null | undefined;
let cacheVal: SessionProject[] = EMPTY;

function read(): SessionProject[] {
  let raw: string | null;
  try { raw = sessionStorage.getItem(KEY); } catch { return memory; }
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try { cacheVal = raw ? (JSON.parse(raw) as SessionProject[]) : EMPTY; } catch { cacheVal = EMPTY; }
  return cacheVal;
}

function write(list: SessionProject[]) {
  memory = list;
  try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode: memory only */ }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
}

export function useSessionProjects(): SessionProject[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addSessionProject(p: SessionProject) { write([...read().filter((x) => x.id !== p.id), p]); }
export function removeSessionProject(id: string) { write(read().filter((x) => x.id !== id)); }

const CLIENT_BY_ID = Object.fromEntries(Object.values(CLIENTS).map((c) => [c.id, c]));

/** A wizard project as a portfolio row: new, no work logged yet, health stated with its reason. */
export function toPortfolio(p: SessionProject): PortfolioProject {
  const hours = p.hoursBudget.trim() ? Number(p.hoursBudget) : null;
  const first = [...p.milestones].filter((m) => m.title && m.date).sort((a, b) => a.date.localeCompare(b.date))[0];
  return {
    id: p.id, name: p.name.trim(), client: CLIENT_BY_ID[p.clientId] ?? { id: p.clientId, name: "—" }, ownerId: p.ownerId || "",
    dueDate: p.dueDate || null, health: { state: "on_track" }, hours: { spent: 0, budget: hours, certainty: "known" },
    pendingApprovals: 0, next: first ? { text: first.title, due: first.date } : null, updated: { at: p.createdAt },
    phase: "planning", healthNote: "פרויקט חדש · עוד אין נתוני ביצוע.", href: null, taskHref: `${R.work}?create=1`, sessionOnly: true,
  };
}
