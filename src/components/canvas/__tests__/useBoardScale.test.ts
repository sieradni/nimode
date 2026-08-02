import { describe, it, expect } from 'vitest';
import {
  computeCellSize,
  computeLayoutCellSize,
  computePreviewCellSize,
} from '../useBoardScale';

describe('computeCellSize', () => {
  it('fits the board to the available height when height is the constraint', () => {
    // 24 render rows (20 visible + 4 buffer); 800px tall viewport => 33px per cell,
    // but width (10 cols) would allow more, so height wins.
    const size = computeCellSize(2000, 800);
    expect(size).toBe(33);
  });

  it('fits the board to the available width when width is the constraint', () => {
    // 10 columns in 300px => 30px per cell; height would allow far more.
    const size = computeCellSize(300, 5000);
    expect(size).toBe(30);
  });

  it('never returns a cell size below the readable minimum', () => {
    expect(computeCellSize(10, 10)).toBeGreaterThanOrEqual(8);
  });

  it('caps the cell size so the board does not become absurd on huge screens', () => {
    expect(computeCellSize(100000, 100000)).toBeLessThanOrEqual(64);
  });

  it('returns an integer so cells align to pixel boundaries', () => {
    const size = computeCellSize(777, 999);
    expect(Number.isInteger(size)).toBe(true);
  });

  it('handles a zero-sized container without producing NaN', () => {
    const size = computeCellSize(0, 0);
    expect(Number.isFinite(size)).toBe(true);
    expect(size).toBeGreaterThan(0);
  });
});

describe('computeLayoutCellSize', () => {
  it('reserves space for flanking panels in the width budget', () => {
    // Same height as computeCellSize test, but the layout cell size should be
    // smaller because horizontal space is consumed by the two side columns.
    const plain = computeCellSize(2000, 800);
    const layout = computeLayoutCellSize(2000, 800);
    expect(layout).toBeLessThanOrEqual(plain);
  });

  it('clamps to the minimum when the container is tiny', () => {
    const size = computeLayoutCellSize(10, 10);
    expect(Number.isFinite(size)).toBe(true);
    expect(size).toBeGreaterThan(0);
  });
});

describe('computePreviewCellSize', () => {
  it('scales the preview cell size by the preview factor', () => {
    expect(computePreviewCellSize(30)).toBe(20); // 30 * 2/3
    expect(computePreviewCellSize(9)).toBe(6); // 9 * 2/3
  });

  it('floors at the minimum preview cell size', () => {
    expect(computePreviewCellSize(4)).toBe(4);
    expect(computePreviewCellSize(2)).toBe(4);
  });
});
