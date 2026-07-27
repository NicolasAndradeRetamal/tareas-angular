import { describe, expect, it } from 'vitest';
import { migrate, UnsupportedSchemaVersionError } from './migrations';
import { CURRENT_SCHEMA_VERSION } from './schema';

describe('migrate', () => {
  it('returns a version 1 document unchanged', () => {
    const doc = {
      schemaVersion: 1,
      savedAt: '2026-07-27T00:00:00.000Z',
      seeded: false,
      lists: [],
      tasks: [],
    };

    expect(migrate(doc)).toEqual(doc);
  });

  it('rejects a missing schema version', () => {
    expect(() => migrate({})).toThrow(UnsupportedSchemaVersionError);
  });

  it('rejects a non-numeric schema version', () => {
    expect(() => migrate({ schemaVersion: 'one' })).toThrow(UnsupportedSchemaVersionError);
  });

  it('rejects a version newer than the one this build knows about', () => {
    expect(() => migrate({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 })).toThrow(
      UnsupportedSchemaVersionError,
    );
  });

  it('rejects a version with no migration step registered', () => {
    expect(() => migrate({ schemaVersion: 0 })).toThrow(UnsupportedSchemaVersionError);
  });
});
