import { BOARD_HEIGHT, BOARD_WIDTH } from './types/board';
import type { AnnotationMatrix } from './types/annotations';

type Position = { x: number; y: number };

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

export function applyAnnotationFloodErase(
  annotations: AnnotationMatrix,
  x: number,
  y: number,
): AnnotationMatrix {
  const cx = clampX(x);
  const cy = clampY(y);
  if (cx === null || cy === null) {
    return copyMatrix(annotations);
  }
  const startRow = annotations[cy];
  if (!startRow) return copyMatrix(annotations);
  const target = startRow[cx];
  if (target === 0) return copyMatrix(annotations);

  const result = copyMatrix(annotations);
  const visited: boolean[][] = [];
  for (let yy = 0; yy < BOARD_HEIGHT; yy++) {
    visited.push(new Array(BOARD_WIDTH).fill(false));
  }
  const queue: Position[] = [{ x: cx, y: cy }];
  const startVisitedRow = visited[cy];
  if (startVisitedRow) startVisitedRow[cx] = true;

  while (queue.length > 0) {
    const { x: px, y: py } = queue.shift()!;
    const row = result[py];
    if (row) row[px] = 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = px + dx;
      const ny = py + dy;
      if (nx < 0 || nx >= BOARD_WIDTH || ny < 0 || ny >= BOARD_HEIGHT) continue;
      const vRow = visited[ny];
      if (!vRow) continue;
      if (vRow[nx]) continue;
      const nRow = annotations[ny];
      if (!nRow) continue;
      if (nRow[nx] !== target) continue;
      vRow[nx] = true;
      queue.push({ x: nx, y: ny });
    }
  }

  return result;
}
