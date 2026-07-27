import type { List, ListColor, ListId } from './list';
import type { IsoDate, Task, TaskPriority, TaskStatus } from './task';

/** Full board state: what gets persisted and what the history snapshots. */
export interface BoardState {
  readonly lists: readonly List[];
  readonly tasks: readonly Task[];
}

export interface CreateTaskInput {
  readonly listId: ListId;
  readonly title: string;
  readonly description?: string;
  readonly priority?: TaskPriority;
  readonly status?: TaskStatus;
  readonly dueDate?: IsoDate | null;
  /** Column end where the task is inserted. Defaults to 'end'. */
  readonly position?: 'start' | 'end';
}

export type UpdateTaskInput = Partial<
  Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'status' | 'listId'>
>;

export interface MoveTaskTarget {
  readonly listId: ListId;
  readonly status: TaskStatus;
  /** Final position within the target column: the CDK currentIndex. */
  readonly targetIndex: number;
}

export interface CreateListInput {
  readonly name: string;
  readonly color?: ListColor;
}
