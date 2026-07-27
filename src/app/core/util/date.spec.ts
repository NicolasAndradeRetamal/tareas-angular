import { describe, expect, it } from 'vitest';
import { daysUntil, formatDueLabel, isOverdue, nowIso, todayIso } from './date';
import type { Task } from '../models/task';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    listId: 'l1',
    title: 'Task',
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

describe('todayIso / nowIso', () => {
  it('formats a local calendar date without shifting across time zones', () => {
    const date = new Date(2026, 6, 27, 23, 59);
    expect(todayIso(date)).toBe('2026-07-27');
  });

  it('pads single-digit months and days', () => {
    const date = new Date(2026, 0, 5);
    expect(todayIso(date)).toBe('2026-01-05');
  });

  it('returns a full UTC ISO instant', () => {
    const date = new Date('2026-07-27T10:00:00.000Z');
    expect(nowIso(date)).toBe('2026-07-27T10:00:00.000Z');
  });
});

describe('isOverdue', () => {
  it('is false when there is no due date', () => {
    expect(isOverdue(makeTask({ dueDate: null }), '2026-07-27')).toBe(false);
  });

  it('is false for a task due today', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-07-27' }), '2026-07-27')).toBe(false);
  });

  it('is true for a task due yesterday', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-07-26' }), '2026-07-27')).toBe(true);
  });

  it('is false for a completed task even if overdue', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-07-26', status: 'done' }), '2026-07-27')).toBe(
      false,
    );
  });
});

describe('daysUntil', () => {
  it('is 0 for the same day', () => {
    expect(daysUntil('2026-07-27', '2026-07-27')).toBe(0);
  });

  it('is negative for a past date', () => {
    expect(daysUntil('2026-07-25', '2026-07-27')).toBe(-2);
  });

  it('is positive for a future date', () => {
    expect(daysUntil('2026-07-30', '2026-07-27')).toBe(3);
  });

  it('does not shift across a month boundary', () => {
    expect(daysUntil('2026-08-01', '2026-07-31')).toBe(1);
  });
});

describe('formatDueLabel', () => {
  it('returns an empty string when there is no date', () => {
    expect(formatDueLabel(null, '2026-07-27')).toBe('');
  });

  it('labels an overdue date with days and full date including year', () => {
    expect(formatDueLabel('2026-07-25', '2026-07-27')).toBe('Venció hace 2 días · 25 jul 2026');
  });

  it('uses singular "día" for exactly one day overdue', () => {
    expect(formatDueLabel('2026-07-26', '2026-07-27')).toBe('Venció hace 1 día · 26 jul 2026');
  });

  it('labels today with the full date including year', () => {
    expect(formatDueLabel('2026-07-27', '2026-07-27')).toBe('Vence hoy · 27 jul 2026');
  });

  it('labels tomorrow with the full date including year', () => {
    expect(formatDueLabel('2026-07-28', '2026-07-27')).toBe('Vence mañana · 28 jul 2026');
  });

  it('omits the year for a future date within the current year', () => {
    expect(formatDueLabel('2026-09-03', '2026-07-27')).toBe('3 sep');
  });

  it('includes the year for a future date in a different year', () => {
    expect(formatDueLabel('2027-03-03', '2026-07-27')).toBe('3 mar 2027');
  });
});
