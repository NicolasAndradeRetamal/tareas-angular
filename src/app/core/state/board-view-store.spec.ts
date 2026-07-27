import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { List } from '../models/list';
import type { Task } from '../models/task';
import { MemoryStorageDriver } from '../storage/memory-storage-driver';
import { BOARD_STORAGE_KEY, CURRENT_SCHEMA_VERSION } from '../storage/schema';
import { STORAGE_DRIVER } from '../storage/storage-driver';
import { BoardViewStore } from './board-view-store';

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
    title: 'Café con el equipo',
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

function setup(lists: List[], tasks: Task[]): BoardViewStore {
  const driver = new MemoryStorageDriver();
  driver.write(
    BOARD_STORAGE_KEY,
    JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, savedAt: '2026-07-01T00:00:00.000Z', seeded: false, lists, tasks }),
  );
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: STORAGE_DRIVER, useValue: driver }] });
  return TestBed.inject(BoardViewStore);
}

describe('BoardViewStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no filters active', () => {
    const view = setup([makeList()], []);
    expect(view.hasActiveFilters()).toBe(false);
    expect(view.statusFilter()).toBe('all');
    expect(view.priorityFilter()).toBeNull();
  });

  it('filters pending vs completed', () => {
    const pending = makeTask({ id: 'a', status: 'todo' });
    const completed = makeTask({ id: 'b', status: 'done', completedAt: '2026-07-01T00:00:00.000Z' });
    const view = setup([makeList()], [pending, completed]);

    view.setStatusFilter('pending');
    expect(view.visibleTasks().map((t) => t.id)).toEqual(['a']);

    view.setStatusFilter('completed');
    expect(view.visibleTasks().map((t) => t.id)).toEqual(['b']);
  });

  it('filters overdue tasks', () => {
    const overdue = makeTask({ id: 'a', dueDate: '2026-07-20' });
    const future = makeTask({ id: 'b', dueDate: '2026-08-01' });
    const view = setup([makeList()], [overdue, future]);

    view.setStatusFilter('overdue');
    expect(view.visibleTasks().map((t) => t.id)).toEqual(['a']);
  });

  it('filters by priority', () => {
    const low = makeTask({ id: 'a', priority: 'low' });
    const urgent = makeTask({ id: 'b', priority: 'urgent' });
    const view = setup([makeList()], [low, urgent]);

    view.setPriorityFilter('urgent');
    expect(view.visibleTasks().map((t) => t.id)).toEqual(['b']);
  });

  it('combines multiple filters', () => {
    const match = makeTask({ id: 'a', priority: 'high', status: 'todo' });
    const wrongPriority = makeTask({ id: 'b', priority: 'low', status: 'todo' });
    const wrongStatus = makeTask({ id: 'c', priority: 'high', status: 'done', completedAt: '2026-07-01T00:00:00.000Z' });
    const view = setup([makeList()], [match, wrongPriority, wrongStatus]);

    view.setPriorityFilter('high');
    view.setStatusFilter('pending');
    expect(view.visibleTasks().map((t) => t.id)).toEqual(['a']);
    expect(view.hasActiveFilters()).toBe(true);
  });

  it('searches case- and accent-insensitively across title and description', () => {
    const task = makeTask({ id: 'a', title: 'Café con el equipo', description: '' });
    const other = makeTask({ id: 'b', title: 'Otra cosa', description: '' });
    const view = setup([makeList()], [task, other]);

    view.setQuery('cafe');
    expect(view.visibleTasks().map((t) => t.id)).toEqual(['a']);

    view.setQuery('CAFÉ');
    expect(view.visibleTasks().map((t) => t.id)).toEqual(['a']);
  });

  it('scopes visible tasks to the active list', () => {
    const secondList = makeList({ id: 'l2', name: 'Personal' });
    const inFirst = makeTask({ id: 'a', listId: 'l1' });
    const inSecond = makeTask({ id: 'b', listId: 'l2' });
    const view = setup([makeList(), secondList], [inFirst, inSecond]);

    view.setActiveList('l2');
    expect(view.visibleTasks().map((t) => t.id)).toEqual(['b']);
    expect(view.activeList()?.id).toBe('l2');
  });

  it('resetFilters clears query, status and priority', () => {
    const view = setup([makeList()], []);
    view.setQuery('x');
    view.setStatusFilter('overdue');
    view.setPriorityFilter('high');

    view.resetFilters();
    expect(view.query()).toBe('');
    expect(view.statusFilter()).toBe('all');
    expect(view.priorityFilter()).toBeNull();
    expect(view.hasActiveFilters()).toBe(false);
  });

  it('builds ordered columns for every status', () => {
    const later = makeTask({ id: 'a', status: 'todo', order: 100 });
    const earlier = makeTask({ id: 'b', status: 'todo', order: 0 });
    const view = setup([makeList()], [later, earlier]);

    const todoColumn = view.columns().find((c) => c.status === 'todo');
    expect(todoColumn?.tasks.map((t) => t.id)).toEqual(['b', 'a']);
    expect(view.columns().map((c) => c.status)).toEqual(['todo', 'in-progress', 'done']);
  });

  it('counts are scoped by active list but ignore other filters', () => {
    const secondList = makeList({ id: 'l2', name: 'Personal' });
    const inFirst = makeTask({ id: 'a', listId: 'l1', priority: 'low' });
    const inSecond = makeTask({ id: 'b', listId: 'l2', priority: 'urgent' });
    const view = setup([makeList(), secondList], [inFirst, inSecond]);

    view.setActiveList('l1');
    view.setPriorityFilter('urgent');
    expect(view.counts().total).toBe(1);
    expect(view.visibleTasks()).toEqual([]);
  });

  it('distinguishes isEmpty from hasNoResults', () => {
    const view = setup([makeList()], []);
    expect(view.isEmpty()).toBe(true);
    expect(view.hasNoResults()).toBe(false);

    const withTasks = setup([makeList()], [makeTask({ priority: 'low' })]);
    withTasks.setPriorityFilter('urgent');
    expect(withTasks.isEmpty()).toBe(false);
    expect(withTasks.hasNoResults()).toBe(true);
  });
});
