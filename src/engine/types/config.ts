import { PieceType } from './piece';

export interface KeyBindings {
  MOVE_LEFT: string;
  MOVE_RIGHT: string;
  SOFT_DROP: string;
  HARD_DROP: string;
  ROTATE_CW: string;
  ROTATE_CCW: string;
  ROTATE_180: string;
  HOLD: string;
  CLEAR_HOLD: string;
  RESET: string;
  UNDO: string;
  REDO: string;
}

/**
 * Standard Tetris layout: Z rotates counter-clockwise, X rotates clockwise and
 * C holds. Undo/redo use the conventional Ctrl+Z / Ctrl+Y combinations.
 * Binding values are canonical binding codes (see `keybindingCodes.ts`).
 */
export const DEFAULT_KEYBINDINGS: KeyBindings = {
  MOVE_LEFT: 'ArrowLeft',
  MOVE_RIGHT: 'ArrowRight',
  SOFT_DROP: 'ArrowDown',
  HARD_DROP: 'Space',
  ROTATE_CW: 'KeyX',
  ROTATE_CCW: 'KeyZ',
  ROTATE_180: 'KeyV',
  HOLD: 'KeyC',
  CLEAR_HOLD: 'Shift+KeyC',
  RESET: 'KeyR',
  UNDO: 'Ctrl+KeyZ',
  REDO: 'Ctrl+KeyY',
};

export interface GameConfig {
  das: number;
  arr: number;
  /**
   * Base soft drop delay in milliseconds per cell (the "1x" soft drop speed).
   */
  sdf: number;
  /**
   * Soft drop factor: a multiplier on the base soft drop speed. Soft drop runs
   * at a consistent speed (delay = sdf / max(sdfFactor, 1)) for the whole hold,
   * and at the max factor the piece drops instantly to its landing position.
   */
  sdfFactor: number;
  lockDelay: number;
  maxLockResets: number;
  gravity: number;
  subzero: boolean;
  autoColor: boolean;
  spawnOffset: number;
  /**
   * Preset upcoming queue. When non-empty, new games start with this queue
   * instead of random pieces. An empty array means the randomizer fills the
   * queue as usual.
   */
  queue: PieceType[];
}

/**
 * The maximum soft drop factor. At this value soft drop becomes infinite:
 * the piece drops instantly to its landing position, matching TETR.IO's ∞ SDF
 * ("sonic drop"). The settings slider shares this bound so the max = infinite.
 */
export const MAX_SOFT_DROP_FACTOR = 100;

export const DEFAULT_CONFIG: GameConfig = {
  das: 133,
  arr: 33,
  sdf: 50,
  sdfFactor: 0,
  lockDelay: 500,
  maxLockResets: 15,
  gravity: 0,
  subzero: false,
  autoColor: true,
  spawnOffset: 1,
  queue: [],
};