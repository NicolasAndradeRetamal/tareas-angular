import { describe, expect, it } from 'vitest';
import { MIN_ORDER_DELTA, ORDER_STEP, byOrder, needsRebalance, rankBetween, rebalance } from './order';

describe('rankBetween', () => {
  it('returns 0 for an empty column', () => {
    expect(rankBetween(null, null)).toBe(0);
  });

  it('inserts at the start, below the first item', () => {
    expect(rankBetween(null, 100)).toBe(100 - ORDER_STEP);
  });

  it('inserts at the end, above the last item', () => {
    expect(rankBetween(100, null)).toBe(100 + ORDER_STEP);
  });

  it('inserts at the midpoint between two neighbors', () => {
    expect(rankBetween(100, 200)).toBe(150);
  });
});

describe('needsRebalance', () => {
  it('is false at the edges of a column', () => {
    expect(needsRebalance(null, 100)).toBe(false);
    expect(needsRebalance(100, null)).toBe(false);
  });

  it('is false when neighbors are comfortably apart', () => {
    expect(needsRebalance(100, 200)).toBe(false);
  });

  it('is true once repeated insertion collapses the gap', () => {
    let before = 0;
    let after = ORDER_STEP;
    for (let i = 0; i < 2000 && !needsRebalance(before, after); i++) {
      after = rankBetween(before, after);
    }
    expect(needsRebalance(before, after)).toBe(true);
    expect(Math.abs(after - before)).toBeLessThan(MIN_ORDER_DELTA);
  });
});

describe('rebalance', () => {
  it('preserves relative order while spacing items by ORDER_STEP', () => {
    const column = [
      { id: 'a', order: 0.001 },
      { id: 'b', order: 0.0011 },
      { id: 'c', order: 0.0012 },
    ];

    const result = rebalance(column);

    expect(result.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(result.map((item) => item.order)).toEqual([0, ORDER_STEP, 2 * ORDER_STEP]);
  });

  it('does not mutate the original items', () => {
    const column = [{ id: 'a', order: 5 }];
    const result = rebalance(column);
    expect(column[0].order).toBe(5);
    expect(result[0]).not.toBe(column[0]);
  });
});

describe('byOrder', () => {
  const base = { order: 1, createdAt: '2026-01-01T00:00:00.000Z', id: 'a' };

  it('sorts by order first', () => {
    const a = { ...base, order: 1 };
    const b = { ...base, order: 2, id: 'b' };
    expect(byOrder(a, b)).toBeLessThan(0);
    expect(byOrder(b, a)).toBeGreaterThan(0);
  });

  it('falls back to createdAt when order is duplicated', () => {
    const a = { ...base, id: 'z', createdAt: '2026-01-01T00:00:00.000Z' };
    const b = { ...base, id: 'a', createdAt: '2026-01-02T00:00:00.000Z' };
    expect(byOrder(a, b)).toBeLessThan(0);
  });

  it('falls back to id as the final, total tiebreaker', () => {
    const a = { ...base, id: 'a' };
    const b = { ...base, id: 'b' };
    expect(byOrder(a, b)).toBeLessThan(0);
    expect(byOrder(a, a)).toBe(0);
  });
});
