/**
 * External irreversible action — "סיכום לפני ביצוע" state machine (handoff 6.7, prototype flow 6). Pure.
 *
 *   summary(confirmed=false) ──check──▶ summary(confirmed=true) ──submit──▶ sending ──target ok──▶ sent
 *          ▲   submit while unconfirmed → stays, `attempted` shows "יש לסמן את תיבת האישור"        └─fail/timeout─▶ failed ──retry──▶ sending
 *
 * `blocked` on submit / retry: the thing being sent no longer matches what was approved (e.g. the proposal amount was
 * edited) — the event is refused and nothing starts; the screen shows the reason. A retry is a send too, so it is
 * checked exactly like the first submit.
 * "Sent" exists only after the target system confirmed. A failure never looks like success and nothing is marked sent.
 */
export type ExecState =
  /** `notice`: why the summary is shown again (e.g. an interrupted send whose outcome is unknown — re-confirm) */
  | { step: "summary"; confirmed: boolean; attempted: boolean; notice?: string }
  | { step: "sending"; startedAt: number }
  | { step: "sent"; at: number }
  | { step: "failed"; at: number; message: string };

export type ExecEvent =
  | { type: "toggleConfirm" }
  | { type: "submit"; now: number; blocked?: string }
  | { type: "targetConfirmed"; now: number }
  | { type: "targetFailed"; now: number; message: string }
  | { type: "retry"; now: number; blocked?: string };

export const initialExec: ExecState = { step: "summary", confirmed: false, attempted: false };

export function execReducer(s: ExecState, e: ExecEvent): ExecState {
  switch (e.type) {
    case "toggleConfirm":
      return s.step === "summary" ? { ...s, confirmed: !s.confirmed, attempted: false } : s;
    case "submit":
      if (s.step !== "summary" || e.blocked) return s;
      return s.confirmed ? { step: "sending", startedAt: e.now } : { ...s, attempted: true };
    case "targetConfirmed":
      return s.step === "sending" ? { step: "sent", at: e.now } : s;
    case "targetFailed":
      return s.step === "sending" ? { step: "failed", at: e.now, message: e.message } : s;
    case "retry":
      return s.step === "failed" && !e.blocked ? { step: "sending", startedAt: e.now } : s;
  }
}

/** The red button is enabled only when the checkbox is ticked (and nothing is in flight). */
export const canExecute = (s: ExecState) => s.step === "summary" && s.confirmed;
