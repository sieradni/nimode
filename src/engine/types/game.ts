import { BoardMatrix } from './board';
import { PieceType, ActivePiece } from './piece';

export interface QueueState {
  queue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
}

export interface GameStats {
  piecesPlaced: number;
  linesCleared: number;
  singles: number;
  doubles: number;
  triples: number;
  quads: number;
  tSpins: number;
  tSpinMinis: number;
  pps: number;
  apm: number;
  kpp: number;
  finesse: number;
  efficiency: number;
  attack: number;
}

export type InputAction =
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'SOFT_DROP'
  | 'HARD_DROP'
  | 'ROTATE_CW'
  | 'ROTATE_CCW'
  | 'ROTATE_180'
  | 'HOLD'
  | 'RESET';

export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  hardDrop: boolean;
  cw: boolean;
  ccw: boolean;
  rotate180: boolean;
  hold: boolean;
  reset: boolean;
}

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
}

export interface GameConfig {
  das: number;
  arr: number;
  sdf: number;
  sdfFactor: number;
  lockDelay: number;
  maxLockResets: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  das: 133,
  arr: 33,
  sdf: 50,
  sdfFactor: 20,
  lockDelay: 500,
  maxLockResets: 15,
};

export const DEFAULT_KEYBINDINGS: KeyBindings = {
  MOVE_LEFT: 'ArrowLeft',
  MOVE_RIGHT: 'ArrowRight',
  SOFT_DROP: 'ArrowDown',
  HARD_DROP: 'ArrowUp',
  ROTATE_CW: 'KeyX',
  ROTATE_CCW: 'KeyZ',
  ROTATE_180: 'KeyC',
  HOLD: 'KeyH',
  RESET: 'KeyR',
};

export const EMPTY_INPUT_STATE: InputState = {
  left: false,
  right: false,
  down: false,
  hardDrop: false,
  cw: false,
  ccw: false,
  rotate180: false,
  hold: false,
  reset: false,
};

export interface GameState {
  board: BoardMatrix;
  activePiece: ActivePiece | null;
  queue: QueueState;
  stats: GameStats;
  config: GameConfig;
  inputState: InputState;
  dasCounters: { left: number; right: number; down: number };
  arrCounters: { left: number; right: number };
  gameOver: boolean;
  paused: boolean;
}

export interface InstanceConfig {
  isPrivate: boolean;
}

export const DEFAULT_INSTANCE_CONFIG: InstanceConfig = {
  isPrivate: false,
};

export interface SpectatorPayload {
  userId: string;
  matrix: number[][];
  activePiece: { type: number; x: number; y: number; r: number } | null;
  queue: number[];
  hold: number | null;
  annotations: number[][];
  stats: {
    pps: number;
    apm: number;
    kpp: number;
    piecesPlaced: number;
    linesCleared: number;
  };
}
