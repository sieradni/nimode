import { PieceType } from '../types';

export interface IBagRandomizer {
  id: string;
  name: string;
  generateBag(): PieceType[];
  peek(count: number): PieceType[];
  pop(): PieceType;
  reset(): void;
}