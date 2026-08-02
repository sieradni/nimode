import {
  PieceType,
  RotationState,
  RotationDirection,
  BoardMatrix,
  ActivePiece,
  RotationResult,
} from '../types';
import { IRotationSystem } from '../interfaces/IRotationSystem';
import { GameConfig } from '../types';
import { PIECE_SHAPES, getSrsPlusKicks, KickOffset } from './srsPlusKicks';
import { VISIBLE_Y_OFFSET } from '../types';

export function rotateMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const result: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const row = result[x];
      if (row) {
        row[n - 1 - y] = matrix[y]?.[x] ?? 0;
      }
    }
  }
  return result;
}

export function getPieceMatrix(type: PieceType, rotation: RotationState): number[][] {
  let matrix = PIECE_SHAPES[type] ?? [];
  for (let i = 0; i < rotation; i++) {
    matrix = rotateMatrix(matrix);
  }
  return matrix;
}

function checkCollision(board: BoardMatrix, piece: ActivePiece, matrix: number[][]): boolean {
  const size = matrix.length;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (matrix[y]?.[x] !== 0) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (boardX < 0 || boardX >= 10 || boardY < 0 || boardY >= 40) {
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

function computeSpawnY(config: GameConfig): number {
  // Visible rows are VISIBLE_Y_OFFSET..BOARD_HEIGHT (y grows downward).
  // spawnOffset=1 (default, TETR.IO): y = 19 - 1 = 18 -> bottom-most cell at
  // row 19, immediately above the visible field with no part within it.
  // Increasing the offset spawns the piece higher above the field.
  return VISIBLE_Y_OFFSET - 1 - config.spawnOffset;
}

export class SrsPlusRotationSystem implements IRotationSystem {
  id = 'srs+';
  name = 'SRS+ (TETR.IO)';

  getInitialState(type: PieceType, config: GameConfig): { x: number; y: number; rotation: RotationState } {
    const spawnY = computeSpawnY(config);
    const x = type === 1 ? 3 : type === 4 ? 4 : 3; // I piece at 3, O at 4, others at 3 (left-leaning)
    return { x, y: spawnY, rotation: 0 };
  }

  getKickTable(
    pieceType: PieceType,
    fromRotation: RotationState,
    toRotation: RotationState
  ): ReadonlyArray<KickOffset> {
    return getSrsPlusKicks(pieceType, fromRotation, toRotation);
  }

  rotate(
    board: BoardMatrix,
    piece: ActivePiece,
    direction: RotationDirection
  ): RotationResult | null {
    const fromRotation = piece.rotation;
    let toRotation: RotationState;

    if (direction === 2) {
      toRotation = ((fromRotation + 2) % 4) as RotationState;
    } else if (direction === 1) {
      toRotation = ((fromRotation + 1) % 4) as RotationState;
    } else {
      toRotation = ((fromRotation + 3) % 4) as RotationState;
    }

    const newMatrix = getPieceMatrix(piece.type, toRotation);
    const kicks = this.getKickTable(piece.type, fromRotation, toRotation);

    for (let i = 0; i < kicks.length; i++) {
      const kick = kicks[i];
      if (!kick) continue;

      const testPiece: ActivePiece = {
        ...piece,
        x: piece.x + kick.x,
        y: piece.y + kick.y,
        rotation: toRotation,
      };

      if (!checkCollision(board, testPiece, newMatrix)) {
        return {
          piece: testPiece,
          kicked: i > 0,
          kickIndex: i,
        };
      }
    }

    return null;
  }
}

export const srsPlusRotationSystem = new SrsPlusRotationSystem();
