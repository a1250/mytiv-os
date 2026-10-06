import "server-only";
import type { BusinessScope } from "@/lib/focus/scope";
import type { RemoteWork } from "@/components/focus/shell/demo-store";
import { MYTIV_LIVE_CAPABILITIES, personFromRow, taskFromRow } from "@/lib/focus/adapters/work";
import { CAPABILITIES } from "@/lib/focus/fixtures/work";
import { readWorkPeople, readWorkProjects, readWorkTasks } from "./read";
import { workConnected } from "@/lib/focus/scope.server";

/**
 * The first paint of a business's Focus Work: its Work read model, read on the server for the verified scope (the
 * business id comes from the membership row, never from the URL). ClickUp-sourced work keeps the planned map until
 * its adapter is connected (it is read only on the Ops screens today).
 */
export async function loadBusinessWork(scope: BusinessScope): Promise<RemoteWork> {
  const live = workConnected();
  const [{ tasks }, people, projects] = await Promise.all([live ? readWorkTasks(scope.businessId) : { tasks: [] }, readWorkPeople(scope.businessId), live ? readWorkProjects(scope.businessId) : []]);
  const persons = people.map(personFromRow);
  const me = persons.find((p) => p.id === scope.userId) ?? { id: scope.userId, name: "את/ה", initial: "?" };
  return {
    slug: scope.slug, viewer: me, role: scope.role, live, tasks: tasks.map(taskFromRow), people: persons.filter((p) => people.find((x) => x.id === p.id)?.active),
    projects, capabilities: { mytiv: MYTIV_LIVE_CAPABILITIES, clickup: { ...CAPABILITIES.clickup, changeStatus: "planned", assign: "planned" } },
  };
}
