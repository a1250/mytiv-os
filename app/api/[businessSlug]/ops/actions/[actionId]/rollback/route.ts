import { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '@/lib/api-guard';
import { getProject } from '@/lib/db/queries/projects';
import { folderFromProject } from '@/lib/ops-config';
import { ClickUpWriteUnverifiedError } from '@/lib/clickup';
import { OpsPolicyError, assertWriter, assertConfirmation, objectInput, requiredText } from '@/lib/ops-policy';
import { executeRollback } from '@/lib/ops-rollback';

/**
 * Reverse one governed update_task. Same gate as every write: signed-in owner/admin, same
 * origin, explicit `confirmed`, unique `requestId`. Not reachable through the copilot.
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
    const result = await executeRollback(scope, projectId, folderFromProject(project), actionId, body.requestId as string);
    if (!result.ok) return Response.json({ ok: false, error: result.error }, { status: result.status });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ ok: false, error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    if (err instanceof ClickUpWriteUnverifiedError) return Response.json({ ok: false, error: 'write_unverified_check_audit_before_retry' }, { status: 502 });
    return Response.json({ ok: false, error: 'operation_unavailable_check_audit_before_retry' }, { status: 503 });
  }
}
