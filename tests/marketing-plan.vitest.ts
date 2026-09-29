import { expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlanView } from '../components/marketing/plan';
import { completionLabel, evidenceStateLabel, isoWeekRange, monthRange, taskStatusLabel, trackPosition } from '../lib/marketing/view';
import { validateArtifact } from '../lib/marketing/validate-artifact';
import { BINDING, validOf } from './marketing-vectors';

// T-4.6 Plan & Workboard + T-4.9 Timeline (MKT-F05 view, F07, F08, F17, F18) — static render from canonical vectors.
const task = (over: Record<string, unknown>) => ({ ...(validOf('C7').tasks as Record<string, unknown>[])[0], ...over });
const board = (tasks: Record<string, unknown>[]) => validateArtifact('C7', { ...validOf('C7'), tasks }, BINDING);
const monthly = (over: Record<string, unknown> = {}) => validateArtifact('C14', { ...validOf('C14'), month: '2026-01', ...over }, BINDING);
const weekly = validateArtifact('C8', { ...validOf('C8'), week: '2026-W03', parent: '2026-01' }, BINDING);
const render = (props: Partial<Parameters<typeof PlanView>[0]>) => renderToStaticMarkup(createElement(PlanView, { monthly: null, weekly: null, board: null, ...props }));
const row = (h: string, attr: string, id: string) => {
  const i = h.indexOf(`${attr}="${id}"`);
  const next = h.indexOf(`${attr}="`, i + 1);
  return attr === 'data-task-id' ? h.slice(i, h.indexOf('</tr>', i)) : h.slice(i, next === -1 ? h.indexOf('C7) אינו כולל', i) : next);
};

test('nothing imported → explicit empty states, no timeline', () => {
  const h = render({});
  for (const t of ['טרם יובאה תוכנית חודשית.', 'טרם יובאה תוכנית שבועית.', 'טרם יובא לוח עבודה.', 'ציר הזמן נבנה מהתוכנית החודשית — טרם יובאה.']) expect(h).toContain(t);
});

test('monthly plan: objectives with provenance; approvalRef is shown as a reference that authorizes nothing (F17, GOV05)', () => {
  const h = render({ monthly: monthly() });
  const m = validOf('C14') as { objectives: { text: string; approvalRef: string }[] };
  expect(h).toContain(m.objectives[0].text);
  expect(h).toContain('הפניה בלבד — אינה מאשרת דבר');
  expect(h).toContain(m.objectives[0].approvalRef);
});

test('workboard: engine status, owner, due or "no date", DoD, blockers, stale apart from blocked, four-state completion (F05, F07, F08)', () => {
  const b = board([
    task({ task_id: 't-1', status: 'scheduled', owner: 'operator', due: '2026-01-20', dod: ['post live', 'link logged'], blockers: [], stale: true }),
    task({ task_id: 't-2', status: 'in_progress', owner: null, due: null, blockers: ['waiting for photos'], stale: false }),
  ]);
  const h = render({ board: b });
  const t1 = row(h, 'data-task-id', 't-1'), t2 = row(h, 'data-task-id', 't-2');
  expect(t1).toContain(taskStatusLabel('scheduled'));
  expect(t1).toContain('לא עודכן זמן רב (stale)');
  expect(t1).toContain('post live');
  expect(t1).toContain('2026-01-20');
  expect(t1).toContain(completionLabel('status_changed'));
  expect(t1).toContain(evidenceStateLabel('none'));
  expect(t2).toContain('ללא אחראי');
  expect(t2).toContain('אין תאריך');
  expect(t2).toContain('waiting for photos');
  expect(t2).not.toContain('stale');
  expect(h).toContain('חסומות: 1 · לא עודכנו זמן רב: 1');
});

test('timeline: tasks at their due date inside the month; missing dates shown as missing; no dependencies drawn (F18)', () => {
  const b = board([task({ task_id: 't-1', due: '2026-01-16' }), task({ task_id: 't-2', due: null })]);
  const h = render({ monthly: monthly(), weekly, board: b });
  const t1 = row(h, 'data-timeline-task', 't-1'), t2 = row(h, 'data-timeline-task', 't-2');
  expect(t1).toContain('left:50%'); // 16 Jan 12:00 UTC = 15.5 of 31 days
  expect(t2).toContain('אין תאריך');
  expect(h).toContain('C7) אינו כולל תלויות, והן לעולם אינן מוסקות');
});

test('date helpers: month and ISO-week ranges, clamped track positions', () => {
  expect(monthRange('2026-02')).toEqual([Date.UTC(2026, 1, 1), Date.UTC(2026, 2, 1)]);
  expect(monthRange('2026-13')).toBeNull();
  expect(isoWeekRange('2026-W03')).toEqual([Date.UTC(2026, 0, 12), Date.UTC(2026, 0, 19)]); // Monday 12 Jan 2026
  expect(isoWeekRange('2026-W01')![0]).toBe(Date.UTC(2025, 11, 29)); // ISO week 1 starts in the previous year
  expect(isoWeekRange('2020-W53')![0]).toBe(Date.UTC(2020, 11, 28));
  expect(isoWeekRange('week 3')).toBeNull();
  const jan = monthRange('2026-01')!;
  expect(trackPosition(null, jan)).toBeNull();
  expect(trackPosition('2025-12-01', jan)).toBe(0);
  expect(trackPosition('2026-03-01', jan)).toBe(100);
  expect(trackPosition('2026-01-01T00:00:00Z', jan)).toBe(0);
});
