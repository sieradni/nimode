import { GameState, GameConfig } from './types';
import { movePiece } from './engineActions';
import { checkCollision } from './boardUtils';
import { stepLockDelay, LockDelayState, LockActivity } from './lockDelayEngine';

export function canFall(state: GameState): boolean {
  if (!state.activePiece) return false;
  const testPiece = {
    ...state.activePiece,
    y: state.activePiece.y + 1,
  };
  return !checkCollision(state.board, testPiece);
}

export function applyGravityToState(
  state: GameState,
  config: GameConfig,
  gravityTimer: number,
  dt: number,
): number {
  if (!state.activePiece) return gravityTimer;
  if (config.gravity === 0) return gravityTimer;

  if (config.gravity >= 20) {
    while (movePiece(state, 0, 1)) {
      // instant drop to landing position
    }
    return 0;
  }

  let timer = gravityTimer + dt;
  // Guideline G: 1G = one cell per second, and higher G falls proportionally
  // faster (e.g. 10G = ten cells per second). 20G is handled above as instant.
  const gravityRate = 1000 / config.gravity;

  while (timer >= gravityRate) {
    if (!movePiece(state, 0, 1)) {
      return 0;
    }
    timer -= gravityRate;
  }
  return timer;
}

export function stepGravityAndLockDelay(
  state: GameState,
  config: GameConfig,
  gravityTimer: number,
  lockDelayState: LockDelayState,
  dt: number,
  activity: LockActivity,
): { gravityTimer: number; shouldLock: boolean } {
  const timer = applyGravityToState(state, config, gravityTimer, dt);
  const grounded = state.activePiece !== null && !canFall(state);
  const step = stepLockDelay(lockDelayState, config, dt, grounded, activity);
  return { gravityTimer: timer, shouldLock: step === 'lock' };
}
