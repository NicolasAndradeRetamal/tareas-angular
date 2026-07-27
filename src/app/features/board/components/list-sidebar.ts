import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
} from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { List, ListId } from '../../../core/models/list';
import { Icon } from '../../../shared/ui/icon';
import { LIST_COLOR_BG_CLASS } from '../../../shared/ui/list-color';

export interface ListSummary {
  readonly list: List;
  readonly count: number;
}

const MENU_POSITIONS: ConnectedPosition[] = [
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
];

@Component({
  selector: 'app-list-sidebar',
  imports: [Icon, CdkOverlayOrigin, CdkConnectedOverlay],
  templateUrl: './list-sidebar.html',
  styleUrl: './list-sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'list-sidebar', role: 'nav', 'aria-label': 'Listas' },
})
export class ListSidebar {
  readonly lists = input.required<readonly ListSummary[]>();
  readonly activeListId = input<ListId | null>(null);
  readonly totalCount = input.required<number>();

  readonly selectList = output<ListId | null>();
  readonly createList = output<void>();
  readonly renameList = output<ListId>();
  readonly deleteList = output<ListId>();

  protected readonly openMenuFor = signal<ListId | null>(null);
  protected readonly canDelete = computed(() => this.lists().length > 1);
  protected readonly dotClass = LIST_COLOR_BG_CLASS;
  protected readonly menuPositions = MENU_POSITIONS;

  protected closeMenu(): void {
    this.openMenuFor.set(null);
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closeMenu();
  }

  protected toggleMenu(id: ListId): void {
    this.openMenuFor.update((current) => (current === id ? null : id));
  }

  protected runAction(action: () => void): void {
    this.closeMenu();
    action();
  }
}
