import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { BoardStore } from '../../core/state/board-store';
import { BoardViewStore } from '../../core/state/board-view-store';
import { MemoryStorageDriver } from '../../core/storage/memory-storage-driver';
import { STORAGE_DRIVER } from '../../core/storage/storage-driver';
import { BoardPage } from './board-page';

describe('BoardPage', () => {
  let fixture: ComponentFixture<BoardPage>;
  let board: BoardStore;
  let view: BoardViewStore;

  function cards(): NodeListOf<Element> {
    return (fixture.nativeElement as HTMLElement).querySelectorAll('.task-card');
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [
        // Same paths as the real router so the fallback redirect actually resolves.
        provideRouter([
          { path: 'tablero', children: [] },
          { path: 'tablero/:listId', children: [] },
        ]),
        { provide: STORAGE_DRIVER, useValue: new MemoryStorageDriver() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardPage);
    board = TestBed.inject(BoardStore);
    view = TestBed.inject(BoardViewStore);
    await fixture.whenStable();
  });

  it('renders one column per status with the seeded board', async () => {
    const headings = (fixture.nativeElement as HTMLElement).querySelectorAll('.task-column');
    expect(headings.length).toBe(3);
    expect(cards().length).toBeGreaterThan(0);
  });

  it('announces the sample board and drops the notice after the first change', async () => {
    expect(text()).toContain('Esto es un tablero de ejemplo.');

    board.createTask({ listId: board.lists()[0].id, title: 'Mía' });
    await fixture.whenStable();

    expect(text()).not.toContain('Esto es un tablero de ejemplo.');
  });

  it('narrows the rendered cards when the search matches fewer tasks', async () => {
    const before = cards().length;

    view.setQuery('zzzz-no-existe');
    await fixture.whenStable();

    expect(cards().length).toBe(0);
    expect(text()).toContain('Ninguna tarea coincide');
    expect(before).toBeGreaterThan(0);
  });

  it('ignores an unknown list in the route and shows every task', async () => {
    fixture.componentRef.setInput('listId', 'does-not-exist');
    await fixture.whenStable();

    expect(view.activeListId()).toBeNull();
    expect(text()).toContain('Todas las tareas');
  });

  it('scopes the board to the list named in the route', async () => {
    const list = board.lists()[0];

    fixture.componentRef.setInput('listId', list.id);
    await fixture.whenStable();

    expect(view.activeListId()).toBe(list.id);
    expect(view.visibleTasks().every((task) => task.listId === list.id)).toBe(true);
  });

  it('shows the empty board state once every task is gone', async () => {
    board.clearBoard();
    await fixture.whenStable();

    expect(text()).toContain('Tu tablero está vacío');
    expect(cards().length).toBe(0);
  });
});
