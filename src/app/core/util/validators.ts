import type { AbstractControl, ValidationErrors } from '@angular/forms';

/** Validators.required accepts whitespace-only text; the domain layer rejects it. */
export function nonBlank(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' && value.trim().length > 0 ? null : { required: true };
}
