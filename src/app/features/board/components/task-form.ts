import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { CreateTaskInput, UpdateTaskInput } from '../../../core/models/board-state';
import type { List, ListId } from '../../../core/models/list';
import {
  PRIORITY_WEIGHT,
  STATUS_LABELS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
} from '../../../core/models/task';
import type { Task, TaskId, TaskPriority, TaskStatus } from '../../../core/models/task';
import { modifierKeyLabel } from '../../../core/util/platform';
import { nonBlank } from '../../../core/util/validators';
import { PriorityLabelPipe } from '../../../shared/pipes/priority-label-pipe';
import { Button } from '../../../shared/ui/button';
import { Dialog } from '../../../shared/ui/dialog';
import { nextDomId } from '../../../shared/ui/dom-id';
import { Icon } from '../../../shared/ui/icon';

export type TaskFormMode = 'create' | 'edit';

const TITLE_COUNTER_THRESHOLD = 96;
const DESCRIPTION_COUNTER_THRESHOLD = 1600;

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, Dialog, Button, Icon, PriorityLabelPipe],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskForm {
  private readonly fb = inject(FormBuilder);

  readonly open = input.required<boolean>();
  readonly mode = input.required<TaskFormMode>();
  readonly task = input<Task | null>(null);
  readonly lists = input.required<readonly List[]>();
  readonly defaultListId = input<ListId | null>(null);
  readonly defaultStatus = input<TaskStatus>('todo');
  /** Preset for a new task's title, e.g. what the user typed in the command palette. */
  readonly defaultTitle = input('');

  readonly create = output<CreateTaskInput>();
  readonly update = output<{ id: TaskId; changes: UpdateTaskInput }>();
  readonly deleteRequested = output<TaskId>();
  readonly closed = output<void>();

  protected readonly priorities = TASK_PRIORITIES;
  protected readonly statuses = TASK_STATUSES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly titleMax = TASK_TITLE_MAX_LENGTH;
  protected readonly descriptionMax = TASK_DESCRIPTION_MAX_LENGTH;
  protected readonly titleCounterThreshold = TITLE_COUNTER_THRESHOLD;
  protected readonly descriptionCounterThreshold = DESCRIPTION_COUNTER_THRESHOLD;
  protected readonly priorityWeight = PRIORITY_WEIGHT;
  protected readonly titleId = nextDomId('task-form-title');
  protected readonly modKey = modifierKeyLabel();

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [nonBlank, Validators.maxLength(TASK_TITLE_MAX_LENGTH)]],
    description: ['', [Validators.maxLength(TASK_DESCRIPTION_MAX_LENGTH)]],
    priority: ['medium' as TaskPriority],
    status: ['todo' as TaskStatus],
    listId: ['', Validators.required],
    dueDate: [''],
  });

  /** Errors stay quiet until the first submit; after that they update on every keystroke. */
  protected readonly submitAttempted = signal(false);

  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen && !this.wasOpen) {
        untracked(() => this.populateForm());
      }
      this.wasOpen = isOpen;
    });
  }

  protected get isEdit(): boolean {
    return this.mode() === 'edit';
  }

  protected clearDueDate(): void {
    this.form.controls.dueDate.setValue('');
  }

  protected submit(): void {
    this.submitAttempted.set(true);
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const dueDate = value.dueDate === '' ? null : value.dueDate;

    if (this.mode() === 'create') {
      this.create.emit({
        listId: value.listId,
        title: value.title,
        description: value.description,
        priority: value.priority,
        status: value.status,
        dueDate,
      });
    } else {
      const task = this.task();
      if (!task) return;
      this.update.emit({
        id: task.id,
        changes: {
          title: value.title,
          description: value.description,
          priority: value.priority,
          status: value.status,
          listId: value.listId,
          dueDate,
        },
      });
    }

    this.closed.emit();
  }

  protected requestDelete(): void {
    const task = this.task();
    if (task) this.deleteRequested.emit(task.id);
  }

  protected formatMeta(iso: string): string {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  }

  private populateForm(): void {
    this.submitAttempted.set(false);
    const task = this.task();
    if (task) {
      this.form.reset({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        listId: task.listId,
        dueDate: task.dueDate ?? '',
      });
    } else {
      this.form.reset({
        title: this.defaultTitle(),
        description: '',
        priority: 'medium',
        status: this.defaultStatus(),
        listId: this.defaultListId() ?? this.lists()[0]?.id ?? '',
        dueDate: '',
      });
    }
  }
}
