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
export function showMainTab(tab: MainTabId, options?: { writeHash?: boolean; pushHistory?: boolean }): void {
  setCurrentMainTab(tab);
  console.log('showMainTab', tab, options);
  // In real implementation, this would update UI and hash
}

/**
 * Initialize main tabs
 */
export function initMainTabs(): void {
  console.log('Main tabs initialized');
  // Simplified - real implementation would bind tab click handlers
}
