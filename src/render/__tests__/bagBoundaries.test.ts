import { describe, it, expect } from 'vitest';
import { getBagBoundaryPositions } from '../bagBoundaries';

describe('getBagBoundaryPositions', () => {
  it('returns the first boundary at bagRemaining and every 7 after', () => {
    expect(getBagBoundaryPositions(20, 3)).toEqual([3, 10, 17]);
  });

  it('omits boundaries that fall on or outside the visible queue', () => {
    expect(getBagBoundaryPositions(8, 3)).toEqual([3]);
    expect(getBagBoundaryPositions(10, 3)).toEqual([3]);
    expect(getBagBoundaryPositions(15, 1)).toEqual([1, 8]);
  });

  it('returns no boundaries when bagRemaining is below 1', () => {
    expect(getBagBoundaryPositions(8, 0)).toEqual([]);
    expect(getBagBoundaryPositions(8, -2)).toEqual([]);
  });

  it('returns none when the queue cannot fit a boundary', () => {
    expect(getBagBoundaryPositions(0, 3)).toEqual([]);
    expect(getBagBoundaryPositions(1, 3)).toEqual([]);
  });
});