// src/app.ts - Application entry point
// This is the main application file that bootstraps SW-Forge

import { initializeSwForge, getVersion } from './index';

/**
 * Bootstrap the application
 */
function bootstrap(): void {
  console.log(`SW-Forge v${getVersion()} starting...`);
  
  // Initialize the application
  initializeSwForge();
  
  // Set up global error handlers
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
  
  console.log('SW-Forge ready');
}

// Bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

export { bootstrap };
