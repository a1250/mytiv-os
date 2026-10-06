"use client";

import Link from "@/components/focus/ui/link";
import { useState } from "react";
import type { ContentItem, ContentStage } from "@/lib/focus/contracts/clients";
import { BOARD_CLIENT, CONTENT_ITEMS, CONTENT_STAGES } from "@/lib/focus/fixtures/clients";
import { daysBetween, fmtDayMonth, fmtWeekday } from "@/lib/focus/format";
import { personName } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { ContentBoard, ItemTags, itemMeta, type MoveResult } from "@/components/focus/patterns/clients/content-board";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { PlannedTag } from "@/components/focus/ui/status";
import { Tabs } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Content work board · UMINO (handoff H5): Kanban of content items with the keyboard/drag model of the Mytiv Work
 * board, a real list view, and a calendar view that is planned (rendered from the same fixtures, labelled "מתוכנן").
 * Rules: only a decision in the approvals queue moves an item to "מאושר"; a blocked item cannot move forward.
 * "מתוזמן" / "נמדד" columns are hidden while empty.
 */
type View = "list" | "kanban" | "calendar";

export default function ClientsBoardScreen() {
  const { now } = useDemo();
  const toast = useToast();
  const [items, setItems] = useState<ContentItem[]>(CONTENT_ITEMS);
  const [view, setView] = useState<View>("kanban");

  const stages = CONTENT_STAGES.filter((s) => !s.hideWhenEmpty || items.some((it) => it.stage === s.key));
  const hidden = CONTENT_STAGES.filter((s) => !stages.includes(s));
  const order = CONTENT_STAGES.map((s) => s.key);
  const title = (k: ContentStage) => CONTENT_STAGES.find((s) => s.key === k)?.title ?? k;

  const move = (id: string, to: ContentStage): MoveResult => {
    const it = items.find((x) => x.id === id);
    if (!it) return { ok: false, reason: "הפריט לא נמצא." };
    if (to === "approved" && it.stage !== "approved") return { ok: false, reason: "רק החלטה בתור האישורים מעבירה ל״מאושר״." };
    if (it.blockedReason && order.indexOf(to) > order.indexOf(it.stage)) return { ok: false, reason: `הפריט חסום: ${it.blockedReason}.` };
    const prev = items;
    setItems(items.map((x) => (x.id === id ? { ...x, stage: to } : x)));
    toast.push({ title: `הועבר לעמודה ${title(to)}`, detail: it.title, undo: { onUndo: () => setItems(prev) } });
    return { ok: true };
  };

  // calendar (planned): the coming week on the demo clock
  const days = Array.from({ length: 8 }, (_, i) => new Date(new Date(now).getTime() + i * 86_400_000).toISOString());
  const undated = items.filter((it) => !it.due);

  return (
    <Page className="f-cl-boardpage">
      <PageHeader
        title={<>לוח עבודה · <Link href={R.client("umino")} className="f-cl-plink">{BOARD_CLIENT.name}</Link></>}
        size="page"
        aside={<Tabs label="תצוגה" value={view} onChange={setView} idBase="f-cl-bview" size="sm" className="f-cl-toggle" items={[
          { key: "list", label: "רשימה" }, { key: "kanban", label: "Kanban" }, { key: "calendar", label: "לוח שנה", ariaLabel: "לוח שנה · מתוכנן" },
        ]} />}
      />

      <div role="tabpanel" id={`f-cl-bview-panel-${view}`} aria-labelledby={`f-cl-bview-tab-${view}`} className="f-cl-boardpage__panel">
        {view === "kanban" && <>
          <ContentBoard stages={stages} items={items} onMove={move} />
          <p className="f-cl-boardpage__note">
            {hidden.length > 0 && <>שלבים נוספים: {hidden.map((s) => `"${s.title}"`).join(" ו")} מוסתרים כשהם ריקים. </>}
            גרירה גם במקלדת: רווח לבחירה, חצים להזזה, רווח להנחה, Esc לביטול.
          </p>
        </>}

        {view === "list" && (
          <table className="f-cl-table f-cl-rtable f-cl-blist">
            <caption className="f-sr">פריטי התוכן של {BOARD_CLIENT.name}</caption>
            <thead><tr><th scope="col">פריט</th><th scope="col">פורמט</th><th scope="col">שלב</th><th scope="col">אחראי</th><th scope="col">תאריך</th><th scope="col">מצב</th></tr></thead>
            <tbody>
              {[...items].sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage)).map((it) => (
                <tr key={it.id}>
                  <th scope="row" data-label="פריט">{it.href ? <Link href={it.href} className="f-cl-plink">{it.title}</Link> : it.title}{it.blockedReason && <span className="f-cl-kcard__why">{it.blockedReason}</span>}</th>
                  <td data-label="פורמט">{it.format}</td>
                  <td data-label="שלב">{title(it.stage)}</td>
                  <td data-label="אחראי">{it.ownerId ? personName(it.ownerId) : "ללא אחראי"}</td>
                  <td data-label="תאריך" className="f-num">{it.note ?? (it.due ? fmtDayMonth(it.due) : "ללא תאריך")}</td>
                  <td data-label="מצב"><ItemTags it={it} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {view === "calendar" && (
          <section className="f-cl-cal" aria-labelledby="f-cl-cal-h">
            <div className="f-cl-cal__head">
              <h2 id="f-cl-cal-h" className="f-cl-cal__title">השבוע הקרוב</h2>
              <PlannedTag />
              <span className="f-meta">תצוגת לוח שנה מלאה עוד לא קיימת. כאן: הפריטים לפי תאריך, מנתוני הדוגמה.</span>
            </div>
            <ol className="f-cl-cal__days">
              {days.map((d) => {
                const day = items.filter((it) => it.due && daysBetween(d, it.due) === 0);
                return (
                  <li key={d} className="f-cl-cal__day">
                    <h3 className="f-cl-cal__date">{fmtWeekday(d)} <span className="f-num">{fmtDayMonth(d)}</span></h3>
                    {day.length === 0 ? <span className="f-meta-sm">אין</span> : day.map((it) => (
                      <span key={it.id} className="f-cl-cal__item"><b>{it.title}</b><span className="f-meta-sm">{it.format} · {title(it.stage)}</span></span>
                    ))}
                  </li>
                );
              })}
            </ol>
            {undated.length > 0 && <p className="f-cl-cal__undated">ללא תאריך: {undated.map((it) => `${it.title} (${itemMeta(it)})`).join(" · ")}</p>}
          </section>
        )}
      </div>
    </Page>
  );
}
