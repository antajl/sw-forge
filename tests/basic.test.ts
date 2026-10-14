// tests/basic.test.ts - Basic tests to verify TypeScript setup
import { describe, it, expect } from 'vitest';

describe('TypeScript Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have window object', () => {
    expect(typeof window).toBe('object');
  });

  it('should initialize SWRM object', () => {
    // Initialize SWRM if not present
    (window as any).SWRM = (window as any).SWRM || {};
    expect(window.SWRM).toBeDefined();
  });
});
