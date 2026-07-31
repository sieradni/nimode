import { describe, it, expect } from 'vitest';

describe('test environment', () => {
  it('runs in a browser-like environment with window and document defined', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('supports localStorage set/get round-trips', () => {
    const key = 'environment-test-key';
    localStorage.setItem(key, 'round-trip-value');
    expect(localStorage.getItem(key)).toBe('round-trip-value');
    localStorage.removeItem(key);
    expect(localStorage.getItem(key)).toBeNull();
  });
});
