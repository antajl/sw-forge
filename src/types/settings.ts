// src/types/settings.ts - Application settings and configuration types
// Based on settings-ui.js and app configuration

export interface AppSettings {
  // Language settings
  language: 'en' | 'ru' | 'fr' | 'zh';
  
  // Theme settings
  theme: 'dark' | 'light' | 'auto';
  
  // Data management
  dataSlots: DataSlot[];
  currentSlotId: string | number;
  
  // Display preferences
  showEfficiency: boolean;
  showGrindValues: boolean;
  showGemValues: boolean;
  
  // Rune table settings
  runeSortField: string;
  runeSortDirection: 'asc' | 'desc';
  runeColumns: string[];
  
  // Monster table settings
  monsterSortField: string;
  monsterSortDirection: 'asc' | 'desc';
  monsterColumns: string[];
  
  // Artifact table settings
  artifactSortField: string;
  artifactSortDirection: 'asc' | 'desc';
  artifactColumns: string[];
  
  // Advanced settings
  enableBetaFeatures: boolean;
  debugMode: boolean;
  
  // Performance settings
  virtualScrolling: boolean;
  batchSize: number;
  
  // Additional settings
  [key: string]: any;
}

export interface DataSlot {
  id: string | number;
  name: string;
  timestamp: number;
  fileSize: number;
  isCurrent: boolean;
  metadata?: SlotMetadata;
}

export interface SlotMetadata {
  wizardName?: string;
  wizardLevel?: number;
  runeCount?: number;
  monsterCount?: number;
  artifactCount?: number;
  version?: string;
  [key: string]: any;
}

export interface StorageConfig {
  dbName: string;
  dbVersion: number;
  storeName: string;
}

export interface SettingsFilter {
  category?: 'display' | 'data' | 'performance' | 'advanced';
  language?: string;
  theme?: string;
}

export interface SettingsUpdate {
  [key: string]: any;
}