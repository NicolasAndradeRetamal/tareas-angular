import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type {
  BoardState,
  CreateListInput,
  CreateTaskInput,
  MoveTaskTarget,
  UpdateTaskInput,
} from '../models/board-state';
import type { List, ListId } from '../models/list';
import { LIST_NAME_MAX_LENGTH } from '../models/list';
import type { MutationKind } from '../models/mutation';
import type { Task, TaskId, TaskStatus } from '../models/task';
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from '../models/task';
import { BoardStorage } from '../storage/board-storage';
import { createSeedBoard } from '../storage/seed';
import type { PersistenceError } from '../storage/storage-driver';
import { nowIso } from '../util/date';
import { newId } from '../util/id';
import { byOrder, needsRebalance, rankBetween, rebalance } from '../util/order';
import {
  canRedo as historyCanRedo,
  canUndo as historyCanUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from './history';

export type LoadIssue = 'corrupt-backed-up' | 'corrupt-lost' | null;

interface InitialLoad {
  readonly state: BoardState;
  readonly seeded: boolean;
  /** Set when the previously stored board could not be read, saying whether a copy survived. */
  readonly loadIssue: LoadIssue;
}

@Injectable({ providedIn: 'root' })
export class BoardStore {
  private readonly storage = inject(BoardStorage);

  private readonly initial = this.loadInitialState();

  private readonly _history = signal(createHistory(this.initial.state));
  private readonly _seeded = signal(this.initial.seeded);
  private readonly _persistenceError = signal<PersistenceError | null>(null);
  private readonly _loadIssue = signal<LoadIssue>(this.initial.loadIssue);

  // --- Reads ---
  readonly state = computed(() => this._history().present.value);
  readonly lists = computed(() => [...this.state().lists].sort(byOrder));
  readonly tasks = computed(() => this.state().tasks);
  readonly taskIndex = computed(() => new Map(this.tasks().map((task) => [task.id, task])));
  readonly listIndex = computed(() => new Map(this.lists().map((list) => [list.id, list])));
  readonly isSeeded = this._seeded.asReadonly();
  readonly persistenceError = this._persistenceError.asReadonly();
  /** Non-null once, right after a corrupt board was recovered on load. Not part of the closed contract. */
  readonly loadIssue = this._loadIssue.asReadonly();

  // --- History ---
  readonly canUndo = computed(() => historyCanUndo(this._history()));
  readonly canRedo = computed(() => historyCanRedo(this._history()));
  readonly undoKind = computed<MutationKind | null>(() => {
    const history = this._history();
    return history.past.length > 0 ? history.present.kind : null;
  });
  readonly redoKind = computed<MutationKind | null>(() => {
    const history = this._history();
    return history.future.length > 0 ? history.future[0].kind : null;
  });

  constructor() {
    effect(() => {
      const state = this.state();
      const seeded = this._seeded();
      const result = this.storage.save(state, { seeded });
      this._persistenceError.set(result.kind === 'failed' ? result.reason : null);
    });
  }

  undo(): void {
    this._history.update(undoHistory);
  }

  redo(): void {
    this._history.update(redoHistory);
  }

  // --- Tasks ---

  createTask(input: CreateTaskInput): TaskId {
    const title = input.title.trim();
    if (title.length === 0) {
      throw new Error('Task title must not be empty');
    }

    const id = newId();
    const timestamp = nowIso();
    const status = input.status ?? 'todo';
    const priority = input.priority ?? 'medium';
    const position = input.position ?? 'end';
    const description = (input.description ?? '').trim().slice(0, TASK_DESCRIPTION_MAX_LENGTH);
    const clampedTitle = title.slice(0, TASK_TITLE_MAX_LENGTH);

    this.commit('create-task', (current) => {
      const column = current.tasks
        .filter((task) => task.listId === input.listId && task.status === status)
        .sort(byOrder);
      const order =
        position === 'start'
          ? rankBetween(null, column[0]?.order ?? null)
          : rankBetween(column.at(-1)?.order ?? null, null);

      const task: Task = {
        id,
        listId: input.listId,
        title: clampedTitle,
        description,
        priority,
        status,
        dueDate: input.dueDate ?? null,
        order,
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: status === 'done' ? timestamp : null,
      };

      return { ...current, tasks: [...current.tasks, task] };
    });

    return id;
  }

  updateTask(id: TaskId, changes: UpdateTaskInput): void {
    const timestamp = nowIso();

    this.commit('update-task', (current) => {
      const existing = current.tasks.find((task) => task.id === id);
      if (!existing) return current;

      const nextTitle =
        changes.title !== undefined
          ? changes.title.trim().slice(0, TASK_TITLE_MAX_LENGTH)
          : existing.title;
      if (nextTitle.length === 0) {
        throw new Error('Task title must not be empty');
      }
      const nextDescription =
        changes.description !== undefined
          ? changes.description.trim().slice(0, TASK_DESCRIPTION_MAX_LENGTH)
          : existing.description;
      const nextPriority = changes.priority ?? existing.priority;
      const nextStatus = changes.status ?? existing.status;
      const nextListId = changes.listId ?? existing.listId;
      const nextDueDate = changes.dueDate !== undefined ? changes.dueDate : existing.dueDate;

      const unchanged =
        nextTitle === existing.title &&
        nextDescription === existing.description &&
        nextPriority === existing.priority &&
        nextStatus === existing.status &&
        nextListId === existing.listId &&
        nextDueDate === existing.dueDate;
      if (unchanged) return current;

      const columnChanged = nextStatus !== existing.status || nextListId !== existing.listId;
      let order = existing.order;
      if (columnChanged) {
        const destination = current.tasks
          .filter(
            (task) => task.id !== id && task.listId === nextListId && task.status === nextStatus,
          )
          .sort(byOrder);
        order = rankBetween(destination.at(-1)?.order ?? null, null);
      }

      const updated: Task = {
        ...existing,
        title: nextTitle,
        description: nextDescription,
        priority: nextPriority,
        status: nextStatus,
        listId: nextListId,
        dueDate: nextDueDate,
        order,
        updatedAt: timestamp,
        completedAt: nextStatus === 'done' ? (existing.completedAt ?? timestamp) : null,
      };

      return { ...current, tasks: current.tasks.map((task) => (task.id === id ? updated : task)) };
    });
  }

  deleteTask(id: TaskId): void {
    this.commit('delete-task', (current) => {
      if (!current.tasks.some((task) => task.id === id)) return current;
      return { ...current, tasks: current.tasks.filter((task) => task.id !== id) };
    });
  }

  setTaskStatus(id: TaskId, status: TaskStatus): void {
    const timestamp = nowIso();

    this.commit('set-task-status', (current) => {
      const existing = current.tasks.find((task) => task.id === id);
      if (!existing || existing.status === status) return current;

      const destination = current.tasks
        .filter(
          (task) => task.id !== id && task.listId === existing.listId && task.status === status,
        )
        .sort(byOrder);
      const order = rankBetween(null, destination[0]?.order ?? null);

      const updated: Task = {
        ...existing,
        status,
        order,
        updatedAt: timestamp,
        completedAt: status === 'done' ? timestamp : null,
      };

      return { ...current, tasks: current.tasks.map((task) => (task.id === id ? updated : task)) };
    });
  }

  toggleTaskDone(id: TaskId): void {
    const task = this.taskIndex().get(id);
    if (!task) return;
    this.setTaskStatus(id, task.status === 'done' ? 'todo' : 'done');
  }

  moveTask(id: TaskId, target: MoveTaskTarget): void {
    const timestamp = nowIso();

    this.commit('move-task', (current) => {
      const existing = current.tasks.find((task) => task.id === id);
      if (!existing) return current;

      const destinationColumn = current.tasks
        .filter(
          (task) =>
            task.id !== id && task.listId === target.listId && task.status === target.status,
        )
        .sort(byOrder);
      const clampedIndex = Math.max(0, Math.min(target.targetIndex, destinationColumn.length));
      const before = clampedIndex > 0 ? destinationColumn[clampedIndex - 1].order : null;
      const after =
        clampedIndex < destinationColumn.length ? destinationColumn[clampedIndex].order : null;

      const moved: Task = {
        ...existing,
        listId: target.listId,
        status: target.status,
        order: rankBetween(before, after),
        updatedAt: timestamp,
        completedAt: target.status === 'done' ? (existing.completedAt ?? timestamp) : null,
      };

      let tasks = current.tasks.map((task) => (task.id === id ? moved : task));

      if (needsRebalance(before, after)) {
        const wholeColumn = [
          ...destinationColumn.slice(0, clampedIndex),
          moved,
          ...destinationColumn.slice(clampedIndex),
        ];
        const rebalanced = rebalance(wholeColumn);
        const orderById = new Map(rebalanced.map((task) => [task.id, task.order]));
        tasks = tasks.map((task) =>
          orderById.has(task.id) ? { ...task, order: orderById.get(task.id) as number } : task,
        );
      }

      return { ...current, tasks };
    });
  }

  // --- Lists ---

  createList(input: CreateListInput): ListId {
    const name = input.name.trim();
    if (name.length === 0) {
      throw new Error('List name must not be empty');
    }

    const id = newId();
    const timestamp = nowIso();
    const clampedName = name.slice(0, LIST_NAME_MAX_LENGTH);

    this.commit('create-list', (current) => {
      const lastOrder =
        current.lists.length > 0 ? ([...current.lists].sort(byOrder).at(-1)?.order ?? null) : null;
      const list: List = {
        id,
        name: clampedName,
        color: input.color ?? 'slate',
        order: rankBetween(lastOrder, null),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return { ...current, lists: [...current.lists, list] };
    });

    return id;
  }

  renameList(id: ListId, name: string): void {
    const timestamp = nowIso();

    this.commit('rename-list', (current) => {
      const existing = current.lists.find((list) => list.id === id);
      if (!existing) return current;

      const trimmed = name.trim();
      if (trimmed.length === 0) {
        throw new Error('List name must not be empty');
      }
      const clamped = trimmed.slice(0, LIST_NAME_MAX_LENGTH);
      if (clamped === existing.name) return current;

      const updated: List = { ...existing, name: clamped, updatedAt: timestamp };
      return { ...current, lists: current.lists.map((list) => (list.id === id ? updated : list)) };
    });
  }

  deleteList(id: ListId): void {
    this.commit('delete-list', (current) => {
      if (current.lists.length <= 1) return current;
      if (!current.lists.some((list) => list.id === id)) return current;
      return {
        lists: current.lists.filter((list) => list.id !== id),
        tasks: current.tasks.filter((task) => task.listId !== id),
      };
    });
  }

  reorderList(id: ListId, targetIndex: number): void {
    const timestamp = nowIso();

    this.commit('reorder-list', (current) => {
      const existing = current.lists.find((list) => list.id === id);
      if (!existing) return current;

      const rest = current.lists.filter((list) => list.id !== id).sort(byOrder);
      const clampedIndex = Math.max(0, Math.min(targetIndex, rest.length));
      const before = clampedIndex > 0 ? rest[clampedIndex - 1].order : null;
      const after = clampedIndex < rest.length ? rest[clampedIndex].order : null;

      const moved: List = { ...existing, order: rankBetween(before, after), updatedAt: timestamp };
      let lists = current.lists.map((list) => (list.id === id ? moved : list));

      if (needsRebalance(before, after)) {
        const whole = [...rest.slice(0, clampedIndex), moved, ...rest.slice(clampedIndex)];
        const rebalanced = rebalance(whole);
        const orderById = new Map(rebalanced.map((list) => [list.id, list.order]));
        lists = lists.map((list) =>
          orderById.has(list.id) ? { ...list, order: orderById.get(list.id) as number } : list,
        );
      }

      return { ...current, lists };
    });
  }

  // --- Board ---

  /** Deletes every task and keeps a single default list. Undoable. */
  clearBoard(): void {
    const timestamp = nowIso();

    this.commit('clear-board', (current) => {
      if (current.tasks.length === 0 && current.lists.length === 1) return current;
      const [first] = [...current.lists].sort(byOrder);
      return { lists: [{ ...first, updatedAt: timestamp }], tasks: [] };
    });
  }

  // --- Single write entry point ---

  private commit(kind: MutationKind, recipe: (current: BoardState) => BoardState): void {
    const current = this.state();
    const next = recipe(current);
    if (next === current) return;
    this._history.update((history) => pushHistory(history, kind, next));
    this._seeded.set(false);
  }

  private loadInitialState(): InitialLoad {
    const result = this.storage.load();
    if (result.kind === 'loaded') {
      return { state: result.state, seeded: result.seeded, loadIssue: null };
    }
    if (result.kind === 'corrupt') {
      return {
        state: createSeedBoard(new Date()),
        seeded: true,
        loadIssue: result.backedUp ? 'corrupt-backed-up' : 'corrupt-lost',
      };
    }
    return { state: createSeedBoard(new Date()), seeded: true, loadIssue: null };
  }
}
