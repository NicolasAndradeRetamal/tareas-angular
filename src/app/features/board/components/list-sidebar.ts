import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { List, ListId } from '../../../core/models/list';
import { Icon } from '../../../shared/ui/icon';
import { LIST_COLOR_BG_CLASS } from '../../../shared/ui/list-color';

export interface ListSummary {
  readonly list: List;
  readonly count: number;
}

@Component({
  selector: 'app-list-sidebar',
  imports: [Icon],
  templateUrl: './list-sidebar.html',
  styleUrl: './list-sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'list-sidebar', role: 'nav', 'aria-label': 'Listas' },
})
export class ListSidebar {
  private readonly host = inject(ElementRef<HTMLElement>);

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

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.openMenuFor() !== null && !this.host.nativeElement.contains(event.target as Node)) {
      this.openMenuFor.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  protected closeMenu(): void {
    this.openMenuFor.set(null);
  }

  protected toggleMenu(id: ListId): void {
    this.openMenuFor.update((current) => (current === id ? null : id));
  }

  protected runAction(action: () => void): void {
    this.openMenuFor.set(null);
    action();
  }
}
