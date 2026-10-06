import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { WorkPersonRow, WorkProjectRow, WorkTaskRow } from "@/lib/focus/adapters/work";

/**
 * The Mytiv Work read model for one business (what Focus renders): every live task with its status key/label,
 * dependencies, sub-tasks, participants, last writer and recent activity; the business's members and projects.
 * Tenant-scoped by `business_id` in every subquery. Read-only.
 */
const TASK_LIMIT = 2000;

const rowsOf = <T,>(res: unknown): T[] => (res as { rows: Record<string, unknown>[] }).rows.map((r) => {
  const v = Object.values(r)[0];
  return (typeof v === "string" ? JSON.parse(v) : v) as T;
});

export async function readWorkTasks(businessId: string, onlyTaskId?: string): Promise<{ tasks: WorkTaskRow[]; complete: boolean }> {
  const res = await db.execute(sql`
    select json_build_object(
      'id', t.id, 'title', t.title, 'notes', coalesce(t.notes, ''), 'statusKey', s.key, 'statusLabel', s.label_he,
      'category', t.status_category, 'legacyStatus', t.status, 'priority', t.priority, 'ownerUserId', t.owner_user_id,
      'startOn', t.start_on, 'dueOn', coalesce(t.due_on::text, t.due_date), 'estimateMinutes', t.estimate_minutes,
      'parentId', t.parent_id, 'projectId', t.project_id, 'leadId', t.lead_id, 'projectName', p.name, 'client', p.client,
      'nextAction', t.next_action, 'followUpOn', t.follow_up_on, 'blockedReason', t.blocked_reason, 'waitingOn', t.waiting_on,
      'version', t.version, 'updatedAt', t.updated_at,
      'updatedBy', (select e.actor_id from work_events e where e.business_id = t.business_id and e.task_id = t.id order by e.at desc limit 1),
      'participants', coalesce((select json_agg(m.user_id order by m.added_at) from task_members m where m.business_id = t.business_id and m.task_id = t.id), '[]'::json),
      'dependsOn', coalesce((select json_agg(json_build_object('id', o.id, 'title', o.title) order by d.created_at)
                              from task_dependencies d join tasks o on o.business_id = d.business_id and o.id = d.depends_on_id
                             where d.business_id = t.business_id and d.task_id = t.id and o.deleted_at is null), '[]'::json),
      'children', coalesce((select json_agg(json_build_object('id', c.id, 'title', c.title, 'done', c.status_category = 'done',
                              'ownerUserId', c.owner_user_id, 'dueOn', c.due_on) order by c.created_at)
                             from tasks c where c.business_id = t.business_id and c.parent_id = t.id and c.deleted_at is null), '[]'::json),
      'activity', coalesce((select json_agg(x) from (select e.id, e.at, e.actor_id as "actorId", e.event, e.detail from work_events e
                             where e.business_id = t.business_id and e.task_id = t.id order by e.at desc limit 20) x), '[]'::json)
    ) as task
    from tasks t
    left join work_statuses s on s.business_id = t.business_id and s.id = t.status_id
    left join projects p on p.business_id = t.business_id and p.id = t.project_id
    where t.business_id = ${businessId}::uuid and t.deleted_at is null and t.archived_at is null
      and (${onlyTaskId ?? null}::uuid is null or t.id = ${onlyTaskId ?? null}::uuid)
    order by t.created_at
    limit ${TASK_LIMIT + 1}`);
  const tasks = rowsOf<WorkTaskRow>(res);
  return { tasks: tasks.slice(0, TASK_LIMIT), complete: tasks.length <= TASK_LIMIT };
}

export async function readWorkPeople(businessId: string): Promise<WorkPersonRow[]> {
  const res = await db.execute(sql`
    select json_build_object('id', u.id, 'name', coalesce(nullif(u.name, ''), split_part(u.email, '@', 1)), 'role', m.role,
                             'active', m.deactivated_at is null) as person
      from business_memberships m join users u on u.id = m.user_id
     where m.business_id = ${businessId}::uuid order by u.name`);
  return rowsOf<WorkPersonRow>(res);
}

export async function readWorkProjects(businessId: string): Promise<WorkProjectRow[]> {
  const res = await db.execute(sql`
    select json_build_object('id', p.id, 'name', p.name, 'client', p.client, 'workSource', p.work_source) as project
      from projects p where p.business_id = ${businessId}::uuid and p.archived_at is null order by p.name`);
  return rowsOf<WorkProjectRow>(res);
}
