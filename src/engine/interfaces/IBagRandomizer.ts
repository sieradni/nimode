import { PieceType } from '../types';

export interface BagState {
  current: PieceType[];
  next: PieceType[];
}

export interface IBagRandomizer {
  id: string;
  name: string;
  pop(): PieceType;
  peek(count: number): PieceType[];
  reset(): void;
  snapshot(): BagState;
  restore(state: BagState): void;
}
