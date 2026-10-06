import Link from "@/components/focus/ui/link";
import { useId, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import { cx } from "./cx";

/**
 * Buttons (Design System §6.1). One primary per area. Red (`danger`) exists only as the last button of
 * "סיכום לפני ביצוע". A disabled button always carries a visible reason (`disabledReason`); without permission the
 * button is not rendered at all (callers omit it). Targets are ≥44×44 (visual or via the hit-area pseudo element).
 */
export type ButtonVariant = "primary" | "secondary" | "neutral" | "outline" | "strong" | "onaccent" | "danger" | "quiet" | "link";
export type ButtonSize = "sm" | "md" | "lg";

type Common = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string; children: ReactNode };

export function buttonClass({ variant = "primary", size = "md", block, className }: Omit<Common, "children">) {
  return cx("f-btn", `f-btn--${variant}`, size !== "md" && `f-btn--${size}`, block && "f-btn--block", className);
}

export function Button({
  variant, size, block, className, children, loading, loadingLabel, disabledReason, type = "button", ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingLabel?: string; disabledReason?: string }) {
  const autoId = useId();
  const whyId = `${rest.id ?? autoId}-why`; // the visible reason is always linked, with or without an id
  // loading keeps the button focusable (a native `disabled` would drop focus to <body> mid-action): it is announced as
  // busy + unavailable and ignores clicks until done
  const btn = (
    <button
      type={loading ? "button" : type}
      {...rest}
      onClick={loading ? undefined : rest.onClick}
      aria-disabled={loading ? true : rest["aria-disabled"]}
      aria-busy={loading || undefined}
      aria-describedby={disabledReason && rest.disabled ? whyId : rest["aria-describedby"]}
      className={buttonClass({ variant, size, block, className })}
    >
      {loading && <span className="f-btn__spin" aria-hidden />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
  if (!disabledReason || !rest.disabled) return btn;
  return (
    <span className="f-btn-wrap">
      {btn}
      <span id={whyId} className="f-btn-why" role="note">{disabledReason}</span>
    </span>
  );
}

/** Navigation that looks like a button. Real navigation is always a Next <Link>. */
export function ButtonLink({ variant, size, block, className, children, ...rest }: Common & ComponentProps<typeof Link>) {
  return <Link {...rest} className={buttonClass({ variant, size, block, className })}>{children}</Link>;
}

/** 44px round icon button. `label` is mandatory: it is the accessible name and the tooltip. */
export function IconButton({
  icon, label, count, surface, small, className, iconSize = 18, ...rest
}: { icon: IconName; label: string; count?: number; surface?: boolean; small?: boolean; iconSize?: number } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  return (
    <button
      type="button"
      {...rest}
      aria-label={count ? `${label} · ${count} חדשות` : label}
      title={label}
      className={cx("f-iconbtn", surface && "f-iconbtn--surface", small && "f-iconbtn--sm", className)}
    >
      <Icon name={icon} size={iconSize} className="f-icon-dim" />
      {count ? <span className="f-iconbtn__count" aria-hidden>{count}</span> : null}
    </button>
  );
}
