import { BOARD_HEIGHT, BOARD_WIDTH } from './types/board';
import type { AnnotationMatrix } from './types/annotations';
import { matchTetromino, type Position } from './autoColorShapes';

function tryEnqueueNeighbor(
  queue: Position[],
  visited: boolean[][],
  annotations: AnnotationMatrix,
  x: number,
  y: number,
): void {
  if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return;
  const vRow = visited[y];
  if (!vRow) return;
  if (vRow[x]) return;
  const aRow = annotations[y];
  if (!aRow) return;
  if (!aRow[x]) return;
  vRow[x] = true;
  queue.push({ x, y });
}

function floodFillComponents(annotations: AnnotationMatrix): Position[][] {
  const visited: boolean[][] = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    visited.push(new Array(BOARD_WIDTH).fill(false));
  }

  const components: Position[][] = [];

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const visitedRow = visited[y];
    if (!visitedRow) continue;
    const annRow = annotations[y];
    if (!annRow) continue;

    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (visitedRow[x]) continue;
      if (!annRow[x]) {
        visitedRow[x] = true;
        continue;
      }

      const component: Position[] = [];
      const queue: Position[] = [{ x, y }];
      visitedRow[x] = true;

      while (queue.length > 0) {
        const pos = queue.shift();
        if (!pos) break;

        const aRow = annotations[pos.y];
        if (!aRow) continue;
        if (!aRow[pos.x]) continue;

        component.push(pos);

        tryEnqueueNeighbor(queue, visited, annotations, pos.x - 1, pos.y);
        tryEnqueueNeighbor(queue, visited, annotations, pos.x + 1, pos.y);
        tryEnqueueNeighbor(queue, visited, annotations, pos.x, pos.y - 1);
        tryEnqueueNeighbor(queue, visited, annotations, pos.x, pos.y + 1);
      }

      components.push(component);
    }
  }

  return components;
}

function copyAnnotations(annotations: AnnotationMatrix): AnnotationMatrix {
  const result: AnnotationMatrix = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row = annotations[y];
    result.push(row ? [...row] : []);
  }
  return result;
}

/**
 * Colors the cells drawn in a single stroke, matched on the stroke's own shape.
 *
 * Unlike `autoColorAnnotations`, this never flood-fills across the board, so a
 * stroke drawn immediately adjacent to an already-annotated piece is still
 * recognised instead of merging into one oversized component (US-7.5).
 *
 * Stroke cells that are no longer filled (drawn then erased before the stroke
 * ended) and duplicates from overlapping pointer moves are ignored.
 */
export function autoColorStroke(
  annotations: AnnotationMatrix,
  stroke: ReadonlyArray<Position>,
): AnnotationMatrix {
  const result = copyAnnotations(annotations);

  const seen = new Set<string>();
  const cells: Position[] = [];
  for (const cell of stroke) {
    const key = `${cell.x},${cell.y}`;
    if (seen.has(key)) continue;
    if (!annotations[cell.y]?.[cell.x]) continue;
    seen.add(key);
    cells.push(cell);
  }

  const matchedType = matchTetromino(cells);
  if (matchedType === undefined) return result;

  for (const cell of cells) {
    const row = result[cell.y];
    if (row) {
      row[cell.x] = matchedType;
    }
  }

  return result;
}

/**
 * Colors every isolated 4-cell annotation component on the board. Retained for
 * the explicit "auto-color whole board" action; per-stroke drawing uses
 * `autoColorStroke`.
 */
export function autoColorAnnotations(annotations: AnnotationMatrix): AnnotationMatrix {
  const components = floodFillComponents(annotations);
  const result = copyAnnotations(annotations);

  for (const component of components) {
    const matchedType = matchTetromino(component);
    if (matchedType === undefined) continue;

    for (const cell of component) {
      const row = result[cell.y];
      if (row) {
        row[cell.x] = matchedType;
      }
    }
  }

  return result;
}
