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
  1: '#00f0f0',
  2: '#0000f0',
  3: '#f0a000',
  4: '#f0f000',
  5: '#00f000',
  6: '#a000f0',
  7: '#f00000',
};

export const PIECE_SPAWNS: Record<PieceType, { x: number; y: number; rotation: RotationState }> = {
  0: { x: 3, y: 38, rotation: 0 },
  1: { x: 3, y: 38, rotation: 0 },
  2: { x: 3, y: 38, rotation: 0 },
  3: { x: 3, y: 38, rotation: 0 },
  4: { x: 4, y: 39, rotation: 0 },
  5: { x: 3, y: 38, rotation: 0 },
  6: { x: 3, y: 38, rotation: 0 },
  7: { x: 3, y: 38, rotation: 0 },
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
