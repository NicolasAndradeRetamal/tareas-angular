import { describe, expect, it } from 'vitest';
import type {
  PaletteContext,
  PaletteListContext,
  PaletteTaskContext,
} from './command-palette-search';
import {
  buildPaletteGroups,
  buildSegments,
  fuzzyMatch,
  initialActiveIndex,
} from './command-palette-search';

function baseContext(overrides: Partial<PaletteContext> = {}): PaletteContext {
  return {
    lists: [],
    tasks: [],
    totalPendingCount: 0,
    themeResolved: 'light',
    canUndo: false,
    canRedo: false,
    undoLabel: null,
    redoLabel: null,
    hasActiveFilters: false,
    hasAnyTask: false,
    ...overrides,
  };
}

function makeList(overrides: Partial<PaletteListContext> = {}): PaletteListContext {
  return { id: 'l1', name: 'Trabajo', colorClass: 'bg-list-blue', pendingCount: 3, ...overrides };
}

function makeTask(overrides: Partial<PaletteTaskContext> = {}): PaletteTaskContext {
  return {
    id: 't1',
    title: 'Preparar el informe semanal',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: null,
    listId: 'l1',
    ...overrides,
  };
}

describe('fuzzyMatch', () => {
  it('matches an empty query against anything, without highlighting', () => {
    expect(fuzzyMatch('', 'Cualquier cosa')).toEqual({ score: 0, indices: [] });
  });

  it('scores a prefix match above a mid-string match', () => {
    const prefix = fuzzyMatch('inf', 'Informe semanal');
    const middle = fuzzyMatch('sem', 'Informe semanal');
    expect(prefix?.score).toBeGreaterThan(middle!.score);
  });

  it('scores a word-boundary match above a plain substring match', () => {
    const wordStart = fuzzyMatch('sem', 'Informe semanal');
    const midWord = fuzzyMatch('orm', 'Informe semanal');
    expect(wordStart?.score).toBeGreaterThan(midWord!.score);
  });

  it('ignores accents and case', () => {
    expect(fuzzyMatch('cafe', 'Café')).not.toBeNull();
    expect(fuzzyMatch('INFORME', 'informe semanal')?.score).toBe(3);
  });

  it('falls back to subsequence matching, scored below any substring match', () => {
    const subsequence = fuzzyMatch('ifs', 'Informe semanal');
    const substring = fuzzyMatch('inf', 'Informe semanal');
    expect(subsequence).not.toBeNull();
    expect(subsequence!.score).toBeLessThan(substring!.score);
  });

  it('returns null when the query cannot be found at all', () => {
    expect(fuzzyMatch('xyz', 'Informe semanal')).toBeNull();
  });
});

describe('buildSegments', () => {
  it('marks the matched range and leaves the rest untouched', () => {
    expect(buildSegments('Informe', [0, 1, 2])).toEqual([
      { text: 'Inf', matched: true },
      { text: 'orme', matched: false },
    ]);
  });

  it('handles scattered subsequence indices with multiple runs', () => {
    expect(buildSegments('abcde', [0, 2, 4])).toEqual([
      { text: 'a', matched: true },
      { text: 'b', matched: false },
      { text: 'c', matched: true },
      { text: 'd', matched: false },
      { text: 'e', matched: true },
    ]);
  });

  it('returns a single unmatched segment when there are no indices', () => {
    expect(buildSegments('Informe', [])).toEqual([{ text: 'Informe', matched: false }]);
  });
});

describe('buildPaletteGroups', () => {
  it('shows actions and go-to with an empty query, and no tasks group', () => {
    const groups = buildPaletteGroups('', baseContext({ lists: [makeList()] }));
    const labels = groups.map((g) => g.label);
    expect(labels).toEqual(['Acciones', 'Ir a']);
    expect(groups[0].items[0]).toMatchObject({ id: 'create-task', label: 'Nueva tarea' });
  });

  it('leads with a query-aware create-task row that is never filtered out', () => {
    const groups = buildPaletteGroups('zzzzz-sin-coincidencias', baseContext());
    const actions = groups.find((g) => g.label === 'Acciones')!;
    expect(actions.items[0]).toMatchObject({
      id: 'create-task',
      label: 'Crear la tarea "zzzzz-sin-coincidencias"',
      query: 'zzzzz-sin-coincidencias',
    });
  });

  it('hides undo, redo, clear-filters and clear-board when they are not available', () => {
    const groups = buildPaletteGroups('', baseContext());
    const actionIds = groups.find((g) => g.label === 'Acciones')!.items.map((i) => i.id);
    expect(actionIds).not.toContain('undo');
    expect(actionIds).not.toContain('redo');
    expect(actionIds).not.toContain('clear-filters');
    expect(actionIds).not.toContain('clear-board');
  });

  it('shows undo and redo with their mutation label once available', () => {
    const groups = buildPaletteGroups(
      '',
      baseContext({
        canUndo: true,
        undoLabel: 'mover tarea',
        canRedo: true,
        redoLabel: 'eliminar tarea',
      }),
    );
    const actions = groups.find((g) => g.label === 'Acciones')!.items;
    expect(actions).toContainEqual(
      expect.objectContaining({ id: 'undo', label: 'Deshacer: mover tarea' }),
    );
    expect(actions).toContainEqual(
      expect.objectContaining({ id: 'redo', label: 'Rehacer: eliminar tarea' }),
    );
  });

  it('lists "Todas las tareas" plus every list under "Ir a"', () => {
    const groups = buildPaletteGroups(
      '',
      baseContext({
        lists: [makeList({ id: 'l1', name: 'Trabajo' }), makeList({ id: 'l2', name: 'Personal' })],
      }),
    );
    const goTo = groups.find((g) => g.label === 'Ir a')!;
    expect(goTo.items.map((i) => i.label)).toEqual(['Todas las tareas', 'Trabajo', 'Personal']);
  });

  it('has no "Tareas" group when the query is empty', () => {
    const groups = buildPaletteGroups('', baseContext({ tasks: [makeTask()] }));
    expect(groups.some((g) => g.label === 'Tareas')).toBe(false);
  });

  it('finds a task by title and highlights the matched letters', () => {
    const groups = buildPaletteGroups(
      'informe',
      baseContext({ tasks: [makeTask({ title: 'Preparar el informe semanal' })] }),
    );
    const tasks = groups.find((g) => g.label === 'Tareas')!;
    // Followed by the row that hands the query to the board (see below).
    expect(tasks.items).toHaveLength(2);
    expect(tasks.items[0]).toMatchObject({ kind: 'task', taskId: 't1' });
  });

  it('finds a task by description when the title does not match, without highlighting it', () => {
    const groups = buildPaletteGroups(
      'aerolineas',
      baseContext({
        tasks: [
          makeTask({
            id: 't2',
            title: 'Reservar el vuelo',
            description: 'Comparar precios entre dos aerolíneas.',
          }),
        ],
      }),
    );
    const tasks = groups.find((g) => g.label === 'Tareas')!;
    expect(tasks.items[0]).toEqual(
      expect.objectContaining({
        taskId: 't2',
        segments: [{ text: 'Reservar el vuelo', matched: false }],
      }),
    );
  });

  it('ranks a title match above a description-only match for the same query', () => {
    const groups = buildPaletteGroups(
      'informe',
      baseContext({
        tasks: [
          makeTask({
            id: 'by-description',
            title: 'Otra tarea',
            description: 'incluye el informe adjunto',
          }),
          makeTask({ id: 'by-title', title: 'Enviar el informe' }),
        ],
      }),
    );
    const ids = groups
      .find((g) => g.label === 'Tareas')!
      .items.filter((i): i is Extract<typeof i, { kind: 'task' }> => i.kind === 'task')
      .map((i) => i.taskId);
    expect(ids).toEqual(['by-title', 'by-description']);
  });

  it('breaks ties between equally-scored tasks by descending priority', () => {
    const groups = buildPaletteGroups(
      'tarea',
      baseContext({
        tasks: [
          makeTask({ id: 'low', title: 'Una tarea baja', priority: 'low' }),
          makeTask({ id: 'urgent', title: 'Una tarea urgente', priority: 'urgent' }),
        ],
      }),
    );
    const ids = groups
      .find((g) => g.label === 'Tareas')!
      .items.filter((i): i is Extract<typeof i, { kind: 'task' }> => i.kind === 'task')
      .map((i) => i.taskId);
    expect(ids).toEqual(['urgent', 'low']);
  });

  it('always closes with "view all" once there is at least one match, not just past the cap', () => {
    // The board has no live search field of its own any more: this row is the
    // only way to hand a query to it, so it can't depend on there being 9+ hits.
    const groups = buildPaletteGroups(
      'informe',
      baseContext({ tasks: [makeTask({ title: 'Preparar el informe semanal' })] }),
    );
    const items = groups.find((g) => g.label === 'Tareas')!.items;
    expect(items).toHaveLength(2);
    expect(items[1]).toMatchObject({
      id: 'view-all-results',
      query: 'informe',
      label: 'Ver 1 resultado en el tablero',
    });
  });

  it('caps task results and appends a "view all" row beyond the cap', () => {
    const tasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({ id: `t${i}`, title: `Tarea número ${i}` }),
    );
    const groups = buildPaletteGroups('tarea', baseContext({ tasks }));
    const items = groups.find((g) => g.label === 'Tareas')!.items;
    expect(items).toHaveLength(9);
    expect(items[8]).toMatchObject({
      id: 'view-all-results',
      query: 'tarea',
      label: 'Ver los 10 resultados en el tablero',
    });
  });

  it('never shows an empty group', () => {
    const groups = buildPaletteGroups(
      'sin-coincidencias-en-listas-ni-tareas',
      baseContext({ lists: [makeList()] }),
    );
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
  });
});

describe('initialActiveIndex', () => {
  it('stays on the first row when there is no preset query', () => {
    const groups = buildPaletteGroups('', baseContext());
    const items = groups.flatMap((g) => g.items);
    expect(initialActiveIndex(items, false)).toBe(0);
  });

  it('skips the leading "create task" row for a preset query with a real match', () => {
    const groups = buildPaletteGroups(
      'informe',
      baseContext({ tasks: [makeTask({ title: 'Preparar el informe semanal' })] }),
    );
    const items = groups.flatMap((g) => g.items);
    expect(items[0].id).toBe('create-task');

    const index = initialActiveIndex(items, true);
    expect(index).toBeGreaterThan(0);
    expect(items[index].id).not.toBe('create-task');
  });

  it('falls back to the "create task" row itself when a preset query has no match', () => {
    const groups = buildPaletteGroups('zzzzz-sin-coincidencias', baseContext());
    const items = groups.flatMap((g) => g.items);
    expect(initialActiveIndex(items, true)).toBe(0);
    expect(items[0].id).toBe('create-task');
  });
});
