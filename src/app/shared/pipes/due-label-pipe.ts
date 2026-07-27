import { Pipe, type PipeTransform } from '@angular/core';
import type { IsoDate } from '../../core/models/task';
import { formatDueLabel, todayIso } from '../../core/util/date';

@Pipe({ name: 'dueLabel' })
export class DueLabelPipe implements PipeTransform {
  private readonly today = todayIso();

  transform(dueDate: IsoDate | null): string {
    return formatDueLabel(dueDate, this.today);
  }
}
