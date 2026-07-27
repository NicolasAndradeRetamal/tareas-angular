import type { Task } from '../../core/models/task';

/**
 * A drop index counts the cards on screen, which may be a filtered subset of the
 * column. The store ranks tasks against the whole column, so the index has to be
 * translated before it means anything.
 *
 * @param siblings Whole status column, sorted by order and without the dragged task.
 * @param visibleColumn Cards rendered in the drop container, in screen order.
 */
export function resolveDropIndex(
  dragged: Task,
  siblings: readonly Task[],
  visibleColumn: readonly Task[],
  dropIndex: number,
): number {
  const withoutDragged = visibleColumn.filter((task) => task.id !== dragged.id);
  const above = withoutDragged[dropIndex - 1];

  if (above === undefined) return 0;

  const index = siblings.findIndex((task) => task.id === above.id);
  return index < 0 ? siblings.length : index + 1;
}
