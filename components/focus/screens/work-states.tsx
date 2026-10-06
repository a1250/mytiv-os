"use client";

import { useState } from "react";
import type { Task } from "@/lib/focus/contracts/work";
import { CLIENTS, PEOPLE } from "@/lib/focus/fixtures/people";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { QuickCreate } from "@/components/focus/patterns/work/quick-create";
import { WorkStateView } from "@/components/focus/patterns/work/work-states";
import { useDemo } from "@/components/focus/shell/demo-store";
import { useCreateUndo } from "@/components/focus/shell/task-actions";
import { Banner } from "@/components/focus/ui/feedback";
import { PlannedTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Mytiv Work system states (handoff W6) — every state is the real component, each interactive: retry goes through
 * loading back to data or to the error again; the conflict really resolves; quick create really creates.
 */
export default function WorkStatesScreen() {
  const demo = useDemo();
  const undoCreate = useCreateUndo();
  const toast = useToast();
  const [errState, setErrState] = useState<"error" | "loading" | "ready">("error");
  const [failRetry, setFailRetry] = useState(true);
  const base = demo.state.tasks.find((t) => t.id === "t-post45")!;
  const [conflict, setConflict] = useState<{ mine: Task; theirs: Task } | null>({ mine: { ...base, assigneeId: PEOPLE.yoav.id }, theirs: { ...base, assigneeId: PEOPLE.ron.id } });
  const [resolved, setResolved] = useState<string | null>(null);

  const retry = () => {
    setErrState("loading");
    setTimeout(() => { setErrState(failRetry ? "error" : "ready"); setFailRetry(false); }, 1200);
  };

  return (
    <Page className="f-wstates">
      <PageHeader eyebrow="עבודה · מצבי מערכת" title="מצבי מערכת" size="page" status="כל תצוגה ב־Mytiv Work עוברת במצבים האלה. תקלה אף פעם לא מוצגת כרשימה ריקה, ו״לא ידוע״ אף פעם לא 0." />
      <div className="f-wstates__grid">
        <section className="f-panel f-wstates__card" aria-label="מצב ריק"><WorkStateView state={{ kind: "empty", title: "אין משימות להיום", hint: "הכל מטופל. אפשר למשוך משימה מ\"בקרוב\" או ליצור חדשה." }} onCreate={() => document.querySelector<HTMLInputElement>(".f-wstates .f-qc__input")?.focus()} /><span className="f-wstates__label">מצב ריק</span></section>
        <section className="f-panel f-wstates__card" aria-label="טעינה"><WorkStateView state={{ kind: "loading" }} /><span className="f-wstates__label">טעינה · Skeleton</span></section>
        <section className="f-panel f-wstates__card" aria-label="תקלה">
          {errState === "ready" ? <Banner kind="done" title="המשימות נטענו" detail={`${demo.state.tasks.length} משימות · מסונכרן עכשיו`} /> : <WorkStateView state={errState === "loading" ? { kind: "loading" } : { kind: "error", message: "לא הצלחנו לטעון משימות" }} onRetry={retry} />}
          <span className="f-wstates__label">תקלה {failRetry && errState === "error" ? "· הניסיון הבא ייכשל שוב" : ""}</span>
        </section>
        <section className="f-panel f-wstates__card" aria-label="לא זמין"><WorkStateView state={{ kind: "unavailable", reason: "ClickUp לא זמין", since: "2026-10-01T06:00:00+03:00" }} onRetry={() => toast.push({ kind: "error", title: "ClickUp עדיין לא זמין", detail: "הנתונים האחרונים נשמרו." })} /><span className="f-wstates__label">מקור לא זמין</span></section>
        <section className="f-panel f-wstates__card" aria-label="הרשאה חסרה"><WorkStateView state={{ kind: "permissionDenied", reason: "אין לך הרשאה לערוך משימות בפרויקט הזה. אפשר להגיב ולעקוב." }} onRequestAccess={() => toast.push({ title: "הבקשה נשלחה לדנה", detail: "תקבל התראה כשתאושר." })} /><span className="f-wstates__label">הרשאה חסרה</span></section>
        <section className="f-panel f-wstates__card f-wstates__card--wide" aria-label="קונפליקט גרסאות">
          {conflict ? (
            <WorkStateView state={{ kind: "versionConflict", mine: conflict.mine, theirs: conflict.theirs, theirsBy: PEOPLE.dana.name, field: "assigneeId" }}
              onKeepMine={() => { setConflict(null); setResolved("נשמרה הגרסה שלך (אחראי: יואב)."); }}
              onTakeTheirs={() => { setConflict(null); setResolved("התקבלה הגרסה של דנה (אחראי: רון)."); }} />
          ) : (
            <div className="f-wstates__resolved"><Banner kind="done" title="הקונפליקט נפתר" detail={resolved ?? ""} /><button type="button" className="f-link" onClick={() => setConflict({ mine: { ...base, assigneeId: PEOPLE.yoav.id }, theirs: { ...base, assigneeId: PEOPLE.ron.id } })}>הצג שוב</button></div>
          )}
          <span className="f-wstates__label">קונפליקט גרסאות</span>
        </section>
        <section className="f-panel f-wstates__card f-wstates__card--wide" aria-label="משימה חדשה">
          <h2 className="f-wstates__h">משימה חדשה</h2>
          <QuickCreate now={demo.now} compact people={Object.values(PEOPLE).map((p) => ({ id: p.id, name: p.name }))} clients={Object.values(CLIENTS).map((c) => c.name)}
            onCreate={(d) => { const t = demo.createTask({ title: d.title, dueDate: d.dueDate, priority: d.priority, assigneeId: d.assigneeId ?? demo.viewer.id }); toast.push({ title: "נוצרה משימה", detail: t.title, undo: { onUndo: undoCreate(t) } }); }} />
        </section>
        <section className="f-panel f-wstates__card f-wstates__card--wide" aria-label="מתוכנן">
          <h2 className="f-wstates__h">יכולת בהמתנה ל־backend <PlannedTag /></h2>
          <p className="f-meta">יכולות שעוד אין להן שרת (טיימר מתמשך, תלויות, דוח שעות, תגובות, checklist) מוצגות במצב &quot;מתוכנן&quot; עם נתוני fixture. הרכיב מרונדר מלא כדי לשמור חוזה ברור — החיבור מזרים נתונים אמיתיים בלי לשנות את ה־UI.</p>
          <code className="f-wstates__code f-mono" dir="ltr">TaskTimer · source: &quot;planned&quot; — fixture now → POST /api/[slug]/work/timers</code>
        </section>
      </div>
    </Page>
  );
}
