import { describe, it, expect } from 'vitest';
import { rotateMatrix, getPieceMatrix } from '../systems/SrsPlusRotationSystem';

/**
 * Board space has Y increasing DOWNWARD (row 0 is the top of the matrix).
 * A clockwise rotation on screen therefore moves a cell at the TOP to the
 * RIGHT side. These tests pin the visual direction of rotation so it can
 * never silently invert again.
 */
describe('rotateMatrix visual direction', () => {
  it('maps a top-centre cell to the right-centre cell (clockwise)', () => {
    const T = [
      [0, 6, 0],
      [6, 6, 6],
      [0, 0, 0],
    ];

    const rotated = rotateMatrix(T);

    // nub started at (x=1, y=0) top-centre -> must land at (x=2, y=1) right-centre
    expect(rotated[1]?.[2]).toBe(6);
    expect(rotated[1]?.[0]).toBe(0);
  });

  it('rotates the T piece nub top -> right -> bottom -> left across R0..R3', () => {
    // R0: nub top-centre
    expect(getPieceMatrix(6, 0)[0]?.[1]).toBe(6);
    // R1 (one CW step): nub right-centre
    expect(getPieceMatrix(6, 1)[1]?.[2]).toBe(6);
    // R2: nub bottom-centre
    expect(getPieceMatrix(6, 2)[2]?.[1]).toBe(6);
    // R3: nub left-centre
    expect(getPieceMatrix(6, 3)[1]?.[0]).toBe(6);
  });

  it('returns to the original orientation after four rotations', () => {
    const original = getPieceMatrix(2, 0);
    let m = original;
    for (let i = 0; i < 4; i++) m = rotateMatrix(m);
    expect(m).toEqual(original);
  });

  it('places the J piece corner top-left at R0 and top-right at R1', () => {
    // J spawn: corner cell at (x=0, y=0)
    expect(getPieceMatrix(2, 0)[0]?.[0]).toBe(2);
    // after one CW step the corner must be at top-right (x=2, y=0)
    expect(getPieceMatrix(2, 1)[0]?.[2]).toBe(2);
  });
});
