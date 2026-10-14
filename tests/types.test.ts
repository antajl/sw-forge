// tests/types.test.ts - Type definition tests
// Tests to verify type definitions work correctly

import { describe, it, expect } from 'vitest';
import type {
  Rune,
  AppSettings,
  EngineConfig,
} from '../src/types';
import {
  isRune,
  isArtifact,
  isMonster,
  isArrayOf,
} from '../src/types/guards';

describe('Type Guards', () => {
  it('should identify valid rune objects', () => {
    const validRune = {
      id: 12345,
      slot: 1,
      grade: 5,
      substats: [],
    };
    
    expect(isRune(validRune)).toBe(true);
  });

  it('should reject invalid rune objects', () => {
    const invalidRune = {
      id: '12345',
      slot: '1',
      grade: '5',
    };
    
    expect(isRune(invalidRune)).toBe(false);
  });

  it('should identify valid artifact objects', () => {
    const validArtifact = {
      id: 67890,
      slot: 1,
      grade: 5,
      kind: 'artifact',
    };
    
    expect(isArtifact(validArtifact)).toBe(true);
  });

  it('should identify valid monster objects', () => {
    const validMonster = {
      id: 11111,
      unitMasterId: 10911,
      attribute: 1,
      archetype: 1,
      level: 40,
    };
    
    expect(isMonster(validMonster)).toBe(true);
  });

  it('should identify arrays of valid type', () => {
    const runes = [
      { id: 1, slot: 1, grade: 5, substats: [] },
      { id: 2, slot: 2, grade: 4, substats: [] },
    ];
    
    expect(isArrayOf(runes, isRune)).toBe(true);
  });
});

describe('Type Structure', () => {
  it('should allow rune type construction', () => {
    const rune: Rune = {
      id: 12345,
      slot: 1,
      grade: 5,
      stars: 6,
      isAncient: false,
      setId: 19,
      setName: 'Violent',
      level: 12,
      maxLevel: 15,
      mainType: 3,
      mainVal: 118,
      mainName: 'ATK',
      mainFlat: true,
      innType: 0,
      innVal: 0,
      innName: '',
      innFlat: false,
      substats: [],
      eff: 85,
      effUncapped: 85,
      occupiedType: 1,
      occupiedId: 5365490176,
      gradeStr: 'Legend',
      _raw: {} as any,
    };
    
    expect(rune.id).toBe(12345);
    expect(rune.slot).toBe(1);
    expect(rune.grade).toBe(5);
  });

  it('should allow settings type construction', () => {
    const settings: AppSettings = {
      language: 'en',
      theme: 'dark',
      dataSlots: [],
      currentSlotId: 'current-runes',
      showEfficiency: true,
      showGrindValues: true,
      showGemValues: true,
      runeSortField: 'eff',
      runeSortDirection: 'desc',
      runeColumns: [],
      monsterSortField: 'name',
      monsterSortDirection: 'asc',
      monsterColumns: [],
      artifactSortField: 'grade',
      artifactSortDirection: 'desc',
      artifactColumns: [],
      enableBetaFeatures: false,
      debugMode: false,
      virtualScrolling: true,
      batchSize: 50,
    };
    
    expect(settings.language).toBe('en');
    expect(settings.theme).toBe('dark');
  });

  it('should allow engine config type construction', () => {
    const config: EngineConfig = {
      hrThresholds: {
        'HP%': { 'Mid_Leg': 8 },
        'ATK%': { 'Mid_Leg': 8 },
      },
      stage: { id: 'mid', name: 'Mid', label: 'Mid' },
      formulas: {},
      roles: {},
    };
    
    expect(config.stage.id).toBe('mid');
    expect(config.hrThresholds['HP%']['Mid_Leg']).toBe(8);
  });
});