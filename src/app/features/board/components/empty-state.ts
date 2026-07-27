import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../../../shared/ui/button';
import type { IconName } from '../../../shared/ui/icon';
import { Icon } from '../../../shared/ui/icon';

@Component({
  selector: 'app-empty-state',
  imports: [Icon, Button],
  templateUrl: './empty-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly icon = input.required<IconName>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly primaryLabel = input<string | null>(null);
  readonly secondaryLabel = input<string | null>(null);
  readonly primaryAction = output<void>();
  readonly secondaryAction = output<void>();
}
