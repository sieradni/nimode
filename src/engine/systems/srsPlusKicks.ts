import { PieceType, RotationState } from '../types';

export const PIECE_SHAPES: Record<PieceType, number[][]> = {
  0: [],
  1: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  2: [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ],
  3: [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ],
  4: [
    [4, 4],
    [4, 4],
  ],
  5: [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ],
  6: [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  7: [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ],
};

export type KickOffset = { x: number; y: number };

const JLSTZ_KICKS: Record<string, KickOffset[]> = {
  '0->1': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '1->0': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '1->2': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '2->1': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '2->3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  '3->2': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '3->0': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '0->3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  '0->2': [{ x: 0, y: 0 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }],
  '2->0': [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }],
  '1->3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -2 }, { x: 1, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -1 }],
  '3->1': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -2 }, { x: -1, y: -1 }, { x: 0, y: -2 }, { x: 0, y: -1 }],
};

const I_KICKS: Record<string, KickOffset[]> = {
  // SRS+ symmetric: mirrored pairs have identical Y values, only X is mirrored
  // Base Y sequence (from standard SRS left-wall kicks 0->L): [0, 0, 0, 2, -1]
  '0->1': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '1->0': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
  '1->2': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
  '2->1': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '2->3': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
  '3->2': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '3->0': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '0->3': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
  '0->2': [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 0 }],
  '2->0': [{ x: 0, y: 0 }, { x: -1, y: -1 }, { x: -1, y: 0 }],
  '1->3': [{ x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }],
  '3->1': [{ x: 0, y: 0 }, { x: 1, y: -1 }, { x: 0, y: -1 }],
};

const DEFAULT_KICK: KickOffset[] = [{ x: 0, y: 0 }];

export function getSrsPlusKicks(
  pieceType: PieceType,
  fromRotation: RotationState,
  toRotation: RotationState
): ReadonlyArray<KickOffset> {
  if (pieceType === 4) return DEFAULT_KICK; // O piece

  const key = `${fromRotation}->${toRotation}`;
  const table = pieceType === 1 ? I_KICKS : JLSTZ_KICKS;
  return table[key] ?? DEFAULT_KICK;
}