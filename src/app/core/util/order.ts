/** Default separation between consecutive items. */
export const ORDER_STEP = 1024;

/** Below this distance between neighbors, the column should be rebalanced. */
export const MIN_ORDER_DELTA = 1e-6;

/** Rank located between two neighbors; null marks the edge of the column. */
export function rankBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 0;
  if (before === null) return (after as number) - ORDER_STEP;
  if (after === null) return before + ORDER_STEP;
  return (before + after) / 2;
}

/** true when neighbors are so close together that a rebalance is worthwhile. */
export function needsRebalance(before: number | null, after: number | null): boolean {
  if (before === null || after === null) return false;
  return Math.abs(after - before) < MIN_ORDER_DELTA;
}

/** Reassigns 0, ORDER_STEP, 2*ORDER_STEP... to an already ordered single column. */
export function rebalance<T extends { order: number }>(column: readonly T[]): T[] {
  return column.map((item, index) => ({ ...item, order: index * ORDER_STEP }));
}

/** Total, stable comparator: order, then createdAt, then id. */
export function byOrder<T extends { order: number; createdAt: string; id: string }>(
  a: T,
  b: T,
): number {
  if (a.order !== b.order) return a.order - b.order;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}
