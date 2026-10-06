/**
 * Focus UI — pure flow rules: approval reasons, quick approve, queue order, the pre-execution state machine, undo
 * windows, processing jobs, keyboard-shortcut gating and theme preference parsing.
 */
import { describe, expect, it } from "vitest";
import { canQuickApprove, checkDecision, queueOrder, reasonRequired } from "@/lib/focus/state/approvals";
import { canExecute, execReducer, initialExec, type ExecState } from "@/lib/focus/state/execution";
import { canUndo, fmtRemaining, openWindow, remainingMs, UNDO_WINDOW_MS } from "@/lib/focus/state/undo";
import { jobStatus, type Job } from "@/lib/focus/state/jobs";
import { isTypingTarget, plainShortcut } from "@/lib/focus/state/keyboard";
import { parseThemePref, themeAttr } from "@/components/focus/shell/theme";
import { APPROVALS } from "@/lib/focus/fixtures/approvals";

describe("approval rules (mandatory reason)", () => {
  it("requires a reason to approve from medium risk up, never for low", () => {
    expect(reasonRequired("low", "approve")).toBe(false);
    expect(reasonRequired("medium", "approve")).toBe(true);
    expect(reasonRequired("high", "approve")).toBe(true);
  });
  it("always requires a reason to request changes or reject, never to defer", () => {
    for (const r of ["low", "medium", "high"] as const) {
      expect(reasonRequired(r, "request_changes")).toBe(true);
      expect(reasonRequired(r, "reject")).toBe(true);
      expect(reasonRequired(r, "defer")).toBe(false);
    }
  });
  it("refuses a medium-risk approval with a blank or whitespace reason and records nothing", () => {
    const r = checkDecision({ risk: "medium" }, "approve", "   ");
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.field).toBe("reason"); expect(r.error).toContain("נימוק"); }
    expect(checkDecision({ risk: "medium" }, "approve", "בתוקף עד 31.10").ok).toBe(true);
  });
  it("quick approve only for low risk without an external action", () => {
    const story = APPROVALS.find((a) => a.id === "content-sushi-story")!;
    const promo = APPROVALS.find((a) => a.id === "promo-1plus1")!;
    const proposal = APPROVALS.find((a) => a.id === "proposal-noa")!;
    expect(canQuickApprove(story)).toBe(true);
    expect(canQuickApprove(promo)).toBe(false);
    expect(canQuickApprove(proposal)).toBe(false);
    expect(canQuickApprove({ risk: "low", execution: proposal.execution })).toBe(false);
  });
  it("orders the queue high risk first, then by due time", () => {
    const q = queueOrder([
      { id: "a", risk: "low" as const, dueAt: "2026-10-01T09:00:00+03:00" },
      { id: "b", risk: "medium" as const, dueAt: "2026-10-01T17:00:00+03:00" },
      { id: "c", risk: "high" as const, dueAt: "2026-10-02T09:00:00+03:00" },
      { id: "d", risk: "medium" as const, dueAt: "2026-10-01T10:00:00+03:00" },
    ]);
    expect(q.map((x) => x.id)).toEqual(["c", "d", "b", "a"]);
  });
});

describe("pre-execution summary (red action)", () => {
  it("does not send until the confirmation box is ticked; an unconfirmed submit only flags the error", () => {
    let s: ExecState = initialExec;
    expect(canExecute(s)).toBe(false);
    s = execReducer(s, { type: "submit", now: 1 });
    expect(s).toEqual({ step: "summary", confirmed: false, attempted: true });
    s = execReducer(s, { type: "toggleConfirm" });
    expect(canExecute(s)).toBe(true);
    s = execReducer(s, { type: "submit", now: 2 });
    expect(s.step).toBe("sending");
  });
  it("shows 'sent' only after the target confirms; ignores confirmations when nothing is in flight", () => {
    expect(execReducer(initialExec, { type: "targetConfirmed", now: 3 })).toBe(initialExec);
    const sending: ExecState = { step: "sending", startedAt: 2 };
    expect(execReducer(sending, { type: "targetConfirmed", now: 3 })).toEqual({ step: "sent", at: 3 });
  });
  it("a failure never looks like success and can be retried", () => {
    const failed = execReducer({ step: "sending", startedAt: 2 }, { type: "targetFailed", now: 3, message: "x" });
    expect(failed.step).toBe("failed");
    expect(execReducer(failed, { type: "retry", now: 4 })).toEqual({ step: "sending", startedAt: 4 });
    expect(execReducer({ step: "sent", at: 3 }, { type: "retry", now: 4 }).step).toBe("sent");
  });
  it("cannot toggle the confirmation once sending", () => {
    const sending: ExecState = { step: "sending", startedAt: 2 };
    expect(execReducer(sending, { type: "toggleConfirm" })).toBe(sending);
  });
});

describe("undo window", () => {
  it("is open for the defined window and closes after it", () => {
    const w = openWindow(1000);
    expect(w.endsAt - w.startedAt).toBe(UNDO_WINDOW_MS);
    expect(canUndo(w, 1000)).toBe(true);
    expect(canUndo(w, 1000 + UNDO_WINDOW_MS - 1)).toBe(true);
    expect(canUndo(w, 1000 + UNDO_WINDOW_MS)).toBe(false);
    expect(canUndo(null, 1000)).toBe(false);
  });
  it("reports the remaining time", () => {
    const w = openWindow(0, 8_000);
    expect(remainingMs(w, 500)).toBe(7_500);
    expect(fmtRemaining(remainingMs(w, 500))).toBe("0:08");
    expect(remainingMs(w, 9_000)).toBe(0);
  });
});

describe("processing jobs", () => {
  const job: Job = { id: "j", kind: "ai_directions", label: "", detail: "", startedAt: 1000, durationMs: 1000, outcome: "success", steps: ["a", "b"] };
  it("is running with progress until its end, then done or failed by outcome", () => {
    const mid = jobStatus(job, 1600);
    expect(mid.state).toBe("running");
    if (mid.state === "running") { expect(mid.progress).toBeCloseTo(0.6); expect(mid.step).toBe(1); }
    expect(jobStatus(job, 2000)).toEqual({ state: "done", at: 2000 });
    expect(jobStatus({ ...job, outcome: "failure" }, 2500)).toEqual({ state: "failed", at: 2000 });
  });
  it("never reports 100% while running and honours cancellation", () => {
    const s = jobStatus(job, 1999);
    expect(s.state === "running" && s.progress < 1).toBe(true);
    expect(jobStatus({ ...job, cancelledAt: 1500 }, 3000)).toEqual({ state: "cancelled", at: 1500 });
  });
});

describe("keyboard shortcuts never fire while typing", () => {
  const field = { closest: (s: string) => (s.includes("input") ? {} : null) };
  const body = { closest: () => null };
  it("detects typing targets", () => {
    expect(isTypingTarget(field)).toBe(true);
    expect(isTypingTarget(body)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
  it("plain shortcuts ignore modifiers and fields", () => {
    expect(plainShortcut({ key: "a", target: body }, ["a"])).toBe(true);
    expect(plainShortcut({ key: "a", target: field }, ["a"])).toBe(false);
    expect(plainShortcut({ key: "a", metaKey: true, target: body }, ["a"])).toBe(false);
    expect(plainShortcut({ key: "b", target: body }, ["a"])).toBe(false);
  });
  it("letter shortcuts also work on a Hebrew layout (physical key), still never in a field or with a modifier", () => {
    expect(plainShortcut({ key: "ש", code: "KeyA", target: body }, ["a", "A"])).toBe(true);
    expect(plainShortcut({ key: "ר", code: "KeyR", target: body }, ["r", "R"])).toBe(true);
    expect(plainShortcut({ key: "ש", code: "KeyA", target: field }, ["a"])).toBe(false);
    expect(plainShortcut({ key: "ש", code: "KeyA", ctrlKey: true, target: body }, ["a"])).toBe(false);
    expect(plainShortcut({ key: "ב", code: "KeyB", target: body }, ["a"])).toBe(false);
    expect(plainShortcut({ key: "/", code: "Slash", target: body }, ["/"])).toBe(true);
  });
  it("other Latin layouts keep their own letters; '/' follows the character, not a letter key", () => {
    // AZERTY: the key labelled "q" sits where QWERTY has A (code KeyA) — it must not approve
    expect(plainShortcut({ key: "q", code: "KeyA", target: body }, ["a", "A"])).toBe(false);
    expect(plainShortcut({ key: "a", code: "KeyQ", target: body }, ["a", "A"])).toBe(true);
    // Hebrew: "/" is produced by the Q key (not search); the Slash key produces "." (search)
    expect(plainShortcut({ key: "/", code: "KeyQ", target: body }, ["/"])).toBe(false);
    expect(plainShortcut({ key: ".", code: "Slash", target: body }, ["/"])).toBe(true);
    // AZERTY "/" (shift+":" on the Period key) still opens search
    expect(plainShortcut({ key: "/", code: "Period", target: body }, ["/"])).toBe(true);
  });
});

describe("a saved proposal is sent only at the approved amount", () => {
  it("computes the saved total with integer agorot + VAT (matches the approved 8,750)", async () => {
    const { savedTotal } = await import("@/components/focus/patterns/sales/proposal-editor");
    const { PROPOSAL_CORPORATE } = await import("@/lib/focus/fixtures/sales");
    expect(savedTotal(PROPOSAL_CORPORATE.lines, PROPOSAL_CORPORATE.vatRate)).toBe(8750);
    const edited = PROPOSAL_CORPORATE.lines.map((l, i) => (i === 0 ? { ...l, qty: l.qty + 1 } : l));
    expect(savedTotal(edited, PROPOSAL_CORPORATE.vatRate)).not.toBe(8750);
  });
});

describe("theme preference", () => {
  it("parses stored values and maps to the html attribute (system = no attribute)", () => {
    expect(parseThemePref("dark")).toBe("dark");
    expect(parseThemePref("light")).toBe("light");
    expect(parseThemePref(null)).toBe("system");
    expect(parseThemePref("blue")).toBe("system");
    expect(themeAttr("system")).toBeNull();
    expect(themeAttr("dark")).toBe("dark");
  });
});

describe("a send that no longer matches its approval is refused — first submit and every retry (round 2)", () => {
  const why = "הסכום השתנה";
  it("submit with a block reason starts nothing (even when confirmed)", () => {
    const confirmed: ExecState = { step: "summary", confirmed: true, attempted: false };
    expect(execReducer(confirmed, { type: "submit", now: 1, blocked: why })).toBe(confirmed);
  });
  it("retry after a failure is checked exactly like the first submit", () => {
    const failed: ExecState = { step: "failed", at: 2, message: "x" };
    expect(execReducer(failed, { type: "retry", now: 3, blocked: why })).toBe(failed);
    expect(execReducer(failed, { type: "retry", now: 3 })).toEqual({ step: "sending", startedAt: 3 });
  });
  it("the store and the summary use one guard: blocked once the saved proposal total differs from the approved amount", async () => {
    const { proposalSendBlock } = await import("@/components/focus/patterns/sales/sales-store");
    const { PROPOSAL_CORPORATE } = await import("@/lib/focus/fixtures/sales");
    const a = APPROVALS.find((x) => x.id === PROPOSAL_CORPORATE.approvalId)!;
    const saved = { lines: PROPOSAL_CORPORATE.lines, notes: "", templateId: "corporate", validityDays: 14 };
    expect(proposalSendBlock(a, null)).toBeUndefined();
    expect(proposalSendBlock(a, saved)).toBeUndefined();
    const edited = { ...saved, lines: saved.lines.map((l, i) => (i === 0 ? { ...l, qty: l.qty + 1 } : l)) };
    expect(proposalSendBlock(a, edited)).toMatch(/נערכה אחרי האישור/);
    expect(proposalSendBlock(APPROVALS.find((x) => x.id !== a.id)!, edited)).toBeUndefined();
  });
});

describe("an external job interrupted by a reload has an unknown outcome (round 2)", () => {
  it("send / schedule still running on reload → failed + unknown, never done; internal jobs keep their clock", async () => {
    const { interruptExternal } = await import("@/lib/focus/state/jobs");
    const mk = (id: string, kind: Job["kind"]): Job => ({ id, kind, label: id, detail: "", startedAt: 1000, durationMs: 1000, outcome: "success" });
    const [mail, meta, ai, doneMail] = interruptExternal([mk("m", "send_mail"), mk("s", "schedule_meta"), mk("a", "ai_directions"), { ...mk("d", "send_mail"), startedAt: 0, durationMs: 10 }], 1500);
    expect(jobStatus(mail, 9999)).toEqual({ state: "failed", at: 1500, unknown: true });
    expect(jobStatus(meta, 9999)).toEqual({ state: "failed", at: 1500, unknown: true });
    expect(jobStatus(ai, 9999)).toEqual({ state: "done", at: 2000 });
    expect(jobStatus(doneMail, 9999).state).toBe("done"); // already confirmed before the reload: stays done
  });
});
