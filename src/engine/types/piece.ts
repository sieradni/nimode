export type PieceType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RotationState = 0 | 1 | 2 | 3;

export const PIECE_NAMES: Record<PieceType, string> = {
  0: 'Empty',
  1: 'I',
  2: 'J',
  3: 'L',
  4: 'O',
  5: 'S',
  6: 'T',
  7: 'Z',
};

export const PIECE_COLORS: Record<PieceType, string> = {
  0: '#000000',
  1: '#47efef',
  2: '#2836fc',
  3: '#f5a42a',
  4: '#ffec45',
  5: '#7bed4a',
  6: '#982dea',
  7: '#eb3a3a',
};

export interface PieceState {
  x: number;
  y: number;
  rotation: RotationState;
}

export interface ActivePiece {
  type: PieceType;
  x: number;
  y: number;
  rotation: RotationState;
}

export type RotationDirection = 1 | -1 | 2;

export interface RotationResult {
  piece: ActivePiece;
  kicked: boolean;
  kickIndex: number;
}

export type KickTable = ReadonlyArray<ReadonlyArray<{ x: number; y: number }>>;
