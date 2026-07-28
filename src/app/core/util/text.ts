const COMBINING_MARK_START = 0x0300;
const COMBINING_MARK_END = 0x036f;

/**
 * Strips diacritics and lowercases. NFD decomposition maps each source character to
 * exactly one output character once combining marks are dropped, so callers can use
 * output character positions as if they were positions in the original string.
 */
export function normalizeText(value: string): string {
  let result = '';
  for (const char of value.normalize('NFD')) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= COMBINING_MARK_START && code <= COMBINING_MARK_END) continue;
    result += char;
  }
  return result.toLowerCase();
}
