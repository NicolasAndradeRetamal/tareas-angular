import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { List } from '../models/list';
import type { Task } from '../models/task';
import { MemoryStorageDriver } from '../storage/memory-storage-driver';
import { BOARD_STORAGE_KEY, CURRENT_SCHEMA_VERSION } from '../storage/schema';
import type { SaveResult, StorageDriver } from '../storage/storage-driver';
import { STORAGE_DRIVER } from '../storage/storage-driver';
import { BoardStore } from './board-store';

function makeList(overrides: Partial<List> = {}): List {
  return {
    id: 'l1',
    name: 'Trabajo',
    color: 'blue',
    order: 0,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    listId: 'l1',
    title: 'Existing task',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: null,
    order: 0,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

function setup(seedDocument?: { lists: List[]; tasks: Task[] }): { store: BoardStore; driver: MemoryStorageDriver } {
  const driver = new MemoryStorageDriver();
  if (seedDocument) {
    driver.write(
      BOARD_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        savedAt: '2026-07-01T00:00:00.000Z',
        seeded: false,
        lists: seedDocument.lists,
        tasks: seedDocument.tasks,
      }),
    );
  }
  TestBed.configureTestingModule({ providers: [{ provide: STORAGE_DRIVER, useValue: driver }] });
  return { store: TestBed.inject(BoardStore), driver };
}

describe('BoardStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('seeding', () => {
    it('seeds a sample board when no key was stored', () => {
      const { store } = setup();
      expect(store.isSeeded()).toBe(true);
      expect(store.tasks().length).toBeGreaterThan(0);
      expect(store.lists().length).toBe(2);
    });

    it('does not re-seed an existing, empty board', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      expect(store.isSeeded()).toBe(false);
      expect(store.tasks()).toEqual([]);
    });

    it('backs up and seeds on corrupt JSON, exposing loadIssue', () => {
      const driver = new MemoryStorageDriver();
      driver.write(BOARD_STORAGE_KEY, '{not json');
      TestBed.configureTestingModule({ providers: [{ provide: STORAGE_DRIVER, useValue: driver }] });
      const store = TestBed.inject(BoardStore);

      expect(store.isSeeded()).toBe(true);
      expect(store.loadIssue()).toBe('corrupt');
    });
  });

  describe('createTask', () => {
    it('appends a task at the end of its column and stamps timestamps', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      const id = store.createTask({ listId: 'l1', title: 'New task' });

      const task = store.taskIndex().get(id);
      expect(task).toBeDefined();
      expect(task?.title).toBe('New task');
      expect(task?.status).toBe('todo');
      expect(task?.priority).toBe('medium');
      expect(task?.createdAt).toBe('2026-07-27T10:00:00.000Z');
      expect(store.canUndo()).toBe(true);
    });

    it('places a task at the start when requested', () => {
      const existing = makeTask({ id: 'first', order: 100 });
      const { store } = setup({ lists: [makeList()], tasks: [existing] });

      const id = store.createTask({ listId: 'l1', title: 'Goes first', position: 'start' });
      const task = store.taskIndex().get(id);
      expect((task?.order ?? Infinity) < existing.order).toBe(true);
    });

    it('throws on an empty title and does not create a history entry', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      expect(() => store.createTask({ listId: 'l1', title: '   ' })).toThrow();
      expect(store.canUndo()).toBe(false);
    });
  });

  describe('updateTask', () => {
    it('updates fields and bumps updatedAt', () => {
      const existing = makeTask();
      const { store } = setup({ lists: [makeList()], tasks: [existing] });

      store.updateTask('t1', { title: 'Renamed', priority: 'high' });
      const updated = store.taskIndex().get('t1');
      expect(updated?.title).toBe('Renamed');
      expect(updated?.priority).toBe('high');
      expect(updated?.updatedAt).toBe('2026-07-27T10:00:00.000Z');
    });

    it('does not create a history entry when nothing changes', () => {
      const existing = makeTask();
      const { store } = setup({ lists: [makeList()], tasks: [existing] });

      store.updateTask('t1', { title: existing.title });
      expect(store.canUndo()).toBe(false);
    });

    it('is a no-op for a non-existent id', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      store.updateTask('missing', { title: 'x' });
      expect(store.canUndo()).toBe(false);
    });

    it('keeps completedAt in sync with status', () => {
      const existing = makeTask();
      const { store } = setup({ lists: [makeList()], tasks: [existing] });

      store.updateTask('t1', { status: 'done' });
      expect(store.taskIndex().get('t1')?.completedAt).not.toBeNull();

      store.updateTask('t1', { status: 'todo' });
      expect(store.taskIndex().get('t1')?.completedAt).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('removes the task', () => {
      const { store } = setup({ lists: [makeList()], tasks: [makeTask()] });
      store.deleteTask('t1');
      expect(store.taskIndex().has('t1')).toBe(false);
    });

    it('is idempotent for a non-existent id', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      store.deleteTask('missing');
      expect(store.canUndo()).toBe(false);
    });
  });

  describe('setTaskStatus / toggleTaskDone', () => {
    it('moves the task to the start of the destination column', () => {
      const target = makeTask({ id: 'other', status: 'in-progress', order: 0 });
      const source = makeTask({ id: 't1', status: 'todo' });
      const { store } = setup({ lists: [makeList()], tasks: [target, source] });

      store.setTaskStatus('t1', 'in-progress');
      const moved = store.taskIndex().get('t1');
      expect(moved?.status).toBe('in-progress');
      expect((moved?.order ?? Infinity) < target.order).toBe(true);
    });

    it('keeps the equivalence between status and completedAt', () => {
      const { store } = setup({ lists: [makeList()], tasks: [makeTask()] });
      store.toggleTaskDone('t1');
      expect(store.taskIndex().get('t1')?.status).toBe('done');
      expect(store.taskIndex().get('t1')?.completedAt).not.toBeNull();

      store.toggleTaskDone('t1');
      expect(store.taskIndex().get('t1')?.status).toBe('todo');
      expect(store.taskIndex().get('t1')?.completedAt).toBeNull();
    });
  });

  describe('moveTask', () => {
    it('changes exactly one task when moving across columns', () => {
      const a = makeTask({ id: 'a', status: 'todo', order: 0 });
      const b = makeTask({ id: 'b', status: 'in-progress', order: 0 });
      const { store } = setup({ lists: [makeList()], tasks: [a, b] });

      store.moveTask('a', { listId: 'l1', status: 'in-progress', targetIndex: 0 });

      const movedA = store.taskIndex().get('a');
      const untouchedB = store.taskIndex().get('b');
      expect(movedA?.status).toBe('in-progress');
      expect(untouchedB).toEqual(b);
    });

    it('rebalances the destination column when neighbors collapse', () => {
      const a = makeTask({ id: 'a', status: 'todo', order: 0 });
      const b = makeTask({ id: 'b', status: 'todo', order: 1e-9 });
      const c = makeTask({ id: 'c', status: 'in-progress', order: 0 });
      const { store } = setup({ lists: [makeList()], tasks: [a, b, c] });

      store.moveTask('c', { listId: 'l1', status: 'todo', targetIndex: 1 });

      const tasks = [...store.tasks()].filter((t) => t.status === 'todo').sort((x, y) => x.order - y.order);
      const orders = tasks.map((t) => t.order);
      expect(new Set(orders).size).toBe(orders.length);
    });

    it('is a no-op for a non-existent id', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      store.moveTask('missing', { listId: 'l1', status: 'todo', targetIndex: 0 });
      expect(store.canUndo()).toBe(false);
    });
  });

  describe('lists', () => {
    it('creates a list', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      const id = store.createList({ name: 'Personal', color: 'emerald' });
      expect(store.listIndex().get(id)?.name).toBe('Personal');
    });

    it('renames a list', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      store.renameList('l1', 'Renamed');
      expect(store.listIndex().get('l1')?.name).toBe('Renamed');
    });

    it('cannot delete the last remaining list', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      store.deleteList('l1');
      expect(store.lists().length).toBe(1);
      expect(store.canUndo()).toBe(false);
    });

    it('deletes a list and cascades its tasks in a single history entry', () => {
      const second = makeList({ id: 'l2', name: 'Personal' });
      const taskInSecond = makeTask({ id: 't2', listId: 'l2' });
      const { store } = setup({ lists: [makeList(), second], tasks: [taskInSecond] });

      store.deleteList('l2');
      expect(store.listIndex().has('l2')).toBe(false);
      expect(store.taskIndex().has('t2')).toBe(false);

      store.undo();
      expect(store.listIndex().has('l2')).toBe(true);
      expect(store.taskIndex().has('t2')).toBe(true);
    });

    it('reorders lists', () => {
      const second = makeList({ id: 'l2', name: 'Personal', order: 100 });
      const { store } = setup({ lists: [makeList(), second], tasks: [] });

      store.reorderList('l2', 0);
      const [first] = store.lists();
      expect(first.id).toBe('l2');
    });
  });

  describe('clearBoard', () => {
    it('empties the tasks and keeps a single list', () => {
      const second = makeList({ id: 'l2', name: 'Personal', order: 100 });
      const { store } = setup({ lists: [makeList(), second], tasks: [makeTask()] });

      store.clearBoard();
      expect(store.lists().length).toBe(1);
      expect(store.tasks()).toEqual([]);
    });
  });

  describe('undo / redo', () => {
    it('reports the kind of the action that will be undone or redone', () => {
      const { store } = setup({ lists: [makeList()], tasks: [] });
      expect(store.undoKind()).toBeNull();

      store.createTask({ listId: 'l1', title: 'A' });
      expect(store.undoKind()).toBe('create-task');
      expect(store.redoKind()).toBeNull();

      store.undo();
      expect(store.canUndo()).toBe(false);
      expect(store.redoKind()).toBe('create-task');

      store.redo();
      expect(store.canRedo()).toBe(false);
      expect(store.tasks().length).toBe(1);
    });
  });

  describe('persistence', () => {
    it('writes to the driver after every mutation', async () => {
      const { store, driver } = setup({ lists: [makeList()], tasks: [] });
      store.createTask({ listId: 'l1', title: 'Persisted' });
      await settle();

      const raw = driver.read(BOARD_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw as string).tasks).toHaveLength(1);
    });

    it('keeps the state in memory and reports the error when the driver fails with quota', async () => {
      const seeded = JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        savedAt: '2026-07-01T00:00:00.000Z',
        seeded: false,
        lists: [makeList()],
        tasks: [],
      });
      const failingDriver: StorageDriver = {
        read: () => seeded,
        write: (): SaveResult => ({ kind: 'failed', reason: 'quota' }),
        remove: () => {},
      };
      TestBed.configureTestingModule({ providers: [{ provide: STORAGE_DRIVER, useValue: failingDriver }] });
      const store = TestBed.inject(BoardStore);

      store.createTask({ listId: store.lists()[0].id, title: 'Still works' });
      await settle();

      expect(store.persistenceError()).toBe('quota');
      expect(store.tasks().length).toBe(1);
    });

    it('reproduces the same board after a reload from the driver', async () => {
      const { store, driver } = setup({ lists: [makeList()], tasks: [] });
      store.createTask({ listId: 'l1', title: 'Round trip' });
      await settle();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: STORAGE_DRIVER, useValue: driver }] });
      const reloaded = TestBed.inject(BoardStore);

      expect(reloaded.tasks().map((t) => t.title)).toEqual(['Round trip']);
      expect(reloaded.isSeeded()).toBe(false);
    });
  });
});
