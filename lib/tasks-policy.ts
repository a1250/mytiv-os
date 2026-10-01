/**
 * Input policy for the legacy internal tasks API (/api/[businessSlug]/tasks). Mytiv Work package 1:
 * an explicit field allowlist with typed validation, so a request body can no longer set `doneAt`,
 * arbitrary statuses, or a project/lead id that the route has not verified belongs to the business.
 */
import { OpsPolicyError, objectInput } from './ops-policy';

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'waiting', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

const FIELDS = ['title', 'notes', 'status', 'priority', 'category', 'dueDate', 'leadId', 'projectId'] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TaskInput = {
  title?: string;
  notes?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  dueDate?: string | null;
  leadId?: string | null;
  projectId?: string | null;
};

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}

function text(value: unknown, name: string, max: number, required: boolean): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new OpsPolicyError(`invalid_${name}`);
  return required ? value.trim() : value;
}
function oneOf<T extends string>(value: unknown, allowed: readonly T[], name: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) throw new OpsPolicyError(`invalid_${name}`);
  return value as T;
}
/** YYYY-MM-DD that is a real calendar date; '' or null clears it. */
function dueDate(value: unknown): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new OpsPolicyError('invalid_due_date');
  const ms = Date.parse(`${value}T12:00:00Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== value) throw new OpsPolicyError('invalid_due_date');
  return value;
}
function optionalId(value: unknown, name: string): string | null {
  if (value === null || value === '') return null;
  if (!isUuid(value)) throw new OpsPolicyError(`invalid_${name}`);
  return value.toLowerCase();
}

/**
 * Parses a create or update body. Unknown keys — including `id`, `businessId`, `doneAt`, `createdAt` —
 * are refused (400), not silently dropped, so a caller learns the field is not writable.
 */
export function parseTaskInput(value: unknown, mode: 'create' | 'update'): TaskInput {
  const body = objectInput(value);
  const unknown = Object.keys(body).filter((k) => !(FIELDS as readonly string[]).includes(k));
  if (unknown.length) throw new OpsPolicyError('field_not_allowed');
  const out: TaskInput = {};
  if (mode === 'create' || body.title !== undefined) out.title = text(body.title, 'title', 500, true);
  if (body.notes !== undefined) out.notes = text(body.notes, 'notes', 20000, false);
  if (body.status !== undefined) out.status = oneOf(body.status, TASK_STATUSES, 'status');
  if (body.priority !== undefined) out.priority = oneOf(body.priority, TASK_PRIORITIES, 'priority');
  if (body.category !== undefined) out.category = text(body.category, 'category', 100, false);
  if (body.dueDate !== undefined) out.dueDate = dueDate(body.dueDate);
  if (body.leadId !== undefined) out.leadId = optionalId(body.leadId, 'lead_id');
  if (body.projectId !== undefined) out.projectId = optionalId(body.projectId, 'project_id');
  if (mode === 'update' && Object.keys(out).length === 0) throw new OpsPolicyError('nothing_to_update');
  return out;
}
