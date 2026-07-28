import type { ListId } from '../../core/models/list';
import { PRIORITY_WEIGHT } from '../../core/models/task';
import type { IsoDate, TaskId, TaskPriority, TaskStatus } from '../../core/models/task';
import { normalizeText } from '../../core/util/text';
import type { IconName } from '../../shared/ui/icon';

export interface TextSegment {
  readonly text: string;
  readonly matched: boolean;
}

export type PaletteCommandId =
  | 'create-task'
  | 'create-list'
  | 'undo'
  | 'redo'
  | 'toggle-theme'
  | 'open-shortcuts'
  | 'clear-filters'
  | 'clear-board'
  | 'view-all-results';

export interface PaletteCommandItem {
  readonly kind: 'command';
  readonly id: PaletteCommandId;
  readonly icon: IconName;
  readonly label: string;
  readonly segments: readonly TextSegment[];
  readonly keys: readonly string[] | null;
  /** Carried by 'create-task' (preset title) and 'view-all-results' (search query). */
  readonly query?: string;
}

export interface PaletteGoListItem {
  readonly kind: 'go-list';
  readonly id: string;
  readonly label: string;
  readonly segments: readonly TextSegment[];
  readonly listId: ListId | null;
  readonly colorClass: string | null;
  readonly count: number;
}

export interface PaletteTaskItem {
  readonly kind: 'task';
  readonly id: string;
  readonly label: string;
  readonly segments: readonly TextSegment[];
  readonly taskId: TaskId;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate: IsoDate | null;
  readonly listName: string;
  readonly done: boolean;
}

export type PaletteItem = PaletteCommandItem | PaletteGoListItem | PaletteTaskItem;

export interface PaletteGroup {
  readonly label: string;
  readonly items: readonly PaletteItem[];
}

export interface PaletteTaskContext {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate: IsoDate | null;
  readonly listId: ListId;
}

export interface PaletteListContext {
  readonly id: ListId;
  readonly name: string;
  readonly colorClass: string;
  readonly pendingCount: number;
}

export interface PaletteContext {
  readonly lists: readonly PaletteListContext[];
  readonly tasks: readonly PaletteTaskContext[];
  readonly totalPendingCount: number;
  readonly themeResolved: 'light' | 'dark';
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** Already in Spanish, lowercase first letter, e.g. "mover tarea". */
  readonly undoLabel: string | null;
  readonly redoLabel: string | null;
  readonly hasActiveFilters: boolean;
  readonly hasAnyTask: boolean;
}

const ACTIONS_CAP = 6;
const GO_TO_CAP = 6;
const TASKS_CAP = 8;

interface FuzzyMatch {
  readonly score: number;
  readonly indices: readonly number[];
}

/**
 * Subsequence match with prefix/word-boundary/substring scored above a loose
 * subsequence. `null` means the query does not match at all. Empty queries match
 * everything at a neutral score, so callers can reuse this for "show defaults".
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = normalizeText(query);
  const t = normalizeText(text);
  if (q.length === 0) return { score: 0, indices: [] };
  if (t.length === 0) return null;

  const idx = t.indexOf(q);
  if (idx !== -1) {
    const indices = Array.from({ length: q.length }, (_, i) => idx + i);
    if (idx === 0) return { score: 3, indices };
    if (/[^\p{L}\p{N}]/u.test(t[idx - 1])) return { score: 2, indices };
    return { score: 1, indices };
  }

  const indices: number[] = [];
  let cursor = 0;
  for (const char of q) {
    const found = t.indexOf(char, cursor);
    if (found === -1) return null;
    indices.push(found);
    cursor = found + 1;
  }
  return { score: -1, indices };
}

/** normalizeText keeps a 1:1 character mapping, so match indices apply to the original text. */
export function buildSegments(text: string, indices: readonly number[]): TextSegment[] {
  if (text.length === 0) return [];
  if (indices.length === 0) return [{ text, matched: false }];

  const matchedSet = new Set(indices);
  const segments: TextSegment[] = [];
  let current = text[0];
  let currentMatched = matchedSet.has(0);
  for (let i = 1; i < text.length; i += 1) {
    const isMatched = matchedSet.has(i);
    if (isMatched === currentMatched) {
      current += text[i];
    } else {
      segments.push({ text: current, matched: currentMatched });
      current = text[i];
      currentMatched = isMatched;
    }
  }
  segments.push({ text: current, matched: currentMatched });
  return segments;
}

function plainSegments(text: string): readonly TextSegment[] {
  return [{ text, matched: false }];
}

interface FixedCommand {
  readonly id: PaletteCommandId;
  readonly icon: IconName;
  readonly label: string;
  readonly keys: readonly string[] | null;
  readonly available: boolean;
}

export function buildPaletteGroups(rawQuery: string, ctx: PaletteContext): readonly PaletteGroup[] {
  const query = rawQuery.trim();

  const createTaskItem: PaletteCommandItem = {
    kind: 'command',
    id: 'create-task',
    icon: 'plus',
    label: query.length > 0 ? `Crear la tarea "${query}"` : 'Nueva tarea',
    segments: plainSegments(query.length > 0 ? `Crear la tarea "${query}"` : 'Nueva tarea'),
    keys: null,
    query,
  };

  const fixedCommands: readonly FixedCommand[] = [
    { id: 'create-list', icon: 'plus', label: 'Nueva lista', keys: null, available: true },
    {
      id: 'undo',
      icon: 'undo',
      label: ctx.undoLabel !== null ? `Deshacer: ${ctx.undoLabel}` : 'Deshacer',
      keys: ['Ctrl', 'Z'],
      available: ctx.canUndo,
    },
    {
      id: 'redo',
      icon: 'redo',
      label: ctx.redoLabel !== null ? `Rehacer: ${ctx.redoLabel}` : 'Rehacer',
      keys: ['Ctrl', 'Shift', 'Z'],
      available: ctx.canRedo,
    },
    {
      id: 'toggle-theme',
      icon: ctx.themeResolved === 'dark' ? 'sun' : 'moon',
      label: ctx.themeResolved === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
      keys: ['T'],
      available: true,
    },
    {
      id: 'open-shortcuts',
      icon: 'keyboard',
      label: 'Atajos de teclado',
      keys: ['?'],
      available: true,
    },
    {
      id: 'clear-filters',
      icon: 'x',
      label: 'Limpiar filtros',
      keys: null,
      available: ctx.hasActiveFilters,
    },
    {
      id: 'clear-board',
      icon: 'trash',
      label: 'Vaciar el tablero',
      keys: null,
      available: ctx.hasAnyTask,
    },
  ];

  const matchedCommands = fixedCommands
    .filter((command) => command.available)
    .map((command) => ({ command, match: fuzzyMatch(query, command.label) }))
    .filter((entry): entry is { command: FixedCommand; match: FuzzyMatch } => entry.match !== null)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, ACTIONS_CAP - 1)
    .map(({ command, match }): PaletteCommandItem => ({
      kind: 'command',
      id: command.id,
      icon: command.icon,
      label: command.label,
      segments: buildSegments(command.label, match.indices),
      keys: command.keys,
    }));

  const actions: PaletteGroup = { label: 'Acciones', items: [createTaskItem, ...matchedCommands] };

  const goToCandidates: {
    label: string;
    listId: ListId | null;
    colorClass: string | null;
    count: number;
  }[] = [
    { label: 'Todas las tareas', listId: null, colorClass: null, count: ctx.totalPendingCount },
    ...ctx.lists.map((list) => ({
      label: list.name,
      listId: list.id,
      colorClass: list.colorClass,
      count: list.pendingCount,
    })),
  ];

  const goTo: PaletteGroup = {
    label: 'Ir a',
    items: goToCandidates
      .map((candidate) => ({ candidate, match: fuzzyMatch(query, candidate.label) }))
      .filter(
        (entry): entry is { candidate: (typeof goToCandidates)[number]; match: FuzzyMatch } =>
          entry.match !== null,
      )
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, GO_TO_CAP)
      .map(({ candidate, match }): PaletteGoListItem => ({
        kind: 'go-list',
        id: `go-list:${candidate.listId ?? 'all'}`,
        label: candidate.label,
        segments: buildSegments(candidate.label, match.indices),
        listId: candidate.listId,
        colorClass: candidate.colorClass,
        count: candidate.count,
      })),
  };

  const groups: PaletteGroup[] = [actions, goTo];

  if (query.length > 0) {
    const listNameById = new Map(ctx.lists.map((list) => [list.id, list.name]));
    const matchedTasks = ctx.tasks
      .map((task) => {
        const titleMatch = fuzzyMatch(query, task.title);
        if (titleMatch !== null) {
          return {
            task,
            score: titleMatch.score,
            segments: buildSegments(task.title, titleMatch.indices),
          };
        }
        const descriptionMatch = fuzzyMatch(query, task.description);
        if (descriptionMatch !== null) {
          return { task, score: descriptionMatch.score - 10, segments: plainSegments(task.title) };
        }
        return null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort(
        (a, b) =>
          b.score - a.score ||
          PRIORITY_WEIGHT[b.task.priority] - PRIORITY_WEIGHT[a.task.priority] ||
          a.task.title.localeCompare(b.task.title),
      );

    const visibleTasks = matchedTasks
      .slice(0, TASKS_CAP)
      .map(({ task, segments }): PaletteTaskItem => ({
        kind: 'task',
        id: `task:${task.id}`,
        label: task.title,
        segments,
        taskId: task.id,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        listName: listNameById.get(task.listId) ?? '',
        done: task.status === 'done',
      }));

    const items: PaletteItem[] = [...visibleTasks];
    // The board no longer has its own live search field: this row is the only way
    // to apply a query to it, so it always closes the group, not just past the cap.
    if (matchedTasks.length > 0) {
      const label =
        matchedTasks.length === 1
          ? 'Ver 1 resultado en el tablero'
          : `Ver los ${matchedTasks.length} resultados en el tablero`;
      items.push({
        kind: 'command',
        id: 'view-all-results',
        icon: 'search',
        label,
        segments: plainSegments(label),
        keys: null,
        query,
      });
    }

    groups.push({ label: 'Tareas', items });
  }

  return groups.filter((group) => group.items.length > 0);
}

/** Row to highlight when the palette opens with a preset query: the first real
 * match, skipping the leading "create task" action an immediate Enter would trigger. */
export function initialActiveIndex(items: readonly PaletteItem[], hasPresetQuery: boolean): number {
  if (!hasPresetQuery) return 0;
  const index = items.findIndex((item) => item.id !== 'create-task');
  return index >= 0 ? index : 0;
}
