import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'search'
  | 'x'
  | 'plus'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'check'
  | 'circle-dashed'
  | 'circle-half'
  | 'circle-check'
  | 'grip'
  | 'warning'
  | 'clock'
  | 'calendar'
  | 'more'
  | 'trash'
  | 'pencil'
  | 'copy'
  | 'menu'
  | 'compass'
  | 'inbox'
  | 'layout'
  | 'chevron-right'
  | 'keyboard'
  | 'info'
  | 'undo';

/** Single hand-rolled icon set: no icon font or third-party dependency. */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
