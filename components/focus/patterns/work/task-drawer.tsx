"use client";

import Link from "@/components/focus/ui/link";
import { useId, useState, type ReactNode } from "react";
import type { Priority, WorkStatus } from "@/lib/focus/contracts/status";
import type { ActiveTimer, CapabilityState, Task, TaskPatch, TimeEntry, WorkCapabilities, WorkRole } from "@/lib/focus/contracts/work";
import { fmtAgo, fmtDate, fmtDayMonth, fmtDuration, fmtTime } from "@/lib/focus/format";
import { demoIso } from "@/lib/focus/fixtures/clock";
import { PEOPLE, PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { blocking, canComplete, canDepend, canDo, childrenOf, displayStatus, isManuallyBlocked, openBlockers, parseDuration, type WorkAction } from "@/lib/focus/state/work";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Banner } from "@/components/focus/ui/feedback";
import { Icon } from "@/components/focus/ui/icon";
import { PlannedTag, SourceDot, WORK, WorkStatusTag } from "@/components/focus/ui/status";
import { PRIORITY } from "./task-card";

/**
 * TaskDrawer (Mytiv Work contract): `{ task, onPatch(patch), onClose }` — every Task field + the activity timeline.
 * Each change is a patch with the token the drawer last saw; a newer write from someone else is a conflict that
 * shows both values and overwrites nothing until the user decides. Viewers see text (no controls) and may comment.
 * Sections whose backend does not exist yet carry "מתוכנן" (from the source's capability map).
 */
export type DrawerProps = {
  task: Task; all: Task[]; now: string; role: WorkRole; caps: Record<keyof WorkCapabilities, CapabilityState>;
  baseVersion: string; viewerId: string;
  /** the fixture demo: planned capabilities run on demo data (labelled "מתוכנן"); elsewhere only live ones write */
  allowPlanned?: boolean;
  onPatch: (patch: TaskPatch, expectedVersion: string) => { ok: true } | { ok: false; conflict?: Task; refused?: string };
  onResolveConflict: (keep: "mine" | "theirs") => void;
  conflict: { theirs: Task; mine: TaskPatch; by: string } | null;
  timer: { active: ActiveTimer | null; elapsedMs: number; onStart: () => void; onPause: () => void; onStop: () => void };
  entries: TimeEntry[]; onLogTime: (minutes: number) => void;
  onDuplicate: () => void; onClose: () => void; onDirtyChange?: (dirty: boolean) => void;
};

/** Canonical statuses only. "חסום" is not a status: it is offered as an action that needs a written reason (see BLOCK). */
const STATUS_OPTIONS: WorkStatus[] = ["todo", "in_progress", "waiting", "done"];
const BLOCK = "__block";
const PRIORITY_OPTIONS: Priority[] = ["low", "medium", "high", "urgent"];

function Section({ title, count, planned, children, className }: { title: string; count?: ReactNode; planned?: boolean; children: ReactNode; className?: string }) {
  return (
    <section className={cx("f-td__sec", className)}>
      <div className="f-td__sechead"><h3 className="f-td__sech">{title}</h3>{planned && <PlannedTag />}<span className="f-grow" />{count}</div>
      {children}
    </section>
  );
}

export function TaskDrawerBody(p: DrawerProps) {
  const { task: t, all, now, role, caps } = p;
  const id = useId();
  const edit = canDo(role, "edit");
  // role permission AND the source's capability (live; planned only in the demo) — the one gate for every control
  const can = (a: WorkAction) => canDo(role, a, caps, p.allowPlanned);
  const [commentDraft, setCommentDraft] = useState("");
  const [subDraft, setSubDraft] = useState("");
  const [checkDraft, setCheckDraft] = useState("");
  const [manual, setManual] = useState("");
  const [manualErr, setManualErr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [depPick, setDepPick] = useState("");
  const [blocking_, setBlocking] = useState(false);
  const [blockDraft, setBlockDraft] = useState("");
  const [blockErr, setBlockErr] = useState<string | null>(null);
  const manualBlock = isManuallyBlocked(t);
  const blockers = openBlockers(t, all);
  const kids = childrenOf(t, all);
  const done = t.status === "done";
  const gate = canComplete(t, all);
  const checkedCount = t.checklist.filter((c) => c.checked).length;
  const subDone = t.subtasks.filter((s) => s.done).length;
  const timerHere = p.timer.active?.taskId === t.id;
  const loggedHere = p.entries.filter((e) => e.taskId === t.id).reduce((a, e) => a + e.minutes, 0);

  const setDirty = (d: string, s: string, c: string, m: string, b: string = blockDraft) => p.onDirtyChange?.(!!(d.trim() || s.trim() || c.trim() || m.trim() || b.trim()));
  const closeBlock = () => { setBlocking(false); setBlockDraft(""); setBlockErr(null); setDirty(commentDraft, subDraft, checkDraft, manual, ""); };
  const patch = (pt: TaskPatch) => {
    const r = p.onPatch(pt, p.baseVersion);
    if (!r.ok) setError(r.refused ?? null); else setError(null);
    return r.ok;
  };
  const candidates = all.filter((x) => x.id !== t.id && !t.dependsOn.some((d) => d.id === x.id) && x.status !== "done" && (x.links.projectId ?? null) === (t.links.projectId ?? null));

  return (
    <div className="f-td">
      <div className="f-td__main">
        {role === "viewer" && <Banner kind="unavailable" title="צפייה בלבד" detail="אין לך הרשאה לערוך משימות בפרויקט הזה. אפשר להגיב ולעקוב." />}
        {p.conflict && (
          <div className="f-conflict" role="alert">
            <b className="f-conflict__h"><span aria-hidden>⧗</span> {p.conflict.by} עדכן/ה משימה זו בזמן שערכת</b>
            <span className="f-conflict__d">השינוי שלך לא נשמר. בחר איזו גרסה לשמור — שום דבר לא נדרס עד שתחליט.</span>
            <div className="f-conflict__cols">
              <div className="f-conflict__col"><span className="f-meta-sm">שלך</span><b>{describePatch(p.conflict.mine)}</b></div>
              <div className="f-conflict__col f-conflict__col--theirs"><span className="f-meta-sm">של {p.conflict.by} · חדש יותר</span><b>{describeTask(p.conflict.theirs, Object.keys(p.conflict.mine) as (keyof TaskPatch)[])}</b></div>
            </div>
            <div className="f-conflict__actions">
              <Button variant="primary" size="sm" onClick={() => p.onResolveConflict("mine")}>שמור את שלי</Button>
              <Button variant="neutral" size="sm" onClick={() => p.onResolveConflict("theirs")}>קבל את של {p.conflict.by}</Button>
            </div>
          </div>
        )}
        <div className="f-td__titlerow">
          {edit ? (
            <input type="checkbox" className="f-check__box f-check__box--round f-td__done" checked={done} aria-label={done ? "סמן כלא בוצע" : "סמן כבוצע"}
              onChange={() => patch({ status: done ? "todo" : "done" })} />
          ) : <span className="f-tl__dot" aria-hidden />}
          <h2 id="task-title" className="f-td__title">{t.title}</h2>
        </div>
        {t.notes && <p className="f-td__notes">{t.notes}</p>}
        {error && <span className="f-field__error" role="alert"><span aria-hidden>!</span>{error}</span>}

        <div className="f-td__fields">
          <label className="f-td__field">
            <span className="f-td__fl">סטטוס</span>
            {edit && can("changeStatus") ? (
              <select className={cx("f-td__pill", `f-td__pill--${manualBlock ? "blocked" : t.status}`)} value={manualBlock ? BLOCK : t.status}
                onChange={(e) => (e.target.value === BLOCK ? setBlocking(true) : (closeBlock(), patch({ status: e.target.value as WorkStatus })))}>
                {t.status === "unknown" && <option value="unknown">{WORK.unknown.glyph} {WORK.unknown.word}</option>}
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{WORK[s].glyph} {WORK[s].word}</option>)}
                {t.status !== "unknown" && <option value={BLOCK}>{WORK.blocked.glyph} {manualBlock ? WORK.blocked.word : `${WORK.blocked.word}…`}</option>}
              </select>
            ) : <WorkStatusTag status={displayStatus(t, all)} />}
          </label>
          <label className="f-td__field">
            <span className="f-td__fl">עדיפות</span>
            {edit ? (
              <select className={cx("f-td__pill", `f-td__pill--p-${PRIORITY[t.priority].tone}`)} value={t.priority} onChange={(e) => patch({ priority: e.target.value as Priority })}>
                {PRIORITY_OPTIONS.map((x) => <option key={x} value={x}>{PRIORITY[x].glyph} {PRIORITY[x].word}</option>)}
              </select>
            ) : <span className="f-td__text">{PRIORITY[t.priority].glyph} {PRIORITY[t.priority].word}</span>}
          </label>
          <label className="f-td__field">
            <span className="f-td__fl">אחראי {caps.assign === "planned" && <PlannedTag />}</span>
            {edit && can("assign") ? (
              <select className="f-td__pill" value={t.assigneeId ?? ""} onChange={(e) => patch({ assigneeId: e.target.value || null })}>
                <option value="">ללא אחראי</option>
                {Object.values(PEOPLE).filter((x) => x.role !== "viewer").map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            ) : <span className="f-td__text">{t.assigneeId ? PEOPLE_BY_ID[t.assigneeId]?.name : "ללא אחראי"}</span>}
          </label>
          <div className="f-td__field">
            <span className="f-td__fl">משתתפים</span>
            <span className="f-td__people">
              {t.participantIds.map((pid) => <span key={pid} className={cx("f-tl__av", `f-tl__av--${pid}`)} title={PEOPLE_BY_ID[pid]?.name} role="img" aria-label={PEOPLE_BY_ID[pid]?.name}>{PEOPLE_BY_ID[pid]?.initial}</span>)}
              {edit && !t.participantIds.includes(p.viewerId) && (
                <button type="button" className="f-td__addp" aria-label="הצטרף כמשתתף" onClick={() => patch({ participantIds: [...t.participantIds, p.viewerId] })}>+</button>
              )}
            </span>
          </div>
        </div>

        {manualBlock && !blocking_ && (
          <div className="f-td__blockwhy">
            <span><span aria-hidden>{WORK.blocked.glyph}</span> חסום: {t.blockedReason}</span>
            {edit && can("changeStatus") && <Button variant="link" size="sm" onClick={() => patch({ unblock: true })}>הסר חסימה</Button>}
          </div>
        )}
        {blocking_ && (
          <form className="f-td__blockform" onSubmit={(e) => {
            e.preventDefault();
            if (!blockDraft.trim()) { setBlockErr("כתבו למה המשימה חסומה. חסימה בלי סיבה לא נשמרת."); return; }
            if (patch({ block: { reason: blockDraft } })) closeBlock();
          }}>
            <label htmlFor={`${id}-block`} className="f-field__label">סיבת החסימה <span className="f-field__label-note">(חובה)</span></label>
            <textarea id={`${id}-block`} rows={2} className="f-input" value={blockDraft} aria-required aria-invalid={blockErr ? true : undefined} aria-describedby={blockErr ? `${id}-block-e` : undefined} autoFocus
              onChange={(e) => { setBlockDraft(e.target.value); setBlockErr(null); setDirty(commentDraft, subDraft, checkDraft, manual, e.target.value); }} />
            {blockErr && <span id={`${id}-block-e`} className="f-field__error" role="alert"><span aria-hidden>!</span>{blockErr}</span>}
            <div className="f-td__blockactions">
              <Button type="submit" variant="primary" size="sm">סמן כחסום</Button>
              <Button variant="neutral" size="sm" onClick={closeBlock}>ביטול</Button>
            </div>
          </form>
        )}

        <div className="f-td__dates">
          <label className="f-td__date">
            <span className="f-td__fl">התחלה</span>
            {edit ? <input type="date" className="f-td__dateinput" value={t.startDate ?? ""} max={t.dueDate ?? undefined} onChange={(e) => patch({ startDate: e.target.value || null })} /> : <b>{t.startDate ? fmtDate(t.startDate) : "—"}</b>}
          </label>
          <label className="f-td__date">
            <span className="f-td__fl">יעד {caps.setDueDate === "planned" && <PlannedTag />}</span>
            {edit ? <input type="date" className="f-td__dateinput" value={t.dueDate ?? ""} min={t.startDate ?? undefined} onChange={(e) => patch({ dueDate: e.target.value || null })} /> : <b>{t.dueDate ? fmtDate(t.dueDate) : "—"}</b>}
          </label>
        </div>

        <Section title="זמן" planned={caps.trackTime === "planned"} className="f-td__box" count={
          <span className="f-meta-sm f-mono" dir="ltr">
            {t.spentMinutes == null ? "—" : `${Math.round((t.spentMinutes) / 6) / 10}h`} / {t.estimateMinutes != null ? `${Math.round(t.estimateMinutes / 6) / 10}h` : "—"} מתוכנן
          </span>}>
          <span className="f-td__bar" role="meter" aria-label="זמן מול הערכה" aria-valuemin={0} aria-valuemax={t.estimateMinutes ?? 0} aria-valuenow={t.spentMinutes ?? 0}>
            <span className="f-td__barfill" style={{ width: `${t.estimateMinutes && t.spentMinutes != null ? Math.max(4, Math.min(100, (t.spentMinutes / t.estimateMinutes) * 100)) : 4}%` }} />
          </span>
          {t.spentMinutes == null && <span className="f-meta-sm">המקור ({t.source === "clickup" ? "ClickUp" : "Mytiv"}) לא מדווח זמן — לא ידוע, לא 0.{loggedHere > 0 ? ` נרשמו כאן ${loggedHere} דק׳.` : ""}</span>}
          {can("trackTime") && (
            <div className="f-td__timer">
              {timerHere && p.timer.active?.running ? (
                <>
                  <Button variant="primary" onClick={p.timer.onPause}><Icon name="pause" size={15} /> השהה · <span className="f-mono" dir="ltr">{fmtDuration(p.timer.elapsedMs)}</span></Button>
                  <Button variant="neutral" onClick={p.timer.onStop}>עצור ושמור</Button>
                </>
              ) : (
                <Button variant="primary" onClick={p.timer.onStart}><Icon name="play" size={15} /> {timerHere ? "המשך טיימר" : "הפעל טיימר"}</Button>
              )}
              <form className="f-td__manual" onSubmit={(e) => {
                e.preventDefault();
                const m = parseDuration(manual);
                if (m == null) { setManualErr("פורמט: 1:30, ‏90, ‏1.5h או 45m (עד 24 שעות)."); return; }
                p.onLogTime(m); setManual(""); setManualErr(null); setDirty(commentDraft, subDraft, checkDraft, "");
              }}>
                <label htmlFor={`${id}-man`} className="f-meta">או הזן ידנית</label>
                <input id={`${id}-man`} className="f-input f-input--sm f-td__maninput f-mono" dir="ltr" placeholder="0:00" value={manual}
                  aria-invalid={manualErr ? true : undefined} aria-describedby={manualErr ? `${id}-manerr` : undefined}
                  onChange={(e) => { setManual(e.target.value); setManualErr(null); setDirty(commentDraft, subDraft, checkDraft, e.target.value); }} />
                <Button type="submit" variant="neutral" size="sm">רשום</Button>
              </form>
              {manualErr && <span id={`${id}-manerr`} className="f-field__error" role="alert"><span aria-hidden>!</span>{manualErr}</span>}
            </div>
          )}
        </Section>

        <Section title="תלויות" planned={caps.depend === "planned"}>
          {t.dependsOn.length === 0 && <span className="f-meta">אין תלויות.</span>}
          {t.dependsOn.map((d) => {
            const dep = all.find((x) => x.id === d.id);
            return (
              <Link key={d.id} href={R.task(d.id)} className="f-td__dep">
                <Icon name="link" size={15} className="f-tcard__depicon" />
                {/* the dependency's state is read from the live task: an open one blocks, a closed one no longer does */}
                <span>{dep && dep.status !== "done" && dep.status !== "cancelled" ? "חסום על ידי" : "תלוי ב־"} <b>{d.title}</b></span>
                {dep && <WorkStatusTag status={displayStatus(dep, all)} size="xs" className="f-td__deptag" />}
              </Link>
            );
          })}
          {blocking(t, all).length > 0 && <span className="f-meta">חוסם: {blocking(t, all).map((b) => b.title).join(", ")}</span>}
          {edit && candidates.length > 0 && (
            <form className="f-td__adddep" onSubmit={(e) => {
              e.preventDefault();
              const on = all.find((x) => x.id === depPick);
              if (!on) return;
              const g = canDepend(t, on, all);
              if (!g.ok) { setError(g.reason); return; }
              patch({ addDependency: { id: on.id, title: on.title } });
              setDepPick("");
            }}>
              <label htmlFor={`${id}-dep`} className="f-sr">הוסף תלות</label>
              <select id={`${id}-dep`} className="f-input f-input--sm" value={depPick} onChange={(e) => setDepPick(e.target.value)}>
                <option value="">+ הוסף תלות (באותו פרויקט)…</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <Button type="submit" variant="neutral" size="sm" disabled={!depPick}>הוסף</Button>
            </form>
          )}
        </Section>

        <Section className="f-td__sec--subs" title="תת־משימות" planned={caps.nest === "planned"} count={<span className="f-meta-sm f-num">{subDone + kids.filter((k) => k.status === "done").length}/{t.subtasks.length + kids.length}</span>}>
          {kids.map((k) => (
            <Link key={k.id} href={R.task(k.id)} className="f-td__sub"><WorkStatusTag status={displayStatus(k, all)} size="xs" glyphOnly /><span className="f-td__item">{k.title}</span></Link>
          ))}
          {t.subtasks.map((s) => (
            <label key={s.id} className="f-td__sub">
              <input type="checkbox" className="f-check__box f-check__box--round f-check__box--sm" checked={s.done} disabled={!edit} onChange={() => patch({ subtask: { id: s.id, done: !s.done } })} />
              <span className={cx("f-td__item", s.done && "f-td__struck")}>{s.title}</span>
            </label>
          ))}
          {edit && (
            <form className="f-td__addrow" onSubmit={(e) => { e.preventDefault(); if (!subDraft.trim()) return; patch({ addSubtask: { id: `s-${Date.now()}`, title: subDraft.trim() } }); setSubDraft(""); setDirty(commentDraft, "", checkDraft, manual); }}>
              <label htmlFor={`${id}-sub`} className="f-sr">תת־משימה חדשה</label>
              <input id={`${id}-sub`} className="f-input f-input--sm" placeholder="+ תת־משימה" value={subDraft} onChange={(e) => { setSubDraft(e.target.value); setDirty(commentDraft, e.target.value, checkDraft, manual); }} />
            </form>
          )}
        </Section>

        <Section title="Checklist · לפני שליחה" planned={caps.checklist === "planned"} count={<span className={cx("f-meta-sm f-num", checkedCount === t.checklist.length && t.checklist.length > 0 && "f-td__allok")}>{checkedCount}/{t.checklist.length}</span>}>
          {t.checklist.map((c) => (
            <label key={c.id} className="f-td__check">
              <input type="checkbox" className="f-check__box f-check__box--sm" checked={c.checked} disabled={!edit} onChange={() => patch({ checklistItem: { id: c.id, checked: !c.checked } })} />
              <span className={cx("f-td__item", c.checked && "f-td__struck")}>{c.label}</span>
            </label>
          ))}
          {edit && (
            <form className="f-td__addrow" onSubmit={(e) => { e.preventDefault(); if (!checkDraft.trim()) return; patch({ addChecklistItem: { id: `k-${Date.now()}`, label: checkDraft.trim() } }); setCheckDraft(""); setDirty(commentDraft, subDraft, "", manual); }}>
              <label htmlFor={`${id}-chk`} className="f-sr">פריט חדש ברשימה</label>
              <input id={`${id}-chk`} className="f-input f-input--sm" placeholder="+ פריט" value={checkDraft} onChange={(e) => { setCheckDraft(e.target.value); setDirty(commentDraft, subDraft, e.target.value, manual); }} />
            </form>
          )}
        </Section>

        <Section className="f-td__sec--evidence" title="ראיות" planned>
          <div className="f-td__evidence">
            {t.evidence.map((a) => <span key={a.id} className="f-td__asset">{a.label}</span>)}
            <span className="f-td__asset f-td__asset--add" aria-hidden>+</span>
            <span className="f-meta-sm">העלאת קבצים תחובר עם אחסון הנכסים.</span>
          </div>
        </Section>

        <Section className="f-td__sec--links" title="מקושר אל">
          <div className="f-td__links">
            {t.links.projectId && <Link href={t.links.projectId === "umino-autumn" ? R.project("umino") : R.projects} className="f-td__link f-td__link--project"><Icon name="folder" size={13} /> פרויקט: {t.context.project ?? t.context.client}</Link>}
            {t.links.campaignId && <Link href={R.campaign(t.links.campaignId)} className="f-td__link"><Icon name="megaphone" size={13} /> קמפיין: יום חמישי</Link>}
            {t.links.leadId && <Link href={R.lead(t.links.leadId)} className="f-td__link">ליד</Link>}
            {t.links.proposalId && <Link href={R.proposal(t.links.proposalId)} className="f-td__link">הצעת מחיר</Link>}
          </div>
        </Section>

        <Section className="f-td__sec--comments" title="תגובות" planned={caps.comment === "planned"}>
          {t.comments.map((c) => (
            <div key={c.id} className="f-td__comment">
              <span className={cx("f-tl__av", `f-tl__av--${c.authorId}`)} aria-hidden>{PEOPLE_BY_ID[c.authorId]?.initial}</span>
              <div className="f-td__cbody">
                <span className="f-td__cmeta"><b>{PEOPLE_BY_ID[c.authorId]?.name}</b> <span className="f-meta-sm">{fmtAgo(c.at, now)} {fmtTime(c.at)}</span></span>
                <span className="f-td__ctext">{c.text.split(/(@\S+)/).map((part, i) => part.startsWith("@") ? <b key={i} className="f-td__mention">{part}</b> : part)}</span>
              </div>
            </div>
          ))}
          {can("comment") && (
            <form className="f-td__newcomment" onSubmit={(e) => {
              e.preventDefault();
              if (!commentDraft.trim()) return;
              patch({ addComment: { id: `c-${Date.now()}`, authorId: p.viewerId, at: demoIso(), text: commentDraft.trim() } });
              setCommentDraft(""); setDirty("", subDraft, checkDraft, manual);
            }}>
              <span className={cx("f-tl__av", `f-tl__av--${p.viewerId}`)} aria-hidden>{PEOPLE_BY_ID[p.viewerId]?.initial}</span>
              <label htmlFor={`${id}-c`} className="f-sr">תגובה חדשה</label>
              <input id={`${id}-c`} className="f-input f-td__cinput" placeholder="כתוב תגובה… השתמש ב־@ לאזכור" value={commentDraft} onChange={(e) => { setCommentDraft(e.target.value); setDirty(e.target.value, subDraft, checkDraft, manual); }} />
            </form>
          )}
        </Section>
      </div>

      <aside className="f-td__side" aria-label="ציר פעילות">
        <h3 className="f-td__sech">ציר פעילות</h3>
        <ol className="f-td__activity">
          {[...t.activity].sort((a, b) => b.at.localeCompare(a.at)).map((a) => (
            <li key={a.id} className={cx("f-td__act", a.tone && `f-td__act--${a.tone}`)}>
              <span>{a.text}</span>
              <span className="f-meta-sm">{fmtDayMonth(a.at)} · {fmtTime(a.at)}</span>
            </li>
          ))}
          {blockers.length > 0 && <li className="f-td__act f-td__act--risk"><span>חסום כעת ע״י {blockers[0].title}</span><span className="f-meta-sm">עכשיו</span></li>}
        </ol>
      </aside>

      <div className="f-td__foot">
        {can("complete") && !done && (
          gate.ok ? <Button variant="primary" onClick={() => patch({ status: "done" })}>סמן כבוצע</Button>
            : <span className="f-btn-wrap f-td__gate"><Button variant="primary" aria-disabled="true" onClick={() => setError(gate.reason)}>סמן כבוצע</Button><span className="f-btn-why">{gate.reason}</span></span>
        )}
        {can("create") && <Button variant="neutral" onClick={p.onDuplicate}>שכפל</Button>}
        <span className="f-grow" />
        <span className="f-meta f-td__saved" role="status">עודכן {fmtAgo(t.updatedAt, now)} · נשמר אוטומטית</span>
      </div>
    </div>
  );
}

function describePatch(p: TaskPatch) {
  if (p.assigneeId !== undefined) return `אחראי: ${p.assigneeId ? PEOPLE_BY_ID[p.assigneeId]?.name : "ללא"}`;
  if (p.block) return `חסום: ${p.block.reason}`;
  if (p.unblock) return "הסרת חסימה";
  if (p.status) return `סטטוס: ${WORK[p.status].word}`;
  if (p.priority) return `עדיפות: ${PRIORITY[p.priority].word}`;
  if (p.dueDate !== undefined) return `יעד: ${p.dueDate ? fmtDate(p.dueDate) : "—"}`;
  return "שינוי שלך";
}
function describeTask(t: Task, keys: (keyof TaskPatch)[]) {
  if (keys.includes("assigneeId")) return `אחראי: ${t.assigneeId ? PEOPLE_BY_ID[t.assigneeId]?.name : "ללא"}`;
  if (keys.includes("block") || keys.includes("unblock")) return t.blockedReason ? `חסום: ${t.blockedReason}` : `סטטוס: ${WORK[t.status].word}`;
  if (keys.includes("status")) return `סטטוס: ${WORK[t.status].word}`;
  if (keys.includes("priority")) return `עדיפות: ${PRIORITY[t.priority].word}`;
  if (keys.includes("dueDate")) return `יעד: ${t.dueDate ? fmtDate(t.dueDate) : "—"}`;
  return "הגרסה החדשה";
}

/** Drawer header row (breadcrumb, source, close). */
export function TaskDrawerHead({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div className="f-td__head">
      <span className="f-meta">{[task.context.client, task.context.project].filter(Boolean).join(" › ")}</span>
      <span className="f-grow" />
      <span className="f-meta-sm f-td__src">מקור: <SourceDot source={task.source} /></span>
      <button type="button" className="f-iconbtn f-td__close" aria-label="סגור" onClick={onClose}><Icon name="x" size={17} className="f-icon-dim" /></button>
    </div>
  );
}
