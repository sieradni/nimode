import { BoardMatrix, ActivePiece, BOARD_WIDTH, BOARD_HEIGHT } from './types';

export interface LockResult {
  linesCleared: number;
  tSpin: boolean;
  tSpinMini: boolean;
}

const T_CORNER_OFFSETS: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: 0 },
  { dx: 2, dy: 0 },
  { dx: 0, dy: 2 },
  { dx: 2, dy: 2 },
];

const T_BACK_OFFSET: ReadonlyArray<{ dx: number; dy: number }> = [
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
];

export function detectTSpin(board: BoardMatrix, piece: ActivePiece): boolean {
  if (piece.type !== 6) return false;

  let occupiedCorners = 0;
  for (const { dx, dy } of T_CORNER_OFFSETS) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) {
      occupiedCorners++;
      continue;
    }
    if (board[y]?.[x] !== 0) {
      occupiedCorners++;
    }
  }

  return occupiedCorners >= 3;
}

export function detectTSpinMini(board: BoardMatrix, piece: ActivePiece): boolean {
  if (piece.type !== 6) return false;
  if (!detectTSpin(board, piece)) return false;

  const r = piece.rotation;
  const back = T_BACK_OFFSET[r as 0 | 1 | 2 | 3]!;
  const bx = piece.x + back.dx;
  const by = piece.y + back.dy;
  if (bx < 0 || bx >= BOARD_WIDTH || by < 0 || by >= BOARD_HEIGHT) return false;
  return board[by]?.[bx] === 0;
}
