"use client";

import { useEffect, useRef, useState } from "react";
import type { PromptCategory, PromptTemplate } from "@/lib/focus/contracts/marketing";
import { PROMPT_OUTPUTS, PROMPT_TOOLS, PROMPTS } from "@/lib/focus/fixtures/marketing";
import { personName } from "@/lib/focus/fixtures/people";
import { fmtAgo } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { jobStatus } from "@/lib/focus/state/jobs";
import { useCopy } from "@/components/focus/patterns/marketing/marketing-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Dialog } from "@/components/focus/ui/dialog";
import { Banner, EmptyState } from "@/components/focus/ui/feedback";
import { Checkbox, SelectField, TextAreaField, TextField } from "@/components/focus/ui/field";
import { SystemLine } from "@/components/focus/ui/status";
import { Chips } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";
import { useNavGuard } from "@/components/focus/shell/nav-guard";

/**
 * Prompt builder & library (handoff H12): search, owner filter and category that really filter; a prompt's fields
 * (tool, output, goal, constraints, quality checks) are editable and saved as a new version (undo); "העתק" uses the
 * Clipboard API with a fallback; "שפר בעזרת AI" is a job whose result is shown as a diff before anything is saved.
 */
type Owner = "all" | "fav" | "mine" | "system";
const CAT: Record<PromptCategory, string> = { image: "יצירת תמונות", text: "טקסט" };
const ownerLabel = (p: PromptTemplate) => (p.owner.kind === "mine" ? "שלי" : p.owner.kind === "system" ? "תבנית מערכת" : personName(p.owner.personId));
type Draft = Pick<PromptTemplate, "tool" | "output" | "goal" | "constraints" | "checks">;
const draftOf = (p: PromptTemplate): Draft => ({ tool: p.tool, output: p.output, goal: p.goal, constraints: p.constraints, checks: p.checks });
const sameDraft = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);

export default function MarketingPromptsScreen() {
  const toast = useToast();
  const [prompts, setPrompts] = useState(PROMPTS);
  const [selectedId, setSelectedId] = useState(PROMPTS[0].id);
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState<Owner>("all");
  const [cat, setCat] = useState<"all" | PromptCategory>("all");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  /** AI suggestions already accepted or dismissed (prompt id → job start), so a settled job is shown once */
  const [handled, setHandled] = useState<Record<string, number>>({});

  const q = query.trim();
  const list = prompts.filter((p) =>
    (owner === "all" || (owner === "fav" ? p.favorite : owner === "mine" ? p.owner.kind === "mine" : p.owner.kind === "system")) &&
    (cat === "all" || p.category === cat) &&
    (!q || p.title.includes(q) || p.goal.includes(q) || p.full.toLowerCase().includes(q.toLowerCase())));
  const selected = prompts.find((p) => p.id === selectedId) ?? null;

  const select = (id: string) => { if (id === selectedId) return; if (dirty) { setPending(id); return; } setSelectedId(id); };
  const update = (next: PromptTemplate, title: string, detail: string) => {
    const prev = prompts.find((p) => p.id === next.id)!;
    setPrompts((xs) => xs.map((p) => (p.id === next.id ? next : p)));
    toast.push({ title, detail, undo: { onUndo: () => setPrompts((xs) => xs.map((p) => (p.id === prev.id ? prev : p))) } });
  };
  const toggleFav = (p: PromptTemplate) => {
    setPrompts((xs) => xs.map((x) => (x.id === p.id ? { ...x, favorite: !x.favorite } : x)));
  };

  return (
    <div className="f-mk-prompts">
      <section className="f-mk-lib" aria-labelledby="lib-h">
        <h1 id="lib-h" className="f-mk-lib__h">ספרייה<span className="f-sr"> · פרומפטים</span></h1>
        <TextField label="חיפוש פרומפט" labelClassName="f-sr" type="search" placeholder="חיפוש פרומפט" value={query} onChange={(e) => setQuery(e.target.value)} inputClassName="f-mk-lib__search" />
        <Chips label="סינון לפי בעלות" value={owner} onChange={setOwner} className="f-mk-lib__chips"
          items={[{ key: "all", label: "הכול" }, { key: "fav", label: "★ מועדפים" }, { key: "mine", label: "שלי" }, { key: "system", label: "תבניות מערכת" }]} />
        <SelectField label="קטגוריה" labelClassName="f-sr" inputClassName="f-input--sm" value={cat} onChange={(e) => setCat(e.target.value as typeof cat)}
          options={[{ value: "all", label: "כל הקטגוריות" }, { value: "image", label: CAT.image }, { value: "text", label: CAT.text }]} />
        <p className="f-sr" role="status">{list.length} פרומפטים</p>
        {list.length === 0 ? (
          <EmptyState title="לא נמצאו פרומפטים" hint="נסו מילה אחרת או נקו את הסינון." action={<Button variant="secondary" size="sm" onClick={() => { setQuery(""); setOwner("all"); setCat("all"); }}>נקה סינון</Button>} />
        ) : (
          <ul className="f-mk-lib__list">
            {list.map((p) => (
              <li key={p.id} className={cx("f-mk-pitem", p.id === selectedId && "f-mk-pitem--on")}>
                <button type="button" className="f-mk-pitem__pick" aria-current={p.id === selectedId ? "true" : undefined} onClick={() => select(p.id)}>
                  <b>{p.favorite && <span aria-label="מועדף">★ </span>}{p.title}</b>
                  <span className="f-meta-sm">{CAT[p.category]} · {ownerLabel(p)}{p.owner.kind === "mine" ? ` · גרסה ${p.version}` : ""}</span>
                </button>
                <button type="button" className="f-mk-pitem__star f-hit" aria-pressed={p.favorite} aria-label={`${p.favorite ? "הסר ממועדפים" : "סמן כמועדף"}: ${p.title}`} onClick={() => toggleFav(p)}>
                  <span aria-hidden>{p.favorite ? "★" : "☆"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected
        ? <PromptWorkspace key={selected.id} p={selected} onDirty={setDirty} onSave={update} handledJob={handled[selected.id] ?? null} onHandled={(at) => setHandled((h) => ({ ...h, [selected.id]: at }))} />
        : <EmptyState title="בחרו פרומפט מהספרייה" />}

      <Dialog className="f-mk-dialog" open={!!pending} onClose={() => setPending(null)} label="שינויים שלא נשמרו">
        <div className="f-mk-form">
          <h2 className="f-mk-form__h">יש שינויים שלא נשמרו</h2>
          <p className="f-meta">אם תעברו לפרומפט אחר, השינויים בשדות לא יישמרו כגרסה.</p>
          <div className="f-mk-form__actions">
            <Button onClick={() => setPending(null)}>חזור ושמור</Button>
            <Button variant="neutral" onClick={() => { const id = pending!; setPending(null); setDirty(false); setSelectedId(id); }}>עבור בלי לשמור</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function PromptWorkspace({ p, onDirty, onSave, handledJob, onHandled }: {
  p: PromptTemplate; onDirty: (d: boolean) => void; onSave: (next: PromptTemplate, title: string, detail: string) => void;
  handledJob: number | null; onHandled: (jobStartedAt: number) => void;
}) {
  const demo = useDemo();
  const copy = useCopy();
  const fullRef = useRef<HTMLParagraphElement>(null);
  const [draft, setDraft] = useState<Draft>(() => draftOf(p));
  const [newRule, setNewRule] = useState("");
  const [ruleError, setRuleError] = useState<string | null>(null);
  const dirty = !sameDraft(draft, draftOf(p));

  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  // unsaved changes: every way out asks first (links, search, Back, closing the tab) — see NavGuardProvider
  useNavGuard({ dirty: dirty, what: "השינויים בפרומפט לא יישמרו כגרסה." });

  const jobId = `improve-${p.id}`;
  const job = demo.state.jobs.find((j) => j.id === jobId && !j.cancelledAt);
  const js = job ? jobStatus(job, demo.state.clock) : null;
  const showResult = job && js && js.state !== "running" && handledJob !== job.startedAt;

  const saveVersion = (full = p.full, how = "נשמרה גרסה") => {
    onSave({ ...p, ...draft, full, version: p.version + 1, savedAt: new Date().toISOString(), improved: full === p.full ? p.improved : undefined },
      `${how} ${p.version + 1}`, p.title);
  };
  const addRule = () => {
    const r = newRule.trim();
    if (!r) { setRuleError("יש לכתוב מגבלה."); return; }
    if (draft.constraints.includes(r)) { setRuleError("המגבלה כבר קיימת."); return; }
    setDraft({ ...draft, constraints: [...draft.constraints, r] });
    setNewRule("");
  };

  return (
    <>
      <section className="f-panel f-mk-pdetail" aria-labelledby="pd-h">
        <div className="f-mk-pdetail__head">
          <h2 id="pd-h" className="f-mk-pdetail__title">{p.title}</h2>
          <span className="f-meta" role="status">גרסה {p.version} · {dirty ? "יש שינויים שלא נשמרו" : `נשמר ${fmtAgo(p.savedAt, demo.now)}`}</span>
        </div>
        <div className="f-mk-pdetail__pair">
          <SelectField label="כלי יעד" value={draft.tool} onChange={(e) => setDraft({ ...draft, tool: e.target.value })} options={PROMPT_TOOLS.map((t) => ({ value: t, label: t }))} />
          <SelectField label="סוג תוצר" value={draft.output} onChange={(e) => setDraft({ ...draft, output: e.target.value })} options={PROMPT_OUTPUTS.map((t) => ({ value: t, label: t }))} />
        </div>
        <TextAreaField label="מטרה והקשר" rows={2} value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} help="מה התוצר צריך לשרת, ולאיזה לקוח." />
        <fieldset className="f-mk-pdetail__set">
          <legend className="f-field__label">מגבלות</legend>
          <ul className="f-mk-rules">
            {draft.constraints.map((c) => (
              <li key={c} className="f-mk-rule">
                {c}
                <button type="button" className="f-mk-rule__x f-hit" aria-label={`הסר מגבלה: ${c}`} onClick={() => setDraft({ ...draft, constraints: draft.constraints.filter((x) => x !== c) })}><span aria-hidden>✕</span></button>
              </li>
            ))}
          </ul>
          <div className="f-mk-rules__add">
            <TextField label="מגבלה חדשה" labelClassName="f-sr" inputClassName="f-input--sm" placeholder="מגבלה חדשה" value={newRule} error={ruleError}
              onChange={(e) => { setNewRule(e.target.value); setRuleError(null); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRule(); } }} />
            <Button variant="neutral" size="sm" onClick={addRule}>+ הוסף</Button>
          </div>
        </fieldset>
        <fieldset className="f-mk-pdetail__set">
          <legend className="f-field__label">רשימת בדיקות איכות</legend>
          <ul className="f-mk-checks">
            {draft.checks.map((k) => (
              <li key={k.id}>
                <Checkbox size="sm" checked={k.done} onChange={(v) => setDraft({ ...draft, checks: draft.checks.map((x) => (x.id === k.id ? { ...x, done: v } : x)) })}>{k.text}</Checkbox>
              </li>
            ))}
          </ul>
        </fieldset>
      </section>

      <section className="f-mk-pfull" aria-labelledby="pf-h">
        <div className="f-mk-pfull__box">
          <h2 id="pf-h" className="f-mk-pfull__h">הפרומפט המלא</h2>
          <p ref={fullRef} className="f-mk-pfull__text" dir="ltr" lang="en">{p.full}</p>
        </div>
        <div className="f-mk-pfull__actions">
          <Button onClick={() => copy(p.full, "הפרומפט", fullRef.current)}>העתק</Button>
          <Button variant="secondary" loading={js?.state === "running"} loadingLabel="משפר…"
            onClick={() => demo.startJob({ id: jobId, kind: "ai_directions", label: `משפר את "${p.title}"`, detail: "", durationMs: 1800, outcome: "success", href: R.prompts })}>
            <span aria-hidden>✦</span> שפר בעזרת AI
          </Button>
          <Button variant="neutral" onClick={() => saveVersion()} disabled={!dirty} disabledReason={!dirty ? "אין שינויים לשמור" : undefined} id="mk-new-version">צור גרסה</Button>
        </div>
        {js?.state === "running" && (
          <div className="f-mk-pfull__job">
            <SystemLine status="processing">ה־AI בודק את הפרומפט…</SystemLine>
            <Button variant="quiet" size="sm" onClick={() => demo.cancelJob(jobId)}>בטל</Button>
          </div>
        )}
        {showResult && js?.state === "failed" && <Banner kind="error" title="השיפור נכשל" detail="הפרומפט לא השתנה." />}
        {showResult && js?.state === "done" && (p.improved ? (
          <div className="f-mk-diff" role="region" aria-label="הצעת שיפור">
            <span className="f-mk-diff__label">נוכחי · גרסה {p.version}</span>
            <p className="f-mk-diff__text f-mk-diff__text--old" dir="ltr" lang="en"><del>{p.full}</del></p>
            <span className="f-mk-diff__label">מוצע ע״י AI</span>
            <p className="f-mk-diff__text f-mk-diff__text--new" dir="ltr" lang="en"><ins>{p.improved}</ins></p>
            <div className="f-mk-diff__actions">
              <Button size="sm" onClick={() => { onHandled(job!.startedAt); saveVersion(p.improved, "השיפור נשמר כגרסה"); }}>שמור כגרסה {p.version + 1}</Button>
              <Button variant="neutral" size="sm" onClick={() => onHandled(job!.startedAt)}>בטל הצעה</Button>
            </div>
          </div>
        ) : (
          <Banner kind="done" title="ה־AI לא מצא שיפור מהותי" detail="הפרומפט נשאר כמו שהוא." action={<Button variant="quiet" size="sm" onClick={() => onHandled(job!.startedAt)}>סגור</Button>} />
        ))}
        <p className="f-meta">&quot;שפר&quot; מציג את ההבדלים מול הגרסה הנוכחית לפני שמירה.</p>
      </section>
    </>
  );
}
