// src/app.ts - Main Application Entry Point (Vite & TypeScript)
import * as Core from './core';
import * as Features from './features';
import * as Types from './types';

// Bundle legacy UI bundle through Vite
import '../js/ui.js';

// Hydrate and guarantee window.SWRM namespace with TypeScript types and modules
if (typeof window !== 'undefined') {
  window.SWRM = window.SWRM || {};
  (window.SWRM as any).ts = {
    core: Core,
    features: Features,
    types: Types,
    version: '1.2.20-ts',
  };

  // Expose typed utilities and core calculations on window.SWRM for progressive migration
  (window.SWRM as any).parseRune = (window.SWRM as any).parseRune || Core.parseRune;
  (window.SWRM as any).calcEfficiency = (window.SWRM as any).calcEfficiency || Core.calcEfficiency;
  (window.SWRM as any).calcEfficiencyUncapped = (window.SWRM as any).calcEfficiencyUncapped || Core.calcEfficiencyUncapped;
  (window.SWRM as any).computeHrThresholds = (window.SWRM as any).computeHrThresholds || Core.computeHrThresholds;
  (window.SWRM as any).computeDuoThresholds = (window.SWRM as any).computeDuoThresholds || Core.computeDuoThresholds;
  (window.SWRM as any).getGodThreshold = (window.SWRM as any).getGodThreshold || Core.getGodThreshold;
}

export function bootstrap(): void {
  console.log('[SW-Forge] Vite + TypeScript application module loaded');

  // Set up global error handlers
  window.addEventListener('error', (event) => {
    console.error('[SW-Forge] Global error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[SW-Forge] Unhandled promise rejection:', event.reason);
  });
}

// Bootstrap when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}

export { Core, Features, Types };
