import type { TaskStatus } from '../../core/models/task';
import type { IconName } from './icon';

export const STATUS_ICON: Record<TaskStatus, IconName> = {
  todo: 'circle-dashed',
  'in-progress': 'circle-half',
  done: 'circle-check',
};

export const STATUS_TEXT_CLASS: Record<TaskStatus, string> = {
  todo: 'text-status-todo',
  'in-progress': 'text-status-progress',
  done: 'text-status-done',
};
