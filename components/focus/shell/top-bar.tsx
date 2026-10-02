"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/focus/ui/icon";
import { cx } from "@/components/focus/ui/cx";
import { APPROVALS } from "@/lib/focus/fixtures/approvals";
import { CLIENTS, VIEWER } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { SCREENS } from "@/lib/focus/screens";
import { CommandPalette } from "./command-palette";
import { useDemo } from "./demo-store";
import { Menu, MenuLink } from "./menu";
import { THEME_OPTIONS, useTheme } from "./theme";

/**
 * Global navigation (handoff TopBar.dc.html + §6.3): ≤7 words-only items, scope switcher, search, notifications with a
 * count, "+ יצירה", avatar. Tablet: items move into "עוד". Mobile: a compact header + 5-item bottom nav with icons
 * (icons only on mobile, always with a word). Hidden in focus mode.
 */
export type NavKey = "today" | "projects" | "marketing" | "sales" | "work" | "comms" | "reports" | "settings";

export const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "today", label: "היום שלי", href: R.today },
  { key: "projects", label: "לקוחות ופרויקטים", href: R.projects },
  { key: "marketing", label: "שיווק ותוכן", href: R.studio },
  { key: "sales", label: "מכירות", href: R.sales },
  { key: "work", label: "עבודה", href: R.work },
  { key: "comms", label: "תקשורת", href: R.comms },
  { key: "reports", label: "דוחות", href: R.reports },
];
const SETTINGS = { key: "settings" as NavKey, label: "הגדרות", href: R.settings };

export function navKeyFor(path: string): NavKey {
  const p = path.replace(/\/$/, "");
  if (/^\/focus\/(projects|clients)/.test(p)) return "projects";
  if (/^\/focus\/(marketing|studio)/.test(p)) return "marketing";
  if (p.startsWith("/focus/sales")) return "sales";
  if (p.startsWith("/focus/work")) return "work";
  if (p.startsWith("/focus/comms")) return "comms";
  if (p.startsWith("/focus/reports")) return "reports";
  if (p.startsWith("/focus/settings")) return "settings";
  return "today";
}

function scopeFor(path: string) {
  const s = SCREENS.find((x) => x.route === path);
  return s?.nav?.client ?? "כל הלקוחות";
}

const CREATE = [
  { label: "משימה", href: `${R.work}?create=1`, hint: "N" },
  { label: "ליד", href: R.sales },
  { label: "הצעת מחיר", href: R.proposals },
  { label: "סטורי", href: R.studioNew },
  { label: "פוסט או באנר", href: R.studioNew },
  { label: "קרוסלה", href: R.studioNew },
];

function useCounts() {
  const { state, approval } = useDemo();
  const pendingApprovals = APPROVALS.filter((a) => approval(a.id)?.status === "pending").length;
  const unread = 3 + state.notifications.filter((n) => !n.read).length;
  return { pendingApprovals, unread };
}

function ThemeChoice({ close }: { close: () => void }) {
  const { pref, setPref } = useTheme();
  return (
    <>
      <div className="f-menu__label" id="theme-label">ערכת צבע</div>
      <div className="f-theme" role="group" aria-labelledby="theme-label">
        {THEME_OPTIONS.map((o) => (
          <button key={o.value} type="button" role="menuitemradio" tabIndex={-1} aria-checked={pref === o.value} className="f-theme__opt" onClick={() => { setPref(o.value); close(); }}>
            <Icon name={o.icon} size={18} />{o.label}
          </button>
        ))}
      </div>
    </>
  );
}

function AvatarMenu() {
  return (
    <Menu label="חשבון" buttonLabel={`חשבון · ${VIEWER.name}`} buttonClassName="f-avatar-btn" buttonContent={<span className="f-avatar" aria-hidden>{VIEWER.initial}</span>}>
      {(close) => (
        <>
          <div className="f-menu__label">{VIEWER.name} · בעלים</div>
          <ThemeChoice close={close} />
          <div className="f-menu__sep" role="separator" />
          <MenuLink href={R.settingsUsers} onSelect={close}>משתמשים והרשאות</MenuLink>
          <MenuLink href={R.screens} onSelect={close}>מפת מסכים (אב טיפוס)</MenuLink>
        </>
      )}
    </Menu>
  );
}

function CreateMenu({ className, content, label = "יצירה" }: { className: string; content: React.ReactNode; label?: string }) {
  return (
    <Menu label="יצירה" buttonLabel={label} buttonClassName={className} buttonContent={content}>
      {(close) => CREATE.map((c) => <MenuLink key={c.label} href={c.href} onSelect={close} hint={c.hint}>{c.label}</MenuLink>)}
    </Menu>
  );
}

function ScopeSwitcher({ path }: { path: string }) {
  const scope = scopeFor(path);
  return (
    <Menu label="בחירת לקוח" buttonLabel={`לקוח: ${scope}`} align="start" buttonClassName="f-switcher f-hit" buttonContent={<>{scope} <span aria-hidden>▾</span></>}>
      {(close) => (
        <>
          <MenuLink href={R.today} onSelect={close} current={scope === "כל הלקוחות"}>כל הלקוחות</MenuLink>
          <MenuLink href={R.client("umino")} onSelect={close} current={scope === CLIENTS.umino.name}>{CLIENTS.umino.name}</MenuLink>
          <MenuLink href={R.projects} onSelect={close} current={scope === CLIENTS.gal.name}>{CLIENTS.gal.name}</MenuLink>
          <MenuLink href={R.settings} onSelect={close} current={scope === "Mytiv"}>Mytiv · הסוכנות</MenuLink>
        </>
      )}
    </Menu>
  );
}

export function FocusTopBar() {
  const path = usePathname();
  const active = navKeyFor(path);
  const items = active === "settings" ? [...NAV, SETTINGS] : NAV;
  const { pendingApprovals, unread } = useCounts();
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input, textarea, select, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); setSearch(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="f-topbar">
        <Link href={R.today} className="f-brand" aria-label="Mytiv · היום שלי">Mytiv</Link>
        <ScopeSwitcher path={path} />
        <nav className="f-nav" aria-label="ניווט ראשי">
          {items.map((n) => (
            <Link key={n.key} href={n.href} className="f-nav__item" aria-current={n.key === active ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        <span className="f-topbar__spacer" />
        <Menu label="ניווט ראשי" className="f-topbar__more" buttonLabel="ניווט · עוד" buttonClassName="f-switcher f-hit" buttonContent={<>{items.find((n) => n.key === active)?.label} · עוד <span aria-hidden>▾</span></>}>
          {(close) => items.map((n) => <MenuLink key={n.key} href={n.href} onSelect={close} current={n.key === active}>{n.label}</MenuLink>)}
        </Menu>
        <button type="button" className="f-iconbtn" aria-label="חיפוש ופקודות" title="חיפוש (/)" onClick={() => setSearch(true)}>
          <Icon name="search" className="f-icon-dim" />
        </button>
        <Link href={R.notifications} className="f-iconbtn" aria-label={`התראות · ${unread} חדשות`} title="התראות">
          <Icon name="bell" className="f-icon-dim" /><span className="f-iconbtn__count" aria-hidden>{unread}</span>
        </Link>
        <CreateMenu className="f-create" content={<>+ יצירה</>} />
        <AvatarMenu />
      </header>

      <header className="f-mhead">
        <ScopeSwitcher path={path} />
        <span className="f-mhead__spacer" />
        <button type="button" className="f-iconbtn f-iconbtn--surface" aria-label="חיפוש ופקודות" onClick={() => setSearch(true)}>
          <Icon name="search" className="f-icon-dim" />
        </button>
        <Link href={R.notifications} className="f-iconbtn f-iconbtn--surface" aria-label={`התראות · ${unread} חדשות`}>
          <Icon name="bell" className="f-icon-dim" /><span className="f-iconbtn__count" aria-hidden>{unread}</span>
        </Link>
      </header>

      <nav className="f-bottomnav" aria-label="ניווט ראשי">
        <BottomItem href={R.today} icon="sun" label="היום" current={active === "today" && !path.startsWith(R.approvals)} />
        <BottomItem href={R.approvals} icon="check-circle-2" label={`אישורים ${pendingApprovals}`} current={path.startsWith(R.approvals)} />
        <CreateMenu className="f-bottomnav__plus" content={<Icon name="plus" size={24} />} label="יצירה" />
        <BottomItem href={R.projects} icon="folder" label="פרויקטים" current={active === "projects"} />
        <Menu label="עוד" buttonLabel="עוד" buttonClassName={cx("f-bottomnav__item")} buttonContent={<><span className="f-bottomnav__icon"><Icon name="menu" className="f-icon-dim" /></span>עוד</>} panelClassName="f-menu__panel--up">
          {(close) => (
            <>
              {[...NAV.filter((n) => n.key !== "today" && n.key !== "projects"), SETTINGS].map((n) => <MenuLink key={n.key} href={n.href} onSelect={close} current={n.key === active}>{n.label}</MenuLink>)}
              <div className="f-menu__sep" role="separator" />
              <ThemeChoice close={close} />
            </>
          )}
        </Menu>
      </nav>

      <CommandPalette open={search} onClose={() => setSearch(false)} />
    </>
  );
}

function BottomItem({ href, icon, label, current }: { href: string; icon: "sun" | "check-circle-2" | "folder"; label: string; current: boolean }) {
  return (
    <Link href={href} className="f-bottomnav__item" aria-current={current ? "page" : undefined}>
      <span className="f-bottomnav__icon"><Icon name={icon} className={current ? undefined : "f-icon-dim"} /></span>{label}
    </Link>
  );
}

/** Prototype-only affordance: reach every screen (incl. focus modes and device previews). */
export function ScreenMapButton() {
  return <Link href={R.screens} className="f-screenmap">מפת מסכים</Link>;
}
