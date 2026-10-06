/**
 * Tenant check for ids a task may link to. A project or lead id from a request body is accepted only
 * after it is found in the caller's own business — an id from another business is answered exactly like
 * an id that does not exist. No auth/route dependencies, so scripts (the leak audit) can call it too.
 */
import { getProject } from "./db/queries/projects";
import { getLead } from "./db/queries/leads";
import { OpsPolicyError } from "./ops-policy";
import type { TaskInput } from "./tasks-policy";

export async function assertTaskLinksInBusiness(businessId: string, input: TaskInput) {
  if (input.projectId && !(await getProject(businessId, input.projectId))) throw new OpsPolicyError("project_not_found", 404);
  if (input.leadId && !(await getLead(businessId, input.leadId))) throw new OpsPolicyError("lead_not_found", 404);
}
