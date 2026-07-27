import { CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { List } from '../../../core/models/list';
import { PRIORITY_WEIGHT, TASK_STATUSES, STATUS_LABELS } from '../../../core/models/task';
import type { Task, TaskStatus } from '../../../core/models/task';
import { daysUntil, isOverdue, todayIso } from '../../../core/util/date';
import { Badge } from '../../../shared/ui/badge';
import type { BadgeVariant } from '../../../shared/ui/badge';
import { nextDomId } from '../../../shared/ui/dom-id';
import { Icon } from '../../../shared/ui/icon';
import { LIST_COLOR_BG_CLASS } from '../../../shared/ui/list-color';
import { DueLabelPipe } from '../../../shared/pipes/due-label-pipe';
import { PriorityLabelPipe } from '../../../shared/pipes/priority-label-pipe';

const PRIORITY_BAR_CLASS: Record<Task['priority'], string> = {
  low: 'bg-priority-low',
  medium: 'bg-priority-medium',
  high: 'bg-priority-high',
  urgent: 'bg-priority-urgent',
};

const PRIORITY_STRIPE_CLASS: Record<Task['priority'], string> = {
  low: 'bg-line',
  medium: 'bg-priority-medium',
  high: 'bg-priority-high',
  urgent: 'bg-priority-urgent',
};

@Component({
  selector: 'app-task-card',
  imports: [CdkDragHandle, Icon, Badge, DueLabelPipe, PriorityLabelPipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'article',
    '[id]': '"task-" + task().id',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.tabindex]': 'roving() ? 0 : -1',
    '[class.task-card--done]': 'task().status === "done"',
    '[class.task-card--highlighted]': 'highlighted()',
    class: 'task-card group',
    '(focus)': 'focused.emit()',
  },
})
export class TaskCard {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly task = input.required<Task>();
  readonly list = input<List | null>(null);
  readonly showListMeta = input(false);
  readonly highlighted = input(false);
  readonly roving = input(false);
  readonly dragEnabled = input(true);

  readonly toggleDone = output<void>();
  readonly edit = output<void>();
  readonly duplicate = output<void>();
  readonly remove = output<void>();
  readonly statusChange = output<TaskStatus>();
  readonly focused = output<void>();

  protected readonly menuOpen = signal(false);
  protected readonly titleId = nextDomId('task-title');
  protected readonly hintId = nextDomId('task-drag-hint');
  private readonly today = todayIso();

  protected readonly overdue = computed(() => isOverdue(this.task(), this.today));
  protected readonly dueVariant = computed<BadgeVariant>(() => {
    const task = this.task();
    if (task.dueDate === null) return 'neutral';
    if (this.overdue()) return 'danger';
    const diffDays = daysUntil(task.dueDate, this.today);
    if (diffDays === 0 || diffDays === 1) return 'warning';
    return 'neutral';
  });

  protected readonly priorityBars = computed(() => {
    const active = PRIORITY_WEIGHT[this.task().priority] + 1;
    return [0, 1, 2, 3].map((index) => index < active);
  });

  protected readonly priorityBarClass = computed(() => PRIORITY_BAR_CLASS[this.task().priority]);
  protected readonly priorityStripeClass = computed(() =>
    this.task().status === 'done' ? 'bg-line' : PRIORITY_STRIPE_CLASS[this.task().priority],
  );
  protected readonly listDotClass = computed(() => {
    const list = this.list();
    return list ? LIST_COLOR_BG_CLASS[list.color] : '';
  });

  protected readonly otherStatuses = computed(() =>
    TASK_STATUSES.filter((status) => status !== this.task().status).map((status) => ({
      status,
      label: STATUS_LABELS[status],
    })),
  );

  @HostListener('document:keydown.escape')
  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected runAction(action: () => void): void {
    this.menuOpen.set(false);
    action();
  }
}
