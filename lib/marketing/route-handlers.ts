import 'server-only';
import type { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '../api-guard';
import { getProject } from '../db/queries/projects';
import { auditedAction } from '../ops-audit';
import { OpsPolicyError, assertConfirmation, assertWriter, objectInput } from '../ops-policy';
import { getMarketingBinding } from './binding-store';
import type { MarketingBinding } from './binding';
import { importArtifact, listLatestArtifacts } from './artifacts';
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

export function marketingModuleEnabled(): boolean { return process.env.MARKETING_MODULE_ENABLED === 'true'; }

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

export const importArtifactRoute = writeRoute('marketing_artifact_import',
  (c) => importArtifact(c.scope, c.projectId, c.binding, c.body.kind, c.body.payload, c.requestId), 1000000);

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
