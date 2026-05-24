// js/tests/core/storage.demo.test.ts
// Tests for demo mode storage operations

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('demo mode storage', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should have demo mode functions available', async () => {
    // Since storage.ts uses Dexie at module level, we test by importing
    // and checking the module has the expected exports
    const mod = await import('../../core/storage.js');
    // The module should export these functions (they may throw if DB not connected,
    // but they should exist)
    expect(mod.isDemoMode).toBeDefined();
    expect(typeof mod.isDemoMode).toBe('function');
    expect(mod.isDemoMode()).toBe(false);
  });

  it('should export activateDemoData and deactivateDemoData', async () => {
    const mod = await import('../../core/storage.js');
    expect(mod.activateDemoData).toBeDefined();
    expect(mod.deactivateDemoData).toBeDefined();
    expect(typeof mod.activateDemoData).toBe('function');
    expect(typeof mod.deactivateDemoData).toBe('function');
  });
});
