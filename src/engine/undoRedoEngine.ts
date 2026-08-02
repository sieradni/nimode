import { GameState } from './types';
import { BagState } from './interfaces/IBagRandomizer';
import { LockDelayState } from './lockDelayEngine';

export interface StateSnapshot {
  board: number[][];
  activePiece: { type: number; x: number; y: number; rotation: number } | null;
  queue: number[];
  hold: number | null;
  canHold: boolean;
  annotations: number[][];
  userPalette: string[];
  gameOver: boolean;
  gravityTimer: number;
  lockDelay: LockDelayState;
  bagState: BagState;
}

export interface PlayerStatsSnapshot {
  pps: number;
  apm: number;
  kpp: number;
  piecesPlaced: number;
  linesCleared: number;
  singles: number;
  doubles: number;
  triples: number;
  quads: number;
  tSpins: number;
  tSpinMinis: number;
  finesse: number;
  efficiency: number;
  attack: number;
}

export interface FullSnapshot {
  state: StateSnapshot;
  stats: PlayerStatsSnapshot;
}

export function createStateSnapshot(
  state: GameState,
  gravityTimer: number,
  lockDelay: LockDelayState,
  bagState: BagState,
): StateSnapshot {
  return {
    board: state.board.map(row => [...row]),
    activePiece: state.activePiece ? { ...state.activePiece, type: state.activePiece.type, rotation: state.activePiece.rotation } : null,
    queue: [...state.queue.queue],
    hold: state.queue.hold,
    canHold: state.queue.canHold,
    annotations: state.annotations.map(row => [...row]),
    userPalette: [...state.userPalette],
    gameOver: state.gameOver,
    gravityTimer,
    lockDelay: { ...lockDelay },
    bagState: { ...bagState },
  };
}

export interface IUndoRedoEngine {
  saveSnapshot(state: GameState, stats: PlayerStatsSnapshot, gravityTimer: number, lock: LockDelayState, bagState: BagState): void;
  undo(): FullSnapshot | null;
  redo(): FullSnapshot | null;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
}

export class UndoRedoEngine implements IUndoRedoEngine {
  private history: FullSnapshot[] = [];
  private future: FullSnapshot[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  saveSnapshot(state: GameState, stats: PlayerStatsSnapshot, gravityTimer: number, lock: LockDelayState, bagState: BagState): void {
    const snapshot: FullSnapshot = {
      state: createStateSnapshot(state, gravityTimer, lock, bagState),
      stats: { ...stats },
    };

    this.history.push(snapshot);
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
    this.future = [];
  }

  undo(): FullSnapshot | null {
    if (this.history.length <= 1) return null;
    const current = this.history.pop();
    if (!current) return null;
    this.future.push(current);
    return this.history[this.history.length - 1] ?? null;
  }

  redo(): FullSnapshot | null {
    const next = this.future.pop();
    if (!next) return null;
    this.history.push(next);
    return next;
  }

  canUndo(): boolean {
    return this.history.length > 1;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.history = [];
    this.future = [];
  }
}
