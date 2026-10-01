/**
 * Which source holds a project's work. Until Mytiv Work's per-project cutover exists (projects.work_source,
 * a later migration), every readable project is held by ClickUp; unlinked/unauthorized projects have none.
 */
import 'server-only';
import type { ClientFolder } from '../ops-config';
import { clickupOpenItems, clickupProjectSource } from './clickup-adapter';
import type { TaskQuerySource, WorkItemsRead } from './types';

export function projectTaskSource(folder: ClientFolder | null): TaskQuerySource | null {
  return folder ? clickupProjectSource(folder) : null;
}

export function openItemsAcross(folders: ClientFolder[]): Promise<WorkItemsRead> {
  return clickupOpenItems(folders);
}
