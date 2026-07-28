import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { ListId } from '../../../core/models/list';
import type { Task, TaskId, TaskPriority } from '../../../core/models/task';
import { PRIORITY_WEIGHT, STATUS_LABELS } from '../../../core/models/task';
import { isOverdue, todayIso } from '../../../core/util/date';
import { Dialog } from '../../../shared/ui/dialog';
import { nextDomId } from '../../../shared/ui/dom-id';
import { Icon } from '../../../shared/ui/icon';
import { LIST_COLOR_BG_CLASS } from '../../../shared/ui/list-color';
import { PRIORITY_BAR_CLASS } from '../../../shared/ui/priority-bar';
import { DueLabelPipe } from '../../../shared/pipes/due-label-pipe';
import type { PaletteContext, PaletteItem } from '../command-palette-search';
import { buildPaletteGroups, initialActiveIndex } from '../command-palette-search';
import type { ListSummary } from './list-sidebar';

@Component({
  selector: 'app-command-palette',
  imports: [Dialog, Icon, DueLabelPipe],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPalette {
  readonly open = input.required<boolean>();
  readonly lists = input.required<readonly ListSummary[]>();
  readonly tasks = input.required<readonly Task[]>();
  readonly totalPendingCount = input.required<number>();
  readonly themeResolved = input.required<'light' | 'dark'>();
  readonly canUndo = input.required<boolean>();
  readonly canRedo = input.required<boolean>();
  readonly undoLabel = input.required<string | null>();
  readonly redoLabel = input.required<string | null>();
  readonly hasActiveFilters = input.required<boolean>();
  readonly modKey = input.required<string>();
  /** The board's active search, if any: the palette opens with it pre-filled and selected. */
  readonly initialQuery = input('');

  readonly closed = output<void>();
  /** Forwarded from Dialog: fires before native Esc/backdrop close restores the
   * trigger's focus, so the board can tell that apart from a real refocus. */
  readonly closing = output<void>();
  readonly createTask = output<string>();
  readonly createList = output<void>();
  readonly toggleTheme = output<void>();
  readonly undo = output<void>();
  readonly redo = output<void>();
  readonly openShortcuts = output<void>();
  readonly clearFilters = output<void>();
  readonly clearBoard = output<void>();
  readonly goToList = output<ListId | null>();
  readonly openTask = output<TaskId>();
  readonly toggleTaskDone = output<TaskId>();
  readonly viewAllResults = output<string>();

  protected readonly titleId = nextDomId('command-palette-title');
  private readonly rowIdPrefix = nextDomId('command-palette-row');

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  private readonly context = computed<PaletteContext>(() => ({
    lists: this.lists().map(({ list, count }) => ({
      id: list.id,
      name: list.name,
      colorClass: LIST_COLOR_BG_CLASS[list.color],
      pendingCount: count,
    })),
    tasks: this.tasks().map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      listId: task.listId,
    })),
    totalPendingCount: this.totalPendingCount(),
    themeResolved: this.themeResolved(),
    canUndo: this.canUndo(),
    canRedo: this.canRedo(),
    undoLabel: this.undoLabel(),
    redoLabel: this.redoLabel(),
    hasActiveFilters: this.hasActiveFilters(),
    hasAnyTask: this.tasks().length > 0,
  }));

  protected readonly groups = computed(() => buildPaletteGroups(this.query(), this.context()));
  protected readonly flatItems = computed(() => this.groups().flatMap((group) => group.items));

  /** Each row's absolute position across every group, precomputed so the template
   * never has to add up group sizes to know which row is the active one. */
  protected readonly renderGroups = computed(() => {
    let offset = 0;
    return this.groups().map((group) => {
      const items = group.items.map((item, index) => ({ item, index: offset + index }));
      offset += group.items.length;
      return { label: group.label, items };
    });
  });

  /** The one unconditional row left standing when nothing else matches the query. */
  protected readonly isEmptyResult = computed(() => {
    const items = this.flatItems();
    return this.query().trim().length > 0 && items.length === 1 && items[0].id === 'create-task';
  });

  protected readonly activeItem = computed<PaletteItem | null>(
    () => this.flatItems()[this.activeIndex()] ?? null,
  );
  protected readonly activeItemId = computed(() =>
    this.activeItem() === null ? null : this.rowId(this.activeIndex()),
  );

  protected readonly resultCountLabel = computed(() => {
    const count = this.flatItems().length;
    return count === 1 ? '1 resultado' : `${count} resultados`;
  });

  private readonly today = todayIso();
  private readonly queryInputRef = viewChild<ElementRef<HTMLInputElement>>('queryInput');
  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen && !this.wasOpen) {
        const preset = this.initialQuery();
        this.query.set(preset);
        this.activeIndex.set(initialActiveIndex(this.flatItems(), preset.length > 0));

        // Set directly, not just through the signal: with text already selected,
        // typing replaces it and Backspace clears it in one press.
        const input = this.queryInputRef()?.nativeElement;
        if (input) {
          input.value = preset;
          if (preset.length > 0) input.select();
        }
      }
      this.wasOpen = isOpen;
    });
  }

  protected rowId(index: number): string {
    return `${this.rowIdPrefix}-${index}`;
  }

  protected statusLabelOf(item: Extract<PaletteItem, { kind: 'task' }>): string {
    return STATUS_LABELS[item.status];
  }

  protected isOverdue(item: Extract<PaletteItem, { kind: 'task' }>): boolean {
    return isOverdue(item, this.today);
  }

  /** Only overdue or due-today tasks earn the badge; everything else would be noise. */
  protected showDueBadge(item: Extract<PaletteItem, { kind: 'task' }>): boolean {
    return !item.done && item.dueDate !== null && item.dueDate <= this.today;
  }

  protected groupHeadingId(label: string): string {
    return `command-palette-group-${label.toLowerCase().replace(/\s+/g, '-')}`;
  }

  protected priorityBars(priority: TaskPriority): readonly boolean[] {
    const active = PRIORITY_WEIGHT[priority] + 1;
    return [0, 1, 2, 3].map((index) => index < active);
  }

  protected priorityBarClass(priority: TaskPriority): string {
    return PRIORITY_BAR_CLASS[priority];
  }

  protected onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  protected onRowHover(index: number): void {
    this.activeIndex.set(index);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.flatItems().length;
    if (count === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        this.activeIndex.set((this.activeIndex() + 1) % count);
        break;
      case 'ArrowUp':
        this.activeIndex.set((this.activeIndex() - 1 + count) % count);
        break;
      case 'Home':
        this.activeIndex.set(0);
        break;
      case 'End':
        this.activeIndex.set(count - 1);
        break;
      case 'Enter': {
        const item = this.activeItem();
        if (item === null) return;
        if (event.ctrlKey || event.metaKey) {
          if (item.kind === 'task') this.toggleTaskDone.emit(item.taskId);
          break;
        }
        this.execute(item);
        break;
      }
      default:
        return;
    }
    event.preventDefault();
  }

  protected execute(item: PaletteItem): void {
    switch (item.kind) {
      case 'go-list':
        this.goToList.emit(item.listId);
        this.closed.emit();
        return;
      case 'task':
        this.openTask.emit(item.taskId);
        this.closed.emit();
        return;
      case 'command':
        this.executeCommand(item);
        return;
    }
  }

  private executeCommand(item: Extract<PaletteItem, { kind: 'command' }>): void {
    switch (item.id) {
      case 'create-task':
        this.createTask.emit(item.query ?? '');
        break;
      case 'create-list':
        this.createList.emit();
        break;
      case 'undo':
        this.undo.emit();
        break;
      case 'redo':
        this.redo.emit();
        break;
      case 'toggle-theme':
        this.toggleTheme.emit();
        break;
      case 'open-shortcuts':
        this.openShortcuts.emit();
        break;
      case 'clear-filters':
        this.clearFilters.emit();
        break;
      case 'clear-board':
        this.clearBoard.emit();
        break;
      case 'view-all-results':
        this.viewAllResults.emit(item.query ?? '');
        break;
    }
    this.closed.emit();
  }
}
