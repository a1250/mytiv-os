"use client";

import Link from "@/components/focus/ui/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import type { MilestoneDraft, NewProjectDraft, SessionProject } from "@/lib/focus/contracts/clients";
import { DELIVERABLE_SUGGESTIONS, EMPTY_DRAFT, WIZARD_CLIENTS, WIZARD_OWNERS, WIZARD_STEPS, WIZARD_TEAM } from "@/lib/focus/fixtures/clients";
import { CLIENTS, PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { fmtDate, fmtMoney } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { addSessionProject, removeSessionProject } from "@/components/focus/patterns/clients/session-projects";
import { MilestoneRows, PeopleChips, StepRail, TextChips, validateStep, type WizardErrors } from "@/components/focus/patterns/clients/wizard-parts";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { Banner } from "@/components/focus/ui/feedback";
import { Checkbox, SelectField, TextAreaField, TextField } from "@/components/focus/ui/field";
import { Icon } from "@/components/focus/ui/icon";
import { PlannedTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";
import { useNavGuard } from "@/components/focus/shell/nav-guard";

/**
 * New project wizard (handoff H3) — focus mode (no global nav). Six steps; "המשך" validates the current step and every
 * error replaces its field's help text; "חזרה" keeps every value; leaving with unsaved input asks first (the shared
 * NavGuard dialog for links, search and Back; the browser prompt for reload/close). The last step creates the project in this browser session only
 * and says so — nothing is sent to a server.
 */
const LAST = WIZARD_STEPS.length - 1;
const CLIENT_NAME = Object.fromEntries(Object.values(CLIENTS).map((c) => [c.id, c.name]));
const name = (id: string) => PEOPLE_BY_ID[id]?.name ?? "—";

function stepSummary(i: number, d: NewProjectDraft): string {
  switch (WIZARD_STEPS[i].key) {
    case "basics": return [CLIENT_NAME[d.clientId], d.name.trim()].filter(Boolean).join(" · ") || WIZARD_STEPS[i].hint;
    case "goals": return d.deliverables.length === 1 ? "תוצר אחד" : `${d.deliverables.length} תוצרים`;
    case "dates": return [d.ownerId && name(d.ownerId), d.dueDate && `יעד ${fmtDate(d.dueDate)}`].filter(Boolean).join(" · ") || WIZARD_STEPS[i].hint;
    case "budget": return d.hoursBudget ? `${d.hoursBudget} שעות` : d.moneyBudget ? fmtMoney(Number(d.moneyBudget)) : "עוד לא נקבע";
    case "connections": return [d.connections.clickup && "ClickUp", d.connections.meta && "Meta"].filter(Boolean).join(", ") || "ללא";
    case "summary": return WIZARD_STEPS[i].hint;
  }
}

function Inner() {
  const toast = useToast();
  const params = useSearchParams();
  const [initial] = useState<NewProjectDraft>(() => {
    const slug = params.get("client") as keyof typeof CLIENTS | null;
    const c = slug && CLIENTS[slug] && WIZARD_CLIENTS.some((x) => x.id === CLIENTS[slug].id) ? CLIENTS[slug].id : "";
    return { ...EMPTY_DRAFT, clientId: c };
  });
  const [d, setD] = useState<NewProjectDraft>(initial);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [errors, setErrors] = useState<WizardErrors>({});
  const [created, setCreated] = useState<SessionProject | null>(null);
  const seq = useRef(0);
  const moved = useRef(false);
  const headRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = !created && JSON.stringify(d) !== JSON.stringify(initial);

  // unsaved changes: every way out asks first (links, search, Back, closing the tab) — see NavGuardProvider
  useNavGuard({ dirty: dirty, what: "מה שמילאת לא נשמר בשום מקום. אם תצא, הפרטים יימחקו." });

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    headRef.current?.focus();
  }, [step, created]);

  const set = <K extends keyof NewProjectDraft>(k: K, v: NewProjectDraft[K], errKey: string = k) => {
    setD((x) => ({ ...x, [k]: v }));
    if (errors[errKey]) setErrors((e) => { const n = { ...e }; delete n[errKey]; return n; });
  };
  const setMilestone = (id: string, patch: Partial<MilestoneDraft>) => {
    setD((x) => ({ ...x, milestones: x.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    if (errors[`ms-${id}`]) setErrors((e) => { const n = { ...e }; delete n[`ms-${id}`]; return n; });
  };

  const focusFirstError = (e: WizardErrors) => {
    const first = Object.keys(e)[0];
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
  };
  const go = (i: number) => { moved.current = true; setStep(i); setReached((r) => Math.max(r, i)); setErrors({}); };

  /** Validate steps [from, target) and move to `target`; stop on the first step with errors. */
  const advance = (target: number, from = Math.min(step, target)) => {
    for (let i = from; i < target; i++) {
      const e = validateStep(WIZARD_STEPS[i].key, d);
      if (Object.keys(e).length) {
        if (i !== step) go(i);
        setErrors(e);
        focusFirstError(e);
        return false;
      }
    }
    go(target);
    return true;
  };

  const create = () => {
    if (!advance(LAST, 0)) return;
    const p: SessionProject = { ...d, name: d.name.trim(), id: `new-${Date.now()}`, createdAt: new Date().toISOString() };
    addSessionProject(p);
    moved.current = true;
    setCreated(p);
    toast.push({
      title: "הפרויקט נוצר בדמו",
      detail: "נשמר בדפדפן הזה בלבד. לא נשלח לשרת.",
      undo: { onUndo: () => { removeSessionProject(p.id); moved.current = true; setCreated(null); } },
    });
  };

  const restart = () => { moved.current = true; setD(EMPTY_DRAFT); setStep(0); setReached(0); setErrors({}); setCreated(null); };


  const cur = WIZARD_STEPS[step];
  const nextLabel = step === LAST ? "צור פרויקט" : `המשך: ${WIZARD_STEPS[step + 1].title}`;

  return (
    <div className="f-focusmode f-cl-wiz">
      <header className="f-cl-wiz__bar">
        <Link href={R.projects} className="f-btn f-btn--neutral f-cl-wiz__close"><Icon name="x" size={16} />סגור</Link>
        <h1 className="f-cl-wiz__h1">פרויקט חדש</h1>
        <span className="f-grow" />
        <span className="f-cl-wiz__save" aria-live="polite">{created ? "נשמר בדמו · לא בשרת" : dirty ? "יש שינויים שלא נשמרו · נשמר רק בסיום" : "עוד לא מולא דבר"}</span>
      </header>

      <div className="f-cl-wiz__body">
        <StepRail
          steps={WIZARD_STEPS.map((s, i) => ({ key: s.key, title: s.title, hint: i < reached ? stepSummary(i, d) : s.hint }))}
          current={created ? WIZARD_STEPS.length : step}
          reached={created ? WIZARD_STEPS.length : reached}
          onGo={(i) => (i < step ? go(i) : advance(i))}
        />

        {created ? (
          <section className="f-cl-wiz__card" aria-labelledby="f-cl-wiz-title">
            <Banner kind="done" title="הפרויקט נוצר" detail={`${CLIENT_NAME[created.clientId]} · אחראי: ${name(created.ownerId)}`} />
            <h2 id="f-cl-wiz-title" ref={headRef} tabIndex={-1} className="f-cl-wiz__title">{created.name}</h2>
            <p className="f-cl-wiz__demo" role="note"><b>נשמר בדמו — לא נשלח לשרת.</b> הפרויקט קיים רק בדפדפן הזה עד שהלשונית תיסגר. הוא מופיע ברשימת הפרויקטים ובעמוד הלקוח, מסומן &quot;נשמר בדמו&quot;.</p>
            <div className="f-cl-wiz__links">
              <ButtonLink href={R.projects} variant="primary">לכל הפרויקטים</ButtonLink>
              {created.clientId === CLIENTS.umino.id && <ButtonLink href={R.client("umino")} variant="neutral">לעמוד של UMINO</ButtonLink>}
              <Button variant="quiet" onClick={restart}>צור פרויקט נוסף</Button>
            </div>
          </section>
        ) : (
          <form
            ref={formRef}
            id="f-cl-wiz-form"
            className="f-cl-wiz__card"
            aria-labelledby="f-cl-wiz-title"
            noValidate
            onSubmit={(e) => { e.preventDefault(); if (step === LAST) create(); else advance(step + 1); }}
          >
            <div className="f-cl-wiz__head">
              <span className="f-cl-wiz__count">שלב {step + 1} מתוך {WIZARD_STEPS.length}{cur.optional ? " · לא חובה" : ""}</span>
              <h2 id="f-cl-wiz-title" ref={headRef} tabIndex={-1} className="f-cl-wiz__title">{cur.title}</h2>
              <p className="f-cl-wiz__lead">{LEAD[cur.key]}</p>
            </div>

            {cur.key === "basics" && <>
              <SelectField label="לקוח" note="(חובה)" name="clientId" value={d.clientId} onChange={(e) => set("clientId", e.target.value)} error={errors.clientId} help="הפרויקט ייפתח תחת הלקוח הזה."
                options={[{ value: "", label: "בחר לקוח" }, ...WIZARD_CLIENTS.map((c) => ({ value: c.id, label: c.name }))]} />
              <TextField label="שם הפרויקט" note="(חובה)" name="name" value={d.name} onChange={(e) => set("name", e.target.value)} error={errors.name} help="קצר וברור, למשל: קמפיין חגים." maxLength={100} />
            </>}

            {cur.key === "goals" && <>
              <TextAreaField label="מה נחשב הצלחה" note="(חובה)" name="goal" value={d.goal} onChange={(e) => set("goal", e.target.value)} error={errors.goal} help="משפט אחד שאפשר למדוד, למשל: 20 מנויים חדשים עד סוף החודש." rows={3} />
              <TextChips label="תוצרים" note="(לפחות אחד)" name="deliverables" values={d.deliverables} suggestions={DELIVERABLE_SUGGESTIONS} onChange={(v) => set("deliverables", v)} error={errors.deliverables} help="מה יימסר ללקוח. אפשר לשנות אחר כך." />
            </>}

            {cur.key === "dates" && <>
              <div className="f-cl-wiz__pair">
                <TextField label="תאריך התחלה" type="date" name="startDate" value={d.startDate} onChange={(e) => set("startDate", e.target.value)} error={errors.startDate} help="ברירת מחדל: היום." />
                <TextField label="תאריך יעד" type="date" name="dueDate" value={d.dueDate} min={d.startDate || undefined} onChange={(e) => set("dueDate", e.target.value)} error={errors.dueDate} help="לא לפני תאריך ההתחלה." />
              </div>
              <SelectField label="אחראי ראשי" note="(חובה)" name="ownerId" value={d.ownerId} onChange={(e) => set("ownerId", e.target.value)} error={errors.ownerId} help="מקבל את ההתראות ואת ההחלטות של הפרויקט."
                options={[{ value: "", label: "בחר אחראי" }, ...WIZARD_OWNERS.map((p) => ({ value: p.id, label: p.name }))]} />
              <PeopleChips label="צוות" note="(לא חובה)" people={WIZARD_TEAM.filter((p) => p.id !== d.ownerId)} selected={d.teamIds.filter((id) => id !== d.ownerId)}
                onAdd={(id) => set("teamIds", [...d.teamIds, id])} onRemove={(id) => set("teamIds", d.teamIds.filter((x) => x !== id))} help="מי עוד עובד על הפרויקט." />
              <MilestoneRows rows={d.milestones} errors={errors} min={d.startDate} max={d.dueDate}
                onChange={setMilestone}
                onAdd={() => setD((x) => ({ ...x, milestones: [...x.milestones, { id: `m${++seq.current}`, title: "", date: "" }] }))}
                onRemove={(id) => { setD((x) => ({ ...x, milestones: x.milestones.filter((m) => m.id !== id) })); setErrors((e) => { const n = { ...e }; delete n[`ms-${id}`]; return n; }); }} />
            </>}

            {cur.key === "budget" && <>
              <div className="f-cl-wiz__pair">
                <TextField label="מכסת שעות" note="(לא חובה)" name="hoursBudget" inputMode="decimal" value={d.hoursBudget} onChange={(e) => set("hoursBudget", e.target.value)} error={errors.hoursBudget} help="ריק = עוד לא נקבע (לא 0)." />
                <TextField label="תקציב בשקלים" note="(לא חובה)" name="moneyBudget" inputMode="numeric" value={d.moneyBudget} onChange={(e) => set("moneyBudget", e.target.value)} error={errors.moneyBudget} help="ללא מדיה. ריק = עוד לא נקבע." />
              </div>
            </>}

            {cur.key === "connections" && <>
              <div className="f-cl-wiz__conns">
                <Checkbox checked={d.connections.clickup} onChange={(v) => set("connections", { ...d.connections, clickup: v })}>
                  <b>ClickUp</b> · לפתוח תיקייה למשימות הפרויקט
                </Checkbox>
                <Checkbox checked={d.connections.meta} onChange={(v) => set("connections", { ...d.connections, meta: v })}>
                  <b>Meta</b> · לקשר לחשבון המודעות של הלקוח
                </Checkbox>
              </div>
              <p className="f-cl-wiz__planned"><PlannedTag /> החיבור בפועל עוד לא קיים בדמו. נשמרת רק ההעדפה, ואפשר לחבר אחר כך ב<Link href={R.settings} className="f-link">הגדרות החיבורים</Link>.</p>
            </>}

            {cur.key === "summary" && (
              <div className="f-cl-sum">
                {WIZARD_STEPS.slice(0, LAST).map((s, i) => (
                  <section key={s.key} className="f-cl-sum__sec" aria-label={s.title}>
                    <div className="f-cl-sum__head"><h3 className="f-cl-sum__title">{s.title}</h3><Button variant="link" size="sm" onClick={() => go(i)} aria-label={`ערוך: ${s.title}`}>ערוך</Button></div>
                    <dl className="f-cl-sum__dl">{SUMMARY[s.key]?.(d).map(([k, v]) => <div key={k} className="f-cl-sum__row"><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                  </section>
                ))}
                <p className="f-cl-wiz__planned"><PlannedTag /> יצירה בדמו: הפרויקט יישמר בדפדפן הזה בלבד ולא יישלח לשרת.</p>
              </div>
            )}

          </form>
        )}
      </div>

      {!created && (
        <div className="f-cl-wiz__foot">
          {step > 0 && <Button variant="neutral" onClick={() => go(step - 1)}><span aria-hidden>→</span> חזרה</Button>}
          <span className="f-grow" />
          {step >= 2 && step < LAST - 1 && <Button variant="quiet" onClick={() => advance(LAST)}>דלג לסיכום</Button>}
          <Button type="submit" form="f-cl-wiz-form" variant="primary" size="lg">{nextLabel} {step < LAST && <span aria-hidden>←</span>}</Button>
        </div>
      )}
    </div>
  );
}

const LEAD: Record<(typeof WIZARD_STEPS)[number]["key"], string> = {
  basics: "לאיזה לקוח הפרויקט ואיך קוראים לו.",
  goals: "מה הלקוח צריך לקבל ואיך נדע שהצלחנו.",
  dates: "אפשר להשלים אחר כך הכול חוץ מאחראי ראשי.",
  budget: "אפשר להשלים אחר כך. בלי מכסה, השעות יוצגו בלי יעד.",
  connections: "איפה המשימות והקמפיינים של הפרויקט יחיו.",
  summary: "בדיקה אחרונה לפני יצירה. כל שלב ניתן לעריכה.",
};

const or = (v: string, empty = "עוד לא נקבע") => v || empty;
const SUMMARY: Partial<Record<(typeof WIZARD_STEPS)[number]["key"], (d: NewProjectDraft) => [string, string][]>> = {
  basics: (d) => [["לקוח", or(CLIENT_NAME[d.clientId], "—")], ["שם", or(d.name.trim(), "—")]],
  goals: (d) => [["הצלחה", or(d.goal.trim(), "—")], ["תוצרים", or(d.deliverables.join(" · "), "—")]],
  dates: (d) => [
    ["תאריכים", `${d.startDate ? fmtDate(d.startDate) : "ללא התחלה"} – ${d.dueDate ? fmtDate(d.dueDate) : "ללא יעד"}`],
    ["אחראי ראשי", d.ownerId ? name(d.ownerId) : "—"],
    ["צוות", or(d.teamIds.filter((id) => id !== d.ownerId).map(name).join(", "), "ללא")],
    ["אבני דרך", or(d.milestones.filter((m) => m.title && m.date).map((m) => `${m.title} ${fmtDate(m.date)}`).join(" · "), "ללא")],
  ],
  budget: (d) => [["מכסת שעות", d.hoursBudget ? `${d.hoursBudget} שעות` : "עוד לא נקבעה"], ["תקציב", d.moneyBudget ? fmtMoney(Number(d.moneyBudget)) : "עוד לא נקבע"]],
  connections: (d) => [["חיבורים", or([d.connections.clickup && "ClickUp", d.connections.meta && "Meta"].filter(Boolean).join(", "), "ללא")]],
};

export default function ClientsNewProjectScreen() {
  return <Suspense><Inner /></Suspense>;
}
