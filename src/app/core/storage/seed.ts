import type { BoardState } from '../models/board-state';
import type { List } from '../models/list';
import type { IsoDateTime, Task, TaskPriority, TaskStatus } from '../models/task';
import { nowIso, todayIso } from '../util/date';
import { newId } from '../util/id';
import { ORDER_STEP } from '../util/order';

function addDays(base: Date, delta: number): Date {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + delta);
  return copy;
}

interface SeedTaskSpec {
  readonly listName: 'Trabajo' | 'Personal';
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly title: string;
  readonly description: string;
  /** Days relative to `now`; null means no due date. */
  readonly dueOffset: number | null;
}

const SEED_TASKS: readonly SeedTaskSpec[] = [
  {
    listName: 'Trabajo',
    status: 'todo',
    priority: 'urgent',
    title: 'Enviar la propuesta al cliente',
    description: 'Revisar las cifras finales antes de enviarla.',
    dueOffset: -3,
  },
  {
    listName: 'Trabajo',
    status: 'todo',
    priority: 'high',
    title: 'Preparar el informe semanal',
    description: 'Resumir los avances del sprint para el equipo.',
    dueOffset: 0,
  },
  {
    listName: 'Trabajo',
    status: 'todo',
    priority: 'medium',
    title: 'Revisar los pull requests pendientes',
    description: 'Hay tres cambios esperando aprobación.',
    dueOffset: 2,
  },
  {
    listName: 'Trabajo',
    status: 'todo',
    priority: 'low',
    title: 'Actualizar la documentación interna',
    description: '',
    dueOffset: null,
  },
  {
    listName: 'Trabajo',
    status: 'in-progress',
    priority: 'high',
    title: 'Diseñar la nueva pantalla de inicio de sesión',
    description: 'Aplicar los tokens de color ya definidos.',
    dueOffset: 1,
  },
  {
    listName: 'Trabajo',
    status: 'in-progress',
    priority: 'medium',
    title: 'Configurar el flujo de integración continua',
    description: 'Automatizar los tests antes de cada despliegue.',
    dueOffset: null,
  },
  {
    listName: 'Trabajo',
    status: 'done',
    priority: 'medium',
    title: 'Reunión de planificación del sprint',
    description: '',
    dueOffset: -5,
  },
  {
    listName: 'Personal',
    status: 'todo',
    priority: 'high',
    title: 'Pagar la factura de la luz',
    description: '',
    dueOffset: -1,
  },
  {
    listName: 'Personal',
    status: 'todo',
    priority: 'medium',
    title: 'Reservar el vuelo de las vacaciones',
    description: 'Comparar precios entre dos aerolíneas.',
    dueOffset: 5,
  },
  {
    listName: 'Personal',
    status: 'todo',
    priority: 'low',
    title: 'Leer el libro pendiente',
    description: '',
    dueOffset: null,
  },
  {
    listName: 'Personal',
    status: 'in-progress',
    priority: 'urgent',
    title: 'Llevar el coche al taller',
    description: 'La revisión debe quedar lista antes del viaje.',
    dueOffset: 0,
  },
  {
    listName: 'Personal',
    status: 'done',
    priority: 'low',
    title: 'Organizar el armario',
    description: '',
    dueOffset: -10,
  },
];

/** Sample board for the first visit. `now` is injected so dates stay relative and testable. */
export function createSeedBoard(now: Date): BoardState {
  const createdAt: IsoDateTime = nowIso(addDays(now, -14));

  const lists: List[] = [
    { id: newId(), name: 'Trabajo', color: 'blue', order: 0, createdAt, updatedAt: createdAt },
    { id: newId(), name: 'Personal', color: 'emerald', order: ORDER_STEP, createdAt, updatedAt: createdAt },
  ];
  const listIdByName = new Map(lists.map((list) => [list.name, list.id]));

  const orderCounters = new Map<string, number>();
  const tasks: Task[] = SEED_TASKS.map((spec) => {
    const listId = listIdByName.get(spec.listName) as string;
    const columnKey = `${listId}::${spec.status}`;
    const order = orderCounters.get(columnKey) ?? 0;
    orderCounters.set(columnKey, order + ORDER_STEP);

    const dueDate = spec.dueOffset === null ? null : todayIso(addDays(now, spec.dueOffset));
    const isDone = spec.status === 'done';

    return {
      id: newId(),
      listId,
      title: spec.title,
      description: spec.description,
      priority: spec.priority,
      status: spec.status,
      dueDate,
      order,
      createdAt,
      updatedAt: createdAt,
      completedAt: isDone ? nowIso(addDays(now, -1)) : null,
    };
  });

  return { lists, tasks };
}
