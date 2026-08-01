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
  sdf: number;
  sdfFactor: number;
  lockDelay: number;
  maxLockResets: number;
  gravity: number;
  subzero: boolean;
  autoColor: boolean;
}

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
};