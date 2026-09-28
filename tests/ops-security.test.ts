import test from 'node:test';
import assert from 'node:assert/strict';
import { assertClosure, assertWriter, assertConfirmation, dateMs } from '../lib/ops-policy';
import { parseMarketingPlan } from '../lib/marketing/contract';
import { computeClientMoney } from '../lib/money';
import { foldersForBusiness, folderFromProject, folderState } from '../lib/ops-config';
import { statusChange, needsReviewConfirmation } from '../lib/ops-closure';
import { snapshotTask, reversePatch, assertUnchanged, rollbackEligibility, isTaskSnapshot } from '../lib/ops-snapshot';
import { expectedMarker } from '../lib/ops-policy';
import { marketingBinding } from '../lib/marketing/binding';
import { requireScopedTask, requireStatusEvidence } from '../lib/ops-access';
import { getTasksByFolderWithCompleteness } from '../lib/clickup';

const fixture = () => ({ schemaVersion: 1, marketingBusiness: 'fixture', revision: 1, sourceRevision: 'fixture-rev', asOf: '2026-01-01T00:00:00Z',
  priorities: [{ id: 'priority', title: 'Fixture priority', evidenceRef: 'brain/priority', confidence: 'KNOWN', provenance: 'owner_supplied' }],
  items: [{ id: 'campaign', title: 'Fixture campaign', kind: 'campaign', priorityId: 'priority', start: '2026-01-02T00:00:00.000Z', end: '2026-01-03T00:00:00.000Z', dependsOn: [], sourceRef: 'work/campaign' }], reviews: [] });

test('members cannot approve external writes', () => assert.throws(() => assertWriter('member')));
test('owners and admins can approve', () => { assertWriter('owner'); assertWriter('admin'); });
test('cross-origin and missing confirmations are rejected', () => {
  const req = new Request('https://ops.example/api', { headers: { origin: 'https://evil.example' } });
  assert.throws(() => assertConfirmation(req, { confirmed: true, requestId: '11111111-1111-4111-8111-111111111111' }));
  assert.throws(() => assertConfirmation(new Request('https://ops.example/api', { headers: { origin: 'https://ops.example' } }), {}));
});
test('closure requires exact current evidence and explicit human review', () => {
  for (const [url, reviewed] of [['https://proof.example/a', false], ['https://other.example/a', true], [undefined, true]]) {
    assert.throws(() => assertClosure('closed', url, reviewed, ['https://proof.example/a']));
  }
  assertClosure('done', 'https://proof.example/a', true, ['https://proof.example/a']);
  assertClosure('open', undefined, false, []);
});
test('a pasted recording URL is never a review by itself', () => {
  const attached = ['https://proof.example/a'];
  // URL present, explicit review declined or never asked → not reviewed, and the server refuses closure.
  for (const change of [statusChange('closed', 'https://proof.example/a', false), statusChange('closed', ' https://proof.example/a ', false)]) {
    assert.equal(change.evidence_reviewed, false);
    assert.throws(() => assertClosure('closed', change.evidence_url, change.evidence_reviewed, attached));
  }
  // Explicit confirmation without a URL is nothing to confirm → still not reviewed, still refused.
  const bare = statusChange('closed', '', true);
  assert.equal(bare.evidence_reviewed, false);
  assert.equal(needsReviewConfirmation(''), false);
  assert.throws(() => assertClosure('closed', bare.evidence_url, bare.evidence_reviewed, attached));
  // Only URL + explicit confirmation, and only when that URL is actually attached, closes.
  const ok = statusChange('closed', 'https://proof.example/a', true);
  assert.equal(ok.evidence_reviewed, true);
  assertClosure('closed', ok.evidence_url, ok.evidence_reviewed, attached);
  assert.throws(() => assertClosure('closed', ok.evidence_url, ok.evidence_reviewed, ['https://proof.example/other']));
});
test('a project folder outside the allowlist is named, not read', () => {
  assert.equal(folderState('mytiv', null), 'unlinked');
  assert.equal(folderState('mytiv', '901816026303'), 'linked');
  assert.equal(folderState('mytiv', '000'), 'unauthorized');
  assert.equal(folderState('other-business', '901816026303'), 'unauthorized');
  assert.equal(folderFromProject({ id: 'p', name: 'P', clickupFolderId: '000', folderState: 'unauthorized' }), null);
  assert.ok(folderFromProject({ id: 'p', name: 'P', clickupFolderId: '901816026303', folderState: 'linked' }));
});
test('a task snapshot keeps identifiers only and round-trips through jsonb', () => {
  const raw = { id: 't1', name: 'Secret title', url: 'u', list: { id: 'l1' }, status: { status: 'working' }, assignees: [{ id: 2, username: 'Dana', email: 'dana@x.invalid' }, { id: 1 }], due_date: '1700000000000', date_updated: '1000' };
  const snap = snapshotTask(raw);
  assert.deepEqual(snap, { taskId: 't1', listId: 'l1', status: 'working', assigneeIds: [1, 2], dueDate: 1700000000000, dateUpdated: '1000' });
  assert.ok(!JSON.stringify(snap).includes('Dana') && !JSON.stringify(snap).includes('Secret'));
  assert.ok(isTaskSnapshot(JSON.parse(JSON.stringify(snap))));
  assert.ok(!isTaskSnapshot({ taskId: 't1' }));
  assert.deepEqual(snapshotTask({ id: 't2', name: '', due_date: null, date_updated: null }).dueDate, null);
});
test('reverse patch undoes exactly what changed, nothing more', () => {
  const pre = { taskId: 't', listId: 'l', status: 'working', assigneeIds: [1], dueDate: null, dateUpdated: '1' };
  const post = { ...pre, status: 'review', assigneeIds: [1, 2], dueDate: 5, dateUpdated: '2' };
  assert.deepEqual(reversePatch(pre, post), { status: 'working', assignees: { rem: [2] }, due_date: null });
  assert.deepEqual(reversePatch({ ...pre, assigneeIds: [3] }, { ...pre, assigneeIds: [1] }), { assignees: { add: [3], rem: [1] } });
  assert.deepEqual(reversePatch({ ...pre, dueDate: 9 }, { ...pre, dueDate: null }), { due_date: 9 });
  assert.equal(reversePatch(pre, { ...pre, dateUpdated: '2' }), null);
});
test('unchanged-since check compares the exact change marker', () => {
  assert.throws(() => assertUnchanged('1000', { id: 't', name: '', date_updated: '1001' }), /task_changed_since_read/);
  assert.throws(() => assertUnchanged(null, { id: 't', name: '', date_updated: '1001' }));
  assertUnchanged('1000', { id: 't', name: '', date_updated: '1000' });
  assertUnchanged(null, { id: 't', name: '', date_updated: null });
  assert.equal(expectedMarker(new Date(1000).toISOString()), '1000');
  assert.equal(expectedMarker(undefined), undefined);
  assert.equal(expectedMarker(''), null);
  assert.throws(() => expectedMarker('yesterday'));
});
test('only task updates are reversible; creations never are, because nothing here can delete', () => {
  assert.equal(rollbackEligibility('update_task'), 'eligible');
  for (const a of ['create_task', 'add_comment', 'add_decision']) assert.deepEqual(rollbackEligibility(a), { not: 'no_delete_capability' });
  assert.deepEqual(rollbackEligibility('marketing_import'), { not: 'not_a_task_update' });
  assert.deepEqual(rollbackEligibility('rollback_task'), { not: 'not_a_task_update' });
});
test('a malformed binding table resolves nothing, and never surfaces as a JSON error', () => {
  const prev = process.env.OPS_MARKETING_BINDINGS;
  process.env.OPS_MARKETING_BINDINGS = '{mytiv:not-json}';
  assert.equal(marketingBinding('mytiv', 'p'), null);
  process.env.OPS_MARKETING_BINDINGS = JSON.stringify({ 'mytiv:p': 'umino', 'mytiv:q': 'Bad Slug!' });
  assert.equal(marketingBinding('mytiv', 'p'), 'umino');
  assert.equal(marketingBinding('mytiv', 'q'), null);
  assert.equal(marketingBinding('other', 'p'), null);
  process.env.OPS_MARKETING_BINDINGS = prev;
});
test('invalid calendar dates are rejected', () => {
  for (const s of ['2026-02-30','2026-13-01','x','2026-1-1']) assert.throws(() => dateMs(s));
  assert.ok(Number.isFinite(dateMs('2024-02-29')));
});
test('folder mapping cannot point another business to Mytiv ClickUp', () => {
  assert.deepEqual(foldersForBusiness('other', [{ id: 'p', name: 'p', clickupFolderId: '901816026303' }]), []);
});
test('missing tracked hours are unknown cost and margin', () => {
  const money = computeClientMoney({ projectId: 'p', name: 'p', monthHours: 0, totalHours: 0, hourlyCost: 100, revenue: { kind: 'proposal', monthly: 1000, setup: 0, proposals: 1 } });
  assert.equal(money.monthCost, null); assert.equal(money.monthMargin, null);
});
test('ambiguous budgets do not produce budget utilization', () => {
  assert.equal(computeClientMoney({ projectId: 'p', name: 'p', monthHours: 10, totalHours: 10, hourlyCost: 100, revenue: { kind: 'budget', total: 2000, raw: '2000 + 500', ambiguous: true } }).budgetUsedPct, null);
});
test('plan roundtrip preserves source references without execution state', () => assert.deepEqual(parseMarketingPlan(fixture(), 'fixture'), fixture()));
for (const [name, mutate] of Object.entries({
  'cross-business import': (x: ReturnType<typeof fixture>) => { x.marketingBusiness = 'other'; },
  'unsupported version': (x: ReturnType<typeof fixture>) => { x.schemaVersion = 2; },
  'duplicate item': (x: ReturnType<typeof fixture>) => { x.items.push({ ...x.items[0] }); },
  'missing priority': (x: ReturnType<typeof fixture>) => { x.items[0].priorityId = 'other'; },
  'invalid dates': (x: ReturnType<typeof fixture>) => { x.items[0].start = '2026-02-30'; },
  'unsafe links': (x: ReturnType<typeof fixture>) => { x.items[0].sourceRef = 'javascript:alert(1)'; },
  'path traversal': (x: ReturnType<typeof fixture>) => { x.items[0].sourceRef = '../other/secret'; },
})) test(`reject ${name}`, () => { const f = fixture(); mutate(f); assert.throws(() => parseMarketingPlan(f, 'fixture')); });
test('reject injected execution status, missing dependencies and cycles', () => {
  const f = fixture();
  assert.throws(() => parseMarketingPlan({ ...f, items: [{ ...f.items[0], status: 'done' }] }, 'fixture'));
  assert.throws(() => parseMarketingPlan({ ...f, items: [{ ...f.items[0], dependsOn: ['missing'] }] }, 'fixture'));
  assert.throws(() => parseMarketingPlan({ ...f, items: [{ ...f.items[0], end: f.items[0].start, dependsOn: ['campaign'] }] }, 'fixture'));
});

test('real ClickUp adapter enforces fresh list membership and closure metadata', async () => {
  process.env.CLICKUP_API_TOKEN = 'fixture-only'; process.env.CLICKUP_WORKSPACE_ID = 'fixture-only';
  const original = globalThis.fetch;
  const requests: string[] = [];
  let taskList = 'foreign';
  globalThis.fetch = async (url) => {
    const path = String(url); requests.push(path);
    if (path.includes('/folder/')) return Response.json({ lists: [{ id: 'allowed', name: 'Tasks', statuses: [{ status: 'custom-final', type: 'closed' }, { status: 'working', type: 'custom' }] }] });
    if (path.includes('/comment')) return Response.json({ comments: [] });
    return Response.json({ id: 'task', name: 'Fixture', list: { id: taskList }, attachments: [] });
  };
  const folder = { key: 'p', label: 'Fixture', clickupFolderId: 'folder' };
  try {
    await assert.rejects(requireScopedTask(folder, 'task'), /not_found/);
    taskList = 'allowed'; await requireScopedTask(folder, 'task');
    await assert.rejects(requireStatusEvidence(folder, 'task', 'custom-final', {}), /recording/);
    await assert.rejects(requireStatusEvidence(folder, 'task', 'unlisted-status', {}), /unknown_status/);
    await requireStatusEvidence(folder, 'task', 'working', {});
    taskList = 'foreign'; await assert.rejects(requireScopedTask(folder, 'task'), /not_found/);
    assert.ok(requests.filter(p => p.includes('/task/task')).length >= 5, 'authorization never relies on stale cached membership');
  } finally { globalThis.fetch = original; }
});

test('getTasksByFolder flags an incomplete read at the 20-page cap (MKT-INT06)', async () => {
  process.env.CLICKUP_API_TOKEN = 'fixture-only'; process.env.CLICKUP_WORKSPACE_ID = 'fixture-only';
  const original = globalThis.fetch;
  const folder = { key: 'p', label: 'Fixture', clickupFolderId: 'folder' };
  const pageOf = (url: unknown) => Number(new URL(String(url)).searchParams.get('page'));
  const oneTask = (page: number) => ({ id: `t-${page}`, name: 'T', status: { status: 'open', type: 'open' } });
  try {
    // Source never signals a last page → the read stops at the 20-page cap with more behind.
    globalThis.fetch = async (url) => Response.json({ tasks: [oneTask(pageOf(url))], last_page: false });
    const capped = await getTasksByFolderWithCompleteness(folder, { fresh: true });
    assert.equal(capped.incomplete, true);
    assert.equal(capped.tasks.length, 20, 'reads exactly the 20-page cap, no more');

    // Source signals the last page on page 2 → complete read of three pages.
    globalThis.fetch = async (url) => { const p = pageOf(url); return Response.json({ tasks: [oneTask(p)], last_page: p >= 2 }); };
    const full = await getTasksByFolderWithCompleteness(folder, { fresh: true });
    assert.equal(full.incomplete, false);
    assert.equal(full.tasks.length, 3);

    // An empty page ends the read cleanly — that is complete, not a truncation.
    globalThis.fetch = async () => Response.json({ tasks: [], last_page: false });
    const empty = await getTasksByFolderWithCompleteness(folder, { fresh: true });
    assert.equal(empty.incomplete, false);
    assert.equal(empty.tasks.length, 0);
  } finally { globalThis.fetch = original; }
});
