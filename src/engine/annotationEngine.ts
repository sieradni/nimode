import { BOARD_HEIGHT, BOARD_WIDTH } from './types/board';
import type { AnnotationMatrix } from './types/annotations';

export { applyFloodErase as applyAnnotationFloodErase } from './floodEraseEngine';

export function createEmptyAnnotations(): AnnotationMatrix {
  const matrix: AnnotationMatrix = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      row.push(0);
    }
    matrix.push(row);
  }
  return matrix;
}

function copyMatrix(matrix: AnnotationMatrix): AnnotationMatrix {
  const result: AnnotationMatrix = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row = matrix[y];
    if (row) {
      result.push([...row]);
    } else {
      const emptyRow: number[] = [];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        emptyRow.push(0);
      }
      result.push(emptyRow);
    }
  }
  return result;
}

function clampX(x: number): number | null {
  if (x < 0 || x >= BOARD_WIDTH) return null;
  return x;
}

function clampY(y: number): number | null {
  if (y < 0 || y >= BOARD_HEIGHT) return null;
  return y;
}

/**
 * Paints a single annotation cell. `value` is the encoded cell value: a piece
 * type 1..7 (auto-colored) or `PALETTE_CELL_OFFSET + i` for a picked colour.
 */
export function applyAnnotationPen(
  annotations: AnnotationMatrix,
  x: number,
  y: number,
  value: number,
): AnnotationMatrix {
  const cx = clampX(x);
  const cy = clampY(y);
  if (cx === null || cy === null) {
    return copyMatrix(annotations);
  }

  const result = copyMatrix(annotations);
  const row = result[cy];
  if (row) {
    row[cx] = value;
  }
  return result;
}

export function applyAnnotationErase(
  annotations: AnnotationMatrix,
  x: number,
  y: number,
): AnnotationMatrix {
  return applyAnnotationPen(annotations, x, y, 0);
}

export function clearAllAnnotations(_annotations: AnnotationMatrix): AnnotationMatrix {
  return createEmptyAnnotations();
}

export function applyAnnotationRectFill(
  annotations: AnnotationMatrix,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  value: number,
): AnnotationMatrix {
  const minX = Math.max(0, Math.min(x1, x2));
  const maxX = Math.min(BOARD_WIDTH - 1, Math.max(x1, x2));
  const minY = Math.max(0, Math.min(y1, y2));
  const maxY = Math.min(BOARD_HEIGHT - 1, Math.max(y1, y2));

  const result = copyMatrix(annotations);

  for (let y = minY; y <= maxY; y++) {
    const row = result[y];
    if (row) {
      for (let x = minX; x <= maxX; x++) {
        row[x] = value;
      }
    }
  }

  return result;
}
