import { BoardMatrix } from './board';
import { PieceType, ActivePiece } from './piece';
import { AnnotationMatrix } from './annotations';
import { GameConfig } from './config';
import { InputState } from './input';

export interface QueueState {
  queue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
}

export interface GameState {
  board: BoardMatrix;
  activePiece: ActivePiece | null;
  queue: QueueState;
  config: GameConfig;
  inputState: InputState;
  dasCounters: { left: number; right: number; down: number };
  arrCounters: { left: number; right: number };
  gameOver: boolean;
  paused: boolean;
  annotations: AnnotationMatrix;
}