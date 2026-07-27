import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { List } from '../../../core/models/list';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../../core/models/task';
import type { Task } from '../../../core/models/task';
import { formatDueLabel, isOverdue, todayIso } from '../../../core/util/date';
import { Button } from '../../../shared/ui/button';
import { Dialog } from '../../../shared/ui/dialog';
import { nextDomId } from '../../../shared/ui/dom-id';
import { Icon } from '../../../shared/ui/icon';
import { LIST_COLOR_BG_CLASS } from '../../../shared/ui/list-color';

const DATE_FORMAT = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

@Component({
  selector: 'app-task-detail',
  imports: [Dialog, Button, Icon],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetail {
  readonly open = input.required<boolean>();
  readonly task = input<Task | null>(null);
  readonly list = input<List | null>(null);

  readonly edit = output<void>();
  readonly duplicate = output<void>();
  readonly remove = output<void>();
  readonly toggleDone = output<void>();
  readonly closed = output<void>();

  protected readonly titleId = nextDomId('task-detail-title');
  private readonly today = todayIso();

  protected readonly statusLabel = computed(() => {
    const task = this.task();
    return task ? STATUS_LABELS[task.status] : '';
  });

  protected readonly priorityLabel = computed(() => {
    const task = this.task();
    return task ? PRIORITY_LABELS[task.priority] : '';
  });

  protected readonly dueLabel = computed(() => {
    const task = this.task();
    return task ? formatDueLabel(task.dueDate, this.today, task.status === 'done') : '';
  });

  protected readonly overdue = computed(() => {
    const task = this.task();
    return task !== null && isOverdue(task, this.today);
  });

  protected readonly listDotClass = computed(() => {
    const list = this.list();
    return list ? LIST_COLOR_BG_CLASS[list.color] : '';
  });

  protected readonly isDone = computed(() => this.task()?.status === 'done');

  protected formatStamp(iso: string): string {
    return DATE_FORMAT.format(new Date(iso));
  }
}
