import { describe, it, expect } from 'vitest';
import { computeAttack } from '../attackTable';

describe('computeAttack', () => {
  describe('regular line clears', () => {
    it('single = 0', () => {
      expect(computeAttack(1, false, false)).toBe(0);
    });
    it('double = 1', () => {
      expect(computeAttack(2, false, false)).toBe(1);
    });
    it('triple = 2', () => {
      expect(computeAttack(3, false, false)).toBe(2);
    });
    it('quad = 4', () => {
      expect(computeAttack(4, false, false)).toBe(4);
    });
  });

  describe('T-Spin (non-mini)', () => {
    it('T-Spin 0 lines = 4', () => {
      expect(computeAttack(0, true, false)).toBe(4);
    });
    it('T-Spin Single = 5', () => {
      expect(computeAttack(1, true, false)).toBe(5);
    });
    it('T-Spin Double = 6', () => {
      expect(computeAttack(2, true, false)).toBe(6);
    });
    it('T-Spin Triple = 7', () => {
      expect(computeAttack(3, true, false)).toBe(7);
    });
  });

  describe('T-Spin Mini', () => {
    it('T-Spin Mini 0 lines = 0', () => {
      expect(computeAttack(0, true, true)).toBe(0);
    });
    it('T-Spin Mini Single = 2', () => {
      expect(computeAttack(1, true, true)).toBe(2);
    });
    it('T-Spin Mini Double = 3', () => {
      expect(computeAttack(2, true, true)).toBe(3);
    });
    it('T-Spin Mini Triple = 4', () => {
      expect(computeAttack(3, true, true)).toBe(4);
    });
  });

  describe('zero or no clear', () => {
    it('0 lines, no spin = 0', () => {
      expect(computeAttack(0, false, false)).toBe(0);
    });
  });
});
