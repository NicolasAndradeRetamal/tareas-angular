import type { ListColor } from '../../core/models/list';

/** Static class map: Tailwind only generates classes it can see written literally. */
export const LIST_COLOR_BG_CLASS: Record<ListColor, string> = {
  slate: 'bg-list-slate',
  blue: 'bg-list-blue',
  emerald: 'bg-list-emerald',
  amber: 'bg-list-amber',
  rose: 'bg-list-rose',
  violet: 'bg-list-violet',
};

export const LIST_COLOR_LABEL: Record<ListColor, string> = {
  slate: 'Pizarra',
  blue: 'Azul',
  emerald: 'Esmeralda',
  amber: 'Ámbar',
  rose: 'Rosa',
  violet: 'Violeta',
};
