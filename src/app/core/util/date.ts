import type { IsoDate, IsoDateTime, Task } from '../models/task';

export function todayIso(now: Date = new Date()): IsoDate {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function nowIso(now: Date = new Date()): IsoDateTime {
  return now.toISOString();
}

export function isOverdue(task: Task, today: IsoDate): boolean {
  return task.dueDate !== null && task.dueDate < today && task.status !== 'done';
}

/** Whole days between `today` and `due`; negative when `due` is in the past. */
export function daysUntil(due: IsoDate, today: IsoDate): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((parseLocalDate(due).getTime() - parseLocalDate(today).getTime()) / msPerDay);
}

function parseLocalDate(value: IsoDate): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function formatAbsolute(due: IsoDate, includeYear: boolean): string {
  const [year, month, day] = due.split('-').map(Number);
  const label = `${day} ${MONTH_LABELS[month - 1]}`;
  return includeYear ? `${label} ${year}` : label;
}

/** Spanish label for a due date, relative to `today`. Empty string when there is no date. */
export function formatDueLabel(due: IsoDate | null, today: IsoDate): string {
  if (due === null) return '';

  const diff = daysUntil(due, today);
  const withYear = formatAbsolute(due, true);

  if (diff < 0) {
    const days = Math.abs(diff);
    const unit = days === 1 ? 'día' : 'días';
    return `Venció hace ${days} ${unit} · ${withYear}`;
  }
  if (diff === 0) return `Vence hoy · ${withYear}`;
  if (diff === 1) return `Vence mañana · ${withYear}`;

  const currentYear = today.slice(0, 4);
  const dueYear = due.slice(0, 4);
  return dueYear === currentYear ? formatAbsolute(due, false) : withYear;
}
