import type { NotificationItem } from "@/lib/focus/contracts/comms";
import { fmtAgo, fmtWaiting } from "@/lib/focus/format";
import { ButtonLink } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { riskText } from "@/components/focus/ui/status";

/**
 * Notification row (handoff H15): unread mark (dot + the word "חדש"), title, a meta line (area · risk · time) and one
 * link to the screen where it is handled. Opening the link marks the row read.
 */
export function NotificationRow({ n, now, primary, onOpen }: { n: NotificationItem; now: string; primary?: boolean; onOpen: (id: string) => void }) {
  const time = n.timing === "waiting" ? fmtWaiting(n.at, now) : fmtAgo(n.at, now);
  return (
    <li className={cx("f-cm-notif", !n.read && "f-cm-notif--unread", primary && "f-cm-notif--primary")}>
      <span className="f-cm-notif__dot" aria-hidden>{n.read ? "" : "●"}</span>
      <span className="f-cm-notif__body">
        <b className="f-cm-notif__title">{n.title}</b>
        <span className="f-cm-notif__meta">
          {n.area}
          {n.risk && <> · <span className={cx("f-cm-notif__risk", `f-cm-notif__risk--${n.risk}`)}>{riskText(n.risk, n.risk === "high")}</span></>}
          {" · "}{time}
          {!n.read && <span className="f-cm-notif__new"> · חדש</span>}
        </span>
      </span>
      <ButtonLink href={n.href} size="sm" variant={primary ? "primary" : "secondary"} className="f-cm-notif__cta" onClick={() => onOpen(n.id)} aria-label={`${n.cta}: ${n.title}`}>
        {n.cta}
      </ButtonLink>
    </li>
  );
}
