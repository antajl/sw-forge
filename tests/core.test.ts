// tests/core.test.ts - Tests for core modules
import { describe, it, expect } from 'vitest';

import {
  GOD_STAT_ORDER,
  HR_COL_KEYS,
  roundThresh,
  modeKey,
} from '../src/core';

import {
  defaultStatConstants,
  computeHrThresholds,
  computeDuoThresholds,
  getGodThreshold,
} from '../src/core';

import {
  parseRune,
  parseSWEX,
  calcEfficiency,
} from '../src/core';

import {
  isFormulaEnabled,
  evaluateFormula,
} from '../src/core';

import {
  checkHighRoll,
  checkDuoRoll,
  getMatchingRoles,
} from '../src/core';

describe('Constants', () => {
  it('should have correct GOD_STAT_ORDER', () => {
    expect(GOD_STAT_ORDER).toBeInstanceOf(Array);
    expect(GOD_STAT_ORDER.length).toBeGreaterThan(0);
  });

  it('should have correct HR_COL_KEYS', () => {
    expect(HR_COL_KEYS).toBeInstanceOf(Array);
    expect(HR_COL_KEYS.length).toBeGreaterThan(0);
  });

  it('should round thresholds correctly', () => {
    expect(roundThresh(12.345)).toBe(12.35);
    expect(roundThresh(12.344)).toBe(12.34);
  });

  it('should create mode keys correctly', () => {
    expect(modeKey('Early', 'Legend')).toBe('Early_Leg');
    expect(modeKey('Mid', 'Hero')).toBe('Mid_Hero');
    expect(modeKey('Late', 'Legend')).toBe('Late_Leg');
  });
});

describe('Thresholds', () => {
  it('should have default stat constants', () => {
    const constants = defaultStatConstants();
    expect(constants).toBeDefined();
    expect(typeof constants).toBe('object');
  });

  it('should export threshold functions', () => {
    expect(typeof computeHrThresholds).toBe('function');
    expect(typeof computeDuoThresholds).toBe('function');
    expect(typeof getGodThreshold).toBe('function');
  });
});

describe('Parser', () => {
  it('should export parser functions', () => {
    expect(typeof parseRune).toBe('function');
    expect(typeof parseSWEX).toBe('function');
    expect(typeof calcEfficiency).toBe('function');
  });
});

describe('Formulas', () => {
  it('should export formula functions', () => {
    expect(typeof isFormulaEnabled).toBe('function');
    expect(typeof evaluateFormula).toBe('function');
  });
});

describe('Roles', () => {
  it('should export role functions', () => {
    expect(typeof checkHighRoll).toBe('function');
    expect(typeof checkDuoRoll).toBe('function');
    expect(typeof getMatchingRoles).toBe('function');
  });
});

describe('Core Module Integration', () => {
  it('should export all core functions', () => {
    // Verify that the core module exports are properly wired up
    expect(modeKey).toBeDefined();
    expect(GOD_STAT_ORDER).toBeDefined();
    expect(HR_COL_KEYS).toBeDefined();
    expect(roundThresh).toBeDefined();
  });
});
