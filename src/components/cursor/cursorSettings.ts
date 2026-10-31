const STORAGE_KEY = 'cc-cursor-effects';

export function getCursorSetting(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'off') return false;
    return true;
  } catch {
    return true;
  }
}

export function setCursorSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    window.dispatchEvent(new CustomEvent('cc-cursor-toggle', { detail: enabled }));
  } catch {}
}
