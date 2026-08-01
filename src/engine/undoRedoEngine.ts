import { GameState } from './types';

export interface StateSnapshot {
  board: number[][];
  activePiece: { type: number; x: number; y: number; rotation: number } | null;
  queue: number[];
  hold: number | null;
  canHold: boolean;
  annotations: number[][];
  gameOver: boolean;
  gravityTimer: number;
  lockDelay: { timer: number; resets: number };
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

export interface IUndoRedoEngine {
  saveSnapshot(state: GameState, stats: PlayerStatsSnapshot, gravityTimer: number, lock: { timer: number; resets: number }): void;
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

  saveSnapshot(state: GameState, stats: PlayerStatsSnapshot, gravityTimer: number, lock: { timer: number; resets: number }): void {
    const snapshot: FullSnapshot = {
      state: {
        board: state.board.map(row => [...row]),
        activePiece: state.activePiece ? { ...state.activePiece, type: state.activePiece.type, rotation: state.activePiece.rotation } : null,
        queue: [...state.queue.queue],
        hold: state.queue.hold,
        canHold: state.queue.canHold,
        annotations: state.annotations.map(row => [...row]),
        gameOver: state.gameOver,
        gravityTimer,
        lockDelay: { timer: lock.timer, resets: lock.resets },
      },
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
