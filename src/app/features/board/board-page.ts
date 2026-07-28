import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import type { CreateTaskInput, UpdateTaskInput } from '../../core/models/board-state';
import type { List, ListId } from '../../core/models/list';
import { MUTATION_LABELS } from '../../core/models/mutation';
import type { MutationKind } from '../../core/models/mutation';
import type { Task, TaskId, TaskStatus } from '../../core/models/task';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../core/models/task';
import { BoardStore } from '../../core/state/board-store';
import { BoardViewStore } from '../../core/state/board-view-store';
import type { StatusFilter } from '../../core/state/board-view-store';
import { ThemeStore } from '../../core/state/theme-store';
import type { ThemePreference } from '../../core/state/theme-store';
import { isMacPlatform, modifierKeyLabel } from '../../core/util/platform';
import { byOrder } from '../../core/util/order';
import { Banner } from '../../shared/ui/banner';
import { Button } from '../../shared/ui/button';
import { Icon } from '../../shared/ui/icon';
import type { IconName } from '../../shared/ui/icon';
import { IconButton } from '../../shared/ui/icon-button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { LIST_COLOR_BG_CLASS } from '../../shared/ui/list-color';
import { BoardToolbar } from './components/board-toolbar';
import { CommandPalette } from './components/command-palette';
import { EmptyState } from './components/empty-state';
import { ListForm } from './components/list-form';
import type { ListFormMode, ListFormResult } from './components/list-form';
import { ListSidebar } from './components/list-sidebar';
import type { ListSummary } from './components/list-sidebar';
import { ShortcutsDialog } from './components/shortcuts-dialog';
import { resolveDropIndex } from './drop-target';
import { TaskColumn } from './components/task-column';
import { TaskDetail } from './components/task-detail';
import { TaskForm } from './components/task-form';
import type { TaskFormMode } from './components/task-form';
import { Toast } from '../../shared/ui/toast';

type ConfirmRequest =
  | { readonly kind: 'delete-task'; readonly id: TaskId }
  | { readonly kind: 'delete-list'; readonly id: ListId }
  | { readonly kind: 'clear-board' };

const THEME_OPTIONS: readonly { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
  { value: 'system', label: 'Seguir al sistema', icon: 'monitor' },
];

/** Matches the drop-flash animation in task-card.css. */
const HIGHLIGHT_MS = 1200;

/** Long enough to read the notice and reach for «Deshacer». */
const TOAST_MS = 6000;

function lowerFirst(text: string): string {
  return text.length === 0 ? text : text[0].toLowerCase() + text.slice(1);
}

function truncateForQuote(text: string, max = 40): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function eliminadasPhrase(count: number): string {
  return count === 1 ? '1 tarea eliminada' : `${count} tareas eliminadas`;
}

const PERSISTENCE_MESSAGES = {
  quota:
    'No se pudieron guardar los últimos cambios: el almacenamiento del navegador está lleno. Tu trabajo sigue en pantalla, pero se perderá al cerrar la pestaña.',
  unavailable:
    'Este navegador no permite guardar datos del sitio (puede ser una ventana privada). Puedes trabajar con normalidad, pero nada se guardará al cerrar.',
  unknown:
    'No se pudieron guardar los últimos cambios. Vuelve a intentar la acción; si sigue fallando, recarga la página.',
} as const;

@Component({
  selector: 'app-board-page',
  imports: [
    CdkDropListGroup,
    ListSidebar,
    BoardToolbar,
    TaskColumn,
    TaskForm,
    TaskDetail,
    ListForm,
    CommandPalette,
    ShortcutsDialog,
    ConfirmDialog,
    EmptyState,
    Banner,
    Toast,
    Button,
    IconButton,
    Icon,
  ],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardPage {
  /** Route parameter, bound by withComponentInputBinding(). */
  readonly listId = input<string | undefined>();

  private readonly board = inject(BoardStore);
  private readonly router = inject(Router);
  protected readonly view = inject(BoardViewStore);
  protected readonly theme = inject(ThemeStore);

  protected readonly themeOptions = THEME_OPTIONS;
  /** Platform doesn't change mid-session: computed once per component instance. */
  protected readonly modKey = modifierKeyLabel();
  protected readonly modKeyShortcut = isMacPlatform() ? 'Meta+K' : 'Control+K';

  // --- UI state ---
  protected readonly sidebarOpen = signal(false);
  protected readonly themeMenuOpen = signal(false);
  protected readonly overflowMenuOpen = signal(false);
  protected readonly shortcutsOpen = signal(false);
  protected readonly paletteOpen = signal(false);
  private readonly searchTrigger = viewChild<ElementRef<HTMLButtonElement>>('searchTrigger');
  /** Closing returns focus to the trigger, which would immediately reopen it if its own
   * (focus) handler couldn't tell that apart from the user focusing it again. Set the
   * instant a close starts (Dialog's `closing`), before the browser restores focus. */
  private suppressNextTriggerFocus = false;
  protected readonly confirmRequest = signal<ConfirmRequest | null>(null);
  protected readonly seedNoticeDismissed = signal(false);
  protected readonly loadIssueDismissed = signal(false);

  protected readonly taskFormOpen = signal(false);
  protected readonly taskFormMode = signal<TaskFormMode>('create');
  protected readonly editingTaskId = signal<TaskId | null>(null);
  protected readonly newTaskStatus = signal<TaskStatus>('todo');
  protected readonly newTaskTitle = signal('');

  protected readonly listFormOpen = signal(false);
  protected readonly listFormMode = signal<ListFormMode>('create');
  protected readonly editingListId = signal<ListId | null>(null);

  protected readonly detailTaskId = signal<TaskId | null>(null);
  protected readonly toastMessage = signal<string | null>(null);
  /** Only toasts about an action the user just took offer "Deshacer"; informational
   * ones (manual undo/redo) don't, since the way back is the other history button. */
  protected readonly toastUndoable = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private dragCancelled = false;

  private readonly explicitFocusId = signal<TaskId | null>(null);
  protected readonly highlightedTaskId = signal<TaskId | null>(null);

  // --- Derived ---
  protected readonly lists = this.board.lists;
  protected readonly listIndex = this.board.listIndex;
  protected readonly allTasks = this.board.tasks;
  protected readonly persistenceError = this.board.persistenceError;

  protected readonly editingTask = computed<Task | null>(() => {
    const id = this.editingTaskId();
    return id === null ? null : (this.board.taskIndex().get(id) ?? null);
  });

  protected readonly detailTask = computed<Task | null>(() => {
    const id = this.detailTaskId();
    return id === null ? null : (this.board.taskIndex().get(id) ?? null);
  });

  protected readonly detailList = computed<List | null>(() => {
    const task = this.detailTask();
    return task === null ? null : (this.listIndex().get(task.listId) ?? null);
  });

  protected readonly editingList = computed<List | null>(() => {
    const id = this.editingListId();
    return id === null ? null : (this.listIndex().get(id) ?? null);
  });

  protected readonly listSummaries = computed<readonly ListSummary[]>(() => {
    const tasks = this.board.tasks();
    return this.lists().map((list) => ({
      list,
      count: tasks.filter((task) => task.listId === list.id && task.status !== 'done').length,
    }));
  });

  protected readonly pendingTotal = computed(
    () => this.board.tasks().filter((task) => task.status !== 'done').length,
  );

  protected readonly contextTitle = computed(
    () => this.view.activeList()?.name ?? 'Todas las tareas',
  );
  protected readonly contextColorClass = computed(() => {
    const list = this.view.activeList();
    return list ? LIST_COLOR_BG_CLASS[list.color] : null;
  });

  protected readonly themeIcon = computed<IconName>(() =>
    this.theme.resolved() === 'dark' ? 'moon' : 'sun',
  );

  /** The sample board is still untouched: no mutation has happened yet. */
  protected readonly showSeedNotice = computed(
    () => this.board.isSeeded() && !this.seedNoticeDismissed() && !this.view.isEmpty(),
  );

  protected readonly loadIssueMessage = computed(() => {
    const issue = this.board.loadIssue();
    if (issue === null || this.loadIssueDismissed()) return null;
    return issue === 'corrupt-backed-up'
      ? 'No pudimos leer el tablero guardado y empezamos uno nuevo. Guardamos una copia del contenido anterior por si la necesitas.'
      : 'No pudimos leer el tablero guardado y empezamos uno nuevo. Tampoco pudimos conservar una copia del contenido anterior.';
  });

  protected readonly activeListIsEmpty = computed(
    () => this.view.activeList() !== null && this.view.counts().total === 0,
  );

  /** Repeats the active criteria so the empty result explains itself. */
  protected readonly filterSummary = computed(() => {
    const parts: string[] = [];
    const query = this.view.query().trim();
    if (query.length > 0) parts.push(`Buscando «${query}»`);
    if (this.view.statusFilter() !== 'all') {
      const labels: Record<StatusFilter, string> = {
        all: '',
        pending: 'pendientes',
        completed: 'completadas',
        overdue: 'vencidas',
      };
      parts.push(`Estado: ${labels[this.view.statusFilter()]}`);
    }
    const priority = this.view.priorityFilter();
    if (priority !== null) parts.push(`Prioridad: ${PRIORITY_LABELS[priority].toLowerCase()}`);
    const list = this.view.activeList();
    if (list) parts.push(`Lista: ${list.name}`);
    return parts.join(' · ');
  });

  protected readonly rovingTaskId = computed<TaskId | null>(() => {
    const explicit = this.explicitFocusId();
    const visible = this.view.columns().flatMap((column) => column.tasks);
    if (explicit !== null && visible.some((task) => task.id === explicit)) return explicit;
    return visible[0]?.id ?? null;
  });

  protected readonly anyDialogOpen = computed(
    () =>
      this.taskFormOpen() ||
      this.listFormOpen() ||
      this.shortcutsOpen() ||
      this.paletteOpen() ||
      this.detailTaskId() !== null ||
      this.confirmRequest() !== null,
  );

  protected readonly undoLabel = computed(() => {
    const kind = this.board.undoKind();
    return kind === null ? null : lowerFirst(MUTATION_LABELS[kind]);
  });

  protected readonly redoLabel = computed(() => {
    const kind = this.board.redoKind();
    return kind === null ? null : lowerFirst(MUTATION_LABELS[kind]);
  });

  /** Always present so the dialog can stay mounted and close properly, returning focus. */
  protected readonly confirmCopy = computed(() => {
    const request = this.confirmRequest();
    if (request === null) return { title: '', message: '', confirmLabel: '' };
    if (request.kind === 'clear-board') {
      return {
        title: 'Vaciar el tablero',
        message: `Se eliminarán ${countLabel(this.board.tasks().length)} y quedará una sola lista vacía. Puedes deshacerlo mientras no cierres la pestaña.`,
        confirmLabel: 'Vaciar el tablero',
      };
    }
    if (request.kind === 'delete-list') {
      const list = this.listIndex().get(request.id);
      const affected = this.board.tasks().filter((task) => task.listId === request.id).length;
      return {
        title: 'Eliminar la lista',
        message: `Se eliminará «${list?.name ?? ''}» con ${countLabel(affected)}.`,
        confirmLabel: 'Eliminar la lista',
      };
    }
    const task = this.board.taskIndex().get(request.id);
    return {
      title: 'Eliminar la tarea',
      message: `Se eliminará «${task?.title ?? ''}» del tablero.`,
      confirmLabel: 'Eliminar la tarea',
    };
  });

  protected readonly persistenceMessage = computed(() => {
    const error = this.persistenceError();
    return error === null ? null : PERSISTENCE_MESSAGES[error];
  });

  constructor() {
    effect(() => {
      const routeListId = this.listId();
      const known = this.board.listIndex();

      if (routeListId === undefined) {
        this.view.setActiveList(null);
        return;
      }
      if (known.has(routeListId)) {
        this.view.setActiveList(routeListId);
        return;
      }
      this.view.setActiveList(null);
      void this.router.navigate(['/tablero'], { replaceUrl: true });
    });
  }

  // --- Navigation ---

  protected selectList(id: ListId | null): void {
    this.sidebarOpen.set(false);
    void this.router.navigate(id === null ? ['/tablero'] : ['/tablero', id]);
  }

  // --- Search and filters ---

  protected clearSearch(): void {
    this.view.setQuery('');
    this.suppressNextTriggerFocus = true;
    this.searchTrigger()?.nativeElement.focus();
  }

  /** The palette's "Ver los N resultados" row: same search, but on the full board. */
  protected onPaletteViewAllResults(query: string): void {
    this.selectList(null);
    this.view.setQuery(query);
  }

  // --- Search / command trigger ---

  protected openPalette(): void {
    this.paletteOpen.set(true);
  }

  /** Ignores the focus a closed palette or a cleared search hands back to the
   * trigger; only an actual later interaction should open the palette again. */
  protected onSearchTriggerFocus(): void {
    if (this.suppressNextTriggerFocus) {
      this.suppressNextTriggerFocus = false;
      return;
    }
    this.paletteOpen.set(true);
  }

  /** Fires before the native close restores focus to the trigger. */
  protected onPaletteClosing(): void {
    this.suppressNextTriggerFocus = true;
  }

  protected onPaletteClosed(): void {
    this.paletteOpen.set(false);
  }

  // --- Task dialogs ---

  protected openCreateTask(status: TaskStatus = 'todo', presetTitle = ''): void {
    this.newTaskStatus.set(status);
    this.newTaskTitle.set(presetTitle);
    this.editingTaskId.set(null);
    this.taskFormMode.set('create');
    this.taskFormOpen.set(true);
  }

  protected openEditTask(id: TaskId): void {
    this.editingTaskId.set(id);
    this.taskFormMode.set('edit');
    this.taskFormOpen.set(true);
  }

  protected closeTaskForm(): void {
    this.taskFormOpen.set(false);
  }

  protected onCreateTask(input: CreateTaskInput): void {
    this.board.createTask(input);
  }

  protected onUpdateTask(payload: { id: TaskId; changes: UpdateTaskInput }): void {
    this.board.updateTask(payload.id, payload.changes);
  }

  /**
   * The column shows the state; the checkbox is the shortcut that jumps straight to
   * "Completada" from anywhere, so it has to say what it did and offer the way back.
   */
  protected toggleDone(id: TaskId): void {
    const before = this.board.taskIndex().get(id);
    if (!before) return;

    this.board.toggleTaskDone(id);
    const after = this.board.taskIndex().get(id);
    if (after) this.announceStatusChange(before.status, after.status);
  }

  protected changeStatus(payload: { id: TaskId; status: TaskStatus }): void {
    const before = this.board.taskIndex().get(payload.id);
    this.board.setTaskStatus(payload.id, payload.status);
    if (before) this.announceStatusChange(before.status, payload.status);
  }

  protected undoLastAction(): void {
    this.board.undo();
    this.dismissToast();
  }

  /** Ctrl+Z, the topbar button and the palette's "Deshacer" command all land here. */
  protected undo(): void {
    if (!this.board.canUndo()) return;
    const kind = this.board.undoKind();
    const before = this.board.tasks();
    this.board.undo();
    this.announceHistoryToast('Se deshizo', kind, before);
  }

  protected redo(): void {
    if (!this.board.canRedo()) return;
    const kind = this.board.redoKind();
    const before = this.board.tasks();
    this.board.redo();
    this.announceHistoryToast('Se rehizo', kind, before);
  }

  /**
   * Finds the one task a create/update/move/status/delete mutation touched, by
   * diffing task lists before and after. Multi-task mutations (delete a list, clear
   * the board) have no single task to flash or check, so this returns null for them.
   */
  private findAffectedTaskId(before: readonly Task[]): TaskId | null {
    const beforeById = new Map(before.map((task) => [task.id, task]));
    const after = this.board.tasks();
    for (const task of after) {
      const previous = beforeById.get(task.id);
      if (!previous || previous.updatedAt !== task.updatedAt) return task.id;
    }
    const afterIds = new Set(after.map((task) => task.id));
    for (const task of before) {
      if (!afterIds.has(task.id)) return task.id;
    }
    return null;
  }

  private announceHistoryToast(
    verb: 'Se deshizo' | 'Se rehizo',
    kind: MutationKind | null,
    before: readonly Task[],
  ): void {
    if (kind === null) return;
    let message = `${verb}: ${lowerFirst(MUTATION_LABELS[kind])}`;

    const affectedId = this.findAffectedTaskId(before);
    if (affectedId !== null && this.board.taskIndex().has(affectedId)) {
      if (this.view.visibleTasks().some((task) => task.id === affectedId)) {
        this.flashTask(affectedId);
        document.getElementById(`task-${affectedId}`)?.scrollIntoView({ block: 'nearest' });
      } else {
        message += ' · No coincide con los filtros activos';
      }
    }
    this.showToast(message);
  }

  private showToast(message: string, options: { undoable?: boolean } = {}): void {
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    this.toastMessage.set(message);
    this.toastUndoable.set(options.undoable ?? false);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), TOAST_MS);
  }

  private dismissToast(): void {
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    this.toastMessage.set(null);
  }

  // --- Task detail ---

  protected openDetail(id: TaskId): void {
    this.detailTaskId.set(id);
  }

  protected closeDetail(): void {
    this.detailTaskId.set(null);
  }

  protected editFromDetail(): void {
    const id = this.detailTaskId();
    this.closeDetail();
    if (id !== null) this.openEditTask(id);
  }

  protected duplicateFromDetail(): void {
    const id = this.detailTaskId();
    this.closeDetail();
    if (id !== null) this.duplicateTask(id);
  }

  protected removeFromDetail(): void {
    const id = this.detailTaskId();
    this.closeDetail();
    if (id !== null) this.requestDeleteTask(id);
  }

  protected toggleDoneFromDetail(): void {
    const id = this.detailTaskId();
    if (id !== null) this.toggleDone(id);
  }

  protected duplicateTask(id: TaskId): void {
    const task = this.board.taskIndex().get(id);
    if (!task) return;
    this.board.createTask({
      listId: task.listId,
      title: `${task.title} (copia)`,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    });
  }

  // --- List dialogs ---

  protected openCreateList(): void {
    this.editingListId.set(null);
    this.listFormMode.set('create');
    this.listFormOpen.set(true);
  }

  protected openRenameList(id: ListId): void {
    this.editingListId.set(id);
    this.listFormMode.set('edit');
    this.listFormOpen.set(true);
  }

  protected onListFormSubmit(result: ListFormResult): void {
    const id = this.editingListId();
    if (this.listFormMode() === 'edit' && id !== null) {
      this.board.updateList(id, { name: result.name, color: result.color });
      return;
    }
    const created = this.board.createList({ name: result.name, color: result.color });
    this.selectList(created);
  }

  // --- Confirmations ---

  protected requestDeleteTask(id: TaskId): void {
    this.confirmRequest.set({ kind: 'delete-task', id });
  }

  protected requestDeleteList(id: ListId): void {
    this.confirmRequest.set({ kind: 'delete-list', id });
  }

  protected requestClearBoard(): void {
    this.overflowMenuOpen.set(false);
    this.confirmRequest.set({ kind: 'clear-board' });
  }

  protected onConfirmed(): void {
    const request = this.confirmRequest();
    this.confirmRequest.set(null);
    if (request === null) return;

    switch (request.kind) {
      case 'delete-task': {
        const task = this.board.taskIndex().get(request.id);
        this.board.deleteTask(request.id);
        this.taskFormOpen.set(false);
        if (task) {
          this.showToast(`Tarea «${truncateForQuote(task.title)}» eliminada`, { undoable: true });
        }
        break;
      }
      case 'delete-list': {
        const list = this.listIndex().get(request.id);
        const affected = this.board.tasks().filter((task) => task.listId === request.id).length;
        this.board.deleteList(request.id);
        if (list) {
          const owner = affected === 1 ? 'su' : 'sus';
          this.showToast(
            `Lista «${truncateForQuote(list.name)}» y ${owner} ${eliminadasPhrase(affected)}`,
            { undoable: true },
          );
        }
        break;
      }
      case 'clear-board': {
        const total = this.board.tasks().length;
        this.board.clearBoard();
        this.showToast(`Tablero vaciado: ${eliminadasPhrase(total)}`, { undoable: true });
        break;
      }
    }
  }

  // --- Drag and drop ---

  protected onReordered(status: TaskStatus, event: { id: TaskId; targetIndex: number }): void {
    if (this.dragCancelled) {
      this.dragCancelled = false;
      return;
    }

    const task = this.board.taskIndex().get(event.id);
    if (!task) return;

    const visible = this.view.columns().find((column) => column.status === status)?.tasks ?? [];
    const siblings = this.board
      .tasks()
      .filter((other) => other.id !== task.id && other.status === status)
      .sort(byOrder);

    const targetIndex = resolveDropIndex(task, siblings, visible, event.targetIndex);
    this.board.moveTask(event.id, { listId: task.listId, status, targetIndex });
    this.flashTask(event.id);
    this.announceStatusChange(task.status, status);
  }

  /** Entering or leaving «Completada» moves the card out of sight; the rest is self-evident. */
  private announceStatusChange(from: TaskStatus, to: TaskStatus): void {
    if (from === to) return;
    if (to === 'done') this.showToast('Tarea completada', { undoable: true });
    else if (from === 'done')
      this.showToast(`Tarea reabierta en «${STATUS_LABELS[to]}»`, { undoable: true });
  }

  private flashTask(id: TaskId): void {
    this.highlightedTaskId.set(id);
    setTimeout(() => {
      if (this.highlightedTaskId() === id) this.highlightedTaskId.set(null);
    }, HIGHLIGHT_MS);
  }

  // --- Board keyboard navigation ---

  protected onBoardKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target === null || !target.classList.contains('task-card')) return;

    const position = this.currentPosition();
    if (position === null) return;

    const columns = this.view.columns();
    const column = columns[position.columnIndex];
    const task = column.tasks[position.taskIndex];

    switch (event.key) {
      case 'ArrowDown':
        this.focusTaskAt(position.columnIndex, position.taskIndex + 1);
        break;
      case 'ArrowUp':
        this.focusTaskAt(position.columnIndex, position.taskIndex - 1);
        break;
      case 'ArrowRight':
        this.focusAdjacentColumn(position, 1);
        break;
      case 'ArrowLeft':
        this.focusAdjacentColumn(position, -1);
        break;
      case 'Home':
        this.focusTaskAt(position.columnIndex, 0);
        break;
      case 'End':
        this.focusTaskAt(position.columnIndex, column.tasks.length - 1);
        break;
      case 'Enter':
        this.openDetail(task.id);
        break;
      case ' ':
        this.toggleDone(task.id);
        break;
      case 'Delete':
        this.requestDeleteTask(task.id);
        break;
      default:
        return;
    }

    event.preventDefault();
  }

  protected onTaskFocused(id: TaskId): void {
    this.explicitFocusId.set(id);
  }

  private currentPosition(): { columnIndex: number; taskIndex: number } | null {
    const id = this.rovingTaskId();
    if (id === null) return null;

    const columns = this.view.columns();
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const taskIndex = columns[columnIndex].tasks.findIndex((task) => task.id === id);
      if (taskIndex >= 0) return { columnIndex, taskIndex };
    }
    return null;
  }

  private focusTaskAt(columnIndex: number, taskIndex: number): void {
    const column = this.view.columns()[columnIndex];
    if (column === undefined || column.tasks.length === 0) return;

    const clamped = Math.max(0, Math.min(taskIndex, column.tasks.length - 1));
    const id = column.tasks[clamped].id;
    this.explicitFocusId.set(id);
    document.getElementById(`task-${id}`)?.focus();
  }

  private focusAdjacentColumn(
    position: { columnIndex: number; taskIndex: number },
    step: number,
  ): void {
    const columns = this.view.columns();
    for (
      let index = position.columnIndex + step;
      index >= 0 && index < columns.length;
      index += step
    ) {
      if (columns[index].tasks.length > 0) {
        this.focusTaskAt(index, position.taskIndex);
        return;
      }
    }
  }

  // --- Global shortcuts ---

  @HostListener('document:keydown', ['$event'])
  protected onGlobalKeydown(event: KeyboardEvent): void {
    // Esc while a card is in the air cancels the move. The CDK has no cancel of its
    // own, so the drop is let through and then ignored: nothing changes.
    if (event.key === 'Escape' && document.querySelector('.cdk-drag-preview') !== null) {
      this.dragCancelled = true;
      event.preventDefault();
      return;
    }

    const modifierPressed = isMacPlatform() ? event.metaKey : event.ctrlKey;

    // The palette works from anywhere, including inside a text field, but never on
    // top of another modal dialog — no stacking modal layers.
    if (modifierPressed && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') {
      if (!this.anyDialogOpen()) this.paletteOpen.set(true);
      event.preventDefault();
      return;
    }

    // Ctrl+Z inside a text field is the browser's own undo for what's being typed;
    // outside one (and with no other dialog blocking it), it undoes a board action.
    if (modifierPressed && !event.altKey && event.key.toLowerCase() === 'z') {
      if (!isEditableTarget(event.target) && !this.anyDialogOpen()) {
        if (event.shiftKey) this.redo();
        else this.undo();
        event.preventDefault();
      }
      return;
    }

    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

    if (isEditableTarget(event.target)) return;

    if (this.anyDialogOpen()) return;

    switch (event.key) {
      case '/':
        this.paletteOpen.set(true);
        break;
      case 'n':
      case 'N':
        this.openCreateTask();
        break;
      case 'l':
      case 'L':
        this.openCreateList();
        break;
      case 't':
      case 'T':
        this.theme.toggle();
        break;
      case '?':
        this.shortcutsOpen.set(true);
        break;
      case 'Escape':
        this.sidebarOpen.set(false);
        this.themeMenuOpen.set(false);
        this.overflowMenuOpen.set(false);
        break;
      default:
        return;
    }

    event.preventDefault();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const menu = (event.target as HTMLElement | null)?.closest('[data-menu]') ?? null;
    if (menu?.getAttribute('data-menu') !== 'theme') this.themeMenuOpen.set(false);
    if (menu?.getAttribute('data-menu') !== 'overflow') this.overflowMenuOpen.set(false);
  }

  protected setThemePreference(preference: ThemePreference): void {
    this.theme.setPreference(preference);
    this.themeMenuOpen.set(false);
  }
}

function countLabel(count: number): string {
  return count === 1 ? '1 tarea' : `${count} tareas`;
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (element === null) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}
