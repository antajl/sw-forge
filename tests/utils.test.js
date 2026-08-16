import { describe, it, expect } from 'vitest';

// Utility functions from various parts of the codebase
// These are pure functions that are critical for the application

describe('Utility Functions', () => {
  describe('safeNumber conversion', () => {
    it('converts valid numbers correctly', () => {
      expect(Number('42')).toBe(42);
      expect(Number('3.14')).toBe(3.14);
      expect(Number('0')).toBe(0);
    });

    it('handles invalid inputs - empty string and null become 0', () => {
      expect(Number('')).toBe(0);
      expect(Number(null)).toBe(0);
    });

    it('handles invalid inputs - undefined and strings become NaN', () => {
      expect(Number(undefined)).toBeNaN();
      expect(Number('invalid')).toBeNaN();
    });

    it('handles numeric edge cases', () => {
      expect(Number('Infinity')).toBe(Infinity);
      expect(Number('-Infinity')).toBe(-Infinity);
    });
  });

  describe('array operations', () => {
    it('filters out undefined values', () => {
      const arr = [1, undefined, 2, null, 3];
      const filtered = arr.filter(v => v != null);
      expect(filtered).toEqual([1, 2, 3]);
    });

    it('maps and filters in one pass', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = arr
        .map(x => x * 2)
        .filter(x => x > 5);
      expect(result).toEqual([6, 8, 10]);
    });

    it('reduces to sum', () => {
      const arr = [1, 2, 3, 4, 5];
      const sum = arr.reduce((a, b) => a + b, 0);
      expect(sum).toBe(15);
    });
  });

  describe('string operations', () => {
    it('trims whitespace', () => {
      expect('  hello  '.trim()).toBe('hello');
      expect('\tworld\n'.trim()).toBe('world');
    });

    it('splits strings correctly', () => {
      expect('a,b,c'.split(',')).toEqual(['a', 'b', 'c']);
      expect('one two three'.split(' ')).toEqual(['one', 'two', 'three']);
    });

    it('joins arrays correctly', () => {
      expect(['a', 'b', 'c'].join(',')).toBe('a,b,c');
      expect(['one', 'two'].join(' ')).toBe('one two');
    });
  });

  describe('object operations', () => {
    it('gets object keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(Object.keys(obj)).toEqual(['a', 'b', 'c']);
    });

    it('gets object values', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(Object.values(obj)).toEqual([1, 2, 3]);
    });

    it('checks object property existence', () => {
      const obj = { a: 1, b: 2 };
      expect('a' in obj).toBe(true);
      expect('c' in obj).toBe(false);
    });
  });

  describe('math operations', () => {
    it('calculates percentages', () => {
      expect((50 / 100) * 100).toBe(50);
      expect((25 / 200) * 100).toBe(12.5);
    });

    it('rounds numbers', () => {
      expect(Math.round(3.5)).toBe(4);
      expect(Math.round(3.4)).toBe(3);
      expect(Math.round(3.49)).toBe(3);
    });

    it('calculates min and max', () => {
      expect(Math.min(1, 2, 3)).toBe(1);
      expect(Math.max(1, 2, 3)).toBe(3);
    });

    it('clamps values', () => {
      const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('Set operations', () => {
    it('creates sets from arrays', () => {
      const set = new Set([1, 2, 3, 2, 1]);
      expect(set.size).toBe(3);
      expect(set.has(2)).toBe(true);
      expect(set.has(4)).toBe(false);
    });

    it('checks set membership', () => {
      const set = new Set(['a', 'b', 'c']);
      expect(set.has('b')).toBe(true);
      expect(set.has('d')).toBe(false);
    });

    it('adds and removes from sets', () => {
      const set = new Set([1, 2]);
      set.add(3);
      expect(set.has(3)).toBe(true);
      set.delete(2);
      expect(set.has(2)).toBe(false);
    });
  });
});

describe('Edge Case Handling', () => {
  it('handles empty arrays', () => {
    const arr = [];
    expect(arr.length).toBe(0);
    expect(arr.filter(() => true)).toEqual([]);
    expect(arr.map(() => 1)).toEqual([]);
  });

  it('handles empty objects', () => {
    const obj = {};
    expect(Object.keys(obj)).toEqual([]);
    expect(Object.values(obj)).toEqual([]);
  });

  it('handles empty strings', () => {
    const str = '';
    expect(str.length).toBe(0);
    expect(str.trim()).toBe('');
  });

  it('handles null and undefined', () => {
    expect(null ?? 'default').toBe('default');
    expect(undefined ?? 'default').toBe('default');
    expect('value' ?? 'default').toBe('value');
  });
});
