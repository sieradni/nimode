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
