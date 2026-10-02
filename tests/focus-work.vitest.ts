/**
 * Mytiv Work (Focus UI) — buckets, Kanban transitions, parent/sub-task and dependency rules, version conflicts,
 * permissions, quick create, manual time and the timer.
 */
import { describe, expect, it } from "vitest";
import type { ActiveTimer, Task } from "@/lib/focus/contracts/work";
import { TASKS } from "@/lib/focus/fixtures/work";
import {
  applyPatch, boardColumns, bucketsFor, canComplete, canDepend, canDo, canStart, checkMove, columnOf, elapsedOf, isBlocked,
  minutesToLog, openCount, parseDuration, parseQuickTask, pauseTimer, resumeTimer, startTimer, statusForColumn, switchTimer,
} from "@/lib/focus/state/work";

const NOW = "2026-10-01T08:10:00+03:00";
const base = (s: Partial<Task> & Pick<Task, "id">): Task => ({
  title: s.id, notes: "", status: "todo", priority: "medium", assigneeId: "me", participantIds: [], startDate: null, dueDate: null,
  estimateMinutes: null, spentMinutes: 0, subtasks: [], checklist: [], parentId: null, dependsOn: [], links: { projectId: "p" }, context: {},
  comments: [], evidence: [], activity: [], source: "mytiv", state: "live", version: 1, updatedAt: NOW, ...s,
});

describe("My Tasks buckets", () => {
  it("places tasks by time and state, never by hand", () => {
    const t = [
      base({ id: "today", dueDate: "2026-10-01" }), base({ id: "late", dueDate: "2026-09-29" }), base({ id: "soon", dueDate: "2026-10-03" }),
      base({ id: "nodate" }), base({ id: "wait", status: "waiting" }), base({ id: "blk", status: "blocked" }),
      base({ id: "dep", dueDate: "2026-10-01", dependsOn: [{ id: "blk", title: "", status: "blocked" }] }),
      base({ id: "unk", status: "unknown" }), base({ id: "done", status: "done" }), base({ id: "other", assigneeId: "x" }),
    ];
    const b = bucketsFor(t, "me", NOW);
    expect(b.today.map((x) => x.id)).toEqual(["today"]);
    expect(b.overdue.map((x) => x.id)).toEqual(["late"]);
    expect(b.soon.map((x) => x.id)).toEqual(["soon"]);
    expect(b.noDate.map((x) => x.id)).toEqual(["nodate"]);
    expect(b.waitingOnOthers.map((x) => x.id)).toEqual(["wait"]);
    expect(b.blocked.map((x) => x.id).sort()).toEqual(["blk", "dep"]);
    expect(b.unmapped.map((x) => x.id)).toEqual(["unk"]);
    expect(openCount(b)).toBe(8);
  });
  it("includes tasks I participate in", () => {
    const b = bucketsFor([base({ id: "x", assigneeId: "y", participantIds: ["me"], dueDate: "2026-10-01" })], "me", NOW);
    expect(b.today).toHaveLength(1);
  });
  it("works on the shared fixture set (blocked by an open dependency)", () => {
    const post = TASKS.find((t) => t.id === "t-post45")!;
    expect(isBlocked(post, TASKS)).toBe(true);
  });
});

describe("Kanban transitions", () => {
  const blocker = base({ id: "b", status: "in_progress" });
  const dependent = base({ id: "d", dependsOn: [{ id: "b", title: "b", status: "in_progress" }] });
  const parent = base({ id: "parent", status: "in_progress" });
  const child = base({ id: "child", parentId: "parent" });
  const all = [blocker, dependent, parent, child];
  it("maps statuses to columns (an open dependency shows as blocked)", () => {
    expect(columnOf(base({ id: "x", status: "waiting" }))).toBe("blockedOrWaiting");
    expect(columnOf(dependent, all)).toBe("blockedOrWaiting");
    expect(columnOf(base({ id: "x", status: "cancelled" }))).toBe("done");
    expect(Object.values(boardColumns([...all, base({ id: "u", status: "unknown" })])).flat()).toHaveLength(4);
  });
  it("sets the status the column means; waiting stays waiting", () => {
    expect(statusForColumn(base({ id: "x" }), "in_progress")).toBe("in_progress");
    expect(statusForColumn(base({ id: "x", status: "waiting" }), "blockedOrWaiting")).toBe("waiting");
    expect(statusForColumn(base({ id: "x" }), "blockedOrWaiting")).toBe("blocked");
  });
  it("refuses moves that break the rules, with a reason", () => {
    expect(checkMove(dependent, "in_progress", all).ok).toBe(false);
    expect(checkMove(dependent, "done", all).ok).toBe(false);
    expect(checkMove(parent, "done", all).ok).toBe(false);
    expect(checkMove(blocker, "done", all).ok).toBe(true);
    expect(checkMove(blocker, "in_progress", all).ok).toBe(false);
  });
});

describe("parent / sub-task and dependency rules", () => {
  it("a parent with open children cannot be completed", () => {
    const parent = base({ id: "p" });
    const g = canComplete(parent, [parent, base({ id: "c", parentId: "p" })]);
    expect(g.ok).toBe(false);
    expect(canComplete(parent, [parent, base({ id: "c", parentId: "p", status: "done" })]).ok).toBe(true);
  });
  it("an unmapped status is never completed or started", () => {
    const u = base({ id: "u", status: "unknown" });
    expect(canComplete(u, [u]).ok).toBe(false);
    expect(canStart(u, [u]).ok).toBe(false);
  });
  it("dependencies stay within the project and never form a cycle", () => {
    const a = base({ id: "a" });
    const b = base({ id: "b", dependsOn: [{ id: "a", title: "a", status: "todo" }] });
    const other = base({ id: "o", links: { projectId: "q" } });
    expect(canDepend(a, other, [a, b, other]).ok).toBe(false);
    expect(canDepend(a, a, [a]).ok).toBe(false);
    expect(canDepend(a, b, [a, b]).ok).toBe(false);
    expect(canDepend(b, base({ id: "c" }), [a, b, base({ id: "c" })]).ok).toBe(true);
  });
});

describe("patches with optimistic concurrency", () => {
  const t = base({ id: "t", version: 3 });
  it("applies with the current version and bumps it", () => {
    const r = applyPatch(t, { priority: "high" }, 3, NOW);
    expect(r.ok && r.task.version === 4 && r.task.priority === "high").toBe(true);
  });
  it("a stale version is a conflict and overwrites nothing", () => {
    const r = applyPatch(t, { priority: "high" }, 2, NOW);
    expect(r.ok).toBe(false);
    expect("conflict" in r && r.conflict.priority).toBe("medium");
  });
  it("refuses invalid changes", () => {
    expect(applyPatch(t, { title: "  " }, 3, NOW).ok).toBe(false);
    expect(applyPatch({ ...t, dueDate: "2026-10-05" }, { startDate: "2026-10-09" }, 3, NOW).ok).toBe(false);
    const blocked = base({ id: "x", dependsOn: [{ id: "y", title: "y", status: "todo" }] });
    const r = applyPatch(blocked, { status: "done" }, 1, NOW, [blocked, base({ id: "y" })]);
    expect("refused" in r && r.refused).toContain("חסום");
  });
  it("adds checklist items, sub-tasks, comments and same-project dependencies", () => {
    const r = applyPatch(t, { addChecklistItem: { id: "k", label: "x" }, addSubtask: { id: "s", title: "y" } }, 3, NOW);
    expect(r.ok && r.task.checklist.length === 1 && r.task.subtasks.length === 1).toBe(true);
    const other = base({ id: "o", links: { projectId: "q" } });
    const d = applyPatch(t, { addDependency: { id: "o", title: "o", status: "todo" } }, 3, NOW, [t, other]);
    expect(d.ok).toBe(false);
  });
});

describe("permissions hide actions", () => {
  it("viewers read and comment only; members cannot delete; capabilities can switch actions off", () => {
    expect(canDo("viewer", "edit")).toBe(false);
    expect(canDo("viewer", "comment")).toBe(true);
    expect(canDo("member", "delete")).toBe(false);
    expect(canDo("member", "edit")).toBe(true);
    expect(canDo("owner", "delete")).toBe(true);
    expect(canDo("owner", "assign", { assign: false })).toBe(false);
  });
});

describe("quick create and manual time", () => {
  const people = [{ id: "u-dana", name: "דנה" }];
  it("fills fields from the text and never guesses unknown people or clients", () => {
    const d = parseQuickTask("לעצב באנר מחר גבוה @דנה #UMINO", NOW, people, ["UMINO"]);
    expect(d).toMatchObject({ title: "לעצב באנר", dueLabel: "מחר", priority: "high", assigneeId: "u-dana", client: "UMINO" });
    const u = parseQuickTask("משימה @נועה #ACME", NOW, people, ["UMINO"]);
    expect(u.assigneeId).toBeNull();
    expect(u.client).toBeNull();
  });
  it("parses durations and rejects anything else", () => {
    expect(parseDuration("1:30")).toBe(90);
    expect(parseDuration("90")).toBe(90);
    expect(parseDuration("1.5h")).toBe(90);
    expect(parseDuration("45m")).toBe(45);
    expect(parseDuration("0")).toBeNull();
    expect(parseDuration("25:00")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
  });
});

describe("timer", () => {
  const task = { id: "t1", title: "T1", context: { client: "C", project: "P" } };
  it("accumulates while running, freezes when paused, resumes", () => {
    const t0 = startTimer(task, new Date(0).toISOString());
    expect(elapsedOf(t0, 60_000)).toBe(60_000);
    const p = pauseTimer(t0, 60_000);
    expect(p.running).toBe(false);
    expect(elapsedOf(p, 999_999)).toBe(60_000);
    const r = resumeTimer(p, new Date(100_000).toISOString());
    expect(elapsedOf(r, 130_000)).toBe(90_000);
  });
  it("logs whole minutes and nothing under 30 seconds", () => {
    const t0: ActiveTimer = { ...startTimer(task, new Date(0).toISOString()) };
    expect(minutesToLog(t0, 29_000)).toBe(0);
    expect(minutesToLog(t0, 61_000)).toBe(2);
  });
  it("one timer per person: starting another stops and logs the running one", () => {
    const running = startTimer(task, new Date(0).toISOString());
    const r = switchTimer(running, { id: "t2", title: "T2", context: {} }, new Date(180_000).toISOString());
    expect(r.conflict).toBe(true);
    expect(r.logged).toEqual({ taskId: "t1", minutes: 3 });
    expect(r.next.taskId).toBe("t2");
    const same = switchTimer(pauseTimer(running, 60_000), task, new Date(120_000).toISOString());
    expect(same.conflict).toBe(false);
    expect(same.next.running).toBe(true);
  });
});
