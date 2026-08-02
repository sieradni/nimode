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

    it('I-piece 180-degree transitions have 3 kick entries', () => {
      const kicks180: Array<[RotationState, RotationState]> = [
        [0, 2], [2, 0], [1, 3], [3, 1],
      ];
      for (const [from, to] of kicks180) {
        const kicks = getSrsPlusKicks(1, from, to);
        expect(kicks).toHaveLength(3);
      }
    });
  });

  describe('JLSTZ 90-degree specific kick values (standard SRS)', () => {
    it('JLSTZ 0->1 (CW from spawn) matches SRS board coords', () => {
      const kicks = getSrsPlusKicks(6, 0, 1);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: -1, y: 0 },
        { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 },
      ]);
    });

    it('JLSTZ 1->0 (CCW to spawn) matches SRS board coords', () => {
      const kicks = getSrsPlusKicks(6, 1, 0);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 },
      ]);
    });

    it('JLSTZ 1->2 matches SRS board coords', () => {
      const kicks = getSrsPlusKicks(6, 1, 2);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 },
      ]);
    });

    it('JLSTZ 2->1 matches SRS board coords', () => {
      const kicks = getSrsPlusKicks(6, 2, 1);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: -1, y: 0 },
        { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 },
      ]);
    });

    it('JLSTZ 2->3 matches SRS board coords', () => {
      const kicks = getSrsPlusKicks(6, 2, 3);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 },
      ]);
    });

    it('JLSTZ 3->2 matches SRS board coords', () => {
      const kicks = getSrsPlusKicks(6, 3, 2);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: -1, y: 0 },
        { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 },
      ]);
    });

    it('JLSTZ 3->0 matches SRS board coords', () => {
      const kicks = getSrsPlusKicks(6, 3, 0);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: -1, y: 0 },
        { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 },
      ]);
    });

    it('JLSTZ 0->3 matches SRS board coords', () => {
      const kicks = getSrsPlusKicks(6, 0, 3);
      expect(kicks).toEqual([
        { x: 0, y: 0 }, { x: 1, y: 0 },
        { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 },
      ]);
    });
  });

  describe('JLSTZ 180-degree specific kick values (TETR.IO SRS+)', () => {
    it('JLSTZ 0->2 (180 CW from spawn) kicks UP first', () => {
      const kicks = getSrsPlusKicks(6, 0, 2);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ]);
    });

    it('JLSTZ 2->0 (180 CCW to spawn) kicks DOWN first', () => {
      const kicks = getSrsPlusKicks(6, 2, 0);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 1 },
        { x: 1, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ]);
    });

    it('JLSTZ 1->3 (180 CW from R) kicks UP for vertical shifts', () => {
      const kicks = getSrsPlusKicks(6, 1, 3);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: -2 },
        { x: 1, y: -1 },
        { x: 0, y: -2 },
        { x: 0, y: -1 },
      ]);
    });

    it('JLSTZ 3->1 (180 CCW from L) kicks UP for vertical shifts', () => {
      const kicks = getSrsPlusKicks(6, 3, 1);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: -1, y: -2 },
        { x: -1, y: -1 },
        { x: 0, y: -2 },
        { x: 0, y: -1 },
      ]);
    });
  });

  describe('I-piece 90-degree symmetric kick values (SRS+)', () => {
    it('I-piece 0->1 (CW from spawn) uses symmetric table', () => {
      const kicks = getSrsPlusKicks(1, 0, 1);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 1, y: 2 },
        { x: -2, y: -1 },
      ]);
    });

    it('I-piece 1->0 (CCW to spawn) uses symmetric table', () => {
      const kicks = getSrsPlusKicks(1, 1, 0);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: 2 },
        { x: 2, y: -1 },
      ]);
    });

    it('I-piece 1->2 (CW from R) uses symmetric table', () => {
      const kicks = getSrsPlusKicks(1, 1, 2);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: 2 },
        { x: 2, y: -1 },
      ]);
    });

    it('I-piece 2->1 (CCW from 2) uses symmetric table', () => {
      const kicks = getSrsPlusKicks(1, 2, 1);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 1, y: 2 },
        { x: -2, y: -1 },
      ]);
    });

    it('I-piece 2->3 (CW from 2) uses symmetric table', () => {
      const kicks = getSrsPlusKicks(1, 2, 3);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: 2 },
        { x: 2, y: -1 },
      ]);
    });

    it('I-piece 3->2 (CCW from L) uses symmetric table', () => {
      const kicks = getSrsPlusKicks(1, 3, 2);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 1, y: 2 },
        { x: -2, y: -1 },
      ]);
    });

    it('I-piece 3->0 (CW from L) uses symmetric table', () => {
      const kicks = getSrsPlusKicks(1, 3, 0);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 1, y: 2 },
        { x: -2, y: -1 },
      ]);
    });

    it('I-piece 0->3 (CCW from spawn) uses symmetric table', () => {
      const kicks = getSrsPlusKicks(1, 0, 3);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 2, y: 0 },
        { x: -1, y: 2 },
        { x: 2, y: -1 },
      ]);
    });

    it('I-piece 0->1 and 0->3 are x-mirrors (left/right symmetry)', () => {
      const cw = getSrsPlusKicks(1, 0, 1);
      const ccw = getSrsPlusKicks(1, 0, 3);
      expect(cw.length).toBe(ccw.length);
      for (let i = 0; i < cw.length; i++) {
        const cwKick = cw[i]!;
        const ccwKick = ccw[i]!;
        // Mirror symmetry: cw.x === -ccw.x (handle -0 === 0)
        const mirroredX = -ccwKick.x;
        const xMatch = cwKick.x === mirroredX || (cwKick.x === 0 && mirroredX === 0);
        expect(xMatch).toBe(true);
        expect(cwKick.y).toBe(ccwKick.y);
      }
    });

    it('I-piece 1->2 and 3->2 are x-mirrors', () => {
      const cw = getSrsPlusKicks(1, 1, 2);
      const ccw = getSrsPlusKicks(1, 3, 2);
      expect(cw.length).toBe(ccw.length);
      for (let i = 0; i < cw.length; i++) {
        const cwKick = cw[i]!;
        const ccwKick = ccw[i]!;
        const mirroredX = -ccwKick.x;
        const xMatch = cwKick.x === mirroredX || (cwKick.x === 0 && mirroredX === 0);
        expect(xMatch).toBe(true);
        expect(cwKick.y).toBe(ccwKick.y);
      }
    });

    it('I-piece 2->1 and 2->3 are x-mirrors', () => {
      const cw = getSrsPlusKicks(1, 2, 1);
      const ccw = getSrsPlusKicks(1, 2, 3);
      expect(cw.length).toBe(ccw.length);
      for (let i = 0; i < cw.length; i++) {
        const cwKick = cw[i]!;
        const ccwKick = ccw[i]!;
        const mirroredX = -ccwKick.x;
        const xMatch = cwKick.x === mirroredX || (cwKick.x === 0 && mirroredX === 0);
        expect(xMatch).toBe(true);
        expect(cwKick.y).toBe(ccwKick.y);
      }
    });

    it('I-piece 3->0 and 1->0 are x-mirrors', () => {
      const cw = getSrsPlusKicks(1, 3, 0);
      const ccw = getSrsPlusKicks(1, 1, 0);
      expect(cw.length).toBe(ccw.length);
      for (let i = 0; i < cw.length; i++) {
        const cwKick = cw[i]!;
        const ccwKick = ccw[i]!;
        const mirroredX = -ccwKick.x;
        const xMatch = cwKick.x === mirroredX || (cwKick.x === 0 && mirroredX === 0);
        expect(xMatch).toBe(true);
        expect(cwKick.y).toBe(ccwKick.y);
      }
    });
  });

  describe('I-piece 180-degree specific kick values (TETR.IO SRS+)', () => {
    it('I-piece 0->2 (180 from horizontal) has 3 kicks', () => {
      const kicks = getSrsPlusKicks(1, 0, 2);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
      ]);
    });

    it('I-piece 2->0 (180 to horizontal) has 3 kicks', () => {
      const kicks = getSrsPlusKicks(1, 2, 0);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: -1, y: -1 },
        { x: -1, y: 0 },
      ]);
    });

    it('I-piece 1->3 (180 from vertical R) has 3 kicks', () => {
      const kicks = getSrsPlusKicks(1, 1, 3);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
      ]);
    });

    it('I-piece 3->1 (180 from vertical L) has 3 kicks', () => {
      const kicks = getSrsPlusKicks(1, 3, 1);
      expect(kicks).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: -1 },
      ]);
    });
  });
});