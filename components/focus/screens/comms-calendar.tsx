"use client";

import { useState } from "react";
import type { CalendarEvent, CalendarView } from "@/lib/focus/contracts/comms";
import { CALENDAR_EVENTS, CALENDAR_SYNC } from "@/lib/focus/fixtures/comms";
import { personName } from "@/lib/focus/fixtures/people";
import { fmtAgo, fmtDayMonth, fmtLongDate, fmtMonthYear } from "@/lib/focus/format";
import {
  AddEventDialog, addDays, addMonths, CalendarLegend, DayView, dayKey, eventLine, MonthView, weekRangeTitle, weekStart, WeekView, type ShownEvent,
} from "@/components/focus/patterns/comms/calendar";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button, IconButton } from "@/components/focus/ui/button";
import { Banner } from "@/components/focus/ui/feedback";
import { Tabs } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Calendar (handoff H10): day / week / month really switch, prev / today / next move the range, events come from the
 * fixtures (meetings, task deadlines with their live assignee, scheduled posts with their live approval state), and
 * "+ אירוע" adds a validated event locally with undo. Sync status is a banner — a failed sync is never an empty calendar.
 */
const VIEWS: { key: CalendarView; label: string }[] = [
  { key: "day", label: "יום" },
  { key: "week", label: "שבוע" },
  { key: "month", label: "חודש" },
];

export default function CommsCalendarScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { now, state } = demo;
  const today = dayKey(now);
  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState(today);
  const [added, setAdded] = useState<CalendarEvent[]>([]);
  const [adding, setAdding] = useState(false);

  const events: ShownEvent[] = [...CALENDAR_EVENTS, ...added].map((e) => {
    const task = e.taskId ? state.tasks.find((t) => t.id === e.taskId) : undefined;
    const approval = e.approvalId ? demo.approval(e.approvalId)?.status ?? e.approval : e.approval;
    const ev = { ...e, approval };
    return { ...ev, line: eventLine(ev, task ? (task.assigneeId ? personName(task.assigneeId) : "ללא אחראי") : undefined) };
  });

  const step = (dir: 1 | -1) => setAnchor((a) => (view === "day" ? addDays(a, dir) : view === "week" ? addDays(a, 7 * dir) : addMonths(a, dir)));
  const title = view === "day" ? fmtLongDate(anchor) : view === "week" ? weekRangeTitle(weekStart(anchor)) : fmtMonthYear(anchor);
  const unit = view === "day" ? "יום" : view === "week" ? "שבוע" : "חודש";

  const add = (ev: CalendarEvent) => {
    setAdded((xs) => [...xs, ev]);
    setAdding(false);
    setAnchor(dayKey(ev.start));
    toast.push({ title: `"${ev.title}" נוסף ליומן`, detail: `${fmtDayMonth(ev.start)} · נשמר ב־Mytiv בלבד, עדיין לא ב־Google Calendar.`, undo: { onUndo: () => setAdded((xs) => xs.filter((x) => x.id !== ev.id)) } });
  };

  return (
    <Page className="f-cm-cal">
      <PageHeader
        title={title}
        size="page"
        className="f-cm-cal__head"
        actions={
          <div className="f-cm-cal__actions">
            <Tabs label="תצוגת יומן" idBase="cm-cal" value={view} onChange={setView} items={VIEWS} size="sm" className="f-cm-cal__views" />
            <div className="f-cm-cal__nav">
              <IconButton icon="chevron-right" label={`${unit} קודם`} onClick={() => step(-1)} />
              <Button variant="neutral" onClick={() => setAnchor(today)}>היום</Button>
              <IconButton icon="chevron-left" label={`${unit} הבא`} onClick={() => step(1)} />
            </div>
            <Button variant="primary" onClick={() => setAdding(true)} className="f-cm-cal__add">+ אירוע</Button>
          </div>
        }
      />

      {CALENDAR_SYNC.state === "synced" ? (
        <Banner kind="done" className="f-cm-cal__sync" title={`${CALENDAR_SYNC.source.label} מסונכרן`} detail={`${fmtAgo(CALENDAR_SYNC.syncedAt, now)} · ${CALENDAR_SYNC.note}`} />
      ) : (
        <Banner kind="unavailable" title={`היומן לא מסונכרן מאז ${fmtDayMonth(CALENDAR_SYNC.since)}`} detail={`${CALENDAR_SYNC.reason} האירועים שמוצגים הם מהסנכרון האחרון.`} />
      )}

      <div role="tabpanel" id={`cm-cal-panel-${view}`} aria-labelledby={`cm-cal-tab-${view}`} className="f-cm-cal__panel">
        {view === "week" && <WeekView start={weekStart(anchor)} events={events} today={today} now={now} />}
        {view === "day" && <DayView day={anchor} events={events} today={today} now={now} />}
        {view === "month" && <MonthView month={anchor} events={events} today={today} onOpenDay={(d) => { setAnchor(d); setView("day"); }} />}
      </div>

      <CalendarLegend />

      <AddEventDialog open={adding} defaultDate={anchor} onClose={() => setAdding(false)} onAdd={add} />
    </Page>
  );
}
