export type MutationKind =
  | 'init'
  | 'create-task'
  | 'update-task'
  | 'delete-task'
  | 'move-task'
  | 'set-task-status'
  | 'create-list'
  | 'rename-list'
  | 'delete-list'
  | 'reorder-list'
  | 'clear-board';

export const MUTATION_LABELS: Record<MutationKind, string> = {
  'init': 'Estado inicial',
  'create-task': 'Crear tarea',
  'update-task': 'Editar tarea',
  'delete-task': 'Eliminar tarea',
  'move-task': 'Mover tarea',
  'set-task-status': 'Cambiar estado',
  'create-list': 'Crear lista',
  'rename-list': 'Renombrar lista',
  'delete-list': 'Eliminar lista',
  'reorder-list': 'Reordenar listas',
  'clear-board': 'Vaciar el tablero',
};
