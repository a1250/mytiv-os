"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { DiscoveryContact, DiscoveryResult, Lead } from "@/lib/focus/contracts/sales";
import { DISCOVERY, DISCOVERY_NOTE } from "@/lib/focus/fixtures/sales";
import { fmtAgo, fmtDayMonth, fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { jobStatus, type JobStatus } from "@/lib/focus/state/jobs";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { DiscoveryCards, DiscoverySkeleton, DiscoveryTable, type DiscoveryRow } from "@/components/focus/patterns/sales/discovery-parts";
import { addLead, removeLead, setDiscovery, useSales } from "@/components/focus/patterns/sales/sales-store";
import { useDemo, useTicker } from "@/components/focus/shell/demo-store";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { Banner, EmptyState } from "@/components/focus/ui/feedback";
import { SelectField, TextField } from "@/components/focus/ui/field";
import { SystemLine } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Lead discovery (handoff H8). A search is a background job: it runs (the user may leave; a notification arrives),
 * and results appear only when it settled. Adding a result as a lead needs an explicit click (undo); a business that
 * is already a lead cannot be added again and says why. "מצא איש קשר" is its own short job; a guess stays "משוער".
 */
const SEARCH_JOB = "lead-discovery";
const label = (v: string) => DISCOVERY.categories.find((c) => c.value === v)?.label ?? v;

export default function SalesDiscoveryScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { now, viewer, state } = demo;
  const sales = useSales();
  const [query, setQuery] = useState(sales.discovery?.query ?? DISCOVERY.last.query);
  const [category, setCategory] = useState(sales.discovery?.category ?? DISCOVERY.last.category);
  const [error, setError] = useState<string | null>(null);

  const job = state.jobs.find((j) => j.id === SEARCH_JOB);
  const contactJobs = state.jobs.filter((j) => j.id.startsWith("disc-contact-"));
  const anyRunning = [job, ...contactJobs].some((j) => j && jobStatus(j, state.clock).state === "running");
  const tick = useTicker(anyRunning, 400);
  const clock = Math.max(state.clock, anyRunning ? tick : 0);
  const status: JobStatus | null = job ? jobStatus(job, clock) : null;
  const search = sales.discovery ?? DISCOVERY.last;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { setError("כתוב מה לחפש, למשל ״מאפיות בחיפה עם אינסטגרם פעיל״."); return; }
    if (status?.state === "running") return;
    setDiscovery({ query: query.trim(), category });
    const fail = state.failNext;
    if (fail) demo.setFailNext(false);
    demo.startJob({
      id: SEARCH_JOB, kind: "ai_directions", label: "בודק עסקים לגילוי לידים", detail: query.trim(),
      durationMs: DISCOVERY.searchMs, outcome: fail ? "failure" : "success", href: R.discovery,
    });
  };

  const isLead = (r: DiscoveryResult): Lead | undefined =>
    sales.leads.find((l) => l.id === `disc-${r.id}` || (r.contact.kind === "existing" && l.id === r.contact.leadId));

  const contactOf = (r: DiscoveryResult): DiscoveryContact => {
    const cj = contactJobs.find((j) => j.id === `disc-contact-${r.id}`);
    return cj && r.guess && jobStatus(cj, clock).state === "done" ? r.guess : r.contact;
  };

  const add = (r: DiscoveryResult, contact: DiscoveryContact) => {
    const lead: Lead = {
      id: `disc-${r.id}`, name: r.name, company: r.meta, source: "גילוי לידים", stage: "new",
      value: { kind: "unknown", reason: "טרם הוערך" }, ownerId: viewer.id, next: { text: "אמת איש קשר", due: null },
      lastContact: null, createdAt: now, quality: { state: contact.kind === "found" ? "partial" : "unverified", label: contact.kind === "found" ? "חסר איש קשר" : "לא מאומת" }, href: null,
    };
    addLead(lead);
    toast.push({ title: `נוסף כליד: ${r.name}`, detail: "הפעולה הבאה: לאמת איש קשר.", undo: { onUndo: () => removeLead(lead.id) } });
  };

  const findContact = (r: DiscoveryResult) => demo.startJob({
    id: `disc-contact-${r.id}`, kind: "ai_directions", label: `בודק איש קשר ל${r.name}`, detail: "מקורות ציבוריים בלבד.",
    durationMs: DISCOVERY.contactMs, outcome: "success", href: R.discovery,
  });

  const action = (r: DiscoveryResult, contact: DiscoveryContact): ReactNode => {
    const lead = isLead(r);
    if (lead) {
      return <Button variant="link" size="sm" disabled disabledReason={lead.id.startsWith("disc-") ? "נוסף מהחיפוש הזה" : `ברשימה כ־${lead.name}`}><span aria-hidden>✓</span> כבר ליד</Button>;
    }
    const cj = contactJobs.find((j) => j.id === `disc-contact-${r.id}`);
    const cjs = cj ? jobStatus(cj, clock) : null;
    if (contact.kind === "none") {
      return cjs?.state === "running"
        ? <SystemLine status="processing">מחפש איש קשר…</SystemLine>
        : <Button variant="link" size="sm" onClick={() => findContact(r)}>מצא איש קשר</Button>;
    }
    return <Button variant="link" size="sm" onClick={() => add(r, contact)} aria-label={`הוסף את ${r.name} כליד`}>הוסף כליד</Button>;
  };

  const results = DISCOVERY.results.filter((r) => r.category === search.category);
  const rows: DiscoveryRow[] = results.map((r) => { const c = contactOf(r); return { r, contact: c, action: action(r, c) }; });

  const body = () => {
    if (status?.state === "running") return <DiscoverySkeleton />;
    if (status?.state === "failed") return <Banner kind="error" title="החיפוש נכשל." detail="לא נוסף דבר. אפשר לנסות שוב." action={<Button variant="neutral" size="sm" onClick={submit}>נסה שוב</Button>} />;
    if (status?.state === "cancelled") return <EmptyState glyph="⏸" title="החיפוש נעצר" hint="לא נוספו תוצאות. אפשר להפעיל אותו שוב." />;
    if (!rows.length) return <EmptyState title={`לא נמצאו עסקים ב״${label(search.category)}״`} hint="נסה ניסוח אחר או קטגוריה אחרת." />;
    return <><DiscoveryTable rows={rows} /><DiscoveryCards rows={rows} /></>;
  };

  return (
    <Page className="f-sl-page f-sl-disc">
      <PageHeader
        eyebrow={<span className="f-sl-crumb">מכירות <span aria-hidden>›</span> גילוי לידים</span>}
        title="גילוי לידים" size="entity"
        actions={<ButtonLink variant="outline" href={R.sales}>ללידים</ButtonLink>}
      />
      <form role="search" aria-label="חיפוש עסקים" className="f-sl-disc__form" onSubmit={submit} noValidate>
        <TextField label="מה לחפש" labelClassName="f-sr" className="f-sl-disc__q" inputClassName="f-sl-disc__qin" value={query} error={error}
          placeholder="למשל: בתי קפה בוטיק בתל אביב שמעלים תוכן לאינסטגרם" onChange={(e) => { setQuery(e.target.value); setError(null); }} maxLength={160} />
        <SelectField label="קטגוריה" labelClassName="f-sr" className="f-sl-disc__cat" inputClassName="f-sl-disc__catin" value={category}
          onChange={(e) => setCategory(e.target.value)} options={DISCOVERY.categories.map((c) => ({ value: c.value, label: `קטגוריה: ${c.label}` }))} />
        <Button type="submit" variant="primary" size="lg" loading={status?.state === "running"} loadingLabel="מחפש…">חפש</Button>
      </form>
      {status?.state === "running" ? (
        <Banner kind="processing" title={`מחפש ברקע · ״${search.query}״`} detail="אפשר לעזוב את המסך, נשלח התראה בסיום. בדרך כלל עד דקה."
          action={<Button variant="onaccent" size="sm" onClick={() => demo.cancelJob(SEARCH_JOB)}>עצור חיפוש</Button>} />
      ) : status?.state === "done" ? (
        <SystemLine status="done">החיפוש הסתיים {fmtAgo(new Date(status.at).toISOString(), new Date(clock).toISOString())} · {rows.length} תוצאות · ״{search.query}״</SystemLine>
      ) : !status ? (
        <span className="f-meta" role="status">חיפוש אחרון: {fmtDayMonth(DISCOVERY.last.ranAt)} {fmtTime(DISCOVERY.last.ranAt)} · {rows.length} תוצאות · ״{search.query}״</span>
      ) : null}
      <div aria-live="polite" aria-busy={status?.state === "running" || undefined}>{body()}</div>
      <p className="f-meta">{DISCOVERY_NOTE}</p>
    </Page>
  );
}
