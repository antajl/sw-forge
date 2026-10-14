// src/features/shell/navigation.ts - Navigation and tab management
// Migrated from js/features/shell

/**
 * Main tab IDs
 */
export type MainTabId = 'guide' | 'dashboard' | 'runetable' | 'monsters' | 'teams' | 'settings';

/**
 * Current main tab
 */
let currentMainTab: MainTabId = 'guide';

/**
 * Get current main tab
 */
export function getCurrentMainTab(): MainTabId {
  return currentMainTab;
}

/**
 * Set current main tab
 */
export function setCurrentMainTab(tab: MainTabId): void {
  currentMainTab = tab;
}

/**
 * Show main tab
 */
export function showMainTab(tab: MainTabId, _options?: { writeHash?: boolean; pushHistory?: boolean }): void {
  setCurrentMainTab(tab);
}

/**
 * Initialize main tabs
 */
export function initMainTabs(): void {
  // Navigation initialized
}
