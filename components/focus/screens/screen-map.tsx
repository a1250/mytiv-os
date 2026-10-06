"use client";

import Link, { useScopedHref } from "@/components/focus/ui/link";
import { useState } from "react";
import { MOBILE_TARGETS, SCREENS } from "@/lib/focus/screens";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button } from "@/components/focus/ui/button";
import { Chips } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";
import { R } from "@/lib/focus/routes";

/**
 * Prototype screen map (the handoff's "Mytiv OS - Index"): every frame → its product screen, its reference
 * (/focus/reference/<ID>) and, for mobile frames, the real screen at 390px inside a phone frame. Also the demo controls
 * (role, simulated failure, reset) used to walk the flows.
 */
const GROUPS = [
  { key: "D", title: "Desktop 1 · היום, אישורים ופרויקט" },
  { key: "E", title: "Desktop 2 · סטודיו התוכן וקמפיין" },
  { key: "F", title: "Desktop 3 · מכירות ועבודה" },
  { key: "G", title: "Desktop 4 · דוחות ובקרה" },
  { key: "H", title: "Desktop 5 · שאר המסכים" },
  { key: "W", title: "Desktop 6 · Mytiv Work" },
  { key: "M", title: "מובייל · מסכי ליבה" },
] as const;
const MODE = { app: "מסך באפליקציה", focus: "מצב פוקוס", mobile: "מובייל · 390px" } as const;

export function ScreenMap() {
  const demo = useDemo();
  const toast = useToast();
  const scoped = useScopedHref();
  const [group, setGroup] = useState<(typeof GROUPS)[number]["key"]>("D");
  const [phone, setPhone] = useState<string | null>(null);
  const g = GROUPS.find((x) => x.key === group)!;
  return (
    <Page className="f-smap">
      <PageHeader eyebrow="אב טיפוס · נתוני הדגמה" title="מפת מסכים" size="page"
        status={`${SCREENS.length} המסכים של כיוון "פוקוס". כל מסך בנוי מרכיבים ומנתוני דוגמה; שום דבר לא נשלח לשרת.`} />
      <section className="f-panel f-smap__demo" aria-labelledby="demo-h">
        <h2 id="demo-h" className="f-smap__h">בקרות הדמו</h2>
        <div className="f-smap__controls">
          <label className="f-smap__ctl">
            <span>תפקיד</span>
            <select className="f-input f-input--sm" value={demo.state.role} onChange={(e) => demo.setRole(e.target.value as typeof demo.state.role)}>
              <option value="owner">בעלים (רון)</option><option value="admin">מנהל</option><option value="member">חבר צוות</option><option value="viewer">צופה</option>
            </select>
          </label>
          <label className="f-smap__ctl f-smap__ctl--check">
            <input type="checkbox" checked={demo.state.failNext} onChange={(e) => demo.setFailNext(e.target.checked)} />
            <span>הפעולה החיצונית הבאה תיכשל (Gmail / Meta / ClickUp)</span>
          </label>
          <Button variant="neutral" size="sm" onClick={() => {
            demo.reset();
            try { Object.keys(sessionStorage).filter((k) => k.startsWith("mytiv-focus")).forEach((k) => sessionStorage.removeItem(k)); localStorage.removeItem("mytiv-focus-timer-v1"); } catch { /* storage blocked */ }
            toast.push({ title: "נתוני הדמו אופסו", detail: "כל ההחלטות, המשימות, הלידים והטיימר חזרו למצב ההתחלתי." });
            setTimeout(() => window.location.reload(), 600);
          }}>אפס נתוני דמו</Button>
        </div>
      </section>
      <Chips label="קבוצת מסכים" value={group} onChange={(k) => { setGroup(k); setPhone(null); }} items={GROUPS.map((x) => ({ key: x.key, label: x.title.split(" · ")[0], count: SCREENS.filter((s) => s.id.startsWith(x.key)).length }))} />
      <section aria-labelledby="grp-h">
        <h2 id="grp-h" className="f-smap__h">{g.title}</h2>
        <ul className="f-smap__grid">
          {SCREENS.filter((s) => s.id.startsWith(g.key)).map((s) => {
            const targets = MOBILE_TARGETS[s.id];
            return (
              <li key={s.id} className="f-smap__card">
                <div className="f-smap__top"><span className="f-smap__id">{s.id}</span><span className="f-meta-sm">{MODE[s.mode]}</span></div>
                <b className="f-smap__t">{s.title}</b>
                {s.subtitle && <span className="f-meta-sm">{s.subtitle}</span>}
                <div className="f-smap__links">
                  <Link href={targets ? targets[0] : s.route} className="f-btn f-btn--secondary f-btn--sm">פתח את המסך</Link>
                  <Link href={R.reference(s.id)} className="f-link f-hit">Reference</Link>
                  {targets && <button type="button" className="f-link f-hit" aria-expanded={phone === s.id} onClick={() => setPhone(phone === s.id ? null : s.id)}>{phone === s.id ? "סגור טלפון" : "תצוגת טלפון"}</button>}
                </div>
                {phone === s.id && targets && (
                  <div className="f-smap__phones">
                    {targets.map((t) => (
                      <div key={t} className="f-phone">
                        <div className="f-phone__status" aria-hidden><span>8:10</span><span className="f-phone__notch" /><span>100%</span></div>
                        <iframe className="f-phone__screen" src={scoped(t)} title={`${s.title} · תצוגת טלפון`} />
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </Page>
  );
}
