import { NextRequest } from 'next/server';
import { guard, ApiGuardError } from '@/lib/api-guard';
import { getProject } from '@/lib/db/queries/projects';
import { bindMarketing, revokeMarketing } from '@/lib/marketing/binding-store';
import { MARKETING_TENANT_SLUG } from '@/lib/marketing/binding';
import { OpsPolicyError, assertConfirmation, assertOwner, objectInput } from '@/lib/ops-policy';
import { auditedAction } from '@/lib/ops-audit';

/**
 * Owner-only marketing tenant binding editor (T-2.2, owner decision D2): bind, rebind (new version) or
 * revoke ("not connected") the marketing-os tenant of one project. Admins and members are refused; every
 * change is a governed, audited action and also an event in the append-only binding log.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; projectId: string }> }) {
  try {
    const { businessSlug, projectId } = await params;
    const scope = await guard(businessSlug); assertOwner(scope.role);
    const project = await getProject(scope.businessId, projectId);
    if (!project) throw new OpsPolicyError('not_found', 404);
    const text = await req.text();
    if (text.length > 10000) throw new OpsPolicyError('payload_too_large', 413);
    const body = objectInput(JSON.parse(text)); assertConfirmation(req, body);
    const requestId = body.requestId as string;
    const target = { kind: 'project' as const, id: projectId };
    if (body.action === 'bind') {
      const marketingBusiness = body.marketingBusiness;
      if (typeof marketingBusiness !== 'string' || !MARKETING_TENANT_SLUG.test(marketingBusiness)) throw new OpsPolicyError('invalid_marketing_business');
      const result = await auditedAction(scope, projectId, requestId, 'marketing_bind', { marketingBusiness },
        () => bindMarketing(scope, projectId, marketingBusiness, requestId), { target });
      return Response.json(result);
    }
    if (body.action === 'revoke') {
      const result = await auditedAction(scope, projectId, requestId, 'marketing_revoke', { revoke: true },
        () => revokeMarketing(scope, projectId, requestId), { target });
      return Response.json(result);
    }
    throw new OpsPolicyError('invalid_action');
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof OpsPolicyError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ error: 'invalid_json' }, { status: 400 });
    return Response.json({ error: 'binding_unavailable' }, { status: 503 });
  }
}
