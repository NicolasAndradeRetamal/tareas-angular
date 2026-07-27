import { Pipe, type PipeTransform } from '@angular/core';
import type { TaskPriority } from '../../core/models/task';
import { PRIORITY_LABELS } from '../../core/models/task';

@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(priority: TaskPriority): string {
    return PRIORITY_LABELS[priority];
  }
}
