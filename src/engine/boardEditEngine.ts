import { BOARD_HEIGHT, BOARD_WIDTH } from './types/board';
import type { BoardMatrix } from './types/board';
import { applyFloodErase } from './floodEraseEngine';

/**
 * Block-mode edits. Unlike annotations, the pen overwrites any cell — locked
 * tetromino cells included — so setups can be freely painted and repainted;
 * the eraser removes anything. `value` is the encoded cell value
 * (`PALETTE_CELL_OFFSET + i` for a picked colour, or 0 to erase).
 */

export function applyBoardPen(
  board: BoardMatrix,
  x: number,
  y: number,
  value: number,
): BoardMatrix {
  if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) {
    return board.map(row => [...row]);
  }
  const result = board.map(row => [...row]);
  const row = result[y];
  if (row) row[x] = value;
  return result;
}

export function applyBoardErase(board: BoardMatrix, x: number, y: number): BoardMatrix {
  return applyBoardPen(board, x, y, 0);
}

export function applyBoardRectFill(
  board: BoardMatrix,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  value: number,
): BoardMatrix {
  const minX = Math.max(0, Math.min(x1, x2));
  const maxX = Math.min(BOARD_WIDTH - 1, Math.max(x1, x2));
  const minY = Math.max(0, Math.min(y1, y2));
  const maxY = Math.min(BOARD_HEIGHT - 1, Math.max(y1, y2));

  const result = board.map(row => [...row]);
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

export function applyBoardFloodErase(board: BoardMatrix, x: number, y: number): BoardMatrix {
  return applyFloodErase(board, x, y, 'any-filled');
}
