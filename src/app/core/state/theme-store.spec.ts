import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryStorageDriver } from '../storage/memory-storage-driver';
import { THEME_STORAGE_KEY } from '../storage/schema';
import { STORAGE_DRIVER } from '../storage/storage-driver';
import { ThemeStore } from './theme-store';

class FakeMediaQueryList {
  matches: boolean;
  private readonly listeners = new Set<(event: { matches: boolean }) => void>();

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(_type: string, listener: (event: { matches: boolean }) => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: (event: { matches: boolean }) => void): void {
    this.listeners.delete(listener);
  }

  emit(matches: boolean): void {
    this.matches = matches;
    this.listeners.forEach((listener) => listener({ matches }));
  }
}

describe('ThemeStore', () => {
  let driver: MemoryStorageDriver;
  let media: FakeMediaQueryList;
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    driver = new MemoryStorageDriver();
    media = new FakeMediaQueryList(false);
    originalMatchMedia = window.matchMedia;
    window.matchMedia = () => media as unknown as MediaQueryList;
    document.documentElement.classList.remove('dark');

    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_DRIVER, useValue: driver }],
    });
  });

  afterEach(() => {
    if (originalMatchMedia) window.matchMedia = originalMatchMedia;
    document.documentElement.classList.remove('dark');
  });

  async function settle(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
  }

  it('defaults to "system" when nothing was stored', () => {
    const store = TestBed.inject(ThemeStore);
    expect(store.preference()).toBe('system');
  });

  it('reads a previously stored preference', () => {
    driver.write(THEME_STORAGE_KEY, 'dark');
    const store = TestBed.inject(ThemeStore);
    expect(store.preference()).toBe('dark');
  });

  it('resolves "system" against the media query', () => {
    media.matches = true;
    const store = TestBed.inject(ThemeStore);
    expect(store.resolved()).toBe('dark');
  });

  it('reacts to a system preference change while set to "system"', () => {
    const store = TestBed.inject(ThemeStore);
    expect(store.resolved()).toBe('light');
    media.emit(true);
    expect(store.resolved()).toBe('dark');
  });

  it('setPreference overrides the system value', () => {
    const store = TestBed.inject(ThemeStore);
    store.setPreference('dark');
    expect(store.resolved()).toBe('dark');
  });

  it('toggle flips between light and dark with an explicit preference', () => {
    const store = TestBed.inject(ThemeStore);
    store.setPreference('light');
    store.toggle();
    expect(store.preference()).toBe('dark');
    store.toggle();
    expect(store.preference()).toBe('light');
  });

  it('persists the preference to the storage driver', async () => {
    const store = TestBed.inject(ThemeStore);
    store.setPreference('dark');
    await settle();
    expect(driver.read(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('applies the dark class to the document root', async () => {
    const store = TestBed.inject(ThemeStore);
    store.setPreference('dark');
    await settle();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    store.setPreference('light');
    await settle();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
