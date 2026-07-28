/** Command-palette and undo shortcuts use Cmd on macOS instead of Ctrl. */
export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const uaData = (navigator as { userAgentData?: { platform?: string } }).userAgentData;
  const platform = uaData?.platform ?? navigator.platform ?? navigator.userAgent;
  return /mac/i.test(platform);
}

export function modifierKeyLabel(): string {
  return isMacPlatform() ? '⌘' : 'Ctrl';
}
