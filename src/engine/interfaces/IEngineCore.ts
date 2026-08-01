import { IRotationSystem } from './IRotationSystem';
import { IBagRandomizer } from './IBagRandomizer';
import { PieceType, BoardMatrix, ActivePiece, GameConfig, GameStats, AnnotationMatrix } from '../types';

export interface EngineState {
  board: BoardMatrix;
  activePiece: ActivePiece | null;
  queue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  stats: GameStats;
  gameOver: boolean;
  paused: boolean;
  annotations: AnnotationMatrix;
}

export type InputEvent =
  | { type: 'MOVE_LEFT'; pressed: boolean }
  | { type: 'MOVE_RIGHT'; pressed: boolean }
  | { type: 'SOFT_DROP'; pressed: boolean }
  | { type: 'HARD_DROP' }
  | { type: 'ROTATE_CW' }
  | { type: 'ROTATE_CCW' }
  | { type: 'ROTATE_180' }
  | { type: 'HOLD' }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'ANNOTATE_PEN'; x: number; y: number; pieceType: number }
  | { type: 'ANNOTATE_ERASE'; x: number; y: number }
  | { type: 'ANNOTATE_FLOOD_ERASE'; x: number; y: number }
  | { type: 'ANNOTATE_RECT_FILL'; x1: number; y1: number; x2: number; y2: number; pieceType: number }
  | { type: 'ANNOTATE_CLEAR_ALL' }
  | { type: 'ANNOTATE_AUTO_COLOR' };

export interface EngineDependencies {
  rotationSystem: IRotationSystem;
  bagRandomizer: IBagRandomizer;
}

export interface IEngineCore {
  initialize(config: GameConfig): void;
  updateConfig(config: GameConfig): void;
  tick(deltaTime: number): void;
  handleInput(input: InputEvent): void;
  getState(): EngineState;
  reset(): void;
  setQueue(pieces: PieceType[]): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
}
