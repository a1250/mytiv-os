import { describe, expect, test } from 'vitest';
import { TASKS } from '@/lib/focus/fixtures/work';
import { undoPatch, writesForPatch } from '@/lib/focus/adapters/work';

// The business-scope translation of a Focus edit into Mytiv Work writes: comments and logged time are their own
// append-only writes (0015); what has no backend is reported unsupported — refused, never faked.
const task = { ...TASKS[0], participantIds: [] };

describe('writesForPatch', () => {
  test('a comment becomes one append-only comment write (and no task patch)', () => {
    const r = writesForPatch(task, { addComment: { id: 'c1', authorId: 'u', at: '2026-10-06T10:00:00.000Z', text: 'שלום' } });
    expect(r).toEqual({ writes: [{ kind: 'comment', taskId: task.id, body: 'שלום' }], unsupported: [] });
  });
  test('logged time becomes a manual time write; out-of-range or negative time (an undo) is unsupported', () => {
    const r = writesForPatch(task, { logMinutes: 30 });
    expect(r.unsupported).toEqual([]);
    expect(r.writes).toEqual([expect.objectContaining({ kind: 'time', taskId: task.id, minutes: 30, source: 'manual' })]);
    for (const m of [0, -15, 1441, 2.5]) expect(writesForPatch(task, { logMinutes: m }).unsupported).toEqual(['logMinutes']);
  });
  test('the checklist is still not connected', () => {
    expect(writesForPatch(task, { addChecklistItem: { id: 'x', label: 'y' } }).unsupported).toEqual(['addChecklistItem']);
  });
  test('a field edit and a comment in one Focus action: the patch first, then the comment', () => {
    const r = writesForPatch(task, { nextAction: 'לשלוח', addComment: { id: 'c', authorId: 'u', at: '2026-10-06T10:00:00.000Z', text: 'הערה' } });
    expect(r.writes.map((w) => w.kind)).toEqual(['update', 'comment']);
  });
  test('an undo never tries to take back time or a comment through a task patch', () => {
    const after = { ...task, spentMinutes: (task.spentMinutes ?? 0) + 30, comments: [...task.comments, { id: 'c', authorId: 'u', at: '2026-10-06T10:00:00.000Z', text: 'x' }] };
    expect(undoPatch(after, task)).toEqual({});
  });
});
