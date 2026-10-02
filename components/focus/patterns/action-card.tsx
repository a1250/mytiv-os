"use client";

import Link from "next/link";
import type { KeyboardEvent, ReactNode } from "react";
import type { RiskLevel } from "@/lib/focus/contracts/status";
import { plainShortcut } from "@/lib/focus/state/keyboard";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { RiskPill, riskText } from "@/components/focus/ui/status";

/**
 * Action card (handoff §6.6): what is needed, client/project, why it matters, how long it waits, risk, ONE action.
 * Phases: default → working (progress, never "success" before the target confirms) → done (with undo while the window
 * is open) / failed (what was kept + retry). Keyboard: Tab between cards, Enter opens, A approves — low risk only.
 */
export type CardPhase =
  | { kind: "default" }
  | { kind: "working"; label: string }
  | { kind: "done"; title: string; detail?: string; undo?: { label: string; onUndo: () => void } }
  | { kind: "failed"; title: string; detail?: string; onRetry: () => void };

export function ActionCard({
  title, context, why, waiting, risk, action, primary, phase = { kind: "default" }, onQuickApprove, size = "md", headingLevel = 3,
}: {
  title: string; context: string; why?: string; waiting: string; risk: RiskLevel;
  action: { label: string; href: string }; primary?: boolean; phase?: CardPhase;
  /** only passed for low-risk items; enables the "A" shortcut */
  onQuickApprove?: () => void; size?: "md" | "lg"; headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (onQuickApprove && phase.kind === "default" && plainShortcut(e, ["a", "A", "ש"])) {
      e.preventDefault();
      onQuickApprove();
    }
  };
  return (
    <article className={cx("f-acard", size === "lg" && "f-acard--lg", phase.kind !== "default" && `f-acard--${phase.kind}`)} onKeyDown={onKey} aria-busy={phase.kind === "working" || undefined}>
      <div className="f-acard__top">
        <RiskPill level={risk} />
        <span className="f-acard__wait">{waiting}</span>
      </div>
      <H className="f-acard__title">{title}</H>
      <span className="f-acard__ctx">{context}</span>
      {why && <span className="f-acard__why">{why}</span>}
      <PhaseFooter phase={phase} action={action} primary={primary} quick={!!onQuickApprove} />
    </article>
  );
}

function PhaseFooter({ phase, action, primary, quick }: { phase: CardPhase; action: { label: string; href: string }; primary?: boolean; quick: boolean }) {
  switch (phase.kind) {
    case "default":
      return (
        <Link href={action.href} className={cx("f-btn", primary ? "f-btn--primary" : "f-btn--secondary", "f-btn--block", "f-acard__cta")} aria-keyshortcuts={quick ? "A" : undefined}>
          {action.label}
        </Link>
      );
    case "working":
      return <span className="f-acard__state f-acard__state--working" role="status"><span className="f-spin" aria-hidden>⟳</span> {phase.label}</span>;
    case "done":
      return (
        <div className="f-acard__result" role="status">
          <b className="f-acard__state f-acard__state--done"><span aria-hidden>✓</span> {phase.title}</b>
          {phase.detail && <span className="f-acard__why">{phase.detail}</span>}
          {phase.undo && <Button variant="neutral" size="sm" onClick={phase.undo.onUndo}>{phase.undo.label}</Button>}
        </div>
      );
    case "failed":
      return (
        <div className="f-acard__result" role="alert">
          <b className="f-acard__state f-acard__state--failed"><span aria-hidden>!</span> {phase.title}</b>
          {phase.detail && <span className="f-acard__why">{phase.detail}</span>}
          <Button variant="secondary" size="sm" onClick={phase.onRetry}>נסה שוב</Button>
        </div>
      );
  }
}

/** Compact card for the "השבוע" column: title + one meta line, the whole card is the link. */
export function CompactActionCard({ title, context, risk, waiting, href, children }: { title: string; context: string; risk: RiskLevel; waiting?: string; href: string; children?: ReactNode }) {
  return (
    <Link href={href} className="f-ccard">
      <b className="f-ccard__title">{title}</b>
      <span className="f-ccard__meta">{context} · {riskText(risk)}{waiting ? ` · ${waiting}` : ""}</span>
      {children}
    </Link>
  );
}
