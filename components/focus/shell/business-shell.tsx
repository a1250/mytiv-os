"use client";

import Link from "@/components/focus/ui/link";
import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { R } from "@/lib/focus/routes";
import { DemoStoreProvider, useDemo, type RemoteWork } from "./demo-store";
import { NavGuardProvider } from "./nav-guard";
import { useFocusScope } from "./scope";
import { unscopedPath } from "@/lib/focus/scope";
import { ToastProvider, useToast } from "@/components/focus/ui/toast";

/**
 * The Focus shell of a real business (Work, approvals and/or mail connected): the same store in remote mode (Mytiv Work API), toasts,
 * the one navigation guard, and a slim top bar with only the connected areas — no demo controls, no fixture
 * notifications, no screen map. Other areas render their "not connected yet" page.
 */
export type BusinessAreas = { work: boolean; approvals: boolean; mail: boolean };
export function BusinessShell({ remote, areas, children }: { remote: RemoteWork; areas: BusinessAreas; children: ReactNode }) {
  return (
    <DemoStoreProvider remote={remote}>
      <ToastProvider>
        <RemoteNotices />
        <NavGuardProvider>
          <BusinessTopBar areas={areas} />
          <main id="main" tabIndex={-1} className="f-main">{children}</main>
        </NavGuardProvider>
      </ToastProvider>
    </DemoStoreProvider>
  );
}

/** Server answers the user must know about (a write refused or in conflict, an unknown outcome) become toasts. */
function RemoteNotices() {
  const { notices, consumeNotices } = useDemo();
  const toast = useToast();
  useEffect(() => {
    if (!notices.length) return;
    for (const n of notices) toast.push({ kind: n.kind === "error" ? "error" : "info", title: n.title, detail: n.detail });
    consumeNotices();
  }, [notices, consumeNotices, toast]);
  return null;
}

const NAV = [
  { area: "work" as const, href: R.work, label: "המשימות שלי", match: (p: string) => p === "/focus/work" },
  { area: "work" as const, href: R.allTasks, label: "כל המשימות", match: (p: string) => p.startsWith("/focus/work/all-tasks") },
  { area: "approvals" as const, href: R.approvals, label: "אישורים", match: (p: string) => p.startsWith("/focus/approvals") },
  { area: "approvals" as const, href: R.marketingBoard, label: "שיווק", match: (p: string) => p.startsWith("/focus/marketing/board") },
  { area: "mail" as const, href: R.comms, label: "דואר", match: (p: string) => p === "/focus/comms" },
];

function BusinessTopBar({ areas }: { areas: BusinessAreas }) {
  const scope = useFocusScope();
  const { viewer } = useDemo();
  const path = unscopedPath(scope.base, usePathname());
  const name = scope.kind === "business" ? scope.name : "";
  return (
    <header className="f-topbar f-topbar--business">
      <div className="f-topbar__inner">
        <span className="f-topbar__brand"><b>Focus</b> · <bdi>{name}</bdi></span>
        <nav aria-label="ניווט ראשי" className="f-topbar__nav">
          {NAV.filter((n) => areas[n.area]).map((n) => <Link key={n.href} href={n.href} className="f-topbar__link" aria-current={n.match(path) ? "page" : undefined}>{n.label}</Link>)}
        </nav>
        <span className="f-grow" />
        <span className="f-meta-sm">{viewer.name}</span>
        <a href={`/${encodeURIComponent(scope.slug)}`} className="f-topbar__link">חזרה למערכת</a>
      </div>
    </header>
  );
}
