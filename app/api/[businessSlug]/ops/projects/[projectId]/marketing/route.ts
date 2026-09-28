import { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '@/lib/api-guard';
import { getProject } from '@/lib/db/queries/projects';
import { marketingBinding, importPlan } from '@/lib/marketing/service';
import { parseMarketingPlan } from '@/lib/marketing/contract';
import { OpsPolicyError, assertConfirmation, assertWriter, objectInput } from '@/lib/ops-policy';
import { auditedAction } from '@/lib/ops-audit';
import { requireScopedTask } from '@/lib/ops-access';
import { folderFromProject } from '@/lib/ops-config';

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; projectId: string }> }) {
  try {
    const { businessSlug, projectId } = await params;
    const scope = await guard(businessSlug); assertWriter(scope.role);
    const project = await getProject(scope.businessId, projectId);
    if (!project) throw new OpsPolicyError('not_found', 404);
    const binding = marketingBinding(businessSlug, projectId);
    if (!binding) throw new OpsPolicyError('marketing_not_connected', 409);
    const text = await req.text();
    if (text.length > 250000) throw new OpsPolicyError('payload_too_large', 413);
    const body = objectInput(JSON.parse(text)); assertConfirmation(req, body);
    const plan = parseMarketingPlan(body.plan, binding);
    for (const item of plan.items) if (item.clickupTaskId) await requireScopedTask(folderFromProject(project), item.clickupTaskId);
    const result = await auditedAction(scope, projectId, body.requestId as string, 'marketing_import', plan, () => importPlan(scope.businessId, projectId, scope.userId, plan), { target: { kind: 'project', id: projectId } });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ error: 'invalid_json' }, { status: 400 });
    return Response.json({ error: 'import_unavailable' }, { status: 503 });
  }
}
