import { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '@/lib/api-guard';
import { getProject } from '@/lib/db/queries/projects';
import { folderFromProject } from '@/lib/ops-config';
import { ClickUpError } from '@/lib/clickup';
import { requireScopedTask } from '@/lib/ops-access';
import { snapshotTask } from '@/lib/ops-snapshot';
import { appendActionEvent, getOpsAction, listActionEvents } from '@/lib/ops-audit';
import { isOpenReconciliation } from '@/lib/ops-audit-view';
import { OpsPolicyError, assertConfirmation, assertWriter, objectInput, requiredText } from '@/lib/ops-policy';
import { artifactByRequest, readbackImport } from '@/lib/marketing/artifacts';

/**
 * Resolve an open reconciliation item (T-11.3 · MKT-GOV06): a governed write whose external outcome is
 * unknown blocks new writes to its target until a writer records what is ACTUALLY there now. This performs
 * a fresh readback of the target and appends `reconciled {observed_state, by, at}` to the original action —
 * it never writes to ClickUp. Same gate as every write: owner/admin, same origin, confirmed, request id.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; actionId: string }> }) {
  try {
    const { businessSlug, actionId } = await params;
    const scope = await guard(businessSlug);
    assertWriter(scope.role);
    const body = objectInput(await req.json());
    assertConfirmation(req, body);
    const projectId = requiredText(body.projectId, 'project_id', 100);
    if (!/^[0-9a-f-]{36}$/i.test(actionId)) throw new OpsPolicyError('not_found', 404);
    const project = await getProject(scope.businessId, projectId);
    if (!project) throw new OpsPolicyError('not_found', 404);
    const action = await getOpsAction(scope.businessId, projectId, actionId);
    if (!action) throw new OpsPolicyError('not_found', 404);
    const events = await listActionEvents(scope.businessId, actionId);
    const own = events.map((e) => ({ event: e.event, detail: (e.detail ?? {}) as Record<string, unknown> }));
    if (!isOpenReconciliation(own)) throw new OpsPolicyError('no_open_reconciliation', 409);
    const target = own.find((e) => e.event === 'confirmed')?.detail.target as { kind?: string; id?: string } | undefined;
    let observed: Record<string, unknown>;
    if (action.action === 'marketing_artifact_import' && target?.kind === 'project' && target.id === projectId) {
      // A marketing import is one atomic insert keyed by its request id. The lock-aware readback (migration 0011)
      // is definitive: in flight → nothing is decided and the item stays open; not written → a fence guarantees
      // the request can never produce an artifact afterwards.
      const outcome = await readbackImport(scope.businessId, action.requestId, scope.userId);
      if (outcome === 'in_flight') throw new OpsPolicyError('import_outcome_pending_retry_readback', 409);
      if (outcome === 'written') {
        const artifact = await artifactByRequest(scope.businessId, action.requestId);
        if (!artifact) throw new Error('readback said written but the artifact is not visible');
        observed = { artifact: { id: artifact.id, kind: artifact.kind, revision: artifact.revision, binding_version: artifact.bindingVersion }, written: true };
      } else observed = { artifact: null, written: false, fenced: true };
      const at = new Date().toISOString();
      await appendActionEvent(scope.businessId, actionId, 'reconciled', { observed_state: observed, by: scope.userId, at, request_id: body.requestId });
      return Response.json({ ok: true, reconciled: actionId, observed_state: observed, at });
    }
    if (target?.kind !== 'task' || typeof target.id !== 'string') throw new OpsPolicyError('readback_unsupported', 409);
    try { observed = { ...snapshotTask((await requireScopedTask(folderFromProject(project), target.id)).task) }; }
    catch (err) {
      const gone = (err instanceof ClickUpError && err.status === 404) || (err instanceof OpsPolicyError && err.message === 'not_found');
      if (!gone) throw err;
      observed = { taskId: target.id, missing: true };
    }
    const at = new Date().toISOString();
    await appendActionEvent(scope.businessId, actionId, 'reconciled', { observed_state: observed, by: scope.userId, at, request_id: body.requestId });
    return Response.json({ ok: true, reconciled: actionId, observed_state: observed, at });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ ok: false, error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    return Response.json({ ok: false, error: 'readback_unavailable_try_again' }, { status: 503 });
  }
}
