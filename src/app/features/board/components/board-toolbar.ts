import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { BoardCounts, StatusFilter } from '../../../core/state/board-view-store';
import { TASK_PRIORITIES, type TaskPriority } from '../../../core/models/task';
import { Button } from '../../../shared/ui/button';
import { PriorityLabelPipe } from '../../../shared/pipes/priority-label-pipe';

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
  { value: 'overdue', label: 'Vencidas' },
];

@Component({
  selector: 'app-board-toolbar',
  imports: [Button, PriorityLabelPipe],
  templateUrl: './board-toolbar.html',
  styleUrl: './board-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardToolbar {
  readonly contextTitle = input.required<string>();
  readonly contextColorClass = input<string | null>(null);
  readonly statusFilter = input.required<StatusFilter>();
  readonly priorityFilter = input.required<TaskPriority | null>();
  readonly hasActiveFilters = input.required<boolean>();
  readonly counts = input.required<BoardCounts>();
  readonly visibleCount = input.required<number>();

  readonly statusFilterChange = output<StatusFilter>();
  readonly priorityFilterChange = output<TaskPriority | null>();
  readonly resetFilters = output<void>();

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly priorities = TASK_PRIORITIES;

  protected readonly summaryText = computed(() => {
    const counts = this.counts();
    if (!this.hasActiveFilters()) {
      return `${counts.total} ${counts.total === 1 ? 'tarea' : 'tareas'} · ${counts.overdue} vencidas`;
    }
    return `Mostrando ${this.visibleCount()} de ${counts.total}`;
  });

  protected onPriorityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.priorityFilterChange.emit(value === '' ? null : (value as TaskPriority));
  }
}
