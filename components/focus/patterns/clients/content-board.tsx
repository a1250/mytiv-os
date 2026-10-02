"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { ContentItem, ContentStage } from "@/lib/focus/contracts/clients";
import { fmtDayMonth } from "@/lib/focus/format";
import { personName } from "@/lib/focus/fixtures/people";
import { cx } from "@/components/focus/ui/cx";
import { Icon } from "@/components/focus/ui/icon";
import { ApprovalPill, OriginTag, WorkStatusTag } from "@/components/focus/ui/status";

/**
 * Content board (handoff H5). Same interaction model as the Mytiv Work TaskBoard (patterns/work/task-board.tsx), which
 * is typed for tasks: a handle per card — Space picks it up, ←/→ move it across columns (RTL-aware), Space/Enter drops,
 * Esc cancels — every step announced in a live region; with a mouse, drag the card. `onMove` may refuse with a reason
 * (e.g. only a decision moves an item to "מאושר"); the refusal is announced and nothing moves.
 */
export type StageDef = { key: ContentStage; title: string };
export type MoveResult = { ok: true } | { ok: false; reason: string };

export const itemMeta = (it: ContentItem) =>
  [it.ownerId ? personName(it.ownerId) : null, it.note ?? (it.due ? fmtDayMonth(it.due) : "ללא תאריך")].filter(Boolean).join(" · ");

/** Status tags of a content item — symbol + word, from the shared status language. */
export function ItemTags({ it }: { it: ContentItem }): ReactNode {
  const tags: ReactNode[] = [];
  if (it.blockedReason) tags.push(<WorkStatusTag key="b" status="blocked" label="חסום" size="xs" />);
  if (it.origin === "ai_suggested") tags.push(<OriginTag key="o" origin="ai_suggested" label="AI" size="sm" />);
  if (it.stage === "pending_approval") tags.push(<ApprovalPill key="p" status="pending" size="sm" />);
  if (it.stage === "approved") tags.push(<ApprovalPill key="a" status="approved" size="sm" />);
  return tags.length ? <span className="f-cl-kcard__tags">{tags}</span> : null;
}

export function ContentBoard({ stages, items, onMove }: { stages: StageDef[]; items: ContentItem[]; onMove: (id: string, to: ContentStage) => MoveResult }) {
  const [picked, setPicked] = useState<{ id: string; from: ContentStage; to: ContentStage } | null>(null);
  const [announce, setAnnounce] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<ContentStage | null>(null);
  const handles = useRef<Record<string, HTMLButtonElement | null>>({});
  const title = (k: ContentStage) => stages.find((s) => s.key === k)?.title ?? k;
  const order = stages.map((s) => s.key);

  const stageOf = (it: ContentItem) => (picked?.id === it.id ? picked.to : it.stage);
  const refocus = (id: string) => requestAnimationFrame(() => handles.current[id]?.focus());

  const commit = (it: ContentItem, to: ContentStage) => {
    const r = onMove(it.id, to);
    setAnnounce(r.ok ? `"${it.title}" הועבר לעמודה ${title(to)}.` : `לא ניתן להעביר: ${r.reason}`);
    refocus(it.id);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, it: ContentItem) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!picked) { setPicked({ id: it.id, from: it.stage, to: it.stage }); setAnnounce(`"${it.title}" נבחר. חצים להזזה, רווח להנחה, Esc לביטול.`); }
      else if (picked.id === it.id) { setPicked(null); if (picked.to !== picked.from) commit(it, picked.to); else setAnnounce("לא הוזז."); }
      return;
    }
    if (e.key === "Escape" && picked) {
      e.preventDefault();
      setPicked(null);
      setAnnounce(`ההזזה בוטלה. "${it.title}" נשאר בעמודה ${title(picked.from)}.`);
      refocus(it.id);
      return;
    }
    if (picked?.id === it.id && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const forward = rtl ? e.key === "ArrowLeft" : e.key === "ArrowRight";
      const i = order.indexOf(picked.to) + (forward ? 1 : -1);
      if (i < 0 || i >= order.length) return;
      setPicked({ ...picked, to: order[i] });
      setAnnounce(`עמודה: ${title(order[i])}`);
      refocus(it.id);
    }
  };

  return (
    <div className="f-cl-board" aria-describedby="f-cl-board-help" style={{ ["--cols" as string]: stages.length }}>
      <p id="f-cl-board-help" className="f-sr">לוח תוכן. בכל כרטיס יש ידית: רווח לבחירה, חצים להזזה בין עמודות, רווח להנחה, Esc לביטול.</p>
      {stages.map((s) => {
        const list = items.filter((it) => stageOf(it) === s.key);
        return (
          <section
            key={s.key}
            className={cx("f-cl-board__col", over === s.key && "f-cl-board__col--over")}
            aria-label={`${s.title} · ${list.length}`}
            onDragOver={(e) => { if (dragId) { e.preventDefault(); setOver(s.key); } }}
            onDragLeave={() => setOver((o) => (o === s.key ? null : o))}
            onDrop={(e) => {
              e.preventDefault(); setOver(null);
              const it = items.find((x) => x.id === dragId); setDragId(null);
              if (it && it.stage !== s.key) commit(it, s.key);
            }}
          >
            <h2 className="f-cl-board__head">{s.title}<span className="f-cl-board__count">{list.length}</span></h2>
            {list.map((it) => {
              const isPicked = picked?.id === it.id;
              return (
                <article
                  key={it.id}
                  className={cx("f-cl-kcard", isPicked && "f-cl-kcard--picked", dragId === it.id && "f-cl-kcard--drag")}
                  draggable
                  onDragStart={(e) => { setDragId(it.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", it.id); }}
                  onDragEnd={() => { setDragId(null); setOver(null); }}
                >
                  <span className="f-cl-kcard__format">{it.format}</span>
                  <h3 className="f-cl-kcard__title">{it.href ? <Link href={it.href} className="f-cl-plink">{it.title}</Link> : it.title}</h3>
                  <span className="f-cl-kcard__meta">{isPicked && picked.to !== picked.from ? `מועבר לעמודה ${title(picked.to)} · נבחר` : itemMeta(it)}</span>
                  {it.blockedReason && <span className="f-cl-kcard__why">{it.blockedReason}</span>}
                  <ItemTags it={it} />
                  <button
                    ref={(el) => { handles.current[it.id] = el; }}
                    type="button"
                    className="f-cl-kcard__handle"
                    aria-pressed={isPicked}
                    aria-label={`הזז: ${it.title} (בעמודה ${title(stageOf(it))})`}
                    onKeyDown={(e) => onKey(e, it)}
                    onClick={() => { if (!picked) setAnnounce("גרור עם העכבר, או רווח ואז חצים."); }}
                  >
                    <Icon name="grip" size={16} />
                  </button>
                </article>
              );
            })}
            {list.length === 0 && <p className="f-cl-board__empty">אין פריטים</p>}
          </section>
        );
      })}
      <div className="f-sr" aria-live="assertive">{announce}</div>
    </div>
  );
}
