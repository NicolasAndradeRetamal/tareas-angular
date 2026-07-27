import type { Task } from '../../core/models/task';

/**
 * A drop index counts the cards on screen, which may be filtered or drawn from
 * several lists at once. The store ranks tasks inside their own (listId, status)
 * column, so the index has to be translated before it means anything.
 *
 * @param siblings Column the task belongs to, sorted by order and without the dragged task.
 * @param visibleColumn Cards rendered in the drop container, in screen order.
 */
export function resolveDropIndex(
  dragged: Task,
  siblings: readonly Task[],
  visibleColumn: readonly Task[],
  dropIndex: number,
): number {
  const withoutDragged = visibleColumn.filter((task) => task.id !== dragged.id);
  const above = withoutDragged
    .slice(0, dropIndex)
    .reverse()
    .find((task) => task.listId === dragged.listId);

  if (above === undefined) return 0;

  const index = siblings.findIndex((task) => task.id === above.id);
  return index < 0 ? siblings.length : index + 1;
}
