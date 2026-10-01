import { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '@/lib/api-guard';
import { getProject } from '@/lib/db/queries/projects';
import { folderFromProject } from '@/lib/ops-config';
import { ClickUpWriteUnverifiedError, getWorkspaceMembers, updateTask } from '@/lib/clickup';
import { snapshotTask } from '@/lib/ops-snapshot';
import { expectedMarker } from '@/lib/ops-policy';
import { requireScopedTask, requireStatusEvidence } from '@/lib/ops-access';
import { OpsPolicyError, assertWriter, assertConfirmation, objectInput, requiredText } from '@/lib/ops-policy';
import { auditedAction } from '@/lib/ops-audit';
import { clickUpAssigneeIds } from '@/lib/work-source/clickup-adapter';

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
    const scoped = await requireScopedTask(folder, taskId);
    const patch: Parameters<typeof updateTask>[1] = {};
    if (body.status !== undefined) {
      patch.status = requiredText(body.status, 'status', 100);
      await requireStatusEvidence(folder, taskId, patch.status, body, scoped);
    }
    if (body.assignee !== undefined) {
      const value = objectInput(body.assignee);
      // Neutral person refs (strings) or legacy numeric ids → ClickUp member ids, each a current member.
      const members = new Set((await getWorkspaceMembers()).map(m => m.id));
      patch.assignees = { add: clickUpAssigneeIds(value.add, members), rem: clickUpAssigneeIds(value.rem, members) };
    }
    if (!Object.keys(patch).length) throw new OpsPolicyError('nothing_to_update');
    // The row the human acted on carries the `date_updated` they saw; a task that moved on
    // since is refused before the write. Absent the claim, pre/post are still recorded.
    const expectedDateUpdated = expectedMarker(body.expectedUpdatedAt);
    const result = await auditedAction(scope, projectId, body.requestId as string, 'update_task',
      { taskId, patch, evidence_url: body.evidence_url, evidence_reviewed: body.evidence_reviewed, expectedUpdatedAt: body.expectedUpdatedAt },
      async (capture) => {
        const { post, raw } = await updateTask(taskId, patch, { expectedDateUpdated, onPre: (pre) => capture.pre(snapshotTask(pre)) });
        capture.post(snapshotTask(post));
        capture.ref({ taskId, url: raw.url, date_updated: post.date_updated ?? null });
        return { ok: true };
      },
      { target: { kind: 'task', id: taskId }, approval: { evidence_url: body.evidence_url ?? null, evidence_reviewed: body.evidence_reviewed === true } });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ error: 'invalid_json' }, { status: 400 });
    if (err instanceof ClickUpWriteUnverifiedError) return Response.json({ error: 'write_unverified_check_audit_before_retry' }, { status: 502 });
    return Response.json({ error: 'operation_unavailable_check_audit_before_retry' }, { status: 503 });
  }
}
