import { describe, it, expect } from 'vitest';
import { createEmptyAnnotations } from '../annotationEngine';
import { autoColorAnnotations } from '../autoColorEngine';
import type { AnnotationMatrix } from '../types';

function setCell(annotations: AnnotationMatrix, x: number, y: number, value: number): void {
  const row = annotations[y];
  if (row) {
    row[x] = value;
  }
}

function placeCells(annotations: AnnotationMatrix, cells: Array<{ x: number; y: number }>, value: number): void {
  for (const c of cells) {
    setCell(annotations, c.x, c.y, value);
  }
}

describe('autoColorAnnotations shape recognition', () => {
  it('should auto-color J-piece to type 2', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 4, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }, { x: 6, y: 21 },
    ], 5);

    const result = autoColorAnnotations(annotations);
    expect(result[20]?.[4]).toBe(2);
    expect(result[21]?.[4]).toBe(2);
    expect(result[21]?.[5]).toBe(2);
    expect(result[21]?.[6]).toBe(2);
  });

  it('should auto-color L-piece to type 3', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 6, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }, { x: 6, y: 21 },
    ], 1);

    const result = autoColorAnnotations(annotations);
    expect(result[20]?.[6]).toBe(3);
    expect(result[21]?.[4]).toBe(3);
    expect(result[21]?.[5]).toBe(3);
    expect(result[21]?.[6]).toBe(3);
  });

  it('should auto-color S-piece to type 5', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 5, y: 20 }, { x: 6, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 },
    ], 2);

    const result = autoColorAnnotations(annotations);
    expect(result[20]?.[5]).toBe(5);
    expect(result[20]?.[6]).toBe(5);
    expect(result[21]?.[4]).toBe(5);
    expect(result[21]?.[5]).toBe(5);
  });

  it('should auto-color Z-piece to type 7', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 4, y: 20 }, { x: 5, y: 20 }, { x: 5, y: 21 }, { x: 6, y: 21 },
    ], 3);

    const result = autoColorAnnotations(annotations);
    expect(result[20]?.[4]).toBe(7);
    expect(result[20]?.[5]).toBe(7);
    expect(result[21]?.[5]).toBe(7);
    expect(result[21]?.[6]).toBe(7);
  });

  it('should skip component with 3 cells', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 4, y: 20 }, { x: 5, y: 20 }, { x: 6, y: 20 },
    ], 5);

    const result = autoColorAnnotations(annotations);
    expect(result[20]?.[4]).toBe(5);
    expect(result[20]?.[5]).toBe(5);
    expect(result[20]?.[6]).toBe(5);
  });

  it('should skip component with 5 cells', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 4, y: 20 }, { x: 5, y: 20 }, { x: 6, y: 20 },
      { x: 4, y: 21 }, { x: 5, y: 21 },
    ], 2);

    const result = autoColorAnnotations(annotations);
    for (const c of [{ x: 4, y: 20 }, { x: 5, y: 20 }, { x: 6, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }]) {
      expect(result[c.y]?.[c.x]).toBe(2);
    }
  });
});
