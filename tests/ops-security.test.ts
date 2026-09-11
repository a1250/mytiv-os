import test from 'node:test';
import assert from 'node:assert/strict';
import { assertClosure, assertWriter, assertConfirmation, dateMs } from '../lib/ops-policy';
import { parseMarketingPlan } from '../lib/marketing/contract';
import { computeClientMoney } from '../lib/money';
import { foldersForBusiness, folderFromProject, folderState } from '../lib/ops-config';
import { statusChange, needsReviewConfirmation } from '../lib/ops-closure';
import { requireScopedTask, requireStatusEvidence } from '../lib/ops-access';

const fixture = () => ({ schemaVersion: 1, marketingBusiness: 'fixture', revision: 1, sourceRevision: 'fixture-rev', asOf: '2026-01-01T00:00:00Z',
  priorities: [{ id: 'priority', title: 'Fixture priority', evidenceRef: 'brain/priority', confidence: 'owner_priority' }],
  items: [{ id: 'campaign', title: 'Fixture campaign', kind: 'campaign', priorityId: 'priority', start: '2026-01-02', end: '2026-01-03', dependsOn: [], sourceRef: 'work/campaign' }], reviews: [] });

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
