import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Button } from './button';
import { IconButton } from './icon-button';
import type { IconName } from './icon';
import { Icon } from './icon';

export type BannerVariant = 'info' | 'warning' | 'error';

const VARIANT_ICON: Record<BannerVariant, IconName> = {
  info: 'info',
  warning: 'warning',
  error: 'warning',
};

@Component({
  selector: 'app-banner',
  imports: [Icon, Button, IconButton],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Banner {
  readonly variant = input<BannerVariant>('info');
  readonly lead = input<string | null>(null);
  readonly message = input.required<string>();
  readonly actionLabel = input<string | null>(null);
  readonly dismissible = input(false);

  readonly action = output<void>();
  readonly dismissed = output<void>();

  protected readonly icon = computed<IconName>(() => VARIANT_ICON[this.variant()]);
  protected readonly role = computed(() => (this.variant() === 'error' ? 'alert' : 'status'));
}
