import type { SaveResult, StorageDriver } from './storage-driver';

/** Fallback for browsers that refuse localStorage, and the test double. */
export class MemoryStorageDriver implements StorageDriver {
  private readonly store = new Map<string, string>();

  read(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  write(key: string, value: string): SaveResult {
    this.store.set(key, value);
    return { kind: 'saved' };
  }

  remove(key: string): void {
    this.store.delete(key);
  }
}
