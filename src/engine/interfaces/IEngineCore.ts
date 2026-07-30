import { IRotationSystem } from './IRotationSystem';
import { IBagRandomizer } from './IBagRandomizer';
import { PieceType, BoardMatrix, ActivePiece, GameConfig, GameStats } from '../types';

export interface EngineState {
  board: BoardMatrix;
  activePiece: ActivePiece | null;
  queue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  stats: GameStats;
  gameOver: boolean;
  paused: boolean;
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
  | { type: 'RESET' };

export interface EngineDependencies {
  rotationSystem: IRotationSystem;
  bagRandomizer: IBagRandomizer;
}

export interface IEngineCore {
  initialize(config: GameConfig): void;
  tick(deltaTime: number): void;
  handleInput(input: InputEvent): void;
  getState(): EngineState;
  reset(): void;
  setQueue(pieces: PieceType[]): void;
}
