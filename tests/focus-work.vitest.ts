/**
 * Mytiv Work (Focus UI) — buckets, Kanban transitions, parent/sub-task and dependency rules, version conflicts,
 * permissions, quick create, manual time and the timer.
 */
import { describe, expect, it } from "vitest";
import type { ActiveTimer, Task } from "@/lib/focus/contracts/work";
import { TASKS } from "@/lib/focus/fixtures/work";
import {
  applyPatch, BOARD_ORDER, blockedWhy, boardColumns, bucketsFor, canComplete, canDepend, canDo, canStart, checkMove, columnOf,
  displayStatus, elapsedOf, isBlocked, minutesToLog, openCount, parseDuration, parseQuickTask, pauseTimer, resumeTimer, startTimer,
  statusForColumn, switchTimer, taskInvariant, type PatchResult,
  blockInfo, blockedByTask, canReopen, isManuallyBlocked, MAX_LOG_MINUTES, revertTask,
} from "@/lib/focus/state/work";
import type { TaskPatch } from "@/lib/focus/contracts/work";

const NOW = "2026-10-01T08:10:00+03:00";
const base = (s: Partial<Task> & Pick<Task, "id">): Task => ({
  title: s.id, notes: "", status: "todo", priority: "medium", assigneeId: "me", participantIds: [], startDate: null, dueDate: null,
  estimateMinutes: null, spentMinutes: 0, subtasks: [], checklist: [], parentId: null, dependsOn: [], links: { projectId: "p" }, context: {},
  comments: [], evidence: [], activity: [], source: "mytiv", state: "live", version: "v1", updatedAt: NOW, ...s,
});

describe("My Tasks buckets", () => {
  it("places tasks by time and state, never by hand", () => {
    const t = [
      base({ id: "today", dueDate: "2026-10-01" }), base({ id: "late", dueDate: "2026-09-29" }), base({ id: "soon", dueDate: "2026-10-03" }),
      base({ id: "nodate" }), base({ id: "wait", status: "waiting" }), base({ id: "blk", status: "waiting", blockedReason: "ממתין לצלם" }),
      base({ id: "dep", dueDate: "2026-10-01", dependsOn: [{ id: "blk", title: "" }] }),
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
  const dependent = base({ id: "d", dependsOn: [{ id: "b", title: "b" }] });
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
    expect(statusForColumn("in_progress")).toBe("in_progress");
    expect(statusForColumn("blockedOrWaiting")).toBe("waiting");
    // "blocked" is never a stored status: the column stores waiting, and a move creates no block without a reason
    expect(statusForColumn("blockedOrWaiting")).toBe("waiting");
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
    const b = base({ id: "b", dependsOn: [{ id: "a", title: "a" }] });
    const other = base({ id: "o", links: { projectId: "q" } });
    expect(canDepend(a, other, [a, b, other]).ok).toBe(false);
    expect(canDepend(a, a, [a]).ok).toBe(false);
    expect(canDepend(a, b, [a, b]).ok).toBe(false);
    expect(canDepend(b, base({ id: "c" }), [a, b, base({ id: "c" })]).ok).toBe(true);
  });
});

describe("patches with optimistic concurrency", () => {
  const t = base({ id: "t", version: "v3" });
  it("applies with the current version and bumps it", () => {
    const r = applyPatch(t, { priority: "high" }, "v3", NOW, [t], "u-dana");
    // a new opaque token, minted by the write path; the writer is recorded
    expect(r.ok && r.task.version !== "v3" && r.task.priority === "high" && r.task.updatedBy === "u-dana").toBe(true);
  });
  it("a stale version is a conflict and overwrites nothing", () => {
    const r = applyPatch(t, { priority: "high" }, "v2", NOW);
    expect(r.ok).toBe(false);
    expect("conflict" in r && r.conflict.priority).toBe("medium");
  });
  it("refuses invalid changes", () => {
    expect(applyPatch(t, { title: "  " }, "v3", NOW).ok).toBe(false);
    expect(applyPatch({ ...t, dueDate: "2026-10-05" }, { startDate: "2026-10-09" }, "v3", NOW).ok).toBe(false);
    const blocked = base({ id: "x", dependsOn: [{ id: "y", title: "y" }] });
    const r = applyPatch(blocked, { status: "done" }, "v1", NOW, [blocked, base({ id: "y" })]);
    expect("refused" in r && r.refused).toContain("חסום");
  });
  it("adds checklist items, sub-tasks, comments and same-project dependencies", () => {
    const r = applyPatch(t, { addChecklistItem: { id: "k", label: "x" }, addSubtask: { id: "s", title: "y" } }, "v3", NOW);
    expect(r.ok && r.task.checklist.length === 1 && r.task.subtasks.length === 1).toBe(true);
    const other = base({ id: "o", links: { projectId: "q" } });
    const d = applyPatch(t, { addDependency: { id: "o", title: "o" } }, "v3", NOW, [t, other]);
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
    // capabilities: only "live" writes — a planned one only in the demo (allowPlanned)
    expect(canDo("owner", "assign", { assign: "live" })).toBe(true);
    expect(canDo("owner", "assign", { assign: "planned" })).toBe(false);
    expect(canDo("owner", "assign", { assign: "planned" }, true)).toBe(true);
    expect(canDo("viewer", "assign", { assign: "planned" }, true)).toBe(false);
    expect(canDo("viewer", "trackTime")).toBe(false);
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

describe("blocked is derived, never stored (Work contract §5)", () => {
  const dep = base({ id: "dep", title: "צילום" });
  const waiting = base({ id: "w", status: "waiting" });
  const manual = base({ id: "m", status: "waiting", blockedReason: "ממתין לצלם חיצוני" });
  const byDep = base({ id: "bd", dependsOn: [{ id: "dep", title: "צילום" }] });
  const all = [dep, waiting, manual, byDep];

  it("shows blocked only for an open dependency or a manual block with its reason", () => {
    expect(displayStatus(byDep, all)).toBe("blocked");
    expect(displayStatus(manual, all)).toBe("blocked");
    expect(displayStatus(waiting, all)).toBe("waiting");
    expect(displayStatus(base({ id: "x", status: "done", dependsOn: byDep.dependsOn }), all)).toBe("done");
    expect(blockedWhy(manual, all)).toBe("ממתין לצלם חיצוני");
    expect(blockedWhy(byDep, all)).toContain("צילום");
    expect(blockedWhy(waiting, all)).toBeNull();
  });

  it("refuses to store status \"blocked\" from any (untyped) input", () => {
    const r = applyPatch(waiting, { status: "blocked" } as unknown as TaskPatch, "v1", NOW, all);
    expect(r.ok).toBe(false);
    expect("refused" in r && r.refused).toBeTruthy();
  });

  it("a manual block needs a written reason; blank or whitespace is refused", () => {
    for (const reason of ["", "   ", "\n\t"]) {
      const r = applyPatch(waiting, { block: { reason } }, "v1", NOW, all);
      expect(r.ok, JSON.stringify(reason)).toBe(false);
      expect("refused" in r && r.refused).toContain("דורשת סיבה כתובה"); // the first layer, not only the invariant
    }
    const ok = applyPatch(base({ id: "t" }), { block: { reason: "  אין צלם  " } }, "v1", NOW, all);
    expect(ok.ok && ok.task.status).toBe("waiting");
    expect(ok.ok && ok.task.blockedReason).toBe("אין צלם");
    expect(applyPatch(base({ id: "c", status: "done" }), { block: { reason: "x" } }, "v1", NOW, all).ok).toBe(false);
  });

  it("leaving waiting or unblocking drops the reason (no stale block)", () => {
    const moved = applyPatch(manual, { status: "todo" }, "v1", NOW, all);
    expect(moved.ok && moved.task.blockedReason).toBeUndefined();
    const lifted = applyPatch(manual, { unblock: true }, "v1", NOW, all);
    expect(lifted.ok && lifted.task.status).toBe("waiting");
    expect(lifted.ok && lifted.task.blockedReason).toBeUndefined();
    expect(lifted.ok && displayStatus(lifted.task, all)).toBe("waiting");
  });

  it("no column maps to a non-canonical status", () => {
    for (const col of BOARD_ORDER) expect(["todo", "in_progress", "waiting", "done"]).toContain(statusForColumn(col));
  });

  it("every fixture task satisfies the stored-task invariant", () => {
    for (const t of TASKS) expect(taskInvariant(t), t.id).toEqual({ ok: true });
    expect(taskInvariant({ ...waiting, status: "blocked" } as unknown as Task).ok).toBe(false);
    expect(taskInvariant({ ...waiting, blockedReason: " " }).ok).toBe(false);
    expect(taskInvariant({ ...base({ id: "z" }), blockedReason: "x" }).ok).toBe(false);
  });

  it("no sequence of patches and moves produces blocked-without-reason (randomised)", () => {
    let seed = 7;
    const rnd = (n: number) => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed % n; };
    const patches: TaskPatch[] = [
      { status: "todo" }, { status: "in_progress" }, { status: "waiting" }, { status: "done" }, { unblock: true },
      { block: { reason: "" } }, { block: { reason: "  " } }, { block: { reason: "סיבה" } }, { status: "blocked" } as unknown as TaskPatch,
    ];
    let tasks = TASKS.map((t) => ({ ...t }));
    for (let i = 0; i < 2000; i++) {
      const t = tasks[rnd(tasks.length)];
      let r: PatchResult;
      if (rnd(2)) r = applyPatch(t, patches[rnd(patches.length)], t.version, NOW, tasks);
      else {
        const to = BOARD_ORDER[rnd(BOARD_ORDER.length)];
        r = checkMove(t, to, tasks).ok ? applyPatch(t, { status: statusForColumn(to) }, t.version, NOW, tasks) : { ok: false, refused: "move" };
      }
      if (r.ok) tasks = tasks.map((x) => (x.id === t.id ? r.task : x));
      for (const x of tasks) expect(taskInvariant(x).ok).toBe(true);
    }
  });
});

describe("undo is a compensating write (versioned, rule-checked)", () => {
  const parent = base({ id: "p", status: "in_progress" });
  const child = base({ id: "c", parentId: "p" });
  it("reverts only while the task is still at the token the action produced", () => {
    const done = applyPatch(child, { status: "done" }, "v1", NOW, [parent, child]);
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    const ok = revertTask(done.task, child, done.task.version, NOW, [parent, done.task]);
    expect(ok.ok && ok.task.status).toBe("todo");
    // someone wrote after the action: the undo would overwrite it → refused, nothing written
    const later = applyPatch(done.task, { priority: "high" }, done.task.version, NOW, [parent, done.task]);
    if (!later.ok) throw new Error("setup");
    const stale = revertTask(later.task, child, done.task.version, NOW, [parent, later.task]);
    expect(stale.ok).toBe(false);
    expect("refused" in stale && stale.refused).toContain("השתנתה");
  });
  it("tokens never go backwards: an undo mints a new one", () => {
    const done = applyPatch(child, { status: "done" }, "v1", NOW, [parent, child]);
    if (!done.ok) throw new Error("setup");
    const r = revertTask(done.task, child, done.task.version, NOW, [parent, done.task]);
    expect(r.ok && r.task.version).not.toBe(child.version);
    expect(r.ok && r.task.version).not.toBe(done.task.version);
  });
  it("an undo that would reopen a child under a parent completed meanwhile is refused", () => {
    const doneChild = { ...child, status: "done" as const, version: "v2" };
    const doneParent = { ...parent, status: "done" as const };
    const r = revertTask(doneChild, child, "v2", NOW, [doneParent, doneChild]);
    expect(r.ok).toBe(false);
  });
});

describe("parent / child reopen rule", () => {
  it("a closed child cannot be reopened under a done parent (any path: patch or move)", () => {
    const p = base({ id: "p", status: "done" });
    const c = base({ id: "c", parentId: "p", status: "done" });
    expect(canReopen(c, [p, c]).ok).toBe(false);
    expect(applyPatch(c, { status: "todo" }, "v1", NOW, [p, c]).ok).toBe(false);
    expect(applyPatch(c, { status: statusForColumn("in_progress") }, "v1", NOW, [p, c]).ok).toBe(false);
    expect(canReopen(c, [{ ...p, status: "in_progress" }, c]).ok).toBe(true);
  });
});

describe("Kanban: a move that would change nothing is refused (not a fake success)", () => {
  it("a card in 'blocked/waiting' only because of its dependency cannot be 'moved' to its own status", () => {
    const dep = base({ id: "d", title: "צילום", status: "in_progress" });
    const t = base({ id: "t", status: "todo", dependsOn: [{ id: "d", title: "צילום" }] });
    expect(columnOf(t, [dep, t])).toBe("blockedOrWaiting");
    const g = checkMove(t, "todo", [dep, t]);
    expect(g.ok).toBe(false);
    expect(!g.ok && g.reason).toContain("צילום");
  });
});

describe("logged time is a write, an increment, and never turns unknown into a number", () => {
  it("adds minutes, bumps the token, bounds the amount", () => {
    const t = base({ id: "t", spentMinutes: 30 });
    const r = applyPatch(t, { logMinutes: 45 }, "v1", NOW);
    expect(r.ok && r.task.spentMinutes).toBe(75);
    expect(r.ok && r.task.version).not.toBe("v1");
    expect(applyPatch(t, { logMinutes: 0 }, "v1", NOW).ok).toBe(false);
    expect(applyPatch(t, { logMinutes: 1441 }, "v1", NOW).ok).toBe(false);
    expect(applyPatch(t, { logMinutes: 1.5 }, "v1", NOW).ok).toBe(false);
  });
  it("a source that does not report time stays unknown (null), not 0 + n", () => {
    const r = applyPatch(base({ id: "u", spentMinutes: null }), { logMinutes: 30 }, "v1", NOW);
    expect(r.ok && r.task.spentMinutes).toBeNull();
  });
  it("a timer never logs more than 24 hours", () => {
    const t: ActiveTimer = { taskId: "t", title: "", context: "", startedAt: "2026-10-01T00:00:00Z", elapsedMs: 0, running: true };
    expect(minutesToLog(t, new Date("2026-10-04T00:00:00Z").getTime())).toBe(MAX_LOG_MINUTES);
  });
});

describe("manual block from the source's status vocabulary (contract §5)", () => {
  it("the business key 'blocked' under waiting is a block even without a reason; the reason is shown when present", () => {
    const keyOnly = base({ id: "k", status: "waiting", statusKey: "blocked" });
    expect(isManuallyBlocked(keyOnly)).toBe(true);
    expect(displayStatus(keyOnly, [keyOnly])).toBe("blocked");
    expect(blockInfo(keyOnly, [keyOnly])?.why).toContain("בלי סיבה");
    expect(taskInvariant(keyOnly).ok).toBe(true);
    expect(taskInvariant({ ...keyOnly, status: "todo" }).ok).toBe(false);
  });
  it("blocking writes the key and the reason together; leaving waiting clears both", () => {
    const b = applyPatch(base({ id: "x" }), { block: { reason: "אין צלם" } }, "v1", NOW);
    expect(b.ok && b.task.statusKey).toBe("blocked");
    if (!b.ok) return;
    const out = applyPatch(b.task, { status: "in_progress" }, b.task.version, NOW);
    expect(out.ok && out.task.statusKey).toBeUndefined();
    expect(out.ok && out.task.blockedReason).toBeUndefined();
  });
  it("a card names the open blocker, never a finished dependency", () => {
    const done = base({ id: "d1", status: "done", title: "ישן" });
    const open = base({ id: "d2", status: "in_progress", title: "פתוח" });
    const t = base({ id: "t", dependsOn: [{ id: "d1", title: "ישן" }, { id: "d2", title: "פתוח" }] });
    expect(blockInfo(t, [done, open, t])?.by?.title).toBe("פתוח");
  });
});

describe("other domains read a task's block live (no copied sentence)", () => {
  it("a content card / campaign row is blocked exactly while its task is open", () => {
    const shoot = base({ id: "shoot", title: "צילום", status: "waiting", statusKey: "blocked" });
    expect(blockedByTask("shoot", [shoot])).toContain("צילום");
    expect(blockedByTask("shoot", [{ ...shoot, status: "done", statusKey: undefined }])).toBeNull();
    expect(blockedByTask("missing", [shoot])).toBeNull();
    expect(blockedByTask(undefined, [shoot])).toBeNull();
  });
  it("the fixtures reference the task, not a copied reason", async () => {
    const { CONTENT_ITEMS } = await import("@/lib/focus/fixtures/clients");
    const { STUDIO_ITEMS } = await import("@/lib/focus/fixtures/marketing");
    expect(CONTENT_ITEMS.filter((c) => c.blockedReason)).toEqual([]);
    expect(STUDIO_ITEMS.filter((s) => s.stage === "blocked" && !s.blockedByTaskId)).toEqual([]);
  });
});

describe("an open editor adopts only the viewer's own writes (write lineage, round 2)", () => {
  it("adopts a chain of own writes; any other writer or a gap in between is a conflict", async () => {
    const { onlyOwnWrites } = await import("@/lib/focus/state/work");
    const w = { "t@v2": { prev: "v1", by: "me" }, "t@v3": { prev: "v2", by: "me" }, "t@v4": { prev: "v3", by: "other" }, "t@v5": { prev: "v4", by: "me" } };
    expect(onlyOwnWrites(w, "t", "v1", "v3", "me")).toBe(true);
    expect(onlyOwnWrites(w, "t", "v1", "v1", "me")).toBe(true);
    expect(onlyOwnWrites(w, "t", "v1", "v5", "me")).toBe(false); // someone else wrote v4 in between
    expect(onlyOwnWrites(w, "t", "v4", "v5", "me")).toBe(true);
    expect(onlyOwnWrites(w, "t", "v1", "v9", "me")).toBe(false); // unknown lineage
    expect(onlyOwnWrites(w, "x", "v1", "v2", "me")).toBe(false); // per task
  });
});

describe("source capability gate (round 2)", () => {
  it("a planned capability runs only in the demo; a live one for any permitted role", async () => {
    const { canDo } = await import("@/lib/focus/state/work");
    const { CAPABILITIES } = await import("@/lib/focus/fixtures/work");
    expect(canDo("owner", "assign", CAPABILITIES.mytiv, false)).toBe(false);
    expect(canDo("owner", "assign", CAPABILITIES.mytiv, true)).toBe(true);
    expect(canDo("owner", "assign", CAPABILITIES.clickup, false)).toBe(true);
    expect(canDo("viewer", "assign", CAPABILITIES.clickup, true)).toBe(false);
    expect(canDo("member", "edit", CAPABILITIES.mytiv, false)).toBe(true);
  });
});
