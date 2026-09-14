import { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '@/lib/api-guard';
import { CONFIRM_REQUIRED, executeProposal, loadOpsContext } from '@/lib/ai/ops-copilot';
import { OpsPolicyError, assertWriter, assertConfirmation, objectInput, requiredText } from '@/lib/ops-policy';
import { auditedAction } from '@/lib/ops-audit';
import { ClickUpWriteUnverifiedError } from '@/lib/clickup';

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const scope = await guard((await params).businessSlug);
    assertWriter(scope.role);
    const body = objectInput(await req.json());
    assertConfirmation(req, body);
    const projectId = requiredText(body.projectId, 'project_id', 100);
    const tool = requiredText(body.tool, 'tool', 100);
    const input = objectInput(body.input);
    if (!CONFIRM_REQUIRED.has(tool)) throw new OpsPolicyError('invalid_action');
    const ctx = await loadOpsContext(scope.businessId, projectId);
    if (!ctx) throw new OpsPolicyError('not_found', 404);
    if (ctx.dataState !== 'available') throw new OpsPolicyError('clickup_unavailable', 503);
    const taskId = typeof input.task_id === 'string' ? input.task_id.trim() : '';
    const result = await auditedAction(scope, projectId, body.requestId as string, tool, input,
      async (capture) => {
        const r = await executeProposal(ctx, tool, input, capture.pre);
        if (r.ok && r.audit) { if (r.audit.post) capture.post(r.audit.post); if (r.audit.ref) capture.ref(r.audit.ref); }
        return r;
      },
      { target: taskId ? { kind: 'task', id: taskId } : { kind: 'project', id: projectId },
        approval: { evidence_url: input.evidence_url ?? null, evidence_reviewed: input.evidence_reviewed === true } });
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ ok: false, error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
    if (err instanceof ClickUpWriteUnverifiedError) return Response.json({ ok: false, error: 'write_unverified_check_audit_before_retry' }, { status: 502 });
    return Response.json({ ok: false, error: 'operation_unavailable_check_audit_before_retry' }, { status: 503 });
  }
}
