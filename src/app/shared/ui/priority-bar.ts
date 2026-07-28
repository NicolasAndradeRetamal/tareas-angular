import type { TaskPriority } from '../../core/models/task';

export const PRIORITY_BAR_CLASS: Record<TaskPriority, string> = {
  low: 'bg-priority-low',
  medium: 'bg-priority-medium',
  high: 'bg-priority-high',
  urgent: 'bg-priority-urgent',
};
