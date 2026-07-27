let counter = 0;

/** Stable, collision-free ids for aria wiring; deterministic so tests can assert them. */
export function nextDomId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
