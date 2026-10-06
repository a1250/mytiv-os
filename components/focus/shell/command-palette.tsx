"use client";

import { useFocusRouter } from "@/components/focus/ui/link";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/focus/ui/dialog";
import { Icon } from "@/components/focus/ui/icon";
import { PlannedTag } from "@/components/focus/ui/status";
import { APPROVALS } from "@/lib/focus/fixtures/approvals";
import { TASKS } from "@/lib/focus/fixtures/work";
import { R } from "@/lib/focus/routes";
import { SCREENS } from "@/lib/focus/screens";
import { useNavGuardAttempt } from "./nav-guard";

/**
 * Search & ask (handoff §6.5): one field over screens, approvals and tasks (fixtures), ↑/↓ + Enter, Esc closes.
 * "שאל את Mytiv" has no backend yet → shown as planned, never as a working answer.
 */
type Hit = { id: string; group: string; title: string; meta?: string; href: string };

const INDEX: Hit[] = [
  ...APPROVALS.map((a) => ({ id: `a-${a.id}`, group: "אישורים", title: a.title, meta: a.summary, href: R.approval(a.id) })),
  ...TASKS.map((t) => ({ id: `t-${t.id}`, group: "משימות", title: t.title, meta: [t.context.client, t.context.project].filter(Boolean).join(" · "), href: R.task(t.id) })),
  ...SCREENS.filter((s) => s.mode !== "mobile").map((s) => ({ id: `s-${s.id}`, group: "מסכים", title: s.title, meta: s.subtitle || undefined, href: s.route })),
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useFocusRouter();
  const hits = useMemo(() => {
    const s = q.trim();
    return (s ? INDEX.filter((h) => `${h.title} ${h.meta ?? ""}`.includes(s)) : INDEX.filter((h) => h.group !== "מסכים")).slice(0, 8);
  }, [q]);
  // a screen with unsaved changes holds the navigation and asks first (the palette is not a link)
  const attempt = useNavGuardAttempt();
  const go = (h: Hit) => { onClose(); setQ(""); if (attempt(h.href)) router.push(h.href); };
  return (
    <Dialog open={open} onClose={() => { onClose(); setQ(""); }} label="חיפוש ופקודות" className="f-palette" initialFocus="input">
      <div className="f-palette__head">
        <Icon name="search" className="f-icon-dim" />
        <input
          className="f-palette__input"
          aria-label="חיפוש"
          role="combobox"
          aria-expanded
          aria-controls="palette-list"
          aria-activedescendant={hits[sel] ? `ph-${hits[sel].id}` : undefined}
          placeholder="חפש אישור, משימה או מסך…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((i) => Math.min(hits.length - 1, i + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
            if (e.key === "Enter" && hits[sel]) { e.preventDefault(); go(hits[sel]); }
          }}
        />
        <kbd className="f-palette__esc" dir="ltr">Esc</kbd>
      </div>
      <ul id="palette-list" role="listbox" aria-label="תוצאות" className="f-palette__list">
        {hits.length === 0 && <li className="f-palette__empty">אין תוצאות ל־&quot;{q}&quot;.</li>}
        {hits.map((h, i) => (
          <li key={h.id} id={`ph-${h.id}`} role="option" aria-selected={i === sel} className="f-palette__hit" onMouseEnter={() => setSel(i)} onClick={() => go(h)}>
            <span className="f-palette__group">{h.group}</span>
            <span className="f-palette__title">{h.title}</span>
            {h.meta && <span className="f-palette__meta">{h.meta}</span>}
          </li>
        ))}
      </ul>
      <div className="f-palette__ask">
        <span><span aria-hidden>✦</span> שאל את Mytiv — תשובה עם מקורות, ופעולה שמגיעה לאישורים.</span>
        <PlannedTag />
      </div>
    </Dialog>
  );
}
