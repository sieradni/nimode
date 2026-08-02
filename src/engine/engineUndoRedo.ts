import { GameState } from './types';
import { LockDelayState } from './lockDelayEngine';
import { PlayerStats } from './playerStats';
import { FullSnapshot, PlayerStatsSnapshot, IUndoRedoEngine, UndoRedoEngine } from './undoRedoEngine';
import { PieceType, RotationState } from './types';
import { IBagRandomizer, BagState } from './interfaces/IBagRandomizer';

export function saveSnapshot(
  state: GameState,
  stats: PlayerStatsSnapshot,
  gravityTimer: number,
  lockDelayState: LockDelayState,
  bagState: BagState
): FullSnapshot {
  return {
    state: {
      board: state.board.map(row => [...row]),
      activePiece: state.activePiece ? { ...state.activePiece, type: state.activePiece.type, rotation: state.activePiece.rotation } : null,
      queue: [...state.queue.queue],
      hold: state.queue.hold,
      canHold: state.queue.canHold,
      annotations: state.annotations.map(row => [...row]),
      userPalette: [...state.userPalette],
      gameOver: state.gameOver,
      gravityTimer,
      lockDelay: { timer: lockDelayState.timer, resets: lockDelayState.resets },
      bagState,
    },
    stats: { ...stats },
  };
}

export function restoreSnapshot(
  targetState: GameState,
  snapshot: FullSnapshot,
  playerStats: PlayerStats,
  bagRandomizer: IBagRandomizer
): void {
  targetState.board = snapshot.state.board.map(row => [...row]);
  targetState.activePiece = snapshot.state.activePiece ? { ...snapshot.state.activePiece, type: snapshot.state.activePiece.type as PieceType, rotation: snapshot.state.activePiece.rotation as RotationState } : null;
  targetState.queue.queue = snapshot.state.queue as PieceType[];
  targetState.queue.hold = snapshot.state.hold as PieceType | null;
  targetState.queue.canHold = snapshot.state.canHold;
  targetState.annotations = snapshot.state.annotations.map(row => [...row]);
  targetState.userPalette = [...snapshot.state.userPalette];
  targetState.gameOver = snapshot.state.gameOver;
  bagRandomizer.restore(snapshot.state.bagState);
  playerStats.undoRestore(snapshot.stats);
}

export class UndoRedoController {
  private readonly engine: IUndoRedoEngine;

  constructor(private readonly playerStats: PlayerStats, private readonly bagRandomizer: IBagRandomizer) {
    this.engine = new UndoRedoEngine();
  }

  save(state: GameState, gravityTimer: number, lock: LockDelayState): void {
    this.engine.saveSnapshot(
      state,
      this.playerStats.getStatsSnapshot(),
      gravityTimer,
      { timer: lock.timer, resets: lock.resets },
      this.bagRandomizer.snapshot(),
    );
  }

  undo(state: GameState): boolean {
    const snapshot = this.engine.undo();
    if (!snapshot) return false;
    restoreSnapshot(state, snapshot, this.playerStats, this.bagRandomizer);
    return true;
  }

  redo(state: GameState): boolean {
    const snapshot = this.engine.redo();
    if (!snapshot) return false;
    restoreSnapshot(state, snapshot, this.playerStats, this.bagRandomizer);
    return true;
  }

  canUndo(): boolean {
    return this.engine.canUndo();
  }

  canRedo(): boolean {
    return this.engine.canRedo();
  }

  clear(): void {
    this.engine.clear();
  }
}
