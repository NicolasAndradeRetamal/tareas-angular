import { Injectable, inject } from '@angular/core';
import type { BoardState } from '../models/board-state';
import type { List, ListColor } from '../models/list';
import { LIST_COLORS, LIST_NAME_MAX_LENGTH } from '../models/list';
import type { Task, TaskPriority, TaskStatus } from '../models/task';
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
} from '../models/task';
import { ORDER_STEP } from '../util/order';
import { migrate, UnsupportedSchemaVersionError } from './migrations';
import { BOARD_BACKUP_KEY, BOARD_STORAGE_KEY, CURRENT_SCHEMA_VERSION, type PersistedBoard } from './schema';
import { STORAGE_DRIVER, type SaveResult } from './storage-driver';

export type LoadResult =
  | { readonly kind: 'loaded'; readonly state: BoardState; readonly seeded: boolean }
  | { readonly kind: 'empty' }
  | { readonly kind: 'corrupt'; readonly backedUp: boolean };

@Injectable({ providedIn: 'root' })
export class BoardStorage {
  private readonly driver = inject(STORAGE_DRIVER);

  load(): LoadResult {
    const raw = this.driver.read(BOARD_STORAGE_KEY);
    if (raw === null) return { kind: 'empty' };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { kind: 'corrupt', backedUp: this.backup(raw) };
    }

    if (!isPlainObject(parsed)) {
      return { kind: 'corrupt', backedUp: this.backup(raw) };
    }

    let document: PersistedBoard;
    try {
      document = migrate(parsed);
    } catch (error) {
      if (error instanceof UnsupportedSchemaVersionError) {
        return { kind: 'corrupt', backedUp: this.backup(raw) };
      }
      throw error;
    }

    const state = normalizeBoard(document);
    if (state === null) {
      return { kind: 'corrupt', backedUp: this.backup(raw) };
    }

    return { kind: 'loaded', state, seeded: document.seeded === true };
  }

  save(state: BoardState, meta: { readonly seeded: boolean }): SaveResult {
    const document: PersistedBoard = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      seeded: meta.seeded,
      lists: state.lists,
      tasks: state.tasks,
    };
    return this.driver.write(BOARD_STORAGE_KEY, JSON.stringify(document));
  }

  clear(): void {
    this.driver.remove(BOARD_STORAGE_KEY);
  }

  private backup(raw: string): boolean {
    return this.driver.write(BOARD_BACKUP_KEY, raw).kind === 'saved';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidListColor(value: unknown): value is ListColor {
  return typeof value === 'string' && (LIST_COLORS as readonly string[]).includes(value);
}

function isValidPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && (TASK_PRIORITIES as readonly string[]).includes(value);
}

function isValidStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as readonly string[]).includes(value);
}

function isIsoDateTime(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizeList(raw: unknown): List | null {
  if (!isPlainObject(raw)) return null;
  const { id, name, color, order, createdAt, updatedAt } = raw;
  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof name !== 'string' || name.trim().length === 0) return null;
  if (!isIsoDateTime(createdAt) || !isIsoDateTime(updatedAt)) return null;

  return {
    id,
    name: name.trim().slice(0, LIST_NAME_MAX_LENGTH),
    color: isValidListColor(color) ? color : 'slate',
    order: typeof order === 'number' && Number.isFinite(order) ? order : 0,
    createdAt,
    updatedAt,
  };
}

/** Intermediate shape: `order` stays nullable until columns are resolved. */
interface SanitizedTask extends Omit<Task, 'order'> {
  readonly order: number | null;
}

function sanitizeTask(raw: unknown, listIds: ReadonlySet<string>): SanitizedTask | null {
  if (!isPlainObject(raw)) return null;
  const { id, listId, title, description, priority, status, dueDate, order, createdAt, updatedAt, completedAt } =
    raw;
  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof listId !== 'string' || !listIds.has(listId)) return null;
  if (typeof title !== 'string' || title.trim().length === 0) return null;
  if (!isIsoDateTime(createdAt) || !isIsoDateTime(updatedAt)) return null;

  const safeStatus = isValidStatus(status) ? status : 'todo';
  const rawCompletedAt = isIsoDateTime(completedAt) ? completedAt : null;

  return {
    id,
    listId,
    title: title.trim().slice(0, TASK_TITLE_MAX_LENGTH),
    description: typeof description === 'string' ? description.slice(0, TASK_DESCRIPTION_MAX_LENGTH) : '',
    priority: isValidPriority(priority) ? priority : 'medium',
    status: safeStatus,
    dueDate: isIsoDate(dueDate) ? dueDate : null,
    order: typeof order === 'number' && Number.isFinite(order) ? order : null,
    createdAt,
    updatedAt,
    completedAt: safeStatus === 'done' ? (rawCompletedAt ?? updatedAt) : null,
  };
}

/** Groups by (listId, status); items without a valid order are moved to the end. */
function resolveTaskOrder(tasks: readonly SanitizedTask[]): Task[] {
  const groups = new Map<string, SanitizedTask[]>();
  for (const task of tasks) {
    const key = `${task.listId}::${task.status}`;
    const group = groups.get(key);
    if (group) {
      group.push(task);
    } else {
      groups.set(key, [task]);
    }
  }

  const result: Task[] = [];
  for (const group of groups.values()) {
    const withOrder = group.filter((task): task is SanitizedTask & { order: number } => task.order !== null);
    const withoutOrder = group.filter((task) => task.order === null);
    withOrder.sort((a, b) => (a.order === b.order ? a.createdAt.localeCompare(b.createdAt) : a.order - b.order));
    withoutOrder.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const ordered = [...withOrder, ...withoutOrder];
    const needsReindex = withoutOrder.length > 0;
    ordered.forEach((task, index) => {
      result.push({ ...task, order: needsReindex ? index * ORDER_STEP : (task.order as number) });
    });
  }
  return result;
}

function normalizeBoard(document: PersistedBoard): BoardState | null {
  if (!Array.isArray(document.lists)) return null;

  const lists = document.lists.map(sanitizeList).filter((list): list is List => list !== null);
  if (lists.length === 0) return null;

  const listIds = new Set(lists.map((list) => list.id));
  const rawTasks = Array.isArray(document.tasks) ? document.tasks : [];
  const sanitizedTasks = rawTasks
    .map((raw) => sanitizeTask(raw, listIds))
    .filter((task): task is SanitizedTask => task !== null);

  return {
    lists,
    tasks: resolveTaskOrder(sanitizedTasks),
  };
}
