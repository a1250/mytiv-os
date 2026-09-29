import type { ApprovalQueueExport } from './c2-c3';

/** The canonical `EnvelopeBase` every envelope contract carries (marketing-os `envelope.ts`). */
export type Envelope = { schemaVersion: 1; sourceRevision: string; asOf: string; marketingBusiness: string };

/**
 * Caller-supplied facts a contextual rule may need beyond the payload itself. Rules that depend on a
 * fact the caller did not supply FAIL CLOSED (they never assume the fact holds).
 */
export type ArtifactContext = {
  /** The imported C2a approval queue a C16 execution receipt must link to. */
  approvalQueue?: ApprovalQueueExport;
};

/**
 * One vendored contract: its structural JSON Schema plus the contextual rules JSON Schema cannot
 * express (the canonical zod refinements, formats, trimmed non-empty strings and safe refs).
 */
export type ContractSpec<T> = {
  schema: object;
  /** Carries the envelope: tenant scope (`marketingBusiness`) + the not-in-the-future `asOf`. */
  envelope: boolean;
  /** Carries a top-level `binding_version`, checked against the caller's current binding version. */
  bound: boolean;
  /** Contextual rules; throws `contract_rule_violation` on the first failing rule. */
  check: (payload: T, context: ArtifactContext) => void;
};

export function contract<T>(spec: ContractSpec<T>): ContractSpec<T> { return spec; }
