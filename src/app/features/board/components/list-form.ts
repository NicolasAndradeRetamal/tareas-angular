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
import { LIST_COLORS, LIST_NAME_MAX_LENGTH } from '../../../core/models/list';
import type { List, ListColor } from '../../../core/models/list';
import { Button } from '../../../shared/ui/button';
import { Dialog } from '../../../shared/ui/dialog';
import { nextDomId } from '../../../shared/ui/dom-id';
import { LIST_COLOR_BG_CLASS, LIST_COLOR_LABEL } from '../../../shared/ui/list-color';
import { nonBlank } from '../../../core/util/validators';

export type ListFormMode = 'create' | 'edit';

export interface ListFormResult {
  readonly name: string;
  readonly color: ListColor;
}

@Component({
  selector: 'app-list-form',
  imports: [ReactiveFormsModule, Dialog, Button],
  templateUrl: './list-form.html',
  styleUrl: './list-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListForm {
  private readonly fb = inject(FormBuilder);

  readonly open = input.required<boolean>();
  readonly mode = input.required<ListFormMode>();
  readonly list = input<List | null>(null);

  readonly submitted = output<ListFormResult>();
  readonly closed = output<void>();

  protected readonly colors = LIST_COLORS;
  protected readonly colorClass = LIST_COLOR_BG_CLASS;
  protected readonly colorLabel = LIST_COLOR_LABEL;
  protected readonly nameMax = LIST_NAME_MAX_LENGTH;
  protected readonly titleId = nextDomId('list-form-title');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [nonBlank, Validators.maxLength(LIST_NAME_MAX_LENGTH)]],
    color: ['slate' as ListColor],
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

  protected submit(): void {
    this.submitAttempted.set(true);
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.submitted.emit({ name: value.name, color: value.color });
    this.closed.emit();
  }

  private populateForm(): void {
    this.submitAttempted.set(false);
    const list = this.list();
    this.form.reset({
      name: list?.name ?? '',
      color: list?.color ?? 'slate',
    });
  }
}
