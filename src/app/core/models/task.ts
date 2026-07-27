import type { ListId } from './list';

export type TaskId = string;

/** Local calendar date, format 'YYYY-MM-DD'. No time or zone attached. */
export type IsoDate = string;

/** UTC instant, full ISO 8601 format. */
export type IsoDateTime = string;

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['todo', 'in-progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Weight used to sort by descending priority. */
export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Por hacer',
  'in-progress': 'En progreso',
  done: 'Completada',
};

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

export interface Task {
  readonly id: TaskId;
  readonly listId: ListId;
  readonly title: string;
  /** Empty string when there is no description; never null. */
  readonly description: string;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly dueDate: IsoDate | null;
  /** Fractional rank within its status column, across every list. */
  readonly order: number;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly completedAt: IsoDateTime | null;
}
