import type { PersistenceError, SaveResult, StorageDriver } from './storage-driver';

export class LocalStorageDriver implements StorageDriver {
  read(key: string): string | null {
    return window.localStorage.getItem(key);
  }

  write(key: string, value: string): SaveResult {
    try {
      window.localStorage.setItem(key, value);
      return { kind: 'saved' };
    } catch (error) {
      return { kind: 'failed', reason: classifyError(error) };
    }
  }

  remove(key: string): void {
    window.localStorage.removeItem(key);
  }
}

function classifyError(error: unknown): PersistenceError {
  const isQuotaError =
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014);
  return isQuotaError ? 'quota' : 'unknown';
}
