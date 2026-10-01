import { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '@/lib/api-guard';
import { getProject } from '@/lib/db/queries/projects';
import { folderFromProject } from '@/lib/ops-config';
import { ClickUpWriteUnverifiedError, type RawTask } from '@/lib/clickup';
import { snapshotTask } from '@/lib/ops-snapshot';
import { requireScopedTask, requireStatusEvidence } from '@/lib/ops-access';
import { OpsPolicyError, assertWriter, assertConfirmation, expectedMarker, objectInput, requiredText } from '@/lib/ops-policy';
import { auditedAction } from '@/lib/ops-audit';
import { clickupCommandSource } from '@/lib/work-source/clickup-adapter';
import { CommandNotSupportedError, type ItemChange, type PersonRef } from '@/lib/work-source/types';

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
    const change: ItemChange = {};
    if (body.status !== undefined) {
      change.status = requiredText(body.status, 'status', 100);
      await requireStatusEvidence(folder, taskId, change.status, body, scoped);
    }
    if (body.assignee !== undefined) {
      // Neutral person refs ({provider:'clickup', id}) or legacy numeric ids; the adapter keeps only current ClickUp members.
      const value = objectInput(body.assignee);
      const list = (v: unknown) => (v === undefined ? [] : v) as PersonRef[]; // shape is checked by the adapter
      change.assignees = { add: list(value.add), remove: list(value.rem) };
    }
    // Validated against ClickUp (capabilities, members) before anything is claimed; `payload` is ClickUp's own patch.
    const prepared = await clickupCommandSource.prepare({ provider: 'clickup', id: taskId }, change);
    const patch = prepared.payload;
    expectedMarker(body.expectedUpdatedAt); // a malformed marker is a 400 before anything is claimed
    const actor = { businessId: scope.businessId, userId: scope.userId, role: scope.role };
    const result = await auditedAction(scope, projectId, body.requestId as string, 'update_task',
      { taskId, patch, evidence_url: body.evidence_url, evidence_reviewed: body.evidence_reviewed, expectedUpdatedAt: body.expectedUpdatedAt },
      async (capture) => {
        // The row the human acted on carries the marker they saw; a task that moved on since is refused before the write.
        const done = await clickupCommandSource.apply(prepared, { actor, expectedToken: body.expectedUpdatedAt as string | null | undefined,
          observer: { before: (pre) => capture.pre(snapshotTask(pre as RawTask)), after: (post) => capture.post(snapshotTask(post as RawTask)) } });
        capture.ref({ taskId, url: done.sourceLink?.href, date_updated: done.concurrencyToken });
        return { ok: true };
      },
      { target: { kind: 'task', id: taskId }, approval: { evidence_url: body.evidence_url ?? null, evidence_reviewed: body.evidence_reviewed === true } });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ error: 'invalid_json' }, { status: 400 });
    if (err instanceof CommandNotSupportedError) return Response.json({ error: err.message }, { status: 409 });
    if (err instanceof ClickUpWriteUnverifiedError) return Response.json({ error: 'write_unverified_check_audit_before_retry' }, { status: 502 });
    return Response.json({ error: 'operation_unavailable_check_audit_before_retry' }, { status: 503 });
  }
}
