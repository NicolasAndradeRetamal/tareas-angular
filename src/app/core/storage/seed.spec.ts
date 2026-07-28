import { describe, expect, it } from 'vitest';
import { TASK_STATUSES } from '../models/task';
import { isOverdue, todayIso } from '../util/date';
import { byOrder } from '../util/order';
import { createSeedBoard } from './seed';

describe('createSeedBoard', () => {
  const now = new Date('2026-07-27T10:00:00.000Z');

  it('creates exactly two lists', () => {
    const board = createSeedBoard(now);
    expect(board.lists).toHaveLength(2);
    expect(board.lists.map((list) => list.name).sort()).toEqual(['Personal', 'Trabajo']);
  });

  it('creates between ten and twelve tasks', () => {
    const board = createSeedBoard(now);
    expect(board.tasks.length).toBeGreaterThanOrEqual(10);
    expect(board.tasks.length).toBeLessThanOrEqual(12);
  });

  it('always includes at least one overdue task', () => {
    const board = createSeedBoard(now);
    const today = todayIso(now);
    expect(board.tasks.some((task) => isOverdue(task, today))).toBe(true);
  });

  it('always includes at least one task due today', () => {
    const board = createSeedBoard(now);
    const today = todayIso(now);
    expect(board.tasks.some((task) => task.dueDate === today)).toBe(true);
  });

  it('spreads tasks across the three statuses', () => {
    const board = createSeedBoard(now);
    const statuses = new Set(board.tasks.map((task) => task.status));
    expect(statuses).toEqual(new Set(['todo', 'in-progress', 'done']));
  });

  it('uses varied priorities', () => {
    const board = createSeedBoard(now);
    const priorities = new Set(board.tasks.map((task) => task.priority));
    expect(priorities.size).toBeGreaterThan(1);
  });

  it('every task references an existing list', () => {
    const board = createSeedBoard(now);
    const listIds = new Set(board.lists.map((list) => list.id));
    expect(board.tasks.every((task) => listIds.has(task.listId))).toBe(true);
  });

  it('respects the status/completedAt invariant', () => {
    const board = createSeedBoard(now);
    expect(
      board.tasks.every((task) => (task.status === 'done') === (task.completedAt !== null)),
    ).toBe(true);
  });

  it('assigns a unique, sortable order within each status column', () => {
    const board = createSeedBoard(now);
    const groups = new Map<string, typeof board.tasks>();
    for (const task of board.tasks) {
      groups.set(task.status, [...(groups.get(task.status) ?? []), task]);
    }
    for (const group of groups.values()) {
      const orders = group.map((task) => task.order);
      // A tie would fall through to the random id and reshuffle the board on every load.
      expect(new Set(orders).size).toBe(orders.length);
      expect([...group].sort(byOrder)).toEqual(group.slice().sort((a, b) => a.order - b.order));
    }
  });

  it('lays out every column identically on repeated seeds', () => {
    // Per column: order has no meaning across statuses, only inside one.
    const layoutOf = (board: ReturnType<typeof createSeedBoard>) =>
      TASK_STATUSES.map((status) =>
        board.tasks
          .filter((task) => task.status === status)
          .sort(byOrder)
          .map((task) => task.title)
          .join(' | '),
      );

    expect(layoutOf(createSeedBoard(now))).toEqual(layoutOf(createSeedBoard(now)));
  });

  it('produces relative dates that shift with the injected clock', () => {
    const boardA = createSeedBoard(new Date('2026-07-27T10:00:00.000Z'));
    const boardB = createSeedBoard(new Date('2026-08-15T10:00:00.000Z'));

    const overdueA = boardA.tasks.find((task) =>
      isOverdue(task, todayIso(new Date('2026-07-27T10:00:00.000Z'))),
    );
    const overdueB = boardB.tasks.find((task) =>
      isOverdue(task, todayIso(new Date('2026-08-15T10:00:00.000Z'))),
    );

    expect(overdueA?.dueDate).not.toBe(overdueB?.dueDate);
  });
});
