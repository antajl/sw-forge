// src/features/rules/constants-ui.ts — constants grid rendering (simplified)

export function refreshEnginePreviews(): void {
  const sc = (window.SWRM as any)?.settings?.statConstants || (window.SWRM as any)?.DEFAULT_STAT_CONSTANTS;
  if (!sc) return;
  // Simplified - actual implementation would compute and render tables
  console.log('Refreshing engine previews with stat constants:', sc);
}
