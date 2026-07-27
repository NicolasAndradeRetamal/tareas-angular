import { InjectionToken } from '@angular/core';
import { LocalStorageDriver } from './local-storage-driver';
import { MemoryStorageDriver } from './memory-storage-driver';

export type PersistenceError = 'quota' | 'unavailable' | 'unknown';

export type SaveResult =
  | { readonly kind: 'saved' }
  | { readonly kind: 'failed'; readonly reason: PersistenceError };

export interface StorageDriver {
  read(key: string): string | null;
  write(key: string, value: string): SaveResult;
  remove(key: string): void;
}

function isStorageAvailable(): boolean {
  try {
    const probeKey = '__tareas-angular:probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

export const STORAGE_DRIVER = new InjectionToken<StorageDriver>('STORAGE_DRIVER', {
  providedIn: 'root',
  factory: () => (isStorageAvailable() ? new LocalStorageDriver() : new MemoryStorageDriver()),
});
