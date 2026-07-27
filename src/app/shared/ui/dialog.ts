import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';

export type DialogSize = 'form' | 'confirm';

/** Thin wrapper over the native <dialog>: free focus trap, Esc-to-close and focus return. */
@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dialog {
  readonly open = input.required<boolean>();
  readonly size = input<DialogSize>('form');
  readonly closed = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  constructor() {
    effect(() => {
      const element = this.dialogRef().nativeElement;
      if (this.open()) {
        if (!element.open) element.showModal();
      } else if (element.open) {
        element.close();
      }
    });
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogRef().nativeElement) {
      this.dialogRef().nativeElement.close();
    }
  }
}
