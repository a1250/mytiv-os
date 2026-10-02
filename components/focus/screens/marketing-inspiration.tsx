"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { InspirationItem, Moodboard } from "@/lib/focus/contracts/marketing";
import { INSPIRATION, INSPIRATION_FILTERS, INSPIRATION_NOTE, MOODBOARDS } from "@/lib/focus/fixtures/marketing";
import { CLIENTS } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { PhotoPlaceholder, PlannedAction, Swatch } from "@/components/focus/patterns/marketing/marketing-parts";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Dialog } from "@/components/focus/ui/dialog";
import { EmptyState } from "@/components/focus/ui/feedback";
import { Checkbox, SelectField, TextField } from "@/components/focus/ui/field";
import { Chips } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Inspiration & moodboards (handoff H6): filter by client or tag, pick a moodboard (and optionally show only its
 * items), save a link as a new card (validated form, undo), create a moodboard (undo). Image upload has no backend
 * yet — it is labelled planned and never pretends to work.
 */
const clientName = (id: string | null) => (id ? Object.values(CLIENTS).find((c) => c.id === id)?.name ?? "—" : null);
const TAGS = [...new Set(INSPIRATION.flatMap((i) => i.tags))];

export default function MarketingInspirationScreen() {
  const toast = useToast();
  const [items, setItems] = useState<InspirationItem[]>(INSPIRATION);
  const [boards, setBoards] = useState<Moodboard[]>(MOODBOARDS);
  const [filter, setFilter] = useState("all");
  const [board, setBoard] = useState<string | null>(MOODBOARDS[0]?.id ?? null);
  const [onlyBoard, setOnlyBoard] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);

  const f = INSPIRATION_FILTERS.find((x) => x.key === filter)!;
  const match = (i: InspirationItem, flt = f) => (flt.clientId ? i.clientId === flt.clientId : flt.tag ? i.tags.includes(flt.tag) : true);
  const selected = boards.find((b) => b.id === board) ?? null;
  const shown = items.filter((i) => match(i) && (!onlyBoard || !selected || i.boardIds.includes(selected.id)));

  const addLink = (item: InspirationItem) => {
    setItems((xs) => [item, ...xs]);
    setFilter("all");
    toast.push({ title: "הקישור נשמר כהשראה", detail: item.title, undo: { onUndo: () => setItems((xs) => xs.filter((x) => x.id !== item.id)) } });
  };
  const addBoard = (b: Moodboard) => {
    const prev = board;
    setBoards((xs) => [...xs, b]);
    setBoard(b.id);
    toast.push({ title: `נוצר מודבורד "${b.title}"`, detail: "אפשר להוסיף אליו פריטים מכל כרטיס.", undo: { onUndo: () => { setBoards((xs) => xs.filter((x) => x.id !== b.id)); setBoard(prev); } } });
  };
  const toggleInBoard = (i: InspirationItem) => {
    if (!selected) return;
    const has = i.boardIds.includes(selected.id);
    const next = { ...i, boardIds: has ? i.boardIds.filter((x) => x !== selected.id) : [...i.boardIds, selected.id] };
    setItems((xs) => xs.map((x) => (x.id === i.id ? next : x)));
    toast.push({ title: has ? `הוסר מ"${selected.title}"` : `נוסף ל"${selected.title}"`, detail: i.title, undo: { onUndo: () => setItems((xs) => xs.map((x) => (x.id === i.id ? i : x))) } });
  };

  return (
    <Page className="f-mk-insp">
      <div className="f-mk-insp__grid">
        <div className="f-mk-insp__main">
          <PageHeader
            size="entity"
            className="f-mk-insp__head"
            eyebrow={<nav aria-label="מיקום" className="f-mk-crumb"><Link href={R.marketingPlan}>שיווק ותוכן</Link> › <span>השראה</span></nav>}
            title="השראה"
            actions={<>
              <Button variant="neutral" onClick={() => setLinkOpen(true)}>+ קישור</Button>
              <PlannedAction className="f-mk-planned--pill">+ העלאת תמונה</PlannedAction>
            </>}
          />
          <Chips label="סינון השראה" value={filter} onChange={setFilter}
            items={INSPIRATION_FILTERS.map((x) => ({ key: x.key, label: x.label, count: x.counted ? items.filter((i) => match(i, x)).length : undefined }))} />
          {selected && onlyBoard && (
            <p className="f-mk-insp__scope" role="status">
              מציג רק את פריטי המודבורד &quot;{selected.title}&quot;. <button type="button" className="f-link f-hit" onClick={() => setOnlyBoard(false)}>הצג הכול</button>
            </p>
          )}
          {shown.length === 0 ? (
            <EmptyState title="אין פריטים בסינון הזה" hint="נסו סינון אחר, או שמרו קישור חדש." action={<Button variant="secondary" size="sm" onClick={() => setFilter("all")}>הצג הכול</Button>} />
          ) : (
            <ul className="f-mk-insp__cards" aria-label="פריטי השראה">
              {shown.map((i) => {
                const inBoard = selected ? i.boardIds.includes(selected.id) : false;
                const meta = [clientName(i.clientId), ...i.tags].filter(Boolean).join(" · ") || (i.kind === "link" ? "קישור חיצוני" : "");
                return (
                  <li key={i.id} className="f-mk-icard">
                    <PhotoPlaceholder label={i.placeholder} height={i.height} />
                    <div className="f-mk-icard__body">
                      {i.url
                        ? <a href={i.url} target="_blank" rel="noopener noreferrer" className="f-mk-icard__title f-mk-icard__title--link">{i.title}<span className="f-sr"> (נפתח בלשונית חדשה)</span></a>
                        : <span className="f-mk-icard__title">{i.title}</span>}
                      <span className="f-mk-icard__meta">{meta}</span>
                    </div>
                    {selected && (
                      <button type="button" className="f-mk-icard__pin f-hit" aria-pressed={inBoard} onClick={() => toggleInBoard(i)} aria-label={`${inBoard ? "הסר מ" : "הוסף ל"}מודבורד ${selected.title}: ${i.title}`}>
                        <span aria-hidden>{inBoard ? "✓" : "+"}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="f-mk-insp__aside" aria-labelledby="boards-h">
          <h2 id="boards-h" className="f-mk-insp__h">מודבורדים</h2>
          <ul className="f-mk-boards">
            {boards.map((b) => {
              const n = items.filter((i) => i.boardIds.includes(b.id)).length;
              const on = b.id === board;
              return (
                <li key={b.id} className={cx("f-mk-board", on && "f-mk-board--on")}>
                  <button type="button" className="f-mk-board__pick" aria-pressed={on} onClick={() => setBoard(on ? null : b.id)}>
                    <span className={cx("f-mk-board__cover", b.cover[0]?.kind === "color" && "f-mk-board__cover--hero")} aria-hidden>
                      {b.cover.length ? b.cover.map((s, k) => <Swatch key={k} swatch={s} />) : <span className="f-mk-board__empty">ריק</span>}
                    </span>
                    <span className="f-mk-board__row">
                      <b>{b.title}</b>
                      <span className="f-meta-sm">{[clientName(b.clientId), `${n} פריטים`].filter(Boolean).join(" · ")}</span>
                    </span>
                  </button>
                  {b.usedIn && <Link href={b.usedIn.href} className="f-mk-board__used">{b.usedIn.label}</Link>}
                  {on && (
                    <Checkbox checked={onlyBoard} onChange={setOnlyBoard} size="sm" className="f-mk-board__only">הצג רק את פריטי המודבורד</Checkbox>
                  )}
                </li>
              );
            })}
          </ul>
          <Button variant="secondary" block onClick={() => setBoardOpen(true)}>+ מודבורד חדש</Button>
          <p className="f-mk-insp__note">{INSPIRATION_NOTE}</p>
        </aside>
      </div>

      <Dialog className="f-mk-dialog" open={linkOpen} onClose={() => setLinkOpen(false)} labelledBy="link-h" initialFocus="input">
        <LinkForm boards={boards} onCancel={() => setLinkOpen(false)} onSave={(it) => { addLink(it); setLinkOpen(false); }} />
      </Dialog>
      <Dialog className="f-mk-dialog" open={boardOpen} onClose={() => setBoardOpen(false)} labelledBy="board-h" initialFocus="input">
        <BoardForm onCancel={() => setBoardOpen(false)} onSave={(b) => { addBoard(b); setBoardOpen(false); }} />
      </Dialog>
    </Page>
  );
}

function LinkForm({ boards, onSave, onCancel }: { boards: Moodboard[]; onSave: (i: InspirationItem) => void; onCancel: () => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [tag, setTag] = useState("");
  const [boardId, setBoardId] = useState("");
  const [errors, setErrors] = useState<{ url?: string; title?: string }>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    let parsed: URL | null = null;
    try { parsed = new URL(url.trim()); } catch { parsed = null; }
    if (!url.trim()) next.url = "יש להדביק קישור.";
    else if (!parsed || !/^https?:$/.test(parsed.protocol)) next.url = "הקישור צריך להתחיל ב־https://";
    if (!title.trim()) next.title = "יש לתת שם קצר לפריט.";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({
      id: `i-link-${Date.now()}`, kind: "link", placeholder: "קישור", title: title.trim(), clientId: client || null, tags: tag ? [tag] : [],
      height: 150, url: parsed!.toString(), boardIds: boardId ? [boardId] : [], addedAt: new Date().toISOString(),
    });
  };
  return (
    <form className="f-mk-form" onSubmit={submit} noValidate>
      <h2 id="link-h" className="f-mk-form__h">שמירת קישור כהשראה</h2>
      <TextField label="קישור" type="url" dir="ltr" inputMode="url" required value={url} error={errors.url} help="פוסט, אתר או תמונה. נשמר ככיוון חזותי בלבד."
        onChange={(e) => { setUrl(e.target.value); setErrors({ ...errors, url: undefined }); }} />
      <TextField label="שם" required value={title} error={errors.title} help="למשל: מסעדה בטוקיו · Instagram"
        onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: undefined }); }} />
      <div className="f-mk-form__row">
        <SelectField label="לקוח" note="(רשות)" value={client} onChange={(e) => setClient(e.target.value)} options={[{ value: "", label: "בלי לקוח" }, ...Object.values(CLIENTS).map((c) => ({ value: c.id, label: c.name }))]} />
        <SelectField label="תגית" note="(רשות)" value={tag} onChange={(e) => setTag(e.target.value)} options={[{ value: "", label: "בלי תגית" }, ...TAGS.map((t) => ({ value: t, label: t }))]} />
      </div>
      <SelectField label="מודבורד" note="(רשות)" value={boardId} onChange={(e) => setBoardId(e.target.value)} options={[{ value: "", label: "לא להוסיף למודבורד" }, ...boards.map((b) => ({ value: b.id, label: b.title }))]} />
      <div className="f-mk-form__actions">
        <Button type="submit">שמור קישור</Button>
        <Button variant="neutral" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  );
}

function BoardForm({ onSave, onCancel }: { onSave: (b: Moodboard) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("יש לתת שם למודבורד."); return; }
    onSave({ id: `b-${Date.now()}`, title: title.trim(), clientId: client || null, cover: [] });
  };
  return (
    <form className="f-mk-form" onSubmit={submit} noValidate>
      <h2 id="board-h" className="f-mk-form__h">מודבורד חדש</h2>
      <TextField label="שם המודבורד" required value={title} error={error} help="למשל: ערבי חורף" onChange={(e) => { setTitle(e.target.value); setError(null); }} />
      <SelectField label="לקוח" note="(רשות)" value={client} onChange={(e) => setClient(e.target.value)} options={[{ value: "", label: "בלי לקוח" }, ...Object.values(CLIENTS).map((c) => ({ value: c.id, label: c.name }))]} />
      <div className="f-mk-form__actions">
        <Button type="submit">צור מודבורד</Button>
        <Button variant="neutral" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  );
}
