"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { BusinessSettings } from "@/lib/focus/contracts/settings";
import { AI_CAPABILITIES, AI_CHECK_MS, AI_PROVIDERS, BRAND_KITS, BUSINESS, LANGUAGES, SETTINGS_NAV, TIME_ZONES } from "@/lib/focus/fixtures/settings";
import { fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { jobStatus } from "@/lib/focus/state/jobs";
import { LeaveDialog, useLeaveGuard } from "@/components/focus/patterns/comms/leave-guard";
import { SettingsFrame, SettingsNav } from "@/components/focus/patterns/comms/settings";
import { PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { Checkbox, SelectField, TextField } from "@/components/focus/ui/field";
import { Bdi } from "@/components/focus/ui/misc";
import { PlannedTag, SystemLine } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Business & studio settings (handoff H14): real labelled controls with help and validation (name, language, time
 * zone, brand colour with a contrast check, AI capabilities), "שמור" with a toast + undo, unsaved changes guarded
 * before leaving. Logo upload is planned; the AI connection check runs as a job.
 */
type Errors = Partial<Record<"name" | "brandColor", string>>;

const HEX = /^#[0-9a-fA-F]{6}$/;
function luminance(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
/** contrast of white text on the colour */
const contrastWithWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);

function validate(v: BusinessSettings): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "יש לכתוב את שם העסק.";
  else if (v.name.trim().length > 60) e.name = "עד 60 תווים.";
  if (!HEX.test(v.brandColor)) e.brandColor = "קוד צבע לא תקין. למשל: #5b45c9";
  else if (contrastWithWhite(v.brandColor) < 4.5) e.brandColor = `הצבע בהיר מדי לטקסט לבן: ניגודיות ${contrastWithWhite(v.brandColor).toFixed(1)} בלבד, ונדרש לפחות 4.5.`;
  return e;
}
const same = (a: BusinessSettings, b: BusinessSettings) => JSON.stringify(a) === JSON.stringify(b);

export default function CommsBusinessScreen() {
  const demo = useDemo();
  const toast = useToast();
  const { state } = demo;
  const [saved, setSaved] = useState<BusinessSettings>(BUSINESS);
  const [v, setV] = useState<BusinessSettings>(BUSINESS);
  const [errors, setErrors] = useState<Errors>({});
  const [kitId, setKitId] = useState(BRAND_KITS[0].clientId);
  const [checks, setChecks] = useState(0);
  const colorId = useId();
  const dirty = !same(v, saved);
  const guard = useLeaveGuard(dirty);

  const set = <K extends keyof BusinessSettings>(k: K, val: BusinessSettings[K]) => {
    setV((x) => ({ ...x, [k]: val }));
    if (k === "name" || k === "brandColor") setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const save = (): boolean => {
    const e = validate(v);
    setErrors(e);
    if (Object.keys(e).length) {
      toast.push({ kind: "error", title: "לא נשמר", detail: "יש שדות שצריך לתקן. הם מסומנים בטופס." });
      return false;
    }
    const prev = saved;
    const next = { ...v, name: v.name.trim() };
    setSaved(next);
    setV(next);
    toast.push({ title: "ההגדרות נשמרו", detail: "חלות מעכשיו על הצעות מחיר, דוחות ותוכן חדש.", undo: { onUndo: () => { setSaved(prev); setV(prev); } } });
    return true;
  };

  const checkJobId = `ai-check-${checks}`;
  const checkJob = state.jobs.find((j) => j.id === checkJobId);
  const check = checkJob && !checkJob.cancelledAt ? jobStatus(checkJob, state.clock) : null;
  const runCheck = () => {
    const fail = state.failNext;
    if (fail) demo.setFailNext(false);
    const n = checks + 1;
    setChecks(n);
    demo.startJob({ id: `ai-check-${n}`, kind: "reconnect", label: "בודק חיבור ל־AI", detail: "", durationMs: AI_CHECK_MS, outcome: fail ? "failure" : "success", href: R.settingsBusiness });
  };

  const kit = BRAND_KITS.find((k) => k.clientId === kitId) ?? BRAND_KITS[0];
  const colorErr = errors.brandColor;

  return (
    <div className="f-cm-spage">
      <SettingsFrame nav={<SettingsNav items={SETTINGS_NAV} current="business" />}>
        <PageHeader
          className="f-cm-settings__head"
          title="העסק, AI ו־Brand Kit"
          status={dirty ? "יש שינויים שלא נשמרו." : "כל השינויים נשמרו."}
          actions={
            <>
              {dirty && <Button variant="neutral" onClick={() => { setV(saved); setErrors({}); }}>בטל שינויים</Button>}
              <Button type="submit" form="cm-biz-form" variant="primary">שמור</Button>
            </>
          }
        />

        <form id="cm-biz-form" className="f-cm-biz" noValidate onSubmit={(e) => { e.preventDefault(); save(); }}>
          <section id="ai" className="f-cm-card" aria-labelledby="cm-ai-h">
            <h2 id="cm-ai-h" className="f-cm-card__title">AI</h2>
            <ul className="f-cm-providers">
              {AI_PROVIDERS.map((p) => (
                <li key={p.id} className="f-cm-provider">
                  <span className="f-cm-provider__top">
                    <b>{p.label}</b>
                    <span className={`f-cm-provider__state f-cm-provider__state--${p.status}`}><span aria-hidden>{p.status === "connected" ? "✓" : "!"}</span> {p.status === "connected" ? "מחובר" : "תקלה"}</span>
                  </span>
                  <span className="f-meta-sm">{p.detail}</span>
                </li>
              ))}
            </ul>
            <fieldset className="f-cm-fieldset">
              <legend className="f-cm-card__sub">יכולות פעילות</legend>
              {AI_CAPABILITIES.map((c) => c.available && c.key !== "autoSend" ? (
                <div key={c.key} className="f-cm-cap">
                  <Checkbox checked={v.ai[c.key]} onChange={(on) => set("ai", { ...v.ai, [c.key]: on })} aria-describedby={`cm-cap-${c.key}`} size="sm">{c.label}</Checkbox>
                  <span id={`cm-cap-${c.key}`} className="f-cm-cap__help">{c.help}</span>
                </div>
              ) : (
                <div key={c.key} className="f-cm-cap f-cm-cap--na">
                  <span className="f-cm-cap__na"><span aria-hidden>⊘</span> {c.label} · לא זמין במערכת</span>
                  <span className="f-cm-cap__help">{c.help}</span>
                </div>
              ))}
            </fieldset>
            <div className="f-cm-card__row">
              <Button variant="neutral" size="sm" onClick={runCheck} loading={check?.state === "running"} loadingLabel="בודק…">בדיקת חיבור</Button>
              <span role="status">
                {check?.state === "running" && <SystemLine status="processing">בודק חיבור לספקי ה־AI…</SystemLine>}
                {check?.state === "done" && <SystemLine status="done">החיבור תקין · נבדק {fmtTime(new Date(check.at).toISOString())}</SystemLine>}
                {check?.state === "failed" && <SystemLine status="failed">הבדיקה נכשלה. ההגדרות לא השתנו. נסה שוב.</SystemLine>}
              </span>
            </div>
            <label className="f-cm-demo">
              <input type="checkbox" checked={state.failNext} onChange={(e) => demo.setFailNext(e.target.checked)} />
              <span>דמו: הדמה כשל בבדיקה הבאה</span>
            </label>
          </section>

          <section id="business" className="f-cm-card" aria-labelledby="cm-biz-h">
            <h2 id="cm-biz-h" className="f-cm-card__title">העסק והסטודיו</h2>
            <TextField label="שם העסק" required value={v.name} onChange={(e) => set("name", e.target.value)} error={errors.name} help="מופיע בהצעות מחיר, בדוחות ובחתימת המייל." maxLength={80} />
            <div className="f-cm-card__pair">
              <SelectField label="שפה" value={v.language} onChange={(e) => set("language", e.target.value as BusinessSettings["language"])} options={LANGUAGES} help="שפת הממשק והטיוטות." />
              <SelectField label="אזור זמן" value={v.timeZone} onChange={(e) => set("timeZone", e.target.value)} options={TIME_ZONES} help={'קובע מה זה "היום" ושעות תזמון.'} />
            </div>
            <div className="f-field">
              <label htmlFor={colorId} className="f-field__label">צבע ראשי</label>
              <div className="f-cm-color">
                <input id={colorId} type="color" className="f-cm-color__swatch" value={HEX.test(v.brandColor) ? v.brandColor : "#000000"} onChange={(e) => set("brandColor", e.target.value)}
                  aria-describedby={colorErr ? `${colorId}-err` : `${colorId}-help`} aria-invalid={colorErr ? true : undefined} />
                <input type="text" dir="ltr" className="f-input f-input--sm f-cm-color__hex" value={v.brandColor} onChange={(e) => set("brandColor", e.target.value.trim())}
                  aria-label="קוד הצבע הראשי" aria-describedby={colorErr ? `${colorId}-err` : `${colorId}-help`} aria-invalid={colorErr ? true : undefined} maxLength={7} />
                {HEX.test(v.brandColor) && <span className="f-cm-color__sample" style={{ background: v.brandColor }} aria-hidden>Aa</span>}
              </div>
              {colorErr
                ? <span id={`${colorId}-err`} className="f-field__error" role="alert"><span aria-hidden>!</span>{colorErr}</span>
                : <span id={`${colorId}-help`} className="f-field__help">משמש בהצעות מחיר ובדוחות שמיוצאים. נבדק שטקסט לבן עליו קריא.</span>}
            </div>
            <div className="f-field">
              <span className="f-field__label">לוגו</span>
              <div className="f-cm-logo">
                <PlannedTag />
                <span>העלאת לוגו תהיה זמינה בקרוב. בינתיים מוצג שם העסק.</span>
              </div>
            </div>
          </section>

          <section id="brand-kit" className="f-cm-card" aria-labelledby="cm-kit-h">
            <div className="f-cm-card__titlerow">
              <h2 id="cm-kit-h" className="f-cm-card__title">Brand Kit · {kit.clientName}</h2>
              <SelectField label="החלף לקוח" labelClassName="f-sr" className="f-cm-kit__client" inputClassName="f-input--sm" value={kitId} onChange={(e) => setKitId(e.target.value)}
                options={BRAND_KITS.map((k) => ({ value: k.clientId, label: k.clientName }))} />
            </div>
            <ul className="f-cm-kit__colors" aria-label="צבעי המותג">
              {kit.colors.map((c) => (
                <li key={c.hex} className="f-cm-kit__color" title={`${c.name} · ${c.hex}`}>
                  <span className="f-cm-kit__sw" style={{ background: c.hex }} aria-hidden />
                  <span className="f-sr">{c.name} <Bdi>{c.hex}</Bdi></span>
                </li>
              ))}
            </ul>
            <dl className="f-cm-kit__rows">
              {kit.rows.map((r) => (
                <div key={r.label} className="f-cm-kit__row"><dt>{r.label}</dt><dd>{r.value}</dd></div>
              ))}
            </dl>
            <p className="f-meta-sm">{kit.note}</p>
            {kit.href && <Link href={kit.href} className="f-link f-hit f-cm-kit__edit">ערוך במוח העסק של {kit.clientName}</Link>}
          </section>
        </form>
      </SettingsFrame>

      <LeaveDialog
        open={!!guard.pendingHref} what="שינויים בהגדרות העסק וה־AI לא יישמרו."
        onStay={guard.stay} onLeave={guard.leave} onSaveAndLeave={() => { if (save()) guard.leave(); else guard.stay(); }}
      />
    </div>
  );
}
