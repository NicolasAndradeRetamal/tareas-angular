import type { IsoDateTime } from './task';

export type ListId = string;

export const LIST_COLORS = ['slate', 'blue', 'emerald', 'amber', 'rose', 'violet'] as const;
export type ListColor = (typeof LIST_COLORS)[number];

export const LIST_NAME_MAX_LENGTH = 60;

export interface List {
  readonly id: ListId;
  readonly name: string;
  readonly color: ListColor;
  /** Fractional rank within the whole set of lists. */
  readonly order: number;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}
