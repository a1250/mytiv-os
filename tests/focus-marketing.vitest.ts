import { describe, expect, test } from 'vitest';
import { approvalPhase, DECISION_REFUSAL, riskOf, type FocusMarketingApproval } from '../lib/focus/adapters/marketing';

// The Focus view of a Marketing OS C2a item (+ the C2b decision recorded here): risk and phase are pure mappings of
// the canonical contract — never derived from client state.
const item = (over: Partial<FocusMarketingApproval> = {}): FocusMarketingApproval => ({
  projectId: 'p', projectName: 'P', client: null, bindingVersion: 1, sourceArtifactId: 's', asOf: '2026-10-01T00:00:00.000Z',
  approvalId: 'a1', contentHash: 'a'.repeat(64), state: 'pending', title: 't', why: 'w', actionType: 'campaign_activate',
  actionClass: 'RED', qaVerdict: 'PASS', rollbackNote: 'r', requestedChange: null, diffSummary: null, factsCited: [], decision: null, ...over,
});

describe('marketing approvals adapter', () => {
  test('the action class is the risk', () => {
    expect([riskOf('GREEN'), riskOf('YELLOW'), riskOf('RED')]).toEqual(['low', 'medium', 'high']);
  });
  test('a pending item with a decision recorded here waits for the engine; the engine state wins otherwise', () => {
    expect(approvalPhase(item())).toBe('pending');
    const decision = { decision: 'approved' as const, note: 'n', decidedAt: '2026-10-01T00:00:00.000Z', reconciledState: null };
    expect(approvalPhase(item({ decision }))).toBe('decided_awaiting_engine');
    for (const state of ['approved', 'rejected', 'expired', 'applied'] as const) expect(approvalPhase(item({ state, decision }))).toBe(state);
  });
  test('every refusal the decision route can return for a valid request is explained', () => {
    for (const code of ['stale_content_hash', 'approval_not_pending', 'stale_binding_version', 'already_recorded', 'request_already_claimed_check_audit_before_retry', 'approval_role_required', 'same_origin_required', 'reconciliation_pending'])
      expect(DECISION_REFUSAL[code]).toBeTruthy();
  });
});
