import { describe, it, expect } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../types';
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

describe('autoColorAnnotations', () => {
  it('should return empty matrix when input is empty', () => {
    const annotations = createEmptyAnnotations();
    const result = autoColorAnnotations(annotations);

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const row = result[y];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        expect(row?.[x]).toBe(0);
      }
    }
  });

  it('should auto-color horizontal I-piece to type 1', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 3, y: 20 }, { x: 4, y: 20 }, { x: 5, y: 20 }, { x: 6, y: 20 },
    ], 7);

    const result = autoColorAnnotations(annotations);
    expect(result[20]?.[3]).toBe(1);
    expect(result[20]?.[4]).toBe(1);
    expect(result[20]?.[5]).toBe(1);
    expect(result[20]?.[6]).toBe(1);
  });

  it('should auto-color vertical I-piece to type 1', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 5, y: 19 }, { x: 5, y: 20 }, { x: 5, y: 21 }, { x: 5, y: 22 },
    ], 3);

    const result = autoColorAnnotations(annotations);
    expect(result[19]?.[5]).toBe(1);
    expect(result[20]?.[5]).toBe(1);
    expect(result[21]?.[5]).toBe(1);
    expect(result[22]?.[5]).toBe(1);
  });

  it('should auto-color O-piece to type 4', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 4, y: 20 }, { x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 },
    ], 2);

    const result = autoColorAnnotations(annotations);
    expect(result[20]?.[4]).toBe(4);
    expect(result[20]?.[5]).toBe(4);
    expect(result[21]?.[4]).toBe(4);
    expect(result[21]?.[5]).toBe(4);
  });

  it('should auto-color T-piece to type 6', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }, { x: 6, y: 21 },
    ], 7);

    const result = autoColorAnnotations(annotations);
    expect(result[20]?.[5]).toBe(6);
    expect(result[21]?.[4]).toBe(6);
    expect(result[21]?.[5]).toBe(6);
    expect(result[21]?.[6]).toBe(6);
  });

  it('should auto-color multiple separate tetrominos', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 0, y: 20 }, { x: 1, y: 20 }, { x: 0, y: 21 }, { x: 1, y: 21 },
    ], 3);
    placeCells(annotations, [
      { x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }, { x: 6, y: 21 },
    ], 7);

    const result = autoColorAnnotations(annotations);
    expect(result[20]?.[0]).toBe(4);
    expect(result[20]?.[1]).toBe(4);
    expect(result[21]?.[0]).toBe(4);
    expect(result[21]?.[1]).toBe(4);
    expect(result[20]?.[5]).toBe(6);
    expect(result[21]?.[4]).toBe(6);
    expect(result[21]?.[5]).toBe(6);
    expect(result[21]?.[6]).toBe(6);
  });

  it('should not mutate the original matrix', () => {
    const annotations = createEmptyAnnotations();
    placeCells(annotations, [
      { x: 3, y: 20 }, { x: 4, y: 20 }, { x: 5, y: 20 }, { x: 6, y: 20 },
    ], 7);

    autoColorAnnotations(annotations);

    expect(annotations[20]?.[3]).toBe(7);
    expect(annotations[20]?.[4]).toBe(7);
    expect(annotations[20]?.[5]).toBe(7);
    expect(annotations[20]?.[6]).toBe(7);
  });
});
