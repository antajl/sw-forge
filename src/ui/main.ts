// src/ui/main.ts - Entry point for TypeScript version
// This is the TypeScript version of SW-Forge

import { initializeSwForge, getVersion } from '../index';
import { initBootstrap } from '../features/shell/bootstrap';
import { initDonateDialog } from '../features/shell/donate-dialog';
import { bindFiltersPopover } from '../features/shell/filters-popover';
import { updateLanguage } from '../features/shell/language-bindings';
import { initMainTabs } from '../features/shell/navigation';
import { initHeaderMobileNav } from '../features/shell/mobile-nav';
import { initTheme } from '../features/shell/theme-nav';
import { initShare } from '../features/app/share';
import { renderTeamsPanel } from '../features/teams/ui';
import { refreshEnginePreviews } from '../features/rules/constants-ui';

console.log('SW Forge TypeScript version loading...');

// Initialize basic SWRM object
window.SWRM = window.SWRM || {};
(window.SWRM as any).version = getVersion();

// Initialize the application
initializeSwForge();

// Initialize shell and UI components
async function initializeTypeScriptUI(): Promise<void> {
  try {
    // Initialize shell state
    const shellState = initBootstrap();
    
    // Initialize UI components
    initDonateDialog();
    initMainTabs();
    initHeaderMobileNav();
    initTheme();
    initShare();
    renderTeamsPanel();
    refreshEnginePreviews();
    
    // Initialize language
    await updateLanguage(shellState.currentLang);
    
    // Bind filters popovers
    bindFiltersPopover('runes-filters-btn', 'runes-filters-panel');
    bindFiltersPopover('gear-filters-btn', 'gear-filters-panel');
    bindFiltersPopover('monsters-filters-btn', 'monsters-filters-panel');
    
    console.log('TypeScript UI initialized successfully');
  } catch (error) {
    console.error('Failed to initialize TypeScript UI:', error);
  }
}

// Render basic UI
function renderBasicUI(): void {
  const app = document.getElementById('app');
  if (!app) return;

  // Clear loading messages
  const loadingElements = app.querySelectorAll('.loading');
  loadingElements.forEach(el => el.remove());

  // Show upload prompt
  const uploadPrompt = document.getElementById('upload-prompt');
  if (uploadPrompt) {
    uploadPrompt.classList.remove('hidden');
  }

  console.log('Basic UI rendered');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeTypeScriptUI();
    renderBasicUI();
  });
} else {
  initializeTypeScriptUI();
  renderBasicUI();
}

console.log('SW Forge TypeScript version initialized');

// Export to make this a module
export {};
