"use client";

import Link from "next/link";
import { useState } from "react";
import type { Approval } from "@/lib/focus/contracts/approvals";
import { APPROVAL_STATS, RECENTLY_DECIDED, WAITING_ON_OTHERS } from "@/lib/focus/fixtures/approvals";
import { personName } from "@/lib/focus/fixtures/people";
import { fmtTime, fmtWaiting } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { canQuickApprove } from "@/lib/focus/state/approvals";
import { plainShortcut } from "@/lib/focus/state/keyboard";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { useQueue } from "@/components/focus/shell/use-queue";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { EmptyState } from "@/components/focus/ui/feedback";
import { SelectField } from "@/components/focus/ui/field";
import { ApprovalPill, OriginTag, RiskPill } from "@/components/focus/ui/status";
import { Chips } from "@/components/focus/ui/tabs";

/**
 * Approvals queue (handoff D4, mobile M2). The same ordered queue as focus mode and "היום שלי": high risk first, then
 * by due time. Low risk can be approved from the list ("אשר" or A on the row); medium/high open the decision. Filters,
 * waiting-on-others, decided items (with undo while reversible) all come from the demo store.
 */
type Filter = "mine" | "high" | "others" | "approved" | "rejected";
const ACTION: Record<string, string> = { "proposal-noa": "בדוק ושלח", "promo-1plus1": "פתח החלטה", "content-sushi-story": "בדוק ואשר", "plan-october": "פתח תוכנית" };

export default function ApprovalsListScreen() {
  const demo = useDemo();
  const q = useQueue();
  const [filter, setFilter] = useState<Filter>("mine");
  const [client, setClient] = useState("all");
  const [kind, setKind] = useState("all");
  const pending = q.pending.filter((a) => (client === "all" || (a.client?.id ?? "sales") === client) && (kind === "all" || a.kind === kind));
  const high = pending.filter((a) => a.risk === "high");
  const decided = q.ordered.filter((a) => a.status !== "pending");
  const shown: Approval[] = filter === "high" ? high : filter === "approved" ? decided.filter((a) => a.status === "approved") : filter === "rejected" ? decided.filter((a) => a.status === "rejected") : pending;
  const first = q.firstPending;

  return (
    <Page className="f-alist">
      <PageHeader
        eyebrow={<nav aria-label="נתיב" className="f-crumbs"><Link href={R.today}>היום שלי</Link> <span aria-hidden>›</span> אישורים</nav>}
        title="אישורים" size="page"
        status={pending.length ? `${q.pending.length} פריטים ממתינים להחלטה שלך.${high.length ? ` ${high.length === 1 ? "אחד מהם" : `${high.length} מהם`} בסיכון גבוה.` : ""}` : "אין פריטים שממתינים לך."}
        actions={first ? <ButtonLink variant="strong" size="lg" href={R.approval(first)} className="f-alist__focus">התחל מצב פוקוס · {q.pending.length}</ButtonLink> : undefined}
      />
      <div className="f-alist__filters">
        <Chips label="סינון אישורים" value={filter} onChange={setFilter} items={[
          { key: "mine", label: "ממתין לי", count: q.pending.length }, { key: "high", label: "סיכון גבוה", count: q.pending.filter((a) => a.risk === "high").length },
          { key: "others", label: "ממתין לאחרים", count: WAITING_ON_OTHERS.length },
        ]} />
        <SelectField label="פרויקט" labelClassName="f-sr" className="f-alist__select" value={client} onChange={(e) => setClient(e.target.value)} options={[{ value: "all", label: "פרויקט: הכול" }, { value: "c-umino", label: "UMINO" }, { value: "c-gal", label: "גל פילאטיס" }, { value: "sales", label: "מכירות" }]} />
        <SelectField label="סוג" labelClassName="f-sr" className="f-alist__select" value={kind} onChange={(e) => setKind(e.target.value)} options={[{ value: "all", label: "סוג: הכול" }, { value: "proposal_send", label: "שליחה חיצונית" }, { value: "campaign_change", label: "שינוי בקמפיין" }, { value: "content", label: "תוכן" }, { value: "plan", label: "תוכנית" }]} />
        <span className="f-grow" />
        <Chips label="הוחלטו" value={filter} onChange={setFilter} items={[
          { key: "approved", label: "אושרו · השבוע", count: APPROVAL_STATS.approvedThisWeek + decided.filter((a) => a.status === "approved").length },
          { key: "rejected", label: "נדחו", count: APPROVAL_STATS.rejected + decided.filter((a) => a.status === "rejected").length },
        ]} />
      </div>

      <div className="f-alist__grid">
        <div className="f-alist__main">
          {filter !== "others" && (
            shown.length === 0 ? (
              <EmptyState glyph="✓" title={filter === "mine" ? "אין פריטים שממתינים לך" : "אין פריטים בסינון הזה"} hint={filter === "mine" ? "כל ההחלטות נרשמו. אפשר לראות מה הוחלט בצד." : "נסה סינון אחר."} />
            ) : (
              <table className="f-atable">
                <caption className="f-sr">פריטים לאישור, מסודרים לפי סיכון ואז לפי מועד</caption>
                <thead><tr><th scope="col">מה מבקשים לאשר</th><th scope="col">הציע</th><th scope="col">סיכון</th><th scope="col">ממתין</th><th scope="col"><span className="f-sr">פעולה</span></th></tr></thead>
                <tbody>
                  {shown.map((a) => {
                    const quick = a.status === "pending" && canQuickApprove(a);
                    const d = demo.state.decisions[a.id];
                    return (
                      <tr key={a.id} className={cx("f-atable__row", a.id === first && "f-atable__row--first")}
                        onKeyDown={(e) => { if (quick && plainShortcut(e, ["a", "A"])) { e.preventDefault(); q.quickApprove(a.id); } }}>
                        <th scope="row" className="f-atable__what">
                          <Link href={R.approval(a.id)} className="f-atable__title">{a.title}{a.version ? ` · גרסה ${a.version}` : ""}</Link>
                          <span className="f-atable__meta">{a.summary}</span>
                        </th>
                        <td className="f-atable__who">
                          {a.origin === "ai_suggested" ? <OriginTag origin={a.origin} label={a.originLabel?.replace("הוצע ע״י ", "")} size="sm" /> : personName(a.assigneeId)}
                          {a.origin === "ai_concept" && <span className="f-atable__ai"> · ✦ נערך בעזרת AI</span>}
                        </td>
                        <td><RiskPill level={a.risk} short /></td>
                        <td className="f-atable__wait">{a.status === "pending" ? fmtWaiting(a.requestedAt, demo.now) : d ? fmtTime(d.decidedAt) : "—"}</td>
                        <td className="f-atable__act">
                          {a.status !== "pending" ? <ApprovalPill status={a.status} size="sm" /> : quick ? (
                            <span className="f-atable__acts">
                              <Button variant="secondary" size="sm" onClick={() => q.quickApprove(a.id)} aria-keyshortcuts="A">אשר</Button>
                              <Link href={R.approval(a.id)} className="f-link f-hit">בדוק</Link>
                            </span>
                          ) : (
                            <Link href={R.approval(a.id)} className={cx("f-btn", "f-btn--block", a.id === first ? "f-btn--primary" : "f-btn--secondary", "f-atable__cta")}>{ACTION[a.id] ?? "פתח"}</Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
          {(filter === "mine" || filter === "others") && (
            <>
              <h2 className="f-alist__h2">ממתין לאחרים · {WAITING_ON_OTHERS.length}</h2>
              <table className="f-atable f-atable--others">
                <caption className="f-sr">פריטים שממתינים להחלטה של אחרים</caption>
                <thead className="f-sr"><tr><th scope="col">פריט</th><th scope="col">אחראי</th><th scope="col">סיכון</th><th scope="col">ממתין</th><th scope="col">פעולה</th></tr></thead>
                <tbody>
                  {WAITING_ON_OTHERS.map((w) => (
                    <tr key={w.id} className="f-atable__row f-atable__row--others">
                      <th scope="row" className="f-atable__what"><span className="f-atable__title f-atable__title--plain">{w.title}</span><span className="f-atable__meta">{w.meta}</span></th>
                      <td className="f-atable__who">{personName(w.by)}</td>
                      <td><RiskPill level={w.risk} short /></td>
                      <td className="f-atable__wait">{fmtWaiting(w.since, demo.now)}</td>
                      <td className="f-atable__act">{w.action && <ReminderButton id={w.id} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        <aside className="f-alist__side" aria-label="הסבר והחלטות אחרונות">
          <section className="f-panel f-aside-card">
            <h2 className="f-aside-card__h f-aside-card__h--lg">רמות סיכון</h2>
            {(["low", "medium", "high"] as const).map((r) => (
              <div key={r} className="f-alist__risk"><RiskPill level={r} short /><span className="f-aside-card__soft">{r === "low" ? "מוגבל והפיך. אפשר לאשר מהרשימה." : r === "medium" ? "משפיע על מחיר, תקציב או תוכן. נימוק חובה." : "פעולה חיצונית. סיכום סופי לפני ביצוע, אף פעם לא אוטומטית."}</span></div>
            ))}
          </section>
          <section className="f-panel f-aside-card">
            <h2 className="f-aside-card__h f-aside-card__h--lg">הוחלט לאחרונה</h2>
            {decided.map((a) => (
              <p key={a.id} className="f-alist__dec"><span aria-hidden>{a.status === "approved" ? "✓" : a.status === "changes_requested" ? "↺" : "✕"}</span> {a.title} · {a.status === "approved" ? "אושר" : a.status === "changes_requested" ? "נשלח לתיקון" : "נדחה"}
                {a.impact.reversibility.kind !== "none" && <> · <button type="button" className="f-link" onClick={() => q.undo(a.id)}>בטל</button></>}</p>
            ))}
            {RECENTLY_DECIDED.map((r) => <p key={r.id} className="f-alist__dec"><span aria-hidden>{r.glyph}</span> {r.text} · {r.when}</p>)}
            <Link href={R.activity} className="f-link">ליומן הפעולות</Link>
          </section>
          <p className="f-shortcuts">ברשימה: <b className="f-kbd" dir="ltr">A</b> מאשר רק פריט בסיכון נמוך.</p>
        </aside>
      </div>
    </Page>
  );
}

/** Reminder = an in-app follow-up for the person we wait for (nothing is sent outside). */
function ReminderButton({ id }: { id: string }) {
  const [sent, setSent] = useState(false);
  return sent
    ? <span className="f-meta-sm" role="status">תזכורת נוספה ליום שלו</span>
    : <Button variant="link" size="sm" onClick={() => setSent(true)} aria-describedby={`rem-${id}`}>שלח תזכורת<span id={`rem-${id}`} className="f-sr"> · תזכורת פנימית ב־Mytiv</span></Button>;
}

