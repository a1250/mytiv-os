"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, projectsIndex } from "@/lib/focus/mock";

/**
 * Focus top bar + 6-area navigation (Direction C). `switcher` shows the current scope — "כל הלקוחות" on the
 * cross-client home, a client's name inside a project. Active nav is matched by path prefix.
 */
export function FocusTopBar() {
  const pathname = usePathname();
  const projMatch = pathname.match(/^\/focus\/projects\/([^/]+)/);
  const switcher = projMatch ? (projectsIndex[projMatch[1]] ?? projMatch[1]) : "כל הלקוחות";
  const isActive = (href: string) => (href === "/focus" ? pathname === "/focus" : pathname.startsWith(href));
  return (
    <header className="f-topbar">
      <div className="f-topbar__inner">
        <span className="f-brand">Mytiv</span>
        <button type="button" className="f-switcher">
          {switcher} <span className="f-switcher__chev">▾</span>
        </button>
        <nav className="f-nav" aria-label="ניווט ראשי">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="f-nav__item" aria-current={isActive(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <span className="f-topbar__spacer" />
        <button type="button" className="f-iconbtn" aria-label="התראות">
          🔔<span className="f-iconbtn__dot">3</span>
        </button>
        <button type="button" className="f-btn f-btn--primary">+ יצירה</button>
        <span className="f-avatar" aria-hidden>ר</span>
      </div>
    </header>
  );
}
