"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SCREENS, type NavKey } from "@/lib/focus/screens";
import { Icon } from "./icon";

/**
 * Top bar — the handoff's shared TopBar component (68px, ≤7 words-only nav items, scope switcher, search, optional
 * notifications with a count, "+ יצירה", avatar). The active item, switcher label and bell come from the screen
 * registry for the current route (as drawn in each handoff frame). Hidden in focus mode and on mobile previews.
 */
const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "today", label: "היום שלי", href: "/focus" },
  { key: "projects", label: "לקוחות ופרויקטים", href: "/focus/projects" },
  { key: "marketing", label: "שיווק ותוכן", href: "/focus/studio" },
  { key: "sales", label: "מכירות", href: "/focus/sales" },
  { key: "work", label: "עבודה", href: "/focus/work" },
  { key: "comms", label: "תקשורת", href: "/focus/comms" },
  { key: "reports", label: "דוחות", href: "/focus/reports" },
];

export function FocusTopBar() {
  const pathname = usePathname();
  const entry = SCREENS.find((s) => s.route === pathname);
  const state = entry?.nav ?? { active: "today" as NavKey, client: "כל הלקוחות", bell: false, avatar: "ר" };
  const items = state.active === "settings" ? [...NAV, { key: "settings" as NavKey, label: "הגדרות", href: "/focus/settings/connections" }] : NAV;
  return (
    <header className="f-topbar">
      <span className="f-brand">Mytiv</span>
      <button type="button" className="f-switcher">{state.client} ▾</button>
      <nav className="f-nav" aria-label="ניווט ראשי">
        {items.map((n) => (
          <Link key={n.key} href={n.href} className="f-nav__item" aria-current={n.key === state.active ? "page" : undefined}>{n.label}</Link>
        ))}
      </nav>
      <button type="button" className="f-iconbtn" aria-label="חיפוש"><Icon name="search" style={{ opacity: 0.8 }} /></button>
      {state.bell && (
        <button type="button" className="f-iconbtn" aria-label="התראות · 3 חדשות">
          <Icon name="bell" style={{ opacity: 0.8 }} /><span className="f-iconbtn__count">3</span>
        </button>
      )}
      <button type="button" className="f-create">+ יצירה</button>
      <span className="f-avatar" aria-hidden>{state.avatar}</span>
    </header>
  );
}

/** Prototype-only affordance: a way to reach every handoff screen (incl. focus modes and mobile previews). */
export function ScreenMapButton() {
  return <Link href="/focus/screens" className="f-screenmap">מפת מסכים</Link>;
}
