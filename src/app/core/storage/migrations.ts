import { CURRENT_SCHEMA_VERSION, type PersistedBoard } from './schema';

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** Key n: migrates a document from version n to n + 1. Empty until version 2 exists. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export class UnsupportedSchemaVersionError extends Error {}

export function migrate(raw: Record<string, unknown>): PersistedBoard {
  const declaredVersion = raw['schemaVersion'];
  let version = typeof declaredVersion === 'number' ? declaredVersion : NaN;

  if (!Number.isInteger(version) || version < 1) {
    throw new UnsupportedSchemaVersionError(`Invalid schema version: ${String(declaredVersion)}`);
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new UnsupportedSchemaVersionError(`Schema version ${version} is newer than supported`);
  }

  let document = raw;
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) {
      throw new UnsupportedSchemaVersionError(`No migration available from version ${version}`);
    }
    document = step(document);
    version += 1;
  }

  return document as unknown as PersistedBoard;
}
