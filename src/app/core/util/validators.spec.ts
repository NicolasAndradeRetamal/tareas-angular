import { FormControl, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { nonBlank } from './validators';

describe('nonBlank', () => {
  it('rejects whitespace-only text that Validators.required lets through', () => {
    const control = new FormControl('   ');

    expect(Validators.required(control)).toBeNull();
    expect(nonBlank(control)).toEqual({ required: true });
  });

  it('rejects an empty value', () => {
    expect(nonBlank(new FormControl(''))).toEqual({ required: true });
    expect(nonBlank(new FormControl(null))).toEqual({ required: true });
  });

  it('accepts text with content around the whitespace', () => {
    expect(nonBlank(new FormControl('  Revisar informe  '))).toBeNull();
  });
});
