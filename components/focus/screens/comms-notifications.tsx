"use client";

import { useState } from "react";
import type { NotificationGroup, NotificationItem } from "@/lib/focus/contracts/comms";
import { NOTIFICATION_NOTE, NOTIFICATIONS } from "@/lib/focus/fixtures/comms";
import { R } from "@/lib/focus/routes";
import { NotificationRow } from "@/components/focus/patterns/comms/notifications";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { demoIso } from "@/lib/focus/fixtures/clock";
import { Button } from "@/components/focus/ui/button";
import { EmptyState } from "@/components/focus/ui/feedback";
import { Tabs } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Notifications (handoff H15): four groups as tabs with counts (arrow keys), fixtures merged with what the demo store
 * raised this session (finished / failed jobs), each item links to the screen where it is handled, and "סמן הכול
 * כנקרא" really marks everything read (locally and in the store). Connection failures have their own tab.
 */
const GROUPS: { key: NotificationGroup; label: string; empty: string }[] = [
  { key: "action", label: "דורש פעולה", empty: "אין כרגע פריטים שמחכים לך." },
  { key: "update", label: "עדכונים", empty: "אין עדכונים חדשים." },
  { key: "done", label: "שהושלמו", empty: "עוד לא הושלם כלום היום. עבודות שיסתיימו יופיעו כאן." },
  { key: "connection", label: "תקלות בחיבורים", empty: "כל החיבורים תקינים." },
];

export default function CommsNotificationsScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { now, state } = demo;
  const [tab, setTab] = useState<NotificationGroup>("action");
  // read marks live in the demo store so the bell in the top bar agrees with this screen
  const readIds = (state.drafts["notifications-read"] as string[] | undefined) ?? [];
  const setReadIds = (f: (xs: string[]) => string[]) => demo.setDraft("notifications-read", f(readIds));

  const fromStore: NotificationItem[] = state.notifications.map((n) => ({
    id: n.id, group: n.title.startsWith("נכשל") ? "action" : "done", title: n.title, area: n.detail, at: demoIso(n.at),
    timing: "ago", href: n.href ?? R.today, cta: "פתח", read: n.read,
  }));
  const all = [...fromStore, ...NOTIFICATIONS].map((n) => ({ ...n, read: n.read || readIds.includes(n.id) }));
  const unread = all.filter((n) => !n.read);
  const of = (g: NotificationGroup) => all.filter((n) => n.group === g);
  const list = of(tab);
  const firstUnreadAction = of("action").find((n) => !n.read)?.id;

  const markRead = (id: string) => setReadIds((xs) => (xs.includes(id) ? xs : [...xs, id]));
  const markAll = () => {
    const n = unread.length;
    setReadIds(() => all.map((x) => x.id));
    demo.readNotifications();
    toast.push({ title: `${n} התראות סומנו כנקראו`, detail: "הפריטים עצמם לא השתנו. מה שדורש פעולה עדיין מחכה בלשונית שלו." });
  };

  return (
    <Page width="narrow" className="f-cm-notifs">
      <PageHeader
        title="התראות"
        size="page"
        status={unread.length ? `${unread.length} חדשות · ${of("action").length} דורשות פעולה.` : "אין התראות חדשות."}
        actions={unread.length ? <Button variant="neutral" onClick={markAll}>סמן הכול כנקרא</Button> : <span className="f-meta"><span aria-hidden>✓</span> הכול נקרא</span>}
      />
      <section className="f-cm-notifs__panel" aria-label="התראות לפי קבוצה">
        <Tabs
          label="קבוצות התראות"
          idBase="cm-notif"
          className="f-cm-notifs__tabs"
          value={tab}
          onChange={setTab}
          items={GROUPS.map((g) => {
            const n = of(g.key).length;
            const u = of(g.key).filter((x) => !x.read).length;
            return {
              key: g.key,
              label: g.label,
              count: n ? <span className={g.key === "connection" ? "f-seg__count--risk" : undefined}>{n}</span> : undefined,
              ariaLabel: `${g.label}: ${n} פריטים${u ? `, ${u} חדשים` : ""}`,
            };
          })}
        />
        <div role="tabpanel" id={`cm-notif-panel-${tab}`} aria-labelledby={`cm-notif-tab-${tab}`} className="f-cm-notifs__list" tabIndex={0}>
          {list.length === 0 ? (
            <EmptyState glyph="✓" title={GROUPS.find((g) => g.key === tab)!.empty} className="f-empty--compact" />
          ) : (
            <ul className="f-cm-notifs__items">
              {list.map((n) => <NotificationRow key={n.id} n={n} now={now} primary={n.id === firstUnreadAction} onOpen={markRead} />)}
            </ul>
          )}
        </div>
        <p className="f-cm-notifs__note">{NOTIFICATION_NOTE}</p>
      </section>
    </Page>
  );
}
