import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { BoardColumn } from '../../../core/state/board-view-store';
import type { ListId } from '../../../core/models/list';
import type { List } from '../../../core/models/list';
import type { Task, TaskId, TaskStatus } from '../../../core/models/task';
import { nextDomId } from '../../../shared/ui/dom-id';
import { IconButton } from '../../../shared/ui/icon-button';
import type { IconName } from '../../../shared/ui/icon';
import { Icon } from '../../../shared/ui/icon';
import { STATUS_ICON, STATUS_TEXT_CLASS } from '../../../shared/ui/status-icon';
import { TaskCard } from './task-card';

@Component({
  selector: 'app-task-column',
  imports: [CdkDropList, CdkDrag, TaskCard, IconButton, Icon],
  templateUrl: './task-column.html',
  styleUrl: './task-column.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'task-column',
    '[class.task-column--drop-target]': 'isDropTarget()',
  },
})
export class TaskColumn {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly column = input.required<BoardColumn>();
  readonly listIndex = input.required<ReadonlyMap<ListId, List>>();
  readonly showListMeta = input(false);
  readonly dragEnabled = input(true);
  readonly focusedTaskId = input<TaskId | null>(null);
  readonly highlightedTaskId = input<TaskId | null>(null);

  readonly addTask = output<void>();
  readonly openTask = output<TaskId>();
  readonly editTask = output<TaskId>();
  readonly toggleDone = output<TaskId>();
  readonly duplicateTask = output<TaskId>();
  readonly deleteTask = output<TaskId>();
  readonly statusChange = output<{ id: TaskId; status: TaskStatus }>();
  readonly focusTask = output<TaskId>();
  readonly reordered = output<{ id: TaskId; targetIndex: number }>();

  protected readonly statusIcon = computed<IconName>(() => STATUS_ICON[this.column().status]);
  protected readonly statusTextClass = computed(() => STATUS_TEXT_CLASS[this.column().status]);
  protected readonly headingId = nextDomId('column-heading');
  /** Only the column under the pointer is highlighted; the rest stay untouched. */
  protected readonly isDropTarget = signal(false);
  protected readonly countLabel = computed(() => {
    const count = this.column().tasks.length;
    return count === 1 ? '1 tarea' : `${count} tareas`;
  });

  protected onDrop(event: CdkDragDrop<readonly Task[]>): void {
    this.isDropTarget.set(false);

    // The CDK keeps the item in the last column it entered even if the pointer left
    // it, so releasing over the top bar would still move the task. The whole column
    // counts as a destination, padding included — not just the list of cards.
    const bounds = this.host.nativeElement.getBoundingClientRect();
    const { x, y } = event.dropPoint;
    const insideColumn =
      x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    if (!insideColumn) return;

    const sameColumn = event.previousContainer === event.container;
    if (sameColumn && event.previousIndex === event.currentIndex) return;

    const task = event.item.data as Task;
    this.reordered.emit({ id: task.id, targetIndex: event.currentIndex });
  }

  protected onDropListEntered(): void {
    this.isDropTarget.set(true);
  }

  protected onDropListExited(): void {
    this.isDropTarget.set(false);
  }
}
