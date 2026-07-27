import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from './button';
import { Dialog } from './dialog';

let nextId = 0;

@Component({
  selector: 'app-confirm-dialog',
  imports: [Dialog, Button],
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly titleId = `confirm-dialog-title-${nextId++}`;
  protected readonly descriptionId = `confirm-dialog-desc-${nextId++}`;
}
