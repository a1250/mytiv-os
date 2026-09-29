import c2aSchema from '../contracts/C2a.schema.json';
import c2bSchema from '../contracts/C2b.schema.json';
import c3aSchema from '../contracts/C3a.schema.json';
import c3bSchema from '../contracts/C3b.schema.json';
import { isDateTimeZ, violation } from './rules';
import { contract, type Envelope } from './spec';

// Canonical source: marketing-os `schemas/contracts/c1-c3.ts` (registry ids from `index.ts`).

export type ApprovalState = 'pending' | 'approved' | 'rejected' | 'expired';
export type ApprovalQueueItem = { approval_id: string; content_hash: string; state: ApprovalState };
/** C2a — ApprovalQueueExport v1 (engine → app). */
export type ApprovalQueueExport = Envelope & { items: ApprovalQueueItem[] };
/** C2b — ApprovalDecision v1 (app → engine). */
export type ApprovalDecision = Envelope & {
  approval_id: string; content_hash: string; decision: 'approved' | 'rejected'; note: string;
  decided_by: string; decided_at: string; app_request_id: string; binding_version: number;
};
/** C3b — BrainChangeProposal v1 (app → engine; no envelope — scoped by `binding_version`). */
export type BrainChangeProposal = {
  file: string; path: string; old: unknown; new: unknown; reason: string; verify: boolean;
  value_hash: string; proposed_by: string; app_request_id: string; binding_version: number;
};
/** C3a — BrainStatusExport v1 (engine → app). */
export type BrainStatusExport = Envelope & {
  files: Record<string, 'ok' | 'missing' | 'invalid' | 'stale'>;
  field_verification: Record<string, { owner_verified: boolean; source_verified?: boolean; source?: string; note?: string }>;
  values: Record<string, Record<string, string>>;
  open_proposals: BrainChangeProposal[];
};

/** The canonical C3b refinement: `old` and `new` must both be PRESENT and defined (`null` is an
 *  explicit "no value"), so a proposal can never silently drop the value it changes. The structural
 *  schema cannot express this (`{}` accepts anything, and neither key is `required`). */
function checkProposal(p: BrainChangeProposal, path: string) {
  for (const key of ['old', 'new'] as const) {
    if (!Object.prototype.hasOwnProperty.call(p, key)) violation(`${path}/${key}`, 'is required');
    if (p[key] === undefined) violation(`${path}/${key}`, 'must not be undefined');
  }
}

export const C2_C3_CONTRACTS = {
  C2a: contract<ApprovalQueueExport>({ schema: c2aSchema, envelope: true, bound: false, check: () => {} }),
  C2b: contract<ApprovalDecision>({
    schema: c2bSchema, envelope: true, bound: true,
    check: (d) => { if (!isDateTimeZ(d.decided_at)) violation('/decided_at', 'must be an ISO-8601 UTC datetime'); },
  }),
  C3a: contract<BrainStatusExport>({
    schema: c3aSchema, envelope: true, bound: false,
    check: (s) => s.open_proposals.forEach((p, i) => checkProposal(p, `/open_proposals/${i}`)),
  }),
  C3b: contract<BrainChangeProposal>({ schema: c3bSchema, envelope: false, bound: true, check: (p) => checkProposal(p, '') }),
};
