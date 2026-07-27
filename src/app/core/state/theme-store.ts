import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { THEME_STORAGE_KEY } from '../storage/schema';
import { STORAGE_DRIVER } from '../storage/storage-driver';

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly driver = inject(STORAGE_DRIVER);
  private readonly media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  private readonly _preference = signal<ThemePreference>(this.loadInitialPreference());
  private readonly _systemPrefersDark = signal(this.media?.matches ?? false);

  readonly preference = this._preference.asReadonly();

  /** Effective theme after resolving 'system' against prefers-color-scheme. */
  readonly resolved = computed<ResolvedTheme>(() => {
    const preference = this._preference();
    return preference === 'system' ? (this._systemPrefersDark() ? 'dark' : 'light') : preference;
  });

  constructor() {
    this.media?.addEventListener('change', (event) => this._systemPrefersDark.set(event.matches));

    effect(() => {
      const resolved = this.resolved();
      if (typeof document === 'undefined') return;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.style.colorScheme = resolved;
    });

    effect(() => {
      this.driver.write(THEME_STORAGE_KEY, this._preference());
    });
  }

  setPreference(value: ThemePreference): void {
    this._preference.set(value);
  }

  /** Toggles between light and dark, fixing an explicit preference. */
  toggle(): void {
    this._preference.set(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private loadInitialPreference(): ThemePreference {
    const raw = this.driver.read(THEME_STORAGE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
  }
}
