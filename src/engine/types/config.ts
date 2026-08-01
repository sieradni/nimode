export interface KeyBindings {
  MOVE_LEFT: string;
  MOVE_RIGHT: string;
  SOFT_DROP: string;
  HARD_DROP: string;
  ROTATE_CW: string;
  ROTATE_CCW: string;
  ROTATE_180: string;
  HOLD: string;
  RESET: string;
  UNDO: string;
  REDO: string;
}

export const DEFAULT_KEYBINDINGS: KeyBindings = {
  MOVE_LEFT: 'ArrowLeft',
  MOVE_RIGHT: 'ArrowRight',
  SOFT_DROP: 'ArrowDown',
  HARD_DROP: 'ArrowUp',
  ROTATE_CW: 'KeyC',
  ROTATE_CCW: 'KeyZ',
  ROTATE_180: 'KeyV',
  HOLD: 'KeyX',
  RESET: 'KeyR',
  UNDO: 'KeyU',
  REDO: 'KeyY',
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
}

export const DEFAULT_CONFIG: GameConfig = {
  das: 133,
  arr: 33,
  sdf: 50,
  sdfFactor: 20,
  lockDelay: 500,
  maxLockResets: 15,
  gravity: 1,
  subzero: false,
};