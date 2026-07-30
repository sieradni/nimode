import { BoardMatrix, ActivePiece, BOARD_WIDTH, BOARD_HEIGHT } from './types';
import { getPieceMatrix } from './systems/SrsPlusRotationSystem';

export function createEmptyBoard(): BoardMatrix {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0));
}

export function checkCollision(board: BoardMatrix, piece: ActivePiece): boolean {
  const matrix = getPieceMatrix(piece.type, piece.rotation);
  const size = matrix.length;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (matrix[y]?.[x] !== 0) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY < 0 || boardY >= BOARD_HEIGHT) {
          return true;
        }
        if (board[boardY]?.[boardX] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

export function lockPieceToBoard(board: BoardMatrix, piece: ActivePiece): BoardMatrix {
  const newBoard = board.map(row => [...row]);
  const matrix = getPieceMatrix(piece.type, piece.rotation);
  const size = matrix.length;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (matrix[y]?.[x] !== 0) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          const row = newBoard[boardY];
          if (row) {
            row[boardX] = piece.type;
          }
        }
      }
    }
  }
  return newBoard;
}

export function clearBoardLines(board: BoardMatrix): { newBoard: BoardMatrix; linesCleared: number } {
  const newBoard = board.map(row => [...row]);
  let linesCleared = 0;

  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row = newBoard[y];
    if (row && row.every(cell => cell !== 0)) {
      newBoard.splice(y, 1);
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
      linesCleared++;
      y--;
    }
  }

  return { newBoard, linesCleared };
}
