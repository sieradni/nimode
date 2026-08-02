import { BOARD_HEIGHT, BOARD_WIDTH } from './types/board';

type Position = { x: number; y: number };

export type FloodEraseMode = 'same-value' | 'any-filled';

function copyMatrix(matrix: number[][]): number[][] {
  const result: number[][] = [];
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
 * Erases the connected region of filled cells around (x, y).
 *
 * `same-value` only clears cells holding the same value as the start cell
 * (used for annotations, so neighbouring marks of other colours survive).
 * `any-filled` clears every filled cell in the region regardless of value
 * (used for board blocks, where colour is irrelevant to erasing).
 */
export function applyFloodErase(
  matrix: number[][],
  x: number,
  y: number,
  mode: FloodEraseMode = 'same-value',
): number[][] {
  const cx = clampX(x);
  const cy = clampY(y);
  if (cx === null || cy === null) {
    return copyMatrix(matrix);
  }
  const startRow = matrix[cy];
  if (!startRow) return copyMatrix(matrix);
  const target = startRow[cx];
  if (target === 0) return copyMatrix(matrix);

  const result = copyMatrix(matrix);
  const visited: boolean[][] = [];
  for (let yy = 0; yy < BOARD_HEIGHT; yy++) {
    visited.push(new Array(BOARD_WIDTH).fill(false));
  }
  const queue: Position[] = [{ x: cx, y: cy }];
  const startVisitedRow = visited[cy];
  if (startVisitedRow) startVisitedRow[cx] = true;

  const matches = (value: number): boolean => mode === 'any-filled' || value === target;

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
      const nRow = matrix[ny];
      if (!nRow) continue;
      if (!nRow[nx] || !matches(nRow[nx] ?? 0)) continue;
      vRow[nx] = true;
      queue.push({ x: nx, y: ny });
    }
  }

  return result;
}
