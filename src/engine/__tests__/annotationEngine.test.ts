import { describe, it, expect } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../types';
import {
  createEmptyAnnotations,
  applyAnnotationPen,
  applyAnnotationErase,
  clearAllAnnotations,
  applyAnnotationRectFill,
} from '../annotationEngine';

describe('annotationEngine', () => {
  describe('createEmptyAnnotations', () => {
    it('should return a 40x10 matrix of all zeros', () => {
      const result = createEmptyAnnotations();

      expect(result.length).toBe(BOARD_HEIGHT);
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const row = result[y];
        expect(row?.length).toBe(BOARD_WIDTH);
        for (let x = 0; x < BOARD_WIDTH; x++) {
          expect(row?.[x]).toBe(0);
        }
      }
    });
  });

  describe('applyAnnotationPen', () => {
    it('should set the cell at (x, y) to the given pieceType', () => {
      const annotations = createEmptyAnnotations();
      const result = applyAnnotationPen(annotations, 3, 5, 4);

      expect(result[5]?.[3]).toBe(4);
    });

    it('should not mutate the original matrix', () => {
      const annotations = createEmptyAnnotations();
      applyAnnotationPen(annotations, 3, 5, 4);

      expect(annotations[5]?.[3]).toBe(0);
    });

    it('should clamp coordinates within board bounds', () => {
      const annotations = createEmptyAnnotations();
      const resultNeg = applyAnnotationPen(annotations, -1, -1, 2);
      const resultOver = applyAnnotationPen(annotations, 100, 100, 2);

      expect(resultNeg).toEqual(createEmptyAnnotations());
      expect(resultOver).toEqual(createEmptyAnnotations());
    });
  });

  describe('applyAnnotationErase', () => {
    it('should set the cell at (x, y) to 0', () => {
      let annotations = createEmptyAnnotations();
      annotations = applyAnnotationPen(annotations, 3, 5, 4);
      const result = applyAnnotationErase(annotations, 3, 5);

      expect(result[5]?.[3]).toBe(0);
    });

    it('should not mutate the original matrix', () => {
      let annotations = createEmptyAnnotations();
      annotations = applyAnnotationPen(annotations, 3, 5, 4);
      applyAnnotationErase(annotations, 3, 5);

      expect(annotations[5]?.[3]).toBe(4);
    });

    it('should clamp coordinates within board bounds', () => {
      const annotations = createEmptyAnnotations();
      const result = applyAnnotationErase(annotations, -1, 100);

      expect(result).toEqual(createEmptyAnnotations());
    });
  });

  describe('clearAllAnnotations', () => {
    it('should return a fresh 40x10 matrix of all zeros', () => {
      let annotations = createEmptyAnnotations();
      annotations = applyAnnotationPen(annotations, 0, 0, 5);
      annotations = applyAnnotationPen(annotations, 9, 39, 3);

      const result = clearAllAnnotations(annotations);

      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const row = result[y];
        for (let x = 0; x < BOARD_WIDTH; x++) {
          expect(row?.[x]).toBe(0);
        }
      }
    });

    it('should not mutate the original matrix', () => {
      let annotations = createEmptyAnnotations();
      annotations = applyAnnotationPen(annotations, 0, 0, 5);
      clearAllAnnotations(annotations);

      expect(annotations[0]?.[0]).toBe(5);
    });
  });

  describe('applyAnnotationRectFill', () => {
    it('should fill a rectangular region with pieceType', () => {
      const annotations = createEmptyAnnotations();
      const result = applyAnnotationRectFill(annotations, 2, 3, 5, 6, 7);

      for (let y = 3; y <= 6; y++) {
        for (let x = 2; x <= 5; x++) {
          expect(result[y]?.[x]).toBe(7);
        }
      }
      expect(result[2]?.[2]).toBe(0);
      expect(result[7]?.[5]).toBe(0);
    });

    it('should handle coordinates in any order', () => {
      const annotations = createEmptyAnnotations();
      const result = applyAnnotationRectFill(annotations, 5, 6, 2, 3, 1);

      for (let y = 3; y <= 6; y++) {
        for (let x = 2; x <= 5; x++) {
          expect(result[y]?.[x]).toBe(1);
        }
      }
    });

    it('should clamp to board bounds', () => {
      const annotations = createEmptyAnnotations();
      const result = applyAnnotationRectFill(annotations, -5, -5, 50, 50, 2);

      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const row = result[y];
        for (let x = 0; x < BOARD_WIDTH; x++) {
          expect(row?.[x]).toBe(2);
        }
      }
    });

    it('should not mutate the original matrix', () => {
      const annotations = createEmptyAnnotations();
      applyAnnotationRectFill(annotations, 0, 0, 1, 1, 5);

      expect(annotations[0]?.[0]).toBe(0);
      expect(annotations[1]?.[1]).toBe(0);
    });
  });
});
