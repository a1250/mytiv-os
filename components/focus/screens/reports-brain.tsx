"use client";

import Link from "next/link";
import { useState } from "react";
import type { BrainFact, FactContentState } from "@/lib/focus/contracts/reports";
import { BRAIN_CLIENT, BRAIN_FACTS, BRAIN_SECTIONS } from "@/lib/focus/fixtures/reports";
import { daysBetween, fmtDate, fmtDayMonth } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { FactEditor, type FactDraft } from "@/components/focus/patterns/reports/fact-editor";
import { KvList, StateTag, fmtWhen } from "@/components/focus/patterns/reports/report-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { EmptyState } from "@/components/focus/ui/feedback";
import { SystemLine, VERIFICATION, VerificationTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * מוח העסק (handoff G5): facts per topic, each with its content state ("תקין" / "לא עדכני" / "חסר") and its
 * verification ("אומת" — who checked it and against what). "אמת" verifies locally with undo; the editor validates;
 * "סמן כלא נכון" and "בקש מידע מהלקוח" are recorded with undo. The fact panel shows source, checker and usage.
 */
const CONTENT: Record<FactContentState, { status: "done" | "stale" | "unavailable"; word: string }> = {
  ok: { status: "done", word: "תקין" },
  stale: { status: "stale", word: "לא עדכני" },
  missing: { status: "unavailable", word: "חסר" },
};

type SectionMark = { glyph: string; word: string; tone: "ok" | "partial" | "missing" };
function sectionMark(facts: BrainFact[]): SectionMark {
  if (!facts.length || facts.some((f) => f.contentState === "missing")) return { glyph: "", word: "חסר", tone: "missing" };
  if (facts.every((f) => f.verification === "verified" && f.contentState === "ok")) return { ...VERIFICATION.verified, tone: "ok" };
  return { ...VERIFICATION.partial, tone: "partial" };
}

function recheckText(f: BrainFact, now: string) {
  if (!f.recheck) return { text: "—", late: false };
  const d = daysBetween(now, f.recheck.date);
  if (d < 0) return { text: "עבר המועד", late: true };
  if (d === 0) return { text: "היום", late: false };
  return { text: fmtDayMonth(f.recheck.date), late: false };
}

export default function ReportsBrainScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { now, viewer } = demo;
  const [facts, setFacts] = useState<BrainFact[]>(BRAIN_FACTS);
  const [sectionId, setSectionId] = useState("prices");
  const [selectedId, setSelectedId] = useState<string | null>("f-promo");
  const [editor, setEditor] = useState<{ fact: BrainFact | null; focusSource?: boolean } | null>(null);
  const [requests, setRequests] = useState<string[]>([]);
  const section = BRAIN_SECTIONS.find((s) => s.id === sectionId)!;
  const inSection = facts.filter((f) => f.sectionId === sectionId);
  const selected = inSection.find((f) => f.id === selectedId) ?? inSection[0] ?? null;
  const stale = inSection.filter((f) => f.contentState === "stale").length;
  const unverified = inSection.filter((f) => f.verification === "unverified").length;

  const replace = (next: BrainFact) => setFacts((fs) => fs.map((f) => (f.id === next.id ? next : f)));
  const verify = (f: BrainFact) => {
    replace({ ...f, verification: "verified", verificationLabel: `אומת ע״י ${viewer.name}`, verifiedBy: { personId: viewer.id, label: viewer.name, at: now } });
    toast.push({ title: "סומן כמאומת", detail: `${f.title} · אומת ע״י ${viewer.name}`, undo: { onUndo: () => replace(f) } });
  };
  const markWrong = (f: BrainFact) => {
    replace({ ...f, verification: "unverified", verificationLabel: "סומן כלא נכון", contentState: f.value ? "stale" : f.contentState });
    toast.push({ title: "סומן כלא נכון", detail: "הפריט לא ישמש בתוכן חדש עד שיתוקן.", undo: { onUndo: () => replace(f) } });
  };
  const request = (f: BrainFact) => {
    setRequests((r) => [...r, f.id]);
    toast.push({ title: "הבקשה נרשמה", detail: `${f.title}: הבקשה נוספה לרשימת השאלות ל־${BRAIN_CLIENT.name}. שום דבר לא נשלח עדיין.`, undo: { onUndo: () => setRequests((r) => r.filter((x) => x !== f.id)) } });
  };
  const save = (d: FactDraft) => {
    const prev = editor?.fact ?? null;
    const value = d.value.trim() || null;
    const base: BrainFact = prev ?? { id: `f-new-${facts.length + 1}`, sectionId, title: "", value: null, contentState: "missing", verification: "unverified", source: null, verifiedBy: null, recheck: null, usedIn: [] };
    const valueChanged = !prev || (prev.value ?? "") !== (value ?? "");
    const next: BrainFact = {
      ...base, title: d.title.trim(), value, source: d.source.trim() || null,
      recheck: d.recheck ? { date: d.recheck } : null,
      contentState: value ? "ok" : "missing",
      ...(valueChanged ? { verification: "unverified" as const, verificationLabel: undefined, verifiedBy: null } : {}),
    };
    if (prev) replace(next); else setFacts((fs) => [...fs, next]);
    setSelectedId(next.id);
    setEditor(null);
    toast.push({
      title: prev ? "הפריט עודכן" : "הפריט נוסף", detail: valueChanged ? "הערך חדש, ולכן הוא מסומן ״לא אומת״." : next.title,
      undo: { onUndo: () => { if (prev) replace(prev); else setFacts((fs) => fs.filter((f) => f.id !== next.id)); } },
    });
  };

  return (
    <div className="f-rp-brain">
      <nav className="f-rp-side" aria-label="נושאים במוח העסק">
        <span className="f-crumbs f-rp-side__crumb"><Link href={R.client("umino")}>{BRAIN_CLIENT.name}</Link> <span aria-hidden>›</span> ידע ותוצאות</span>
        <h1 className="f-rp-side__title">מוח העסק</h1>
        <ul className="f-rp-side__list">
          {BRAIN_SECTIONS.map((s) => {
            const m = sectionMark(facts.filter((f) => f.sectionId === s.id));
            const on = s.id === sectionId;
            return (
              <li key={s.id}>
                <button type="button" className="f-rp-side__item" aria-current={on ? "true" : undefined} onClick={() => { setSectionId(s.id); setSelectedId(null); }}>
                  <span>{s.label}</span>
                  <span className={cx("f-rp-side__mark", `f-rp-side__mark--${m.tone}`)}>
                    {m.glyph && <span aria-hidden>{m.glyph}</span>}<span className={m.tone === "missing" ? undefined : "f-sr"}>{m.word}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="f-rp-brain__main" aria-labelledby="brain-sec">
        <div className="f-rp-brain__head">
          <h2 id="brain-sec" className="f-rp-brain__h2">{section.label}</h2>
          <span className="f-meta">{inSection.length} פריטים{stale ? ` · ${stale} לא עדכני` : ""}{unverified ? ` · ${unverified} לא מאומת` : ""}</span>
          <Button variant="secondary" onClick={() => setEditor({ fact: null })}>+ פריט</Button>
        </div>
        <section className="f-panel f-rp-tablewrap" aria-label={`פריטים · ${section.label}`}>
          {inSection.length === 0 ? (
            <EmptyState title="אין עדיין פריטים בנושא הזה" hint="פריט חדש יסומן ״לא אומת״ עד שמישהו יבדוק אותו." action={<Button variant="neutral" onClick={() => setEditor({ fact: null })}>+ פריט</Button>} />
          ) : (
            <table className="f-rp-table f-rp-table--brain">
              <caption className="f-sr">{section.label}: פריטים, מצב התוכן ומצב האימות</caption>
              <thead><tr><th scope="col">פריט וערך</th><th scope="col">מצב התוכן</th><th scope="col">מצב האימות</th><th scope="col">לבדוק שוב</th></tr></thead>
              <tbody>
                {inSection.map((f) => {
                  const on = selected?.id === f.id;
                  const rc = recheckText(f, now);
                  return (
                    <tr key={f.id} className={cx(on && "f-rp-row--active")}>
                      <th scope="row" data-label="פריט וערך">
                        <button type="button" className="f-rp-fact" aria-pressed={on} onClick={() => setSelectedId(f.id)}>
                          <b>{f.title}</b>
                          {f.value ? <span className="f-meta">{f.value}</span> : <span className="f-rp-fact__none"><span aria-hidden>— </span>אין עדיין ערך</span>}
                        </button>
                      </th>
                      <td data-label="מצב התוכן"><StateTag status={CONTENT[f.contentState].status}>{CONTENT[f.contentState].word}</StateTag></td>
                      <td data-label="מצב האימות">
                        <span className="f-rp-verif">
                          <VerificationTag state={f.verification} label={f.verificationLabel} />
                          {f.verification !== "verified" && f.value && <Button variant="link" className="f-rp-verif__btn" onClick={() => verify(f)}>אמת<span className="f-sr">: {f.title}</span></Button>}
                          {!f.value && <Button variant="link" className="f-rp-verif__btn" onClick={() => setEditor({ fact: f })}>הוסף ערך<span className="f-sr">: {f.title}</span></Button>}
                        </span>
                      </td>
                      <td data-label="לבדוק שוב"><span className={cx("f-num", rc.late && "f-rp-late")}>{rc.late && <span aria-hidden>! </span>}{rc.text}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
        <p className="f-meta">&quot;תקין&quot; מתאר את התוכן עצמו, ו&quot;אומת&quot; מתאר מי בדק אותו ומול מה. פריט יכול להיות תקין ועדיין לא מאומת.</p>
      </section>

      {selected && (
        <aside className="f-panel f-rp-factpanel" aria-labelledby="fact-title">
          <div className="f-rp-factpanel__head">
            <span className="f-meta">{section.label}</span>
            <h2 id="fact-title" className="f-rp-factpanel__title">{selected.title}</h2>
            <span className={cx("f-rp-factpanel__value", !selected.value && "f-value--unavailable")}>{selected.value ?? "— אין עדיין ערך"}</span>
          </div>
          <div className="f-rp-factpanel__body">
            <KvList rows={[
              { label: "מקור", value: selected.source ?? <span className="f-value--unavailable">— לא צוין מקור</span> },
              { label: "אימת", value: selected.verifiedBy ? <>{selected.verifiedBy.label} · <span className="f-num">{fmtWhen(selected.verifiedBy.at, now)}</span></> : <VerificationTag state={selected.verification} label={selected.verificationLabel} /> },
              { label: "לבדוק שוב", value: selected.recheck ? <><span className="f-num">{fmtDate(selected.recheck.date)}</span>{selected.recheck.why ? `, ${selected.recheck.why}` : ""}</> : "—" },
            ]} />
            <div className="f-rp-factpanel__used">
              <h3 className="f-rp-factpanel__h3">היכן בשימוש · <span className="f-num">{selected.usedIn.length}</span></h3>
              {selected.usedIn.length ? (
                <ul className="f-rp-inline-links">{selected.usedIn.map((u) => <li key={u.label}><Link href={u.href} className="f-link">{u.label}</Link></li>)}</ul>
              ) : <span className="f-meta">עוד לא בשימוש בתוכן.</span>}
            </div>
            {requests.includes(selected.id) && <SystemLine status="processing">הבקשה נרשמה ומחכה לתשובת {BRAIN_CLIENT.name}.</SystemLine>}
            <div className="f-rp-factpanel__actions">
              <Button variant="neutral" size="sm" onClick={() => setEditor({ fact: selected })}>ערוך</Button>
              <Button variant="neutral" size="sm" onClick={() => setEditor({ fact: selected, focusSource: true })}>{selected.source ? "שנה מקור" : "הוסף מקור"}</Button>
              {selected.verificationLabel !== "סומן כלא נכון" && selected.value && <Button variant="neutral" size="sm" onClick={() => markWrong(selected)}>סמן כלא נכון</Button>}
              <Button variant="secondary" size="sm" disabled={requests.includes(selected.id)} onClick={() => request(selected)}>{requests.includes(selected.id) ? "המידע התבקש" : "בקש מידע מהלקוח"}</Button>
            </div>
          </div>
        </aside>
      )}

      {editor && (
        <FactEditor
          key={editor.fact?.id ?? "new"}
          open
          fact={editor.fact}
          sectionLabel={section.label}
          now={now}
          focusSource={editor.focusSource}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
