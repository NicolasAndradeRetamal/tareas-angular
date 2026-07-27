import { CdkDrag, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { BoardColumn } from '../../../core/state/board-view-store';
import type { ListId } from '../../../core/models/list';
import type { List } from '../../../core/models/list';
import type { Task, TaskId, TaskStatus } from '../../../core/models/task';
import { IconButton } from '../../../shared/ui/icon-button';
import type { IconName } from '../../../shared/ui/icon';
import { Icon } from '../../../shared/ui/icon';
import { TaskCard } from './task-card';

const STATUS_ICON: Record<TaskStatus, IconName> = {
  'todo': 'circle-dashed',
  'in-progress': 'circle-half',
  'done': 'circle-check',
};

const STATUS_TEXT_CLASS: Record<TaskStatus, string> = {
  'todo': 'text-status-todo',
  'in-progress': 'text-status-progress',
  'done': 'text-status-done',
};

@Component({
  selector: 'app-task-column',
  imports: [CdkDropList, CdkDrag, TaskCard, IconButton, Icon],
  templateUrl: './task-column.html',
  styleUrl: './task-column.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'task-column' },
})
export class TaskColumn {
  readonly column = input.required<BoardColumn>();
  readonly listIndex = input.required<ReadonlyMap<ListId, List>>();
  readonly showListMeta = input(false);
  readonly dragEnabled = input(true);
  readonly focusedTaskId = input<TaskId | null>(null);
  readonly highlightedTaskId = input<TaskId | null>(null);

  readonly addTask = output<void>();
  readonly editTask = output<TaskId>();
  readonly toggleDone = output<TaskId>();
  readonly duplicateTask = output<TaskId>();
  readonly deleteTask = output<TaskId>();
  readonly statusChange = output<{ id: TaskId; status: TaskStatus }>();
  readonly focusTask = output<TaskId>();
  readonly reordered = output<{ id: TaskId; targetIndex: number }>();

  protected readonly statusIcon = computed<IconName>(() => STATUS_ICON[this.column().status]);
  protected readonly statusTextClass = computed(() => STATUS_TEXT_CLASS[this.column().status]);
  protected readonly headingId = `column-heading-${Math.random().toString(36).slice(2)}`;

  protected onDrop(event: CdkDragDrop<readonly Task[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const task = event.item.data as Task;
    this.reordered.emit({ id: task.id, targetIndex: event.currentIndex });
  }
}
