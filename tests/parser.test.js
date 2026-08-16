import { describe, it, expect } from 'vitest';

// Helper functions extracted from parser.js for testing
// These are pure functions with no side effects, perfect for unit testing

function normalizeGradeRank(rank) {
  const n = Number(rank);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1 && n <= 5) return n;
  if (n >= 11 && n <= 15) return n - 10;
  const mod = n % 10;
  if (n >= 10 && mod >= 1 && mod <= 5) return mod;
  return n;
}

function isFlat(typeId) {
  return typeId === 1 || typeId === 3 || typeId === 5;
}

function isMainStatFlat(slotNo, typeId) {
  const slot = Number(slotNo);
  if (slot === 1 || slot === 3 || slot === 5) return true;
  if (slot === 2 || slot === 4 || slot === 6) return false;
  return isFlat(typeId);
}

describe('Parser Utility Functions', () => {
  describe('normalizeGradeRank', () => {
    it('returns 0 for invalid inputs', () => {
      expect(normalizeGradeRank(0)).toBe(0);
      expect(normalizeGradeRank(-1)).toBe(0);
      expect(normalizeGradeRank(NaN)).toBe(0);
      expect(normalizeGradeRank(null)).toBe(0);
      expect(normalizeGradeRank(undefined)).toBe(0);
    });

    it('preserves normal grades 1-5', () => {
      expect(normalizeGradeRank(1)).toBe(1);
      expect(normalizeGradeRank(2)).toBe(2);
      expect(normalizeGradeRank(3)).toBe(3);
      expect(normalizeGradeRank(4)).toBe(4);
      expect(normalizeGradeRank(5)).toBe(5);
    });

    it('normalizes SWEX +10 scheme (11-15)', () => {
      expect(normalizeGradeRank(11)).toBe(1);
      expect(normalizeGradeRank(12)).toBe(2);
      expect(normalizeGradeRank(13)).toBe(3);
      expect(normalizeGradeRank(14)).toBe(4);
      expect(normalizeGradeRank(15)).toBe(5);
    });

    it('handles modulo normalization for values >= 10', () => {
      expect(normalizeGradeRank(21)).toBe(1);
      expect(normalizeGradeRank(32)).toBe(2);
      expect(normalizeGradeRank(43)).toBe(3);
    });

    it('returns unexpected values as-is for debugging', () => {
      expect(normalizeGradeRank(100)).toBe(100);
      expect(normalizeGradeRank(99)).toBe(99);
    });
  });

  describe('isFlat', () => {
    it('returns true for flat stat type IDs', () => {
      expect(isFlat(1)).toBe(true);  // HP flat
      expect(isFlat(3)).toBe(true);  // ATK flat
      expect(isFlat(5)).toBe(true);  // DEF flat
    });

    it('returns false for percent stat type IDs', () => {
      expect(isFlat(2)).toBe(false); // HP%
      expect(isFlat(4)).toBe(false); // ATK%
      expect(isFlat(6)).toBe(false); // DEF%
    });

    it('returns false for other stat types', () => {
      expect(isFlat(8)).toBe(false); // SPD
      expect(isFlat(9)).toBe(false); // CRI
      expect(isFlat(10)).toBe(false); // CD
    });
  });

  describe('isMainStatFlat', () => {
    it('returns true for slots 1, 3, 5 (flat main stat slots)', () => {
      expect(isMainStatFlat(1, 1)).toBe(true);
      expect(isMainStatFlat(3, 3)).toBe(true);
      expect(isMainStatFlat(5, 5)).toBe(true);
    });

    it('returns false for slots 2, 4, 6 (percent main stat slots)', () => {
      expect(isMainStatFlat(2, 2)).toBe(false);
      expect(isMainStatFlat(4, 4)).toBe(false);
      expect(isMainStatFlat(6, 6)).toBe(false);
    });

    it('falls back to typeId check for other slots', () => {
      expect(isMainStatFlat(0, 1)).toBe(true);  // flat type
      expect(isMainStatFlat(0, 2)).toBe(false); // percent type
      expect(isMainStatFlat(7, 3)).toBe(true);  // flat type
      expect(isMainStatFlat(7, 4)).toBe(false); // percent type
    });
  });
});
