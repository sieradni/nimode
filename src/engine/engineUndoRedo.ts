import { GameState } from './types';
import { LockDelayState } from './lockDelayEngine';
import { PlayerStats } from './playerStats';
import { FullSnapshot, IUndoRedoEngine, UndoRedoEngine } from './undoRedoEngine';
import { PieceType, RotationState } from './types';
import { IBagRandomizer } from './interfaces/IBagRandomizer';

export interface UndoRedoResult {
  gravityTimer: number;
  lockDelay: LockDelayState;
}

export function restoreSnapshot(
  targetState: GameState,
  snapshot: FullSnapshot,
  playerStats: PlayerStats,
  bagRandomizer: IBagRandomizer
): UndoRedoResult {
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
  return {
    gravityTimer: snapshot.state.gravityTimer,
    lockDelay: { ...snapshot.state.lockDelay },
  };
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
      { ...lock },
      this.bagRandomizer.snapshot(),
    );
  }

  undo(state: GameState): UndoRedoResult | null {
    const snapshot = this.engine.undo();
    if (!snapshot) return null;
    return restoreSnapshot(state, snapshot, this.playerStats, this.bagRandomizer);
  }

  redo(state: GameState): UndoRedoResult | null {
    const snapshot = this.engine.redo();
    if (!snapshot) return null;
    return restoreSnapshot(state, snapshot, this.playerStats, this.bagRandomizer);
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
