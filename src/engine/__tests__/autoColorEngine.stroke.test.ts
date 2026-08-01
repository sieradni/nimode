import { describe, it, expect } from 'vitest';
import { createEmptyAnnotations } from '../annotationEngine';
import { autoColorStroke } from '../autoColorEngine';
import type { AnnotationMatrix } from '../types';

function place(a: AnnotationMatrix, cells: Array<{ x: number; y: number }>, v: number): void {
  for (const c of cells) {
    const row = a[c.y];
    if (row) row[c.x] = v;
  }
}

describe('autoColorStroke', () => {
  it('colors a stroke that forms a T piece', () => {
    const a = createEmptyAnnotations();
    const stroke = [{ x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }, { x: 6, y: 21 }];
    place(a, stroke, 8);

    const result = autoColorStroke(a, stroke);
    for (const c of stroke) expect(result[c.y]?.[c.x]).toBe(6);
  });

  it('colors a stroke even when it is adjacent to an existing annotated piece', () => {
    const a = createEmptyAnnotations();
    // Pre-existing O piece already on the board, directly to the left.
    const existing = [{ x: 2, y: 20 }, { x: 3, y: 20 }, { x: 2, y: 21 }, { x: 3, y: 21 }];
    place(a, existing, 4);

    // New stroke drawn immediately adjacent (x=4..) forming an O piece.
    const stroke = [{ x: 4, y: 20 }, { x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }];
    place(a, stroke, 8);

    const result = autoColorStroke(a, stroke);
    for (const c of stroke) expect(result[c.y]?.[c.x]).toBe(4);
    // The pre-existing piece keeps its colour.
    for (const c of existing) expect(result[c.y]?.[c.x]).toBe(4);
  });

  it('colors a stroke adjacent to a differently-shaped neighbour', () => {
    const a = createEmptyAnnotations();
    // A vertical I piece at x=3 that would merge with the stroke under a
    // global flood fill, producing an 8-cell component.
    const existing = [{ x: 3, y: 18 }, { x: 3, y: 19 }, { x: 3, y: 20 }, { x: 3, y: 21 }];
    place(a, existing, 1);

    const stroke = [{ x: 4, y: 20 }, { x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }];
    place(a, stroke, 8);

    const result = autoColorStroke(a, stroke);
    for (const c of stroke) expect(result[c.y]?.[c.x]).toBe(4);
  });

  it('leaves a stroke untouched when it is not a tetromino', () => {
    const a = createEmptyAnnotations();
    const stroke = [{ x: 4, y: 20 }, { x: 5, y: 20 }, { x: 6, y: 20 }];
    place(a, stroke, 8);

    const result = autoColorStroke(a, stroke);
    for (const c of stroke) expect(result[c.y]?.[c.x]).toBe(8);
  });

  it('ignores stroke cells that were erased before the stroke ended', () => {
    const a = createEmptyAnnotations();
    const stroke = [{ x: 4, y: 20 }, { x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }];
    place(a, stroke, 8);
    // The player drew a 5th cell then erased it; it is reported in the stroke
    // but is empty in the matrix.
    const reported = [...stroke, { x: 6, y: 20 }];

    const result = autoColorStroke(a, reported);
    for (const c of stroke) expect(result[c.y]?.[c.x]).toBe(4);
  });

  it('does not mutate the input matrix', () => {
    const a = createEmptyAnnotations();
    const stroke = [{ x: 4, y: 20 }, { x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }];
    place(a, stroke, 8);

    autoColorStroke(a, stroke);
    for (const c of stroke) expect(a[c.y]?.[c.x]).toBe(8);
  });

  it('returns a copy when the stroke is empty', () => {
    const a = createEmptyAnnotations();
    const result = autoColorStroke(a, []);
    expect(result).not.toBe(a);
    expect(result[20]?.[4]).toBe(0);
  });
});
