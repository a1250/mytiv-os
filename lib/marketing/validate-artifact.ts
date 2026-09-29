import Ajv, { type ValidateFunction } from 'ajv';
import { OpsPolicyError } from '../ops-policy';
import { AS_OF_SKEW_MS, isDateTimeZ, violation } from './contract-rules/rules';
import type { ArtifactContext, ContractSpec } from './contract-rules/spec';
import { C2_C3_CONTRACTS } from './contract-rules/c2-c3';
import { C5_C8_CONTRACTS } from './contract-rules/c5-c8';
import { C9_C14_CONTRACTS } from './contract-rules/c9-c14';

/**
 * Generic validation for every vendored marketing-os artifact contract (C2–C16; C1 keeps its own
 * `validateMarketingPlan`). Composed in the order the vendored contract intends:
 *   1. the kind must be a registered contract (anything else → `unsupported_artifact_kind`);
 *   2. AJV structural gate against the vendored canonical `<kind>.schema.json`;
 *   3. the envelope rules (`asOf` UTC datetime, not in the future; tenant scope = the binding) and,
 *      for payloads that carry one, `binding_version` = the caller's current binding version;
 *   4. the contract's contextual rules — the canonical zod refinements the JSON Schema cannot carry.
 * The vendored files are canonical; nothing here defines a competing contract.
 */
const REGISTRY = { ...C2_C3_CONTRACTS, ...C5_C8_CONTRACTS, ...C9_C14_CONTRACTS };

export type ArtifactKind = keyof typeof REGISTRY;
export type ArtifactPayload<K extends ArtifactKind> = (typeof REGISTRY)[K] extends ContractSpec<infer T> ? T : never;
export type { ArtifactContext };

/** The tenant binding the artifact must belong to. `bindingVersion`, when supplied, is enforced on
 *  every payload that carries a `binding_version` (a stale version is refused). */
export type ArtifactBinding = { marketingBusiness: string; bindingVersion?: number };

export const ARTIFACT_KINDS = Object.keys(REGISTRY) as ArtifactKind[];

export function isArtifactKind(kind: unknown): kind is ArtifactKind {
  return typeof kind === 'string' && Object.prototype.hasOwnProperty.call(REGISTRY, kind);
}

// Formats are enforced exactly by the contextual rules (zod parity), so AJV skips them.
const ajv = new Ajv({ allErrors: false, strict: false, validateFormats: false });
const compiled = new Map<ArtifactKind, ValidateFunction>();
function structural(kind: ArtifactKind): ValidateFunction {
  let fn = compiled.get(kind);
  if (!fn) { fn = ajv.compile(REGISTRY[kind].schema); compiled.set(kind, fn); }
  return fn;
}

export function validateArtifact<K extends ArtifactKind>(kind: K, payload: unknown, binding: ArtifactBinding, context: ArtifactContext = {}): ArtifactPayload<K> {
  if (!isArtifactKind(kind)) throw new OpsPolicyError('unsupported_artifact_kind');
  const validate = structural(kind);
  if (!validate(payload)) {
    const first = validate.errors?.[0];
    const where = first ? `${first.instancePath || '/'} ${first.message ?? ''}`.trim() : '';
    throw new OpsPolicyError(`contract_structure_invalid${where ? `: ${where}` : ''}`);
  }
  const spec = REGISTRY[kind] as ContractSpec<unknown>;
  const o = payload as Record<string, unknown>;
  if (spec.envelope) {
    if (!isDateTimeZ(o.asOf)) violation('/asOf', 'must be an ISO-8601 UTC datetime');
    const asOf = Date.parse(o.asOf);
    if (Number.isNaN(asOf) || asOf > Date.now() + AS_OF_SKEW_MS) violation('/asOf', 'must not be in the future');
    if (o.marketingBusiness !== binding.marketingBusiness) throw new OpsPolicyError('contract_scope_or_version_mismatch');
  }
  if (spec.bound && binding.bindingVersion !== undefined && o.binding_version !== binding.bindingVersion) {
    throw new OpsPolicyError('stale_binding_version', 409);
  }
  spec.check(payload, context);
  return payload as ArtifactPayload<K>;
}
