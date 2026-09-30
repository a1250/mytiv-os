import 'server-only';
import type { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '../api-guard';
import { getProject } from '../db/queries/projects';
import { appendActionEvent, auditedAction, auditPayloadHash, findOpsActionByRequest, listActionEvents } from '../ops-audit';
import { isOpenReconciliation } from '../ops-audit-view';
import { OpsPolicyError, assertConfirmation, assertWriter, objectInput } from '../ops-policy';
import { getMarketingBinding } from './binding-store';
import type { MarketingBinding } from './binding';
import { artifactByRequest, canonicalHash, canonicalize, insertArtifact, listLatestArtifacts, readbackImport, reconcileAll } from './artifacts';
import { marketingModuleEnabled } from './module-flag';
import { exportRecord, recordDecision, recordEvidence, recordOutcome, recordProposal, recordReceipt, type RecordKind } from './records';

/**
 * Shared handlers for the marketing artifact / record routes (T-3.2). Every route is behind
 * MARKETING_MODULE_ENABLED (default off; off → 404, as if the route did not exist). Writes require a
 * writer (owner/admin), a project of the caller's business, an ACTIVE binding, a same-origin confirmed
 * request with a request id, and the binding version the human saw; they run inside `auditedAction`, so an
 * audit that cannot be written blocks the write and a replayed request id is refused (409).
 */
type Params = { params: Promise<{ businessSlug: string; projectId: string }> };
type IdParams = { params: Promise<{ businessSlug: string; projectId: string; id: string }> };
type Scope = Awaited<ReturnType<typeof guard>>;

export { marketingModuleEnabled };

async function respond(fn: () => Promise<Response>): Promise<Response> {
  try { return await fn(); }
  catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ error: 'invalid_json' }, { status: 400 });
    return Response.json({ error: 'marketing_unavailable' }, { status: 503 });
  }
}

async function projectScope(businessSlug: string, projectId: string, write: boolean): Promise<Scope> {
  if (!marketingModuleEnabled()) throw new OpsPolicyError('not_found', 404);
  const scope = await guard(businessSlug);
  if (write) assertWriter(scope.role);
  if (!(await getProject(scope.businessId, projectId))) throw new OpsPolicyError('not_found', 404);
  return scope;
}

type WriteContext = { scope: Scope; projectId: string; binding: MarketingBinding; body: Record<string, unknown>; requestId: string };
function writeRoute(action: string, write: (c: WriteContext) => Promise<unknown>, maxBytes = 250000) {
  return (req: NextRequest, { params }: Params) => respond(async () => {
    const { businessSlug, projectId } = await params;
    const scope = await projectScope(businessSlug, projectId, true);
    const binding = await getMarketingBinding(scope.businessId, projectId);
    if (!binding) throw new OpsPolicyError('marketing_not_connected', 409);
    const text = await req.text();
    if (text.length > maxBytes) throw new OpsPolicyError('payload_too_large', 413);
    const body = objectInput(JSON.parse(text)); assertConfirmation(req, body);
    // The human confirmed against the binding version they saw; a rebind/revoke since makes it stale.
    if (body.bindingVersion !== binding.bindingVersion) throw new OpsPolicyError('stale_binding_version', 409);
    const requestId = body.requestId as string;
    const result = await auditedAction(scope, projectId, requestId, action, body, () => write({ scope, projectId, binding, body, requestId }),
      { target: { kind: 'project', id: projectId } });
    return Response.json(result);
  });
}

/** Reconciliation after an import: derived, idempotent, outside the governed write. A failure leaves the
 *  import committed and audited as succeeded; the replay of the same request (or any later import) converges. */
async function reconcileSafely(businessId: string, projectId: string, binding: MarketingBinding) {
  try { return { reconciled: await reconcileAll(businessId, projectId, binding), reconciliationPending: false }; }
  catch (error) {
    console.error('marketing reconciliation failed; retry the same import request to converge', error instanceof Error ? error.message : error);
    return { reconciled: null, reconciliationPending: true };
  }
}

const IMPORT_ACTION = 'marketing_artifact_import';
const claimedConflict = () => new OpsPolicyError('request_already_claimed_check_audit_before_retry', 409);

/**
 * GPT review P1-1 — the exact replay of an import whose request id is already claimed.
 * Identity (round 2): the claim's payload hash is taken over the CANONICAL request body (keys recursively
 * sorted), so a re-send that differs only in JSON key order is the same request; any changed value — payload,
 * kind, binding version, request id — and any other user, project or action is a conflicting reuse → 409.
 * Outcome (round 2): decided by the definitive readback (readbackImport, migration 0011), never by visibility:
 *   - written     → return the existing artifact (never a second one), append `succeeded` (observed by readback)
 *                   if the first attempt never recorded it, close an open unknown-outcome item with `reconciled`,
 *                   and re-run reconciliation;
 *   - in_flight   → the original write has not terminated: nothing is concluded, the unknown-outcome item stays
 *                   open (new writes to the project stay blocked) → 409, retry the readback later;
 *   - not_written → a fence now guarantees the request id can never produce an artifact: close an open item
 *                   with `reconciled {written:false, fenced:true}` and refuse (409) — a claimed request id is
 *                   never executed twice; send a new request id.
 */
async function replayImport(scope: Scope, projectId: string, requestId: string, body: Record<string, unknown>) {
  const claim = await findOpsActionByRequest(scope.businessId, requestId);
  if (!claim) return null;
  if (claim.action !== IMPORT_ACTION || claim.projectId !== projectId || claim.userId !== scope.userId || claim.payloadHash !== auditPayloadHash(canonicalize(body))) throw claimedConflict();
  const events = (await listActionEvents(scope.businessId, claim.id)).map((e) => ({ event: e.event, detail: (e.detail ?? {}) as Record<string, unknown> }));
  const outcome = await readbackImport(scope.businessId, requestId, scope.userId);
  if (outcome === 'in_flight') throw new OpsPolicyError('import_outcome_pending_retry_readback', 409);
  const at = new Date().toISOString();
  if (outcome === 'not_written') {
    if (isOpenReconciliation(events)) await appendActionEvent(scope.businessId, claim.id, 'reconciled', { observed_state: { artifact: null, written: false, fenced: true }, by: scope.userId, at, request_id: requestId, via: 'replay_readback' });
    throw claimedConflict();
  }
  const artifact = await artifactByRequest(scope.businessId, requestId);
  if (!artifact || artifact.projectId !== projectId || artifact.kind !== body.kind || artifact.contentHash !== canonicalHash(body.payload)) throw claimedConflict();
  const result = { ok: true as const, kind: artifact.kind, revision: artifact.revision, bindingVersion: artifact.bindingVersion };
  if (!events.some((e) => e.event === 'succeeded')) {
    const failed = [...events].reverse().find((e) => e.event === 'failed_or_unknown');
    await appendActionEvent(scope.businessId, claim.id, 'succeeded', { result, observed_by: 'readback', replayed: true, at, ...(failed ? { corrects_phase: failed.detail.phase ?? null } : {}) });
  }
  if (isOpenReconciliation(events)) await appendActionEvent(scope.businessId, claim.id, 'reconciled', { observed_state: { artifact: { id: artifact.id, kind: artifact.kind, revision: artifact.revision, binding_version: artifact.bindingVersion }, written: true }, by: scope.userId, at, request_id: requestId, via: 'replay_readback' });
  const binding = await getMarketingBinding(scope.businessId, projectId);
  return { ...result, replayed: true, ...(binding ? await reconcileSafely(scope.businessId, projectId, binding) : { reconciled: null, reconciliationPending: false }) };
}

/** Artifact import (engine → app). The governed write is the insert alone; reconciliation follows it. */
export const importArtifactRoute = (req: NextRequest, { params }: Params) => respond(async () => {
  const { businessSlug, projectId } = await params;
  const scope = await projectScope(businessSlug, projectId, true);
  const text = await req.text();
  if (text.length > 1000000) throw new OpsPolicyError('payload_too_large', 413);
  const body = objectInput(JSON.parse(text)); assertConfirmation(req, body);
  const requestId = body.requestId as string;
  const replayed = await replayImport(scope, projectId, requestId, body);
  if (replayed) return Response.json(replayed);
  const binding = await getMarketingBinding(scope.businessId, projectId);
  if (!binding) throw new OpsPolicyError('marketing_not_connected', 409);
  if (body.bindingVersion !== binding.bindingVersion) throw new OpsPolicyError('stale_binding_version', 409);
  // the claim's payload hash covers the CANONICAL body, so an exact replay is recognised whatever its key order
  const result = await auditedAction(scope, projectId, requestId, IMPORT_ACTION, canonicalize(body),
    (capture) => insertArtifact(scope, projectId, binding, body.kind, body.payload, requestId, () => capture.writing()), { target: { kind: 'project', id: projectId } });
  return Response.json({ ...result, ...(await reconcileSafely(scope.businessId, projectId, binding)) });
});

type RecordWriter = (scope: Scope, projectId: string, binding: MarketingBinding, body: Record<string, unknown>, requestId: string) => Promise<unknown>;
const RECORD_WRITERS: Record<RecordKind, RecordWriter> = {
  decision: recordDecision, proposal: recordProposal, evidence: recordEvidence, outcome: recordOutcome, receipt: recordReceipt,
};
export function recordRoute(kind: RecordKind) {
  return writeRoute(`marketing_record_${kind}`, (c) => RECORD_WRITERS[kind](c.scope, c.projectId, c.binding, c.body, c.requestId));
}

/** Latest artifact per kind under the active binding — readable by any member of the business. */
export const listArtifactsRoute = (_req: NextRequest, { params }: Params) => respond(async () => {
  const { businessSlug, projectId } = await params;
  const scope = await projectScope(businessSlug, projectId, false);
  const binding = await getMarketingBinding(scope.businessId, projectId);
  if (!binding) return Response.json({ connected: false, artifacts: [] });
  return Response.json({ connected: true, bindingVersion: binding.bindingVersion, artifacts: await listLatestArtifacts(scope.businessId, projectId, binding) });
});

/** Downloadable JSON of one record (writer-only: exporting hands the record to the engine). */
export function exportRoute(kind: RecordKind) {
  return (_req: NextRequest, { params }: IdParams) => respond(async () => {
    const { businessSlug, projectId, id } = await params;
    const scope = await projectScope(businessSlug, projectId, true);
    const payload = await exportRecord(scope.businessId, projectId, kind, id);
    return new Response(JSON.stringify(payload, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="marketing-${kind}-${id}.json"`, 'Cache-Control': 'no-store' },
    });
  });
}
