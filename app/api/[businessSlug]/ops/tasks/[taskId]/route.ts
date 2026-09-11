import { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '@/lib/api-guard';
import { getProject } from '@/lib/db/queries/projects';
import { folderFromProject } from '@/lib/ops-config';
import { getWorkspaceMembers, updateTask } from '@/lib/clickup';
import { requireScopedTask, requireStatusEvidence } from '@/lib/ops-access';
import { OpsPolicyError, assertWriter, assertConfirmation, objectInput, requiredText } from '@/lib/ops-policy';
import { auditedAction } from '@/lib/ops-audit';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; taskId: string }> }) {
  try {
    const { businessSlug, taskId } = await params;
    const scope = await guard(businessSlug);
    assertWriter(scope.role);
    const body = objectInput(await req.json());
    assertConfirmation(req, body);
    const projectId = requiredText(body.projectId, 'project_id', 100);
    const project = await getProject(scope.businessId, projectId);
    if (!project) throw new OpsPolicyError('not_found', 404);
    const folder = folderFromProject(project);
    await requireScopedTask(folder, taskId);
    const patch: Parameters<typeof updateTask>[1] = {};
    if (body.status !== undefined) {
      patch.status = requiredText(body.status, 'status', 100);
      await requireStatusEvidence(folder, taskId, patch.status, body);
    }
    if (body.assignee !== undefined) {
      const value = objectInput(body.assignee);
      const members = new Set((await getWorkspaceMembers()).map(m => m.id));
      const parseIds = (input: unknown): number[] => {
        if (input === undefined) return [];
        if (!Array.isArray(input) || input.length > 50 || input.some(id => !Number.isSafeInteger(id) || !members.has(id))) throw new OpsPolicyError('invalid_assignee');
        return input;
      };
      patch.assignees = { add: parseIds(value.add), rem: parseIds(value.rem) };
    }
    if (!Object.keys(patch).length) throw new OpsPolicyError('nothing_to_update');
    const result = await auditedAction(scope, projectId, body.requestId as string, 'update_task', { taskId, patch, evidence_url: body.evidence_url, evidence_reviewed: body.evidence_reviewed }, async () => {
      await updateTask(taskId, patch);
      return { ok: true };
    });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ error: 'invalid_json' }, { status: 400 });
    return Response.json({ error: 'operation_unavailable_check_audit_before_retry' }, { status: 503 });
  }
}
