import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { List } from '../models/list';
import type { Task } from '../models/task';
import { BoardStorage } from './board-storage';
import { MemoryStorageDriver } from './memory-storage-driver';
import { BOARD_BACKUP_KEY, BOARD_STORAGE_KEY } from './schema';
import type { StorageDriver } from './storage-driver';
import { STORAGE_DRIVER } from './storage-driver';

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
    title: 'Preparar informe',
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

describe('BoardStorage', () => {
  let storage: BoardStorage;
  let driver: MemoryStorageDriver;

  beforeEach(() => {
    driver = new MemoryStorageDriver();
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_DRIVER, useValue: driver }],
    });
    storage = TestBed.inject(BoardStorage);
  });

  it('reports empty when the key is absent', () => {
    expect(storage.load()).toEqual({ kind: 'empty' });
  });

  it('loads a valid document', () => {
    const list = makeList();
    const task = makeTask();
    driver.write(
      BOARD_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, savedAt: '2026-07-01T00:00:00.000Z', seeded: true, lists: [list], tasks: [task] }),
    );

    const result = storage.load();
    expect(result.kind).toBe('loaded');
    if (result.kind === 'loaded') {
      expect(result.seeded).toBe(true);
      expect(result.state.lists).toEqual([list]);
      expect(result.state.tasks).toEqual([task]);
    }
  });

  it('treats malformed JSON as corrupt and keeps a backup', () => {
    driver.write(BOARD_STORAGE_KEY, '{not json');

    const result = storage.load();
    expect(result).toEqual({ kind: 'corrupt', backedUp: true });
    expect(driver.read(BOARD_BACKUP_KEY)).toBe('{not json');
  });

  it('treats a schema version newer than supported as corrupt', () => {
    driver.write(BOARD_STORAGE_KEY, JSON.stringify({ schemaVersion: 99, lists: [], tasks: [] }));

    expect(storage.load()).toEqual({ kind: 'corrupt', backedUp: true });
  });

  it('treats a document with no lists array as corrupt', () => {
    driver.write(BOARD_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, seeded: false, tasks: [] }));

    expect(storage.load()).toEqual({ kind: 'corrupt', backedUp: true });
  });

  it('treats a document whose lists are all invalid as corrupt', () => {
    driver.write(
      BOARD_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, seeded: false, lists: [{ id: '', name: '' }], tasks: [] }),
    );

    expect(storage.load()).toEqual({ kind: 'corrupt', backedUp: true });
  });

  it('drops tasks whose listId does not reference an existing list', () => {
    const list = makeList();
    const orphan = makeTask({ id: 'orphan', listId: 'missing-list' });
    driver.write(
      BOARD_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, seeded: false, lists: [list], tasks: [orphan] }),
    );

    const result = storage.load();
    expect(result.kind).toBe('loaded');
    if (result.kind === 'loaded') {
      expect(result.state.tasks).toEqual([]);
    }
  });

  it('moves tasks with a non-numeric order to the end of their column', () => {
    const list = makeList();
    const first = makeTask({ id: 'first', order: 100 });
    const broken = makeTask({ id: 'broken', order: Number.NaN as unknown as number, createdAt: '2026-07-02T00:00:00.000Z' });
    driver.write(
      BOARD_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        seeded: false,
        lists: [list],
        tasks: [{ ...broken, order: 'not-a-number' }, first],
      }),
    );

    const result = storage.load();
    expect(result.kind).toBe('loaded');
    if (result.kind === 'loaded') {
      const [firstTask, secondTask] = result.state.tasks;
      expect(firstTask.id).toBe('first');
      expect(secondTask.id).toBe('broken');
      expect(secondTask.order).toBeGreaterThan(firstTask.order);
    }
  });

  it('reconciles completedAt with status', () => {
    const list = makeList();
    const inconsistent = makeTask({ status: 'done', completedAt: null });
    driver.write(
      BOARD_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, seeded: false, lists: [list], tasks: [inconsistent] }),
    );

    const result = storage.load();
    expect(result.kind).toBe('loaded');
    if (result.kind === 'loaded') {
      expect(result.state.tasks[0].completedAt).not.toBeNull();
    }
  });

  it('round-trips a save through load', () => {
    const state = { lists: [makeList()], tasks: [makeTask()] };
    storage.save(state, { seeded: false });

    const result = storage.load();
    expect(result.kind).toBe('loaded');
    if (result.kind === 'loaded') {
      expect(result.state).toEqual(state);
      expect(result.seeded).toBe(false);
    }
  });

  it('removes the board key on clear', () => {
    storage.save({ lists: [makeList()], tasks: [] }, { seeded: false });
    storage.clear();
    expect(storage.load()).toEqual({ kind: 'empty' });
  });

  it('surfaces a failed save from the driver', () => {
    const failingDriver: StorageDriver = {
      read: () => null,
      write: () => ({ kind: 'failed', reason: 'quota' }),
      remove: () => {},
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: STORAGE_DRIVER, useValue: failingDriver }] });
    const failingStorage = TestBed.inject(BoardStorage);

    const result = failingStorage.save({ lists: [makeList()], tasks: [] }, { seeded: false });
    expect(result).toEqual({ kind: 'failed', reason: 'quota' });
  });
});
