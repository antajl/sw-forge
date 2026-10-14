// src/types/index.ts - Central type exports
// This file exports all type definitions for the SW-Forge TypeScript project

// SWEX types
export type {
  SwexJson,
  WizardInfo,
  UnitSlots,
  Unit,
  Rune as SwexRune,
  Building,
} from './swex';

// Rune types
export type {
  BaseRune,
  Rune,
  Substat,
  RuneFilter,
  RuneSort,
} from './rune';

// Artifact types
export type {
  BaseArtifact,
  Artifact,
  Relic,
  Effect,
  ArtifactFilter,
  ArtifactSort,
} from './artifact';

// Monster types
export type {
  Monster,
  Skill,
  MonsterFilter,
  MonsterSort,
} from './monster';

// Settings types
export type {
  AppSettings,
  DataSlot,
  SlotMetadata,
  StorageConfig,
  SettingsFilter,
  SettingsUpdate,
} from './settings';

// Engine types
export type {
  EngineConfig,
  ThresholdMap,
  Stage,
  FormulaMap,
  Formula,
  RoleMap,
  Role,
  EngineResult,
  StatMap,
  FormulaResult,
  RoleResult,
  EngineContext,
} from './engine';

// Common utility types
export type {
  Nullable,
  Optional,
  PartialRecord,
  DeepPartial,
  RequiredKeys,
  PickKeys,
  OmitKeys,
  PromiseType,
  ArrayElement,
  RequireKeys,
  Merge,
} from './common';

// Type guards and utilities
export {
  isRune,
  isArtifact,
  isMonster,
  isRelic,
  isArrayOf,
  isRecordOf,
} from './guards';