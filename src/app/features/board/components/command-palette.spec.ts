import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { List } from '../../../core/models/list';
import type { Task } from '../../../core/models/task';
import type { ListSummary } from './list-sidebar';
import { CommandPalette } from './command-palette';

function makeList(overrides: Partial<List> = {}): List {
  return {
    id: 'l1',
    name: 'Trabajo',
    color: 'blue',
    order: 0,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    listId: 'l1',
    title: 'Preparar el informe semanal',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: null,
    order: 0,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

describe('CommandPalette', () => {
  let fixture: ComponentFixture<CommandPalette>;
  let component: CommandPalette;

  function setInputs(overrides: { lists?: ListSummary[]; tasks?: Task[] } = {}) {
    const list = makeList();
    fixture.componentRef.setInput('open', false);
    fixture.componentRef.setInput('lists', overrides.lists ?? [{ list, count: 2 }]);
    fixture.componentRef.setInput('tasks', overrides.tasks ?? [makeTask()]);
    fixture.componentRef.setInput('totalPendingCount', 5);
    fixture.componentRef.setInput('themeResolved', 'light');
    fixture.componentRef.setInput('canUndo', false);
    fixture.componentRef.setInput('canRedo', false);
    fixture.componentRef.setInput('undoLabel', null);
    fixture.componentRef.setInput('redoLabel', null);
    fixture.componentRef.setInput('hasActiveFilters', false);
    fixture.componentRef.setInput('modKey', 'Ctrl');
    fixture.detectChanges();
  }

  function queryInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.cmdpalette__input');
  }

  function rows(): NodeListOf<HTMLElement> {
    return fixture.nativeElement.querySelectorAll('.cmdpalette__row');
  }

  function type(value: string) {
    const input = queryInput();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function press(key: string, extra: KeyboardEventInit = {}) {
    queryInput().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CommandPalette] }).compileComponents();
    fixture = TestBed.createComponent(CommandPalette);
    component = fixture.componentInstance;
    // The native <dialog> never opens (open stays false), so this is safe under jsdom,
    // which has no HTMLDialogElement.showModal; only the interior markup is exercised.
    setInputs();
  });

  it('opens with the default groups and no task results', () => {
    expect(rows().length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('Nueva tarea');
    expect(fixture.nativeElement.textContent).not.toContain('Tareas');
  });

  it('filters rows as the query changes and finds a task by title', () => {
    type('informe');
    expect(fixture.nativeElement.textContent).toContain('Preparar el informe semanal');
  });

  it('always keeps a query-aware "create task" row, even with no matches', () => {
    type('zzzzz-sin-coincidencias');
    expect(fixture.nativeElement.textContent).toContain('Crear la tarea "zzzzz-sin-coincidencias"');
    expect(fixture.nativeElement.textContent).toContain('Sin resultados');
  });

  it('wraps the highlight past the last row back to the first', () => {
    const total = rows().length;
    for (let i = 0; i < total - 1; i += 1) press('ArrowDown');
    expect(rows()[total - 1].classList).toContain('cmdpalette__row--active');

    press('ArrowDown');
    expect(rows()[0].classList).toContain('cmdpalette__row--active');
  });

  it('emits goToList and closes when Enter runs a list row', () => {
    type('trabajo');
    let closed = false;
    let goneTo: string | null | undefined;
    component.closed.subscribe(() => (closed = true));
    component.goToList.subscribe((id) => (goneTo = id));

    // "Crear la tarea…" always leads; the matching list is the next row.
    press('ArrowDown');
    press('Enter');

    expect(goneTo).toBe('l1');
    expect(closed).toBe(true);
  });

  it('completes a task with Ctrl+Enter without closing the palette', () => {
    type('informe');
    let closed = false;
    let toggled: string | null = null;
    component.closed.subscribe(() => (closed = true));
    component.toggleTaskDone.subscribe((id) => (toggled = id));

    // The task row is not first (Acciones/Ir a lead); reach it, then complete it.
    const total = rows().length;
    for (let i = 0; i < total - 1; i += 1) press('ArrowDown');
    press('Enter', { ctrlKey: true });

    expect(toggled).toBe('t1');
    expect(closed).toBe(false);
  });

  it('emits createTask with the typed text preset when there is no match', () => {
    let preset: string | null = null;
    component.createTask.subscribe((title) => (preset = title));

    // No fixture text contains an "x", so only the leading create-task row can match.
    type('xxxxxxxxxxxxxxx');
    press('Enter');

    expect(preset).toBe('xxxxxxxxxxxxxxx');
  });
});
