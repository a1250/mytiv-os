import type { IntegrationStatus, SkillsStatus } from '@/lib/marketing/contract-rules/c9-c14';
import { UNKNOWN_VALUE } from '@/lib/marketing/view';

const CLASS_LABEL: Record<string, string> = { A: 'A · API מאומת', B: 'B · אפשרי, דורש אימות', C: 'C · ידני', D: 'D · פעולת דפדפן', E: 'E · יצוא/ייבוא' };

/**
 * M8 Integrations (T-10.3 · MKT-INT01): from C10 — class A–E, status, verified_at/by. The contract carries
 * verification metadata only (no credential field exists), so no secret can be shown.
 */
export function IntegrationsView({ integrations }: { integrations: IntegrationStatus | null }) {
  if (!integrations) return <p className="bg-card border-border rounded-xl border p-6">טרם יובא מצב האינטגרציות.</p>;
  return <section className="space-y-3">
    <p className="text-muted-foreground text-xs">נכון ל־{integrations.asOf.slice(0, 10)} · מקור {integrations.sourceRevision}</p>
    <table className="w-full text-sm [&_th]:px-2 [&_td]:px-2"><thead><tr className="text-muted-foreground text-xs"><th className="text-start">אינטגרציה</th><th className="text-start">סיווג</th><th className="text-start">מצב</th><th className="text-start">אומת</th></tr></thead>
      <tbody>{integrations.integrations.map((i) => <tr key={i.id} className="border-border border-t">
        <td className="py-2">{i.name} <span className="text-muted-foreground text-xs" dir="ltr">({i.id})</span></td><td>{CLASS_LABEL[i.class]}</td>
        <td>{i.status === 'verified' ? 'מאומת' : 'לא מאומת'}</td>
        <td>{i.verified_at && i.verified_by ? `${i.verified_at.slice(0, 10)} · ${i.verified_by}` : UNKNOWN_VALUE}</td>
      </tr>)}</tbody></table>
  </section>;
}

/**
 * M10 Skills Lab (T-10.3 · MKT-F16): read-only from C11 — lifecycle status, golden examples, last replay
 * score. There is deliberately no promote control: promotion happens only in the engine, by the owner.
 */
export function SkillsView({ skills }: { skills: SkillsStatus | null }) {
  if (!skills) return <p className="bg-card border-border rounded-xl border p-6">טרם יובא מצב המיומנויות.</p>;
  return <section className="space-y-3">
    <p className="text-muted-foreground text-xs">נכון ל־{skills.asOf.slice(0, 10)} · קידום מיומנות נעשה רק במנוע, בהחלטה מפורשת של הבעלים.</p>
    {skills.skills.length === 0 ? <p>אין מיומנויות רשומות.</p> :
      <table className="w-full text-sm [&_th]:px-2 [&_td]:px-2"><thead><tr className="text-muted-foreground text-xs"><th className="text-start">מיומנות</th><th className="text-start">שלב</th><th className="text-start">דוגמאות זהב</th><th className="text-start">ציון הרצה חוזרת</th></tr></thead>
        <tbody>{skills.skills.map((s) => <tr key={s.skill} className="border-border border-t">
          <td className="py-2" dir="ltr">{s.skill}</td><td dir="ltr">{s.status}</td><td className="tabular-nums">{s.golden_count}</td>
          <td className="tabular-nums">{s.last_replay_score === null ? UNKNOWN_VALUE : s.last_replay_score}</td>
        </tr>)}</tbody></table>}
  </section>;
}
