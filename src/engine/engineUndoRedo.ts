import { GameState } from './types';
import { LockDelayState } from './lockDelayEngine';
import { PlayerStats } from './playerStats';
import { FullSnapshot, PlayerStatsSnapshot } from './undoRedoEngine';
import { PieceType, RotationState } from './types';

export interface EngineCoreState {
  board: number[][];
  activePiece: { type: number; x: number; y: number; rotation: number } | null;
  queue: { queue: number[]; hold: number | null; canHold: boolean };
  annotations: number[][];
  gameOver: boolean;
  gravityTimer: number;
  lockDelayState: LockDelayState;
}

export function saveSnapshot(
  state: GameState,
  stats: PlayerStatsSnapshot,
  gravityTimer: number,
  lockDelayState: LockDelayState
): FullSnapshot {
  return {
    state: {
      board: state.board.map(row => [...row]),
      activePiece: state.activePiece ? { ...state.activePiece, type: state.activePiece.type, rotation: state.activePiece.rotation } : null,
      queue: [...state.queue.queue],
      hold: state.queue.hold,
      canHold: state.queue.canHold,
      annotations: state.annotations.map(row => [...row]),
      gameOver: state.gameOver,
      gravityTimer,
      lockDelay: { timer: lockDelayState.timer, resets: lockDelayState.resets },
    },
    stats: { ...stats },
  };
}

export function restoreSnapshot(
  targetState: GameState,
  snapshot: FullSnapshot,
  playerStats: PlayerStats
): void {
  targetState.board = snapshot.state.board.map(row => [...row]);
  targetState.activePiece = snapshot.state.activePiece ? { ...snapshot.state.activePiece, type: snapshot.state.activePiece.type as PieceType, rotation: snapshot.state.activePiece.rotation as RotationState } : null;
  targetState.queue.queue = snapshot.state.queue as PieceType[];
  targetState.queue.hold = snapshot.state.hold as PieceType | null;
  targetState.queue.canHold = snapshot.state.canHold;
  targetState.annotations = snapshot.state.annotations.map(row => [...row]);
  targetState.gameOver = snapshot.state.gameOver;
  playerStats.undoRestore(snapshot.stats);
}