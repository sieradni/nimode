import { PieceType, RotationState, RotationDirection, BoardMatrix, ActivePiece, RotationResult } from '../types';

export interface IRotationSystem {
  id: string;
  name: string;
  getInitialState(type: PieceType): { x: number; y: number; rotation: RotationState };
  rotate(
    board: BoardMatrix,
    piece: ActivePiece,
    direction: RotationDirection
  ): RotationResult | null;
  getKickTable(pieceType: PieceType, fromRotation: RotationState, toRotation: RotationState): ReadonlyArray<{ x: number; y: number }>;
}