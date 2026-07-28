import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Task } from '../../../core/models/task';
import { TaskCard } from './task-card';

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

describe('TaskCard', () => {
  let fixture: ComponentFixture<TaskCard>;

  function setTask(overrides: Partial<Task> = {}) {
    fixture.componentRef.setInput('task', makeTask(overrides));
    fixture.detectChanges();
  }

  function openMenu(): void {
    const trigger = fixture.nativeElement.querySelector(
      '.task-card__menu-trigger',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
  }

  /** The overlay content is portaled to document.body, outside the fixture root. */
  function menuItemLabels(): string[] {
    return Array.from(document.querySelectorAll('.task-card__menu [role="menuitem"]')).map(
      (item) => item.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TaskCard] }).compileComponents();
    fixture = TestBed.createComponent(TaskCard);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('offers "Completar" and "Mover a En progreso" for a pending task, without a duplicate "Mover a Completada"', () => {
    setTask({ status: 'todo' });
    openMenu();

    const labels = menuItemLabels();
    expect(labels).toContain('Completar');
    expect(labels).toContain('Mover a En progreso');
    expect(labels).not.toContain('Mover a Completada');
    expect(labels).not.toContain('Mover a Por hacer');
  });

  it('offers "Reabrir" and "Mover a En progreso" for a done task, without a duplicate "Mover a Por hacer"', () => {
    setTask({ status: 'done', completedAt: '2026-07-02T00:00:00.000Z' });
    openMenu();

    const labels = menuItemLabels();
    expect(labels).toContain('Reabrir');
    expect(labels).toContain('Mover a En progreso');
    expect(labels).not.toContain('Mover a Por hacer');
    expect(labels).not.toContain('Mover a Completada');
  });

  it('offers "Mover a Por hacer" for an in-progress task, alongside "Completar"', () => {
    setTask({ status: 'in-progress' });
    openMenu();

    const labels = menuItemLabels();
    expect(labels).toContain('Completar');
    expect(labels).toContain('Mover a Por hacer');
    expect(labels).not.toContain('Mover a Completada');
    expect(labels).not.toContain('Mover a En progreso');
  });
});
