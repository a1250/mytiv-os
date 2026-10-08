"use client";

import Link, { useFocusRouter } from "@/components/focus/ui/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { AssetAvailability, ContentRequirement, CoverOption, PriorityPlan } from "@/lib/focus/contracts/plan";
import { ASSET_SUMMARIES, PLAN_OCTOBER, PLAN_TODAY, REQUIREMENTS } from "@/lib/focus/fixtures/plan";
import { R } from "@/lib/focus/routes";
import { unscopedPath } from "@/lib/focus/scope";
import { countSlots, requirementSlots, requirementWord } from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { cx } from "@/components/focus/ui/cx";
import { useToast } from "@/components/focus/ui/toast";
import { useFocusScope } from "@/components/focus/shell/scope";
import { CoverOptions, COVER_WORD } from "@/components/focus/patterns/plan/cover-options";
import { ClientRequestSheet } from "@/components/focus/patterns/plan/client-request-sheet";
import { RequirementSpec, RequirementStatusWord } from "@/components/focus/patterns/plan/requirements";
import { Num, PlanFrame, WeekNote, usePlanParams } from "@/components/focus/patterns/plan/plan-parts";
import { dayLabel, priorityOf } from "@/components/focus/patterns/plan/plan-view";
import { usePlan, type PlanApi } from "@/components/focus/patterns/plan/use-plan";

/**
 * Asset Map (design package #s6): what each move needs against what exists, every gap in plain words, and five ways to
 * cover a requirement. "Awaiting approval" (exists, not usable yet) and "missing" (does not exist) are never the same
 * word. The library here is demo data — the Google Drive index arrives in V2.
 */
export default function PlanAssetsScreen() {
  return <Suspense fallback={null}><Assets /></Suspense>;
}

const SLOT_WORD: Record<AssetAvailability, string> = { approved: "מאושר", awaiting_approval: "ממתין לאישור", missing: "חסר" };

function Assets() {
  const plan = usePlan();
  const { period, week, sp } = usePlanParams();
  const router = useFocusRouter();
  const path = unscopedPath(useFocusScope().base, usePathname());
  const search = useSearchParams();
  const [sheet, setSheet] = useState(false);
  if (period.month !== "2026-10") return <PlanFrame view="assets"><p className="f-pl-meta">לתוכנית של נובמבר עוד אין דרישות תוכן. <Link className="f-pl-link" href={`${R.plan}?period=2026-11`}>למה מקדמים בנובמבר ‹</Link></p></PlanFrame>;
  const selId = search.get("req") ?? "req-events-testimonial";
  const sel = REQUIREMENTS.find((r) => r.id === selId) ?? REQUIREMENTS[1];
  const select = (id: string) => {
    const q = new URLSearchParams(sp.toString());
    q.set("req", id);
    router.replace(`${path}?${q.toString()}`);
    if (window.matchMedia("(max-width: 767px)").matches) setSheet(true);
  };
  const total = ASSET_SUMMARIES.reduce((s, a) => s + a.total, 0);
  const controls = <span className="f-pl-meta">ספרייה: נתוני הדגמה · {total} נכסים · Google Drive יחובר בהמשך; העלאה לדרישה זמינה בפאנל</span>;
  return (
    <PlanFrame view="assets" controls={controls}>
      {week && <WeekNote>מוצגות דרישות שהיעד שלהן השבוע או לפני כן.</WeekNote>}
      <div className="f-pl-assets">
        <div className="f-pl-assets__list">
          {PLAN_OCTOBER.priorities.map((pp) => <PriorityAssets key={pp.priorityId} pp={pp} plan={plan} selId={sel.id} onSelect={select} week={week} />)}
        </div>
        <aside className="f-pl-assets__panel" aria-label="דרישת תוכן נבחרת">
          <RequirementPanel req={sel} plan={plan} />
        </aside>
      </div>
      <Dialog open={sheet} onClose={() => setSheet(false)} variant="drawer" label={`דרישת תוכן · ${sel.title}`} className="f-pl-panel f-pl-panel--change f-pl-sheetonly">
        <div className="f-pl-panel__body"><RequirementPanel req={sel} plan={plan} onDone={() => setSheet(false)} /></div>
      </Dialog>
    </PlanFrame>
  );
}

function gapLine(pp: PriorityPlan, plan: PlanApi) {
  const s = ASSET_SUMMARIES.find((a) => a.priorityId === pp.priorityId)!;
  const reqs = REQUIREMENTS.filter((r) => r.priorityId === pp.priorityId);
  const awaiting = reqs.flatMap((r) => { const c = countSlots(requirementSlots(r, plan.overlay, plan.f.builders)); return c.awaiting_approval && !c.missing ? [`${c.awaiting_approval} ${r.gapLabel}`] : []; });
  const open = reqs.filter((r) => countSlots(requirementSlots(r, plan.overlay, plan.f.builders)).missing > 0);
  const missing = open.filter((r) => plan.overlay.requirements[r.id]?.choice !== "request").map((r) => `${r.gapLabel}${r.neededByDay ? ` לפני ${dayLabel(r.neededByDay)}` : ""}`);
  const requested = open.filter((r) => plan.overlay.requirements[r.id]?.choice === "request").map((r) => `${r.gapLabel}${r.neededByDay ? ` עד ${dayLabel(r.neededByDay)}` : ""}`);
  return { s, awaiting, missing, requested, reqs };
}

function PriorityAssets({ pp, plan, selId, onSelect, week }: { pp: PriorityPlan; plan: PlanApi; selId: string; onSelect: (id: string) => void; week: boolean }) {
  const p = priorityOf(pp.priorityId);
  const { s, awaiting, missing, requested, reqs } = gapLine(pp, plan);
  // open when a gap is due soon (within 10 days) or something waits for approval; otherwise one line
  const soon = reqs.some((r) => countSlots(requirementSlots(r, plan.overlay, plan.f.builders)).missing > 0 && r.neededByDay != null && r.neededByDay - PLAN_TODAY <= 10);
  const [open, setOpen] = useState(soon || awaiting.length > 0 || reqs.some((r) => r.id === selId));
  const shown = week ? reqs.filter((r) => r.neededByDay == null || r.neededByDay <= 10 || countSlots(requirementSlots(r, plan.overlay, plan.f.builders)).awaiting_approval > 0) : reqs;
  const sentence = (
    <>
      <Num>{s.total}</Num> נכסים, <Num>{s.active}</Num> פעילים{s.scheduled ? <>, <Num>{s.scheduled}</Num> מתוזמנים</> : null}.
      {awaiting.length > 0 && <> <b>ממתין לאישור:</b> {awaiting.join(", ")}.</>}
      {missing.length > 0 && <> <b>חסר (לא קיים):</b> {missing.join(", ")}.</>}
      {requested.length > 0 && <> <b>ממתין ללקוח:</b> {requested.join(", ")}.</>}
      {s.fatigue && <> <b>מעייף:</b> {s.fatigue}</>}
      {s.rightsNote && <span className="f-pl-meta"> · {s.rightsNote}</span>}
    </>
  );
  if (!open) {
    return (
      <section className="f-pl-acard f-pl-acard--collapsed">
        <button type="button" className="f-pl-acard__collapsed f-hit" aria-expanded={false} onClick={() => setOpen(true)}>
          <b className="f-pl-acard__cname">{p.name}</b><span className="f-pl-acard__csent">{sentence}</span><span className="f-pl-map__chev" aria-hidden>‹</span>
        </button>
      </section>
    );
  }
  return (
    <section className="f-pl-acard" aria-label={`נכסים · ${p.name}`}>
      <div className="f-pl-acard__head"><h2 className="f-pl-acard__name">{p.name}</h2><p className="f-pl-acard__sent">{sentence}</p></div>
      <ul className="f-pl-reqs" aria-label={`דרישות תוכן · ${p.name}`}>
        {shown.map((r) => <RequirementRow key={r.id} r={r} plan={plan} selected={r.id === selId} onSelect={() => onSelect(r.id)} />)}
      </ul>
    </section>
  );
}

function RequirementRow({ r, plan, selected, onSelect }: { r: ContentRequirement; plan: PlanApi; selected: boolean; onSelect: () => void }) {
  const slots = requirementSlots(r, plan.overlay, plan.f.builders);
  const w = requirementWord(r, slots);
  return (
    <li>
      <button type="button" className={cx("f-pl-req f-hit", selected && "f-pl-req--on")} aria-pressed={selected} onClick={onSelect}>
        <span className="f-pl-req__title"><b>{r.title}</b><span className="f-pl-meta">{r.forLabel}</span></span>
        <span className="f-pl-req__due">{r.live ? <span className="f-pl-meta">פעיל</span> : r.neededByDay ? `עד ${dayLabel(r.neededByDay)}` : "—"}</span>
        <span className="f-pl-req__slots" aria-label={slots.map((s) => SLOT_WORD[s]).join(", ")}>
          {slots.map((s, i) => <span key={i} className={cx("f-pl-slot", `f-pl-slot--${s}`)} aria-hidden />)}
        </span>
        <span className={cx("f-pl-req__word", `f-pl-tone--${w.tone}`)}>{w.word}</span>
      </button>
    </li>
  );
}

function RequirementPanel({ req, plan, onDone }: { req: ContentRequirement; plan: PlanApi; onDone?: () => void }) {
  const toast = useToast();
  const [request, setRequest] = useState(false);
  const move = plan.moves.find((m) => m.id === req.moveId);
  const slots = requirementSlots(req, plan.overlay, plan.f.builders);
  const c = countSlots(slots);
  const chosen = plan.overlay.requirements[req.id];
  const choose = (choice: CoverOption, extra: { assetId?: string; fileName?: string } = {}) => {
    if (choice === "request") { setRequest(true); return; }
    plan.coverRequirement(req.id, choice, { assetId: extra.assetId });
    toast.push({ title: `${COVER_WORD[choice]} · ${req.title}`, detail: "הנכס ממתין לאישור לפני שימוש" });
    onDone?.();
  };
  const covered = c.missing === 0 && c.awaiting_approval === 0;
  return (
    <div className="f-pl-rpanel">
      <div className="f-pl-rpanel__head">
        <span className="f-pl-meta">דרישת תוכן · {move?.name ?? req.forLabel}{req.neededByDay ? ` · עד ${dayLabel(req.neededByDay)}` : ""}</span>
        <h2 className="f-pl-rpanel__title">{req.title}</h2>
        <RequirementStatusWord req={req} plan={plan} />
      </div>
      <RequirementSpec req={req} approverName={plan.approverName} />
      {req.creativeIds ? (
        <div className="f-pl-covered">
          <b>{c.awaiting_approval ? `${c.awaiting_approval} ממתינים לאישור · ${c.approved} מאושר` : "כל הקריאייטיבים מאושרים"}</b>
          <span className="f-pl-meta">הקריאייטיבים קיימים; האישור וההחלפה נעשים בתוך הבונה, בלי לצאת ממנו.</span>
          {move?.builderId && <Link className="f-pl-link" href={`${R.planBuilder(move.builderId)}#creative`}>פתח בבונה ‹</Link>}
        </div>
      ) : covered ? (
        <div className="f-pl-covered"><b>מאושר</b><span className="f-pl-meta">כל הנכסים מאושרים ובשימוש.</span></div>
      ) : (
        <>
          <CoverOptions req={req} chosen={chosen} today={plan.today} onChoose={choose} onClear={() => plan.clearRequirement(req.id)} />
          {chosen?.choice === "request" && <Button variant="secondary" onClick={() => setRequest(true)}>הבקשה ללקוח</Button>}
        </>
      )}
      <ClientRequestSheet req={request ? req : null} plan={plan} open={request} onClose={() => { setRequest(false); onDone?.(); }} />
    </div>
  );
}
