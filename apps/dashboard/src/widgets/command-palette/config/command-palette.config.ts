/**
 * Window event that opens the command palette. Lets any client leaf (e.g. the
 * topbar search button) trigger it without wrapping the shell in another
 * context provider.
 */
export const COMMAND_PALETTE_EVENT = 'workspace:command-palette';

export function openCommandPalette(): void {
  window.dispatchEvent(new Event(COMMAND_PALETTE_EVENT));
}
