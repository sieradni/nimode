import { GameState, GameConfig, ActivePiece } from './types';
import { IRotationSystem } from './interfaces/IRotationSystem';
import { IBagRandomizer } from './interfaces/IBagRandomizer';
import { InputHandler } from './inputHandler';
import { movePiece, holdPiece, hardDrop, lockPiece } from './engineActions';
import { stepGravityAndLockDelay } from './gravityEngine';
import { LockDelayState, createLockDelayState } from './lockDelayEngine';
import { LockResult } from './tSpinDetector';

export interface RestoredTimers {
  gravityTimer: number;
  lockDelay: LockDelayState;
}

export interface FixedTickCallbacks {
  rotate(direction: 1 | -1 | 2): boolean;
  onReset(): void;
  onLock(result: LockResult, piece: ActivePiece | null): void;
  onKeyPress(): void;
  onHold(): void;
  onClearHold(): void;
  onUndo(): RestoredTimers | null;
  onRedo(): RestoredTimers | null;
  rotationOccurred(): boolean;
}

export interface FixedTickResult {
  lockDelayState: LockDelayState;
  gravityTimer: number;
}

export function runFixedTick(
  state: GameState,
  config: GameConfig,
  inputHandler: InputHandler,
  bagRandomizer: IBagRandomizer,
  rotationSystem: IRotationSystem,
  lockDelayState: LockDelayState,
  gravityTimer: number,
  dt: number,
  callbacks: FixedTickCallbacks,
): FixedTickResult {
  let moved = false;
  let rotated = false;

  inputHandler.updateMovement(config, dt, (dx, dy) => {
    const success = movePiece(state, dx, dy);
    if (success) {
      moved = true;
    }
    return success;
  });

  const actions = inputHandler.consumeOneTimeInputs();
  const keyPresses = inputHandler.consumeKeyPressCount();
  for (let i = 0; i < keyPresses; i++) {
    callbacks.onKeyPress();
  }

  if (actions.reset) {
    callbacks.onReset();
    return { lockDelayState: createLockDelayState(), gravityTimer: 0 };
  }
  if (actions.undo) {
    const restored = callbacks.onUndo();
    if (restored) {
      gravityTimer = restored.gravityTimer;
      lockDelayState = restored.lockDelay;
    }
  }
  if (actions.redo) {
    const restored = callbacks.onRedo();
    if (restored) {
      gravityTimer = restored.gravityTimer;
      lockDelayState = restored.lockDelay;
    }
  }
  if (state.gameOver) {
    return { lockDelayState, gravityTimer };
  }
  if (actions.cw) { rotated = callbacks.rotate(1) || rotated; }
  if (actions.ccw) { rotated = callbacks.rotate(-1) || rotated; }
  if (actions.rotate180) { rotated = callbacks.rotate(2) || rotated; }
  if (actions.hold) {
    holdPiece(state, bagRandomizer, rotationSystem, config);
    callbacks.onHold();
    lockDelayState = createLockDelayState();
    gravityTimer = 0;
  }
  if (actions.clearHold) {
    if (state.queue.hold !== null) {
      state.queue.hold = null;
      callbacks.onClearHold();
    }
  }
  if (actions.hardDrop) {
    const lockedPiece = state.activePiece ? { ...state.activePiece } : null;
    callbacks.onLock(hardDrop(state, bagRandomizer, rotationSystem), lockedPiece);
    lockDelayState = createLockDelayState();
    gravityTimer = 0;
  }

  const step = stepGravityAndLockDelay(
    state,
    config,
    gravityTimer,
    lockDelayState,
    dt,
    moved || rotated ? 'moved' : 'none',
  );
  gravityTimer = step.gravityTimer;
  if (step.shouldLock) {
    const lockedPiece = state.activePiece ? { ...state.activePiece } : null;
    callbacks.onLock(lockPiece(state, bagRandomizer, rotationSystem, callbacks.rotationOccurred()), lockedPiece);
    lockDelayState = createLockDelayState();
    gravityTimer = 0;
  }
  return { lockDelayState, gravityTimer };
}
