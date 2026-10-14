// src/features/monsters/index.ts — monsters exports (placeholder)
// TODO: Migrate monsters modules (14 files)
// - bootstrap
// - box-overview
// - monsters-bulk
// - monsters-card
// - monsters-detail
// - monsters-events
// - monsters-filters
// - monsters-gear
// - monsters-hub
// - monsters-list
// - monsters-runes
// - monsters-state
// - monsters-stats-calc
// - monsters-storage
// - monsters-table
// - skill-planner

export interface Unit {
  unitId: number;
  masterId: number;
  name: string;
  element: string;
  level: number;
  // ... more fields
}
