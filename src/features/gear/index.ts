// src/features/gear/index.ts — gear/artifacts exports (placeholder)
// TODO: Migrate gear/artifacts modules (7 files)
// - artifact-verdict
// - artifacts-table
// - artifacts-virtual
// - dashboard-artifacts
// - gear-roster-chips
// - gear-table-filters
// - relics-table
// - table-kind

export interface Artifact {
  id: number;
  type: string;
  grade: number;
  level: number;
  // ... more fields
}

export interface Relic {
  id: number;
  category: string;
  grade: number;
  // ... more fields
}
