import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from './button';
import { Dialog } from './dialog';
import { nextDomId } from './dom-id';

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

  protected readonly titleId = nextDomId('confirm-dialog-title');
  protected readonly descriptionId = nextDomId('confirm-dialog-desc');
}
