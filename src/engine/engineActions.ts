import { GameState, ActivePiece } from './types';
import { IBagRandomizer } from './interfaces/IBagRandomizer';
import { IRotationSystem } from './interfaces/IRotationSystem';
import { checkCollision, lockPieceToBoard, clearBoardLines } from './boardUtils';
import { detectTSpin, detectTSpinMini, LockResult } from './tSpinDetector';

export function movePiece(state: GameState, dx: number, dy: number): boolean {
  if (!state.activePiece) return false;

  const testPiece: ActivePiece = {
    ...state.activePiece,
    x: state.activePiece.x + dx,
    y: state.activePiece.y + dy,
  };

  if (!checkCollision(state.board, testPiece)) {
    state.activePiece = testPiece;
    return true;
  }
  return false;
}

export function spawnNextPiece(
  state: GameState,
  randomizer: IBagRandomizer,
  rotationSystem: IRotationSystem
): void {
  if (state.queue.queue.length === 0) {
    state.queue.queue.push(randomizer.pop());
  }
  const nextType = state.queue.queue.shift();
  if (nextType === undefined) return;

  state.queue.queue.push(randomizer.pop());

  const spawn = rotationSystem.getInitialState(nextType);
  const piece: ActivePiece = {
    type: nextType,
    x: spawn.x,
    y: spawn.y,
    rotation: spawn.rotation,
  };

  if (checkCollision(state.board, piece)) {
    state.gameOver = true;
    state.activePiece = null;
  } else {
    state.activePiece = piece;
  }
}

export function lockPiece(
  state: GameState,
  randomizer: IBagRandomizer,
  rotationSystem: IRotationSystem,
  rotationOccurred: boolean,
): LockResult {
  if (!state.activePiece) return { linesCleared: 0, tSpin: false, tSpinMini: false };

  const tSpin = rotationOccurred ? detectTSpin(state.board, state.activePiece) : false;
  const tSpinMini = rotationOccurred ? detectTSpinMini(state.board, state.activePiece) : false;

  state.board = lockPieceToBoard(state.board, state.activePiece);
  const { newBoard, linesCleared } = clearBoardLines(state.board);
  state.board = newBoard;

  spawnNextPiece(state, randomizer, rotationSystem);
  state.queue.canHold = true;
  return { linesCleared, tSpin, tSpinMini };
}

export function holdPiece(
  state: GameState,
  randomizer: IBagRandomizer,
  rotationSystem: IRotationSystem
): void {
  if (!state.queue.canHold || !state.activePiece) return;

  const heldType = state.queue.hold;
  const activeType = state.activePiece.type;

  if (heldType === null) {
    state.queue.hold = activeType;
    spawnNextPiece(state, randomizer, rotationSystem);
  } else {
    state.queue.hold = activeType;
    const spawn = rotationSystem.getInitialState(heldType);
    state.activePiece = {
      type: heldType,
      x: spawn.x,
      y: spawn.y,
      rotation: spawn.rotation,
    };
  }
  state.queue.canHold = false;
}

export function hardDrop(
  state: GameState,
  randomizer: IBagRandomizer,
  rotationSystem: IRotationSystem
): LockResult {
  if (!state.activePiece) return { linesCleared: 0, tSpin: false, tSpinMini: false };

  while (movePiece(state, 0, 1)) {
    // falling until the piece lands
  }
  return lockPiece(state, randomizer, rotationSystem, false);
}
