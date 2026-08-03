import { IRotationSystem } from './IRotationSystem';
import { IBagRandomizer } from './IBagRandomizer';
import { PieceType, BoardMatrix, ActivePiece, GameConfig, GameStats, AnnotationMatrix, AnnotationEvent, BoardEditEvent, EditMode } from '../types';

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
  userPalette: string[];
  /**
   * The number of pieces remaining in the current 7-bag, used to render bag
   * boundary separators in the queue.
   */
  bagRemaining: number;
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
  | { type: 'CLEAR_HOLD' }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'EDIT_BEGIN'; mode: EditMode }
  | { type: 'EDIT_COMMIT'; cells: ReadonlyArray<{ x: number; y: number }> }
  | AnnotationEvent
  | BoardEditEvent;

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
  clearBoard(): void;
  setQueue(pieces: PieceType[]): void;
  setPaused(paused: boolean): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
}
