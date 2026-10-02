import Link from "next/link";
import type { ReactNode } from "react";
import type { AccountRole, Permission, PermissionRow, SettingsNavItem, SettingsSection } from "@/lib/focus/contracts/settings";
import { cx } from "@/components/focus/ui/cx";

/**
 * Settings patterns (handoff H13/H14): the settings side navigation (a list of links with aria-current; a horizontal
 * wrap of links below 1200px), the settings frame, and the role × permission matrix (a semantic table whose every
 * cell is symbol + word).
 */
export function SettingsNav({ items, current }: { items: SettingsNavItem[]; current: SettingsSection }) {
  return (
    <nav className="f-cm-snav" aria-label="הגדרות">
      <span className="f-cm-snav__title" aria-hidden>הגדרות</span>
      <ul className="f-cm-snav__list">
        {items.map((it) => (
          <li key={it.key}>
            <Link href={it.href} className="f-cm-snav__item" aria-current={it.key === current ? "page" : undefined}>
              <span>{it.label}</span>
              {it.count ? <span className="f-cm-snav__count" aria-label={it.countLabel ?? `${it.count}`}><span aria-hidden>!</span> {it.count}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SettingsFrame({ nav, children, aside, className }: { nav: ReactNode; children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cx("f-cm-settings", aside ? "f-cm-settings--aside" : undefined, className)}>
      {nav}
      <div className="f-cm-settings__main">{children}</div>
      {aside}
    </div>
  );
}

export function PermissionMatrix({ rows, roles, roleLabel, words, legend, title }: {
  rows: PermissionRow[]; roles: AccountRole[]; roleLabel: (r: AccountRole) => string;
  words: Record<Permission, { glyph: string; word: string }>; legend: string; title: string;
}) {
  return (
    <section className="f-cm-matrix" aria-labelledby="cm-matrix-title">
      <h2 id="cm-matrix-title" className="f-cm-matrix__title">{title}</h2>
      <table className="f-cm-matrix__table">
        <thead>
          <tr>
            <td />
            {roles.map((r) => <th key={r} scope="col" className="f-cm-matrix__role">{roleLabel(r)}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="f-cm-matrix__cap">{row.label}</th>
              {roles.map((r) => {
                const p = row.cells[r];
                return (
                  <td key={r} className={cx("f-cm-matrix__cell", `f-cm-matrix__cell--${p}`)}>
                    <span className="f-cm-matrix__glyph" aria-hidden>{words[p].glyph}</span>
                    <span className="f-cm-matrix__word">{words[p].word}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="f-cm-matrix__legend">{legend}</p>
    </section>
  );
}
