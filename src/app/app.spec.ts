import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    return TestBed.createComponent(App);
  }

  it('should create the app', async () => {
    const fixture = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose a skip link pointing at the main content', async () => {
    const fixture = await setup();
    await fixture.whenStable();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a.skip-link');
    expect(link?.getAttribute('href')).toBe('#contenido');
    expect(link?.textContent?.trim()).toBe('Saltar al contenido');
  });
});
