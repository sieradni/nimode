import { describe, it, expect } from 'vitest';
import { getSrsPlusKicks } from '../systems/srsPlusKicks';
import { PieceType, RotationState } from '../types';

describe('srsPlusKicks', () => {
  const JLSTZ_PIECES: PieceType[] = [2, 3, 5, 6, 7];
  const ALL_ROTATIONS: RotationState[] = [0, 1, 2, 3];

  describe('kick table structure', () => {
    it('every kick table starts with a zero offset', () => {
      for (const piece of JLSTZ_PIECES) {
        for (const from of ALL_ROTATIONS) {
          for (const to of ALL_ROTATIONS) {
            if (from === to) continue;
            const kicks = getSrsPlusKicks(piece, from, to);
            expect(kicks[0]).toEqual({ x: 0, y: 0 });
          }
        }
      }
    });

    it('O piece always returns a single default kick', () => {
      for (const from of ALL_ROTATIONS) {
        for (const to of ALL_ROTATIONS) {
          if (from === to) continue;
          const kicks = getSrsPlusKicks(4, from, to);
          expect(kicks).toHaveLength(1);
          expect(kicks[0]).toEqual({ x: 0, y: 0 });
        }
      }
    });

    it('JLSTZ non-180 transitions have 5 kick entries', () => {
      const non180: Array<[RotationState, RotationState]> = [
        [0, 1], [1, 0], [1, 2], [2, 1],
        [2, 3], [3, 2], [3, 0], [0, 3],
      ];
      for (const piece of JLSTZ_PIECES) {
        for (const [from, to] of non180) {
          const kicks = getSrsPlusKicks(piece, from, to);
          expect(kicks).toHaveLength(5);
        }
      }
    });

    it('JLSTZ 180-degree transitions have 6 kick entries', () => {
      const kicks180: Array<[RotationState, RotationState]> = [
        [0, 2], [2, 0], [1, 3], [3, 1],
      ];
      for (const piece of JLSTZ_PIECES) {
        for (const [from, to] of kicks180) {
          const kicks = getSrsPlusKicks(piece, from, to);
          expect(kicks).toHaveLength(6);
        }
      }
    });

    it('I-piece non-180 transitions have 5 kick entries', () => {
      const non180: Array<[RotationState, RotationState]> = [
        [0, 1], [1, 0], [1, 2], [2, 1],
        [2, 3], [3, 2], [3, 0], [0, 3],
      ];
      for (const [from, to] of non180) {
        const kicks = getSrsPlusKicks(1, from, to);
        expect(kicks).toHaveLength(5);
      }
    });

    it('I-piece 180-degree transitions have 2 kick entries', () => {
      const kicks180: Array<[RotationState, RotationState]> = [
        [0, 2], [2, 0], [1, 3], [3, 1],
      ];
      for (const [from, to] of kicks180) {
        const kicks = getSrsPlusKicks(1, from, to);
        expect(kicks).toHaveLength(2);
      }
    });
  });

  describe('specific kick values', () => {
    it('JLSTZ 0->1 (CW from spawn) matches SRS+ board coords', () => {
      const kicks = getSrsPlusKicks(6, 0, 1);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: -1, y: 0 },
        { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 },
      ]);
    });

    it('JLSTZ 1->0 (CCW to spawn) matches SRS+ board coords', () => {
      const kicks = getSrsPlusKicks(6, 1, 0);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 },
      ]);
    });

    it('I-piece 0->1 matches TETR.IO I kicks (board coords)', () => {
      const kicks = getSrsPlusKicks(1, 0, 1);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: -2, y: 0 },
        { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 },
      ]);
    });

    it('I-piece 0->2 (180) has only two entries', () => {
      const kicks = getSrsPlusKicks(1, 0, 2);
      expect(kicks).toEqual([{ x: 0, y: 0 }, { x: 0, y: 1 }]);
    });

    it('I-piece 2->0 (180 reverse) has only two entries', () => {
      const kicks = getSrsPlusKicks(1, 2, 0);
      expect(kicks).toEqual([{ x: 0, y: 0 }, { x: 0, y: -1 }]);
    });

    it('I-piece 1->3 (180) has only two entries', () => {
      const kicks = getSrsPlusKicks(1, 1, 3);
      expect(kicks).toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    });

    it('I-piece 3->1 (180 reverse) has only two entries', () => {
      const kicks = getSrsPlusKicks(1, 3, 1);
      expect(kicks).toEqual([{ x: 0, y: 0 }, { x: -1, y: 0 }]);
    });

    it('JLSTZ 0->2 (180) has 6 entries with correct first pair', () => {
      const kicks = getSrsPlusKicks(6, 0, 2);
      expect(kicks[0]).toEqual({ x: 0, y: 0 });
      expect(kicks[1]).toEqual({ x: 0, y: 1 });
    });

    it('JLSTZ 2->0 (180 reverse) has 6 entries with correct first pair', () => {
      const kicks = getSrsPlusKicks(6, 2, 0);
      expect(kicks[0]).toEqual({ x: 0, y: 0 });
      expect(kicks[1]).toEqual({ x: 0, y: -1 });
    });

    it('JLSTZ 1->3 (180) has 6 entries with correct first pair', () => {
      const kicks = getSrsPlusKicks(6, 1, 3);
      expect(kicks[0]).toEqual({ x: 0, y: 0 });
      expect(kicks[1]).toEqual({ x: 1, y: 0 });
    });

    it('JLSTZ 3->1 (180 reverse) has 6 entries with correct first pair', () => {
      const kicks = getSrsPlusKicks(6, 3, 1);
      expect(kicks[0]).toEqual({ x: 0, y: 0 });
      expect(kicks[1]).toEqual({ x: -1, y: 0 });
    });
  });
});
