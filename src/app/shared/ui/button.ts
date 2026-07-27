import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ButtonVariant =
  'primary' | 'secondary' | 'subtle' | 'danger' | 'danger-subtle' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Shared button: covers every variant and size from the design system in one place. */
@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly disabledReason = input<string | null>(null);
  readonly clicked = output<void>();
}
