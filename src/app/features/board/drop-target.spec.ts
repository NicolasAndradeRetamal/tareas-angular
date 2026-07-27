import { describe, expect, it } from 'vitest';
import type { Task } from '../../core/models/task';
import { resolveDropIndex } from './drop-target';

function makeTask(id: string, order: number, listId = 'l1'): Task {
  return {
    id,
    listId,
    title: id,
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: null,
    order,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    completedAt: null,
  };
}

describe('resolveDropIndex', () => {
  const a = makeTask('a', 1024);
  const b = makeTask('b', 2048);
  const c = makeTask('c', 3072);

  it('maps a drop straight onto the column when nothing is filtered out', () => {
    const dragged = c;
    const siblings = [a, b];
    const visible = [a, b, c];

    expect(resolveDropIndex(dragged, siblings, visible, 0)).toBe(0);
    expect(resolveDropIndex(dragged, siblings, visible, 1)).toBe(1);
    expect(resolveDropIndex(dragged, siblings, visible, 2)).toBe(2);
  });

  it('skips hidden tasks so a filtered drop lands after its visible neighbour', () => {
    const hidden = makeTask('hidden', 1536);
    const dragged = c;
    const siblings = [a, hidden, b];
    const visible = [a, b, c];

    // Dropped just below `a` on screen: `hidden` sits between them in the real column.
    expect(resolveDropIndex(dragged, siblings, visible, 1)).toBe(1);
    // Dropped just below `b`, which is the third task of the real column.
    expect(resolveDropIndex(dragged, siblings, visible, 2)).toBe(3);
  });

  it('honours neighbours from other lists, since the column ranks them together', () => {
    const other = makeTask('other', 1536, 'l2');
    const dragged = c;
    const siblings = [a, b, other];
    const visible = [a, b, other, c];

    expect(resolveDropIndex(dragged, siblings, visible, 1)).toBe(1);
    // Dropped just below a card of another list: that card still holds a position.
    expect(resolveDropIndex(dragged, siblings, visible, 3)).toBe(3);
  });

  it('appends when the visible neighbour is no longer in the column', () => {
    const stale = makeTask('stale', 4096);
    const dragged = a;

    expect(resolveDropIndex(dragged, [b, c], [stale, a], 1)).toBe(2);
  });

  it('returns the first position when the task is dropped at the top', () => {
    expect(resolveDropIndex(c, [a, b], [c, a, b], 0)).toBe(0);
  });
});
