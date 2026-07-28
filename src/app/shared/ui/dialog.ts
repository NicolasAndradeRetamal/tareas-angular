import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

export type DialogSize = 'form' | 'confirm' | 'palette';
export type DialogRole = 'dialog' | 'alertdialog';

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
  readonly role = input<DialogRole>('dialog');
  /** Id of the heading that names the dialog; screen readers read it off the <dialog> itself. */
  readonly labelledBy = input.required<string>();
  readonly describedBy = input<string | null>(null);
  readonly closed = output<void>();
  /** Fires before the native close restores focus to the trigger — earlier than `closed`,
   * for consumers that need to tell a real focus change apart from that restore. */
  readonly closing = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const element = this.dialogRef().nativeElement;
      if (this.open()) {
        if (!element.open) {
          element.showModal();
          // The panel's own content (behind an @if on a sibling input, e.g. task
          // detail) may not be rendered yet when this effect runs; wait a render.
          afterNextRender(() => this.focusInitialElement(element), { injector: this.injector });
        }
      } else if (element.open) {
        this.closing.emit();
        element.close();
      }
    });
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogRef().nativeElement) {
      this.closing.emit();
      this.dialogRef().nativeElement.close();
    }
  }

  // Without an explicit target, showModal() focuses the first focusable descendant
  // (often a footer button), dragging the panel's own scroll down; default to the title.
  private focusInitialElement(dialogEl: HTMLDialogElement): void {
    if (!dialogEl.open) return;
    const explicit = dialogEl.querySelector<HTMLElement>('[autofocus]');
    const labelId = this.labelledBy();
    const target =
      explicit ?? (labelId ? dialogEl.querySelector<HTMLElement>(`#${CSS.escape(labelId)}`) : null);
    if (target) {
      if (!explicit && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    dialogEl.querySelector('.dialog__panel')?.scrollTo({ top: 0 });
  }
}
