import type { IsoDateTime } from '../models/task';
import type { List } from '../models/list';
import type { Task } from '../models/task';

export const BOARD_STORAGE_KEY = 'tareas-angular:board';
export const BOARD_BACKUP_KEY = 'tareas-angular:board:backup';
export const THEME_STORAGE_KEY = 'tareas-angular:theme';

export const CURRENT_SCHEMA_VERSION = 1;

export interface PersistedBoardV1 {
  readonly schemaVersion: 1;
  /** Instant of the last save; diagnostics and future migrations. */
  readonly savedAt: IsoDateTime;
  /** true when the content came from the example seed. */
  readonly seeded: boolean;
  readonly lists: readonly List[];
  readonly tasks: readonly Task[];
}

export type PersistedBoard = PersistedBoardV1;
