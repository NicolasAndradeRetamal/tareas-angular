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
import { Router } from '@angular/router';
import type { CreateTaskInput, UpdateTaskInput } from '../../core/models/board-state';
import type { List, ListId } from '../../core/models/list';
import type { Task, TaskId, TaskStatus } from '../../core/models/task';
import { PRIORITY_LABELS } from '../../core/models/task';
import { BoardStore } from '../../core/state/board-store';
import { BoardViewStore } from '../../core/state/board-view-store';
import type { StatusFilter } from '../../core/state/board-view-store';
import { ThemeStore } from '../../core/state/theme-store';
import type { ThemePreference } from '../../core/state/theme-store';
import { byOrder } from '../../core/util/order';
import { Banner } from '../../shared/ui/banner';
import { Button } from '../../shared/ui/button';
import { Icon } from '../../shared/ui/icon';
import type { IconName } from '../../shared/ui/icon';
import { IconButton } from '../../shared/ui/icon-button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { LIST_COLOR_BG_CLASS } from '../../shared/ui/list-color';
import { BoardToolbar } from './components/board-toolbar';
import { EmptyState } from './components/empty-state';
import { ListForm } from './components/list-form';
import type { ListFormMode, ListFormResult } from './components/list-form';
import { ListSidebar } from './components/list-sidebar';
import type { ListSummary } from './components/list-sidebar';
import { ShortcutsDialog } from './components/shortcuts-dialog';
import { resolveDropIndex } from './drop-target';
import { TaskColumn } from './components/task-column';
import { TaskForm } from './components/task-form';
import type { TaskFormMode } from './components/task-form';

type ConfirmRequest =
  | { readonly kind: 'delete-task'; readonly id: TaskId }
  | { readonly kind: 'delete-list'; readonly id: ListId }
  | { readonly kind: 'clear-board' };

const THEME_OPTIONS: readonly { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
  { value: 'system', label: 'Seguir al sistema', icon: 'monitor' },
];

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
    ListSidebar,
    BoardToolbar,
    TaskColumn,
    TaskForm,
    ListForm,
    ShortcutsDialog,
    ConfirmDialog,
    EmptyState,
    Banner,
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

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly themeOptions = THEME_OPTIONS;

  // --- UI state ---
  protected readonly sidebarOpen = signal(false);
  protected readonly themeMenuOpen = signal(false);
  protected readonly overflowMenuOpen = signal(false);
  protected readonly shortcutsOpen = signal(false);
  protected readonly confirmRequest = signal<ConfirmRequest | null>(null);
  protected readonly seedNoticeDismissed = signal(false);
  protected readonly loadIssueDismissed = signal(false);

  protected readonly taskFormOpen = signal(false);
  protected readonly taskFormMode = signal<TaskFormMode>('create');
  protected readonly editingTaskId = signal<TaskId | null>(null);
  protected readonly newTaskStatus = signal<TaskStatus>('todo');

  protected readonly listFormOpen = signal(false);
  protected readonly listFormMode = signal<ListFormMode>('create');
  protected readonly editingListId = signal<ListId | null>(null);

  private readonly explicitFocusId = signal<TaskId | null>(null);

  // --- Derived ---
  protected readonly lists = this.board.lists;
  protected readonly listIndex = this.board.listIndex;
  protected readonly persistenceError = this.board.persistenceError;

  protected readonly editingTask = computed<Task | null>(() => {
    const id = this.editingTaskId();
    return id === null ? null : (this.board.taskIndex().get(id) ?? null);
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

  protected readonly contextTitle = computed(() => this.view.activeList()?.name ?? 'Todas las tareas');
  protected readonly contextColorClass = computed(() => {
    const list = this.view.activeList();
    return list ? LIST_COLOR_BG_CLASS[list.color] : null;
  });

  protected readonly themeIcon = computed<IconName>(() => (this.theme.resolved() === 'dark' ? 'moon' : 'sun'));

  /** The sample board is still untouched: no mutation has happened yet. */
  protected readonly showSeedNotice = computed(
    () => this.board.isSeeded() && !this.seedNoticeDismissed() && !this.view.isEmpty(),
  );

  protected readonly showLoadIssue = computed(
    () => this.board.loadIssue() !== null && !this.loadIssueDismissed(),
  );

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
    () => this.taskFormOpen() || this.listFormOpen() || this.shortcutsOpen() || this.confirmRequest() !== null,
  );

  protected readonly confirmCopy = computed(() => {
    const request = this.confirmRequest();
    if (request === null) return null;
    if (request.kind === 'clear-board') {
      return {
        title: 'Vaciar el tablero',
        message:
          'Se eliminarán todas las tareas y quedará una sola lista vacía. Puedes deshacerlo mientras no cierres la pestaña.',
        confirmLabel: 'Vaciar el tablero',
      };
    }
    if (request.kind === 'delete-list') {
      const list = this.listIndex().get(request.id);
      return {
        title: 'Eliminar la lista',
        message: `Se eliminará «${list?.name ?? ''}» y todas sus tareas.`,
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

  protected onSearchInput(event: Event): void {
    this.view.setQuery((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.view.setQuery('');
    this.searchInput()?.nativeElement.focus();
  }

  // --- Task dialogs ---

  protected openCreateTask(status: TaskStatus = 'todo'): void {
    this.newTaskStatus.set(status);
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

  protected toggleDone(id: TaskId): void {
    this.board.toggleTaskDone(id);
  }

  protected changeStatus(payload: { id: TaskId; status: TaskStatus }): void {
    this.board.setTaskStatus(payload.id, payload.status);
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
      this.board.renameList(id, result.name);
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
      case 'delete-task':
        this.board.deleteTask(request.id);
        this.taskFormOpen.set(false);
        break;
      case 'delete-list':
        this.board.deleteList(request.id);
        break;
      case 'clear-board':
        this.board.clearBoard();
        break;
    }
  }

  // --- Drag and drop ---

  protected onReordered(status: TaskStatus, event: { id: TaskId; targetIndex: number }): void {
    const task = this.board.taskIndex().get(event.id);
    if (!task) return;

    const visible = this.view.columns().find((column) => column.status === status)?.tasks ?? [];
    const siblings = this.board
      .tasks()
      .filter((other) => other.id !== task.id && other.listId === task.listId && other.status === status)
      .sort(byOrder);

    const targetIndex = resolveDropIndex(task, siblings, visible, event.targetIndex);
    this.board.moveTask(event.id, { listId: task.listId, status, targetIndex });
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
        this.openEditTask(task.id);
        break;
      case ' ':
        this.board.toggleTaskDone(task.id);
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

  private focusAdjacentColumn(position: { columnIndex: number; taskIndex: number }, step: number): void {
    const columns = this.view.columns();
    for (let index = position.columnIndex + step; index >= 0 && index < columns.length; index += step) {
      if (columns[index].tasks.length > 0) {
        this.focusTaskAt(index, position.taskIndex);
        return;
      }
    }
  }

  // --- Global shortcuts ---

  @HostListener('document:keydown', ['$event'])
  protected onGlobalKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

    if (isEditableTarget(event.target)) {
      if (event.key === 'Escape' && event.target === this.searchInput()?.nativeElement) {
        this.view.setQuery('');
      }
      return;
    }

    if (this.anyDialogOpen()) return;

    switch (event.key) {
      case '/':
        this.searchInput()?.nativeElement.focus();
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
    const target = event.target as HTMLElement | null;
    if (target === null || target.closest('[data-menu]') === null) {
      this.themeMenuOpen.set(false);
      this.overflowMenuOpen.set(false);
    }
  }

  protected setThemePreference(preference: ThemePreference): void {
    this.theme.setPreference(preference);
    this.themeMenuOpen.set(false);
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (element === null) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}
