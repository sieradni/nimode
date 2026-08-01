import { describe, it, expect } from 'vitest';
import { walkLineCells } from '../walkLineCells';

describe('walkLineCells', () => {
  it('returns start when start equals end', () => {
    expect([...walkLineCells(3, 5, 3, 5)]).toEqual([[3, 5]]);
  });

  it('walks a horizontal line', () => {
    expect([...walkLineCells(1, 2, 4, 2)]).toEqual([
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
    ]);
  });

  it('walks a vertical line', () => {
    expect([...walkLineCells(0, 0, 0, 3)]).toEqual([[0, 0], [0, 1], [0, 2], [0, 3]]);
  });

  it('walks a diagonal line', () => {
    expect([...walkLineCells(0, 0, 3, 3)]).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it('walks a slope line (Bresenham)', () => {
    expect([...walkLineCells(0, 0, 5, 2)]).toEqual([
      [0, 0],
      [1, 0],
      [2, 1],
      [3, 1],
      [4, 2],
      [5, 2],
    ]);
  });
});
