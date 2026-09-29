import { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '@/lib/api-guard';
import { getProject } from '@/lib/db/queries/projects';
import { getMarketingBinding, importPlan } from '@/lib/marketing/service';
import { validateMarketingPlan } from '@/lib/marketing/validate';
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
    const binding = await getMarketingBinding(scope.businessId, projectId);
    if (!binding) throw new OpsPolicyError('marketing_not_connected', 409);
    const text = await req.text();
    if (text.length > 250000) throw new OpsPolicyError('payload_too_large', 413);
    const body = objectInput(JSON.parse(text)); assertConfirmation(req, body);
    // The human confirmed a plan against the binding version they saw; a rebind/revoke since then makes
    // that confirmation stale (T-2.3) — refuse rather than import under a different binding.
    if (body.bindingVersion !== binding.bindingVersion) throw new OpsPolicyError('stale_binding_version', 409);
    const plan = validateMarketingPlan(body.plan, binding.marketingBusiness);
    for (const item of plan.items) if (item.clickupTaskId) await requireScopedTask(folderFromProject(project), item.clickupTaskId);
    const result = await auditedAction(scope, projectId, body.requestId as string, 'marketing_import', plan, () => importPlan(scope.businessId, projectId, scope.userId, plan, binding), { target: { kind: 'project', id: projectId } });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ error: 'invalid_json' }, { status: 400 });
    return Response.json({ error: 'import_unavailable' }, { status: 503 });
  }
}
