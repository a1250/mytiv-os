"use client";

import Link from "@/components/focus/ui/link";
import { useRef, useState, type KeyboardEvent } from "react";
import type { BoardColumn, Task } from "@/lib/focus/contracts/work";
import { fmtDayMonth } from "@/lib/focus/format";
import { PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { BOARD_ORDER, columnOf, isManuallyBlocked, openBlockers } from "@/lib/focus/state/work";
import { cx } from "@/components/focus/ui/cx";
import { Icon } from "@/components/focus/ui/icon";
import { SourceDot, WORK } from "@/components/focus/ui/status";
import { PriorityPill } from "./task-card";

/**
 * TaskBoard (Kanban) — contract `{ columns, onMove(taskId, toColumn, expectedVersion) }`. Keyboard (handoff): focus a card's handle,
 * Space picks it up, ←/→ move it between columns (RTL-aware), Space/Enter drops, Esc cancels. Every move is announced.
 * Mouse: drag the card. The rules (dependencies, open children) are checked by onMove, which may refuse with a reason.
 */
export const COLUMN_TITLES: Record<BoardColumn, { title: string; dot: string }> = {
  todo: { title: "לא התחיל", dot: "todo" },
  in_progress: { title: "בתהליך", dot: "progress" },
  blockedOrWaiting: { title: "חסום / ממתין", dot: "blocked" },
  done: { title: "הושלם", dot: "done" },
};

export function TaskBoard({
  tasks, all, onMove, timerTaskId, timerLabel, canEdit = true,
}: {
  /** `expectedVersion` = the token of the card as rendered (the move is refused as a conflict if it moved on) */
  tasks: Task[]; all: Task[]; onMove: (taskId: string, to: BoardColumn, expectedVersion: string) => { ok: boolean; reason?: string };
  timerTaskId?: string | null; timerLabel?: string; canEdit?: boolean;
}) {
  const [picked, setPicked] = useState<{ id: string; from: BoardColumn; to: BoardColumn } | null>(null);
  const [announce, setAnnounce] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<BoardColumn | null>(null);
  const handles = useRef<Record<string, HTMLButtonElement | null>>({});

  const colOf = (t: Task) => (picked?.id === t.id ? picked.to : columnOf(t, all));
  const columns = BOARD_ORDER.map((c) => ({ key: c, tasks: tasks.filter((t) => colOf(t) === c) }));

  const commit = (id: string, to: BoardColumn, title: string) => {
    const t = tasks.find((x) => x.id === id);
    const r = t ? onMove(id, to, t.version) : { ok: false, reason: "המשימה לא נמצאה." };
    setAnnounce(r.ok ? `"${title}" הועברה ל${COLUMN_TITLES[to].title}.` : `לא ניתן להעביר: ${r.reason}`);
    requestAnimationFrame(() => handles.current[id]?.focus());
  };

  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>, t: Task) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!picked) { const from = columnOf(t, all); setPicked({ id: t.id, from, to: from }); setAnnounce(`"${t.title}" נבחרה. חצים להזזה, רווח להנחה, Esc לביטול.`); }
      else if (picked.id === t.id) { setPicked(null); if (picked.to !== picked.from) commit(t.id, picked.to, t.title); else setAnnounce("לא הוזזה."); }
      return;
    }
    if (e.key === "Escape" && picked) { e.preventDefault(); setPicked(null); setAnnounce(`ההזזה בוטלה. "${t.title}" נשארה ב${COLUMN_TITLES[picked.from].title}.`); requestAnimationFrame(() => handles.current[t.id]?.focus()); return; }
    if (picked?.id === t.id && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const forward = rtl ? e.key === "ArrowLeft" : e.key === "ArrowRight";
      const i = BOARD_ORDER.indexOf(picked.to) + (forward ? 1 : -1);
      if (i < 0 || i >= BOARD_ORDER.length) return;
      const to = BOARD_ORDER[i];
      setPicked({ ...picked, to });
      setAnnounce(`עמודה: ${COLUMN_TITLES[to].title}`);
      requestAnimationFrame(() => handles.current[t.id]?.focus());
    }
  };

  return (
    <div className="f-board" aria-describedby="board-help">
      <p id="board-help" className="f-sr">לוח משימות. בכל כרטיס יש ידית: רווח לבחירה, חצים להזזה בין עמודות, רווח להנחה, Esc לביטול.</p>
      {columns.map((c) => (
        <section
          key={c.key}
          className={cx("f-board__col", over === c.key && "f-board__col--over")}
          aria-label={`${COLUMN_TITLES[c.key].title} · ${c.tasks.length}`}
          onDragOver={(e) => { if (dragId) { e.preventDefault(); setOver(c.key); } }}
          onDragLeave={() => setOver((o) => (o === c.key ? null : o))}
          onDrop={(e) => { e.preventDefault(); setOver(null); const t = all.find((x) => x.id === dragId); setDragId(null); if (t && columnOf(t, all) !== c.key) commit(t.id, c.key, t.title); }}
        >
          <h2 className="f-board__head"><span className={cx("f-board__dot", `f-board__dot--${COLUMN_TITLES[c.key].dot}`)} aria-hidden />{COLUMN_TITLES[c.key].title}<span className="f-board__count">{c.tasks.length}</span></h2>
          {c.tasks.map((t) => {
            const blockers = openBlockers(t, all);
            const isPicked = picked?.id === t.id;
            const who = t.assigneeId ? PEOPLE_BY_ID[t.assigneeId] : null;
            return (
              <article
                key={t.id}
                className={cx("f-kcard", isPicked && "f-kcard--picked", t.status === "done" && "f-kcard--done")}
                draggable={canEdit}
                onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", t.id); }}
                onDragEnd={() => { setDragId(null); setOver(null); }}
              >
                {t.status === "done" ? (
                  <span className="f-kcard__done"><span aria-hidden>{WORK.done.glyph}</span> {WORK.done.word}</span>
                ) : (
                  <div className="f-kcard__top">
                    <PriorityPill priority={t.priority} size="xs" />
                    {timerTaskId === t.id ? <span className="f-kcard__timer f-mono" dir="ltr" aria-label={`טיימר פעיל ${timerLabel ?? ""}`}>● {timerLabel}</span>
                      : t.subtasks.length ? <span className="f-kcard__sub f-num">{t.subtasks.filter((s) => s.done).length}/{t.subtasks.length}</span>
                      : <SourceDot source={t.source} />}
                  </div>
                )}
                <h3 className="f-kcard__title"><Link href={R.task(t.id, "board")} className="f-tcard__link">{t.title}</Link></h3>
                {isPicked && <span className="f-kcard__sub">מועבר ל{COLUMN_TITLES[picked.to].title} · נבחר</span>}
                {!isPicked && blockers.length > 0 && <span className="f-kcard__sub">חסום ע״י {blockers[0].title.split(" ")[0]}</span>}
                {!isPicked && !blockers.length && isManuallyBlocked(t) && <span className="f-kcard__sub"><span aria-hidden>{WORK.blocked.glyph}</span> חסום: {t.blockedReason}</span>}
                {!isPicked && !blockers.length && !isManuallyBlocked(t) && t.status === "waiting" && t.waitingFor && <span className="f-kcard__sub">ממתין ל: {t.waitingFor}</span>}
                {t.status !== "done" && (
                  <div className="f-kcard__foot">
                    <span className={cx("f-tl__av", t.assigneeId && `f-tl__av--${t.assigneeId}`, !who && "f-tl__av--none")} title={who?.name ?? "ללא אחראי"} aria-label={who?.name ?? "ללא אחראי"}>{who?.initial ?? "?"}</span>
                    <span className="f-kcard__due">{t.dueDate ? fmtDayMonth(t.dueDate) : "—"}</span>
                  </div>
                )}
                {canEdit && (
                  <button
                    ref={(el) => { handles.current[t.id] = el; }}
                    type="button"
                    className="f-kcard__handle"
                    aria-pressed={isPicked}
                    aria-label={`הזז: ${t.title} (בעמודה ${COLUMN_TITLES[colOf(t)].title})`}
                    onKeyDown={(e) => onHandleKey(e, t)}
                    onClick={() => !picked && setAnnounce("גרור עם העכבר או השתמש ברווח ובחצים.")}
                  >
                    <Icon name="grip" size={16} />
                  </button>
                )}
              </article>
            );
          })}
          {c.tasks.length === 0 && <p className="f-board__empty">אין משימות</p>}
        </section>
      ))}
      <div className="f-sr" aria-live="assertive">{announce}</div>
    </div>
  );
}
