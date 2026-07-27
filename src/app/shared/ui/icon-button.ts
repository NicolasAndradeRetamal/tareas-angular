import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type IconButtonSize = 'sm' | 'md' | 'lg';

/** Icon-only button: 20px icon, 44x44 touch target, mandatory accessible label. */
@Component({
  selector: 'app-icon-button',
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButton {
  readonly label = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly size = input<IconButtonSize>('md');
  readonly disabled = input(false);
  readonly pressed = input<boolean | null>(null);
  readonly variant = input<'default' | 'danger'>('default');
  readonly clicked = output<void>();

  protected get titleText(): string {
    return this.hint() ?? this.label();
  }
}
