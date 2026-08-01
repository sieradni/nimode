import { GameConfig } from './types';

export interface LockDelayState {
  grounded: boolean;
  timer: number;
  resets: number;
}

export type LockActivity = 'none' | 'moved' | 'rotated';

export type LockDelayResult = 'lock' | 'waiting' | 'idle';

export function createLockDelayState(): LockDelayState {
  return { grounded: false, timer: 0, resets: 0 };
}

export function stepLockDelay(
  state: LockDelayState,
  config: Pick<GameConfig, 'lockDelay' | 'maxLockResets' | 'gravity' | 'subzero' | 'autoColor'>,
  dt: number,
  grounded: boolean,
  activity: LockActivity,
): LockDelayResult {
  state.grounded = grounded;

  if (!grounded || config.subzero) {
    state.timer = 0;
    state.resets = 0;
    return 'idle';
  }

  if (config.gravity >= 20) {
    return 'lock';
  }

  if (activity !== 'none' && state.resets < config.maxLockResets) {
    state.timer = 0;
    state.resets++;
  }

  state.timer += dt;
  return state.timer >= config.lockDelay ? 'lock' : 'waiting';
}
