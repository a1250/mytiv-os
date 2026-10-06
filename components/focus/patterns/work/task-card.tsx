import Link from "next/link";
import type { Priority } from "@/lib/focus/contracts/status";
import type { Task } from "@/lib/focus/contracts/work";
import { daysBetween, fmtDayMonth, fmtDays } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { cx } from "@/components/focus/ui/cx";
import { Icon } from "@/components/focus/ui/icon";
import { SourceDot, WORK, WorkStatusTag } from "@/components/focus/ui/status";

/**
 * Task cards for Mytiv Work (W1, D1 "העבודה שלי להיום", M9). Pure views over the `Task` contract; actions come in as
 * callbacks (`onStartTimer`). The whole title is the link to the task drawer; the timer is a real button.
 */
export const PRIORITY: Record<Priority, { glyph: string; word: string; tone: "low" | "medium" | "high" }> = {
  low: { glyph: "●", word: "נמוך", tone: "low" },
  medium: { glyph: "◆", word: "בינוני", tone: "medium" },
  high: { glyph: "▲", word: "גבוה", tone: "high" },
  urgent: { glyph: "▲", word: "דחוף", tone: "high" },
};

export function PriorityPill({ priority, size = "sm" }: { priority: Priority; size?: "xs" | "sm" }) {
  const p = PRIORITY[priority];
  return <span className={cx("f-risk", `f-risk--${p.tone}`, size === "xs" && "f-risk--xs")}><span aria-hidden>{p.glyph}</span>{p.word}<span className="f-sr"> · עדיפות</span></span>;
}

export const priorityText = (p: Priority) => `${PRIORITY[p].glyph} ${PRIORITY[p].word}`;
const ctxText = (t: Task) => [t.context.client, t.context.project].filter(Boolean).join(" · ");
const sourceWord = (t: Task) => (t.source === "mytiv" ? "Mytiv" : "ClickUp");

export type TaskCardProps = {
  task: Task; now: string; size?: "sm" | "md"; view?: "list" | "board";
  timer?: { activeTaskId: string | null; onStart: (id: string) => void; onPause: () => void };
  blockerTitle?: string;
  /** derived by the caller (`displayStatus` / the "blocked" bucket) — "blocked" is never a stored status */
  blocked?: boolean;
  /** force the one-line shape (secondary cards in "היום שלי") */
  compact?: boolean;
};

/** Decide which card shape a task gets (rich when there is a next step, sub-task progress, a running state or a block). */
export function TaskCard(props: TaskCardProps) {
  const { task: t } = props;
  if (props.blocked) return <BlockedTaskCard {...props} />;
  if (t.status === "waiting") return <WaitingTaskCard {...props} />;
  if (props.compact) return <PlainTaskCard {...props} />;
  if (t.nextAction || t.subtasks.length || t.status === "in_progress") return <RichTaskCard {...props} />;
  return <PlainTaskCard {...props} />;
}

function TitleLink({ t, view = "list", className }: { t: Task; view?: "list" | "board"; className: string }) {
  return <Link href={R.task(t.id, view)} className={cx(className, "f-tcard__link")}>{t.title}</Link>;
}

export function RichTaskCard({ task: t, now, size = "md", view, timer }: TaskCardProps) {
  const overdue = t.dueDate ? daysBetween(t.dueDate, now) : 0;
  const isOverdue = overdue > 0;
  const subDone = t.subtasks.filter((s) => s.done).length;
  const running = timer?.activeTaskId === t.id;
  const footer = t.nextAction ? `הבא: ${t.nextAction}` : t.subtasks.length ? `תת־משימות ${subDone}/${t.subtasks.length}` : "";
  return (
    <article className={cx("f-tcard", "f-tcard--rich", `f-tcard--${size}`, isOverdue && "f-tcard--overdue")}>
      <div className="f-tcard__top">
        <PriorityPill priority={t.priority} size={size === "sm" ? "xs" : "sm"} />
        {isOverdue ? <span className="f-tcard__late">באיחור {fmtDays(overdue)}</span> : <SourceDot source={t.source} />}
      </div>
      <h3 className="f-tcard__title"><TitleLink t={t} view={view} className="f-tcard__titlelink" /></h3>
      {size === "md" && (
        <span className="f-tcard__ctx">
          {isOverdue && t.dueDate ? `${t.context.client ?? ""} · יעד היה ${fmtDayMonth(t.dueDate)}` : t.status === "in_progress" && !t.nextAction ? `${t.context.client ?? ""} · ${WORK.in_progress.glyph} ${WORK.in_progress.word}` : ctxText(t)}
        </span>
      )}
      <div className="f-tcard__foot">
        <span className="f-tcard__next">{size === "sm" && t.subtasks.length && t.nextAction ? `${footer} · ${subDone}/${t.subtasks.length}` : footer}</span>
        {size === "sm" && isOverdue ? null : timer && !isOverdue ? (
          <button type="button" className="f-tcard__timer" onClick={() => (running ? timer.onPause() : timer.onStart(t.id))} aria-pressed={running} aria-label={running ? `השהה טיימר · ${t.title}` : `הפעל טיימר · ${t.title}`}>
            <Icon name={running ? "pause" : "play"} size={size === "sm" ? 14 : 15} />{running ? "טיימר פעיל" : size === "md" && t.subtasks.length && !t.nextAction ? "הפעל" : "הפעל טיימר"}
          </button>
        ) : (
          <Link href={R.task(t.id, view)} className="f-tcard__open" aria-label={`פתח · ${t.title}`}>פתח</Link>
        )}
      </div>
    </article>
  );
}

export function PlainTaskCard({ task: t, now, size = "md", view }: TaskCardProps) {
  const overdue = t.dueDate ? daysBetween(t.dueDate, now) : 0;
  const subDone = t.subtasks.filter((s) => s.done).length;
  const smMeta = overdue > 0
    ? `${t.context.client ?? ""} · באיחור ${fmtDays(overdue)}`
    : t.nextAction ? `הבא: ${t.nextAction}${t.subtasks.length ? ` · ${subDone}/${t.subtasks.length}` : ""}` : null;
  const meta = size === "sm" && smMeta ? smMeta : !t.dueDate
    ? null
    : overdue > 0
      ? `${t.context.client ?? ""} · ${priorityText(t.priority)} · באיחור ${fmtDays(overdue)}`
      : overdue === 0
        ? `${t.context.client ?? ""} · ${priorityText(t.priority)} · ${sourceWord(t)}`
        : `יעד ${fmtDayMonth(t.dueDate)} · ${priorityText(t.priority)} · ${sourceWord(t)}`;
  if (!t.dueDate && size !== "sm") {
    return (
      <article className={cx("f-tcard", "f-tcard--row", `f-tcard--${size}`)}>
        <h3 className="f-tcard__title"><TitleLink t={t} view={view} className="f-tcard__titlelink" /></h3>
        <span className="f-tcard__meta">{WORK[t.status].glyph} {WORK[t.status].word}</span>
      </article>
    );
  }
  return (
    <article className={cx("f-tcard", "f-tcard--plain", `f-tcard--${size}`, overdue > 0 && "f-tcard--overdue")}>
      <h3 className="f-tcard__title"><TitleLink t={t} view={view} className="f-tcard__titlelink" /></h3>
      <span className="f-tcard__meta">{meta}</span>
    </article>
  );
}

export function BlockedTaskCard({ task: t, size = "md", view }: TaskCardProps) {
  const dep = t.dependsOn[0];
  return (
    <article className={cx("f-tcard", "f-tcard--blocked", `f-tcard--${size}`)}>
      {size === "md" ? (
        <div className="f-tcard__top"><WorkStatusTag status="blocked" size="xs" /><SourceDot source={t.source} /></div>
      ) : <WorkStatusTag status="blocked" size="xs" className="f-tcard__tag" />}
      <h3 className="f-tcard__title"><TitleLink t={t} view={view} className="f-tcard__titlelink" /></h3>
      {dep ? (
        <Link href={R.task(dep.id, view)} className="f-tcard__dep">
          <Icon name="link" size={size === "sm" ? 13 : 14} className="f-tcard__depicon" />
          <span>חסום {size === "sm" ? "ע״י" : "על ידי"} {size === "sm" ? dep.title : <b>{dep.title}</b>}</span>
        </Link>
      ) : t.blockedReason ? <span className="f-tcard__meta">{t.blockedReason}</span> : t.waitingFor ? <span className="f-tcard__meta">ממתין ל: {t.waitingFor}</span> : null}
    </article>
  );
}

export function WaitingTaskCard({ task: t, now, size = "md", view }: TaskCardProps) {
  const days = daysBetween(t.updatedAt, now);
  return (
    <article className={cx("f-tcard", "f-tcard--waiting", `f-tcard--${size}`)}>
      <div className="f-tcard__row">
        <h3 className="f-tcard__title"><TitleLink t={t} view={view} className="f-tcard__titlelink" /></h3>
        <span className={cx("f-risk", "f-risk--medium", "f-risk--xs")} title={WORK.waiting.word}>
          <span aria-hidden>{WORK.waiting.glyph}</span>{size === "md" ? WORK.waiting.word : <span className="f-sr">{WORK.waiting.word}</span>}
        </span>
      </div>
      <span className="f-tcard__meta">ממתין ל: {t.waitingFor ?? "—"} · {fmtDays(days)}</span>
    </article>
  );
}
