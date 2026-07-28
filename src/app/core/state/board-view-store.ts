import { Injectable, computed, inject, signal } from '@angular/core';
import type { List, ListId } from '../models/list';
import { STATUS_LABELS, TASK_STATUSES } from '../models/task';
import type { Task, TaskPriority } from '../models/task';
import { isOverdue, todayIso } from '../util/date';
import { byOrder } from '../util/order';
import { normalizeText } from '../util/text';
import { BoardStore } from './board-store';

export type StatusFilter = 'all' | 'pending' | 'completed' | 'overdue';

export interface BoardColumn {
  readonly status: (typeof TASK_STATUSES)[number];
  readonly label: string;
  readonly tasks: readonly Task[];
}

export interface BoardCounts {
  readonly total: number;
  readonly pending: number;
  readonly completed: number;
  readonly overdue: number;
}

@Injectable({ providedIn: 'root' })
export class BoardViewStore {
  private readonly board = inject(BoardStore);
  private readonly today = todayIso();

  private readonly _query = signal('');
  private readonly _statusFilter = signal<StatusFilter>('all');
  private readonly _priorityFilter = signal<TaskPriority | null>(null);
  private readonly _activeListId = signal<ListId | null>(null);

  // --- Query state ---
  readonly query = this._query.asReadonly();
  readonly statusFilter = this._statusFilter.asReadonly();
  readonly priorityFilter = this._priorityFilter.asReadonly();
  readonly activeListId = this._activeListId.asReadonly();
  readonly hasActiveFilters = computed(
    () =>
      this._query().trim().length > 0 ||
      this._statusFilter() !== 'all' ||
      this._priorityFilter() !== null,
  );

  setQuery(value: string): void {
    this._query.set(value);
  }

  setStatusFilter(value: StatusFilter): void {
    this._statusFilter.set(value);
  }

  setPriorityFilter(value: TaskPriority | null): void {
    this._priorityFilter.set(value);
  }

  setActiveList(id: ListId | null): void {
    this._activeListId.set(id);
  }

  resetFilters(): void {
    this._query.set('');
    this._statusFilter.set('all');
    this._priorityFilter.set(null);
  }

  // --- Derived ---
  readonly activeList = computed<List | null>(() => {
    const id = this._activeListId();
    return id === null ? null : (this.board.listIndex().get(id) ?? null);
  });

  readonly visibleTasks = computed(() => {
    const listId = this._activeListId();
    const query = normalizeText(this._query().trim());
    const statusFilter = this._statusFilter();
    const priorityFilter = this._priorityFilter();
    const today = this.today;

    return this.board.tasks().filter((task) => {
      if (listId !== null && task.listId !== listId) return false;
      if (priorityFilter !== null && task.priority !== priorityFilter) return false;
      if (!matchesStatusFilter(task, statusFilter, today)) return false;
      if (query.length > 0 && !normalizeText(`${task.title} ${task.description}`).includes(query))
        return false;
      return true;
    });
  });

  readonly columns = computed<readonly BoardColumn[]>(() => {
    const visible = this.visibleTasks();
    return TASK_STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      tasks: visible.filter((task) => task.status === status).sort(byOrder),
    }));
  });

  readonly counts = computed<BoardCounts>(() => {
    const listId = this._activeListId();
    const today = this.today;
    const scoped =
      listId === null
        ? this.board.tasks()
        : this.board.tasks().filter((task) => task.listId === listId);

    return {
      total: scoped.length,
      pending: scoped.filter((task) => task.status !== 'done').length,
      completed: scoped.filter((task) => task.status === 'done').length,
      overdue: scoped.filter((task) => isOverdue(task, today)).length,
    };
  });

  /** No tasks anywhere on the board, regardless of the active list or filters. */
  readonly isEmpty = computed(() => this.board.tasks().length === 0);
  /** There are tasks, but none pass the current scope and filters. */
  readonly hasNoResults = computed(() => !this.isEmpty() && this.visibleTasks().length === 0);
}

function matchesStatusFilter(task: Task, filter: StatusFilter, today: string): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'pending':
      return task.status !== 'done';
    case 'completed':
      return task.status === 'done';
    case 'overdue':
      return isOverdue(task, today);
  }
}
