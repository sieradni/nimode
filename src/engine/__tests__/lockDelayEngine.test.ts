import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG } from '../types';
import { stepLockDelay, createLockDelayState, LockDelayState } from '../lockDelayEngine';

function makeConfig(overrides?: Partial<typeof DEFAULT_CONFIG>) {
  return { ...DEFAULT_CONFIG, ...overrides };
}

describe('stepLockDelay', () => {
  it('returns idle and resets timers while the piece is airborne', () => {
    const state: LockDelayState = createLockDelayState();
    const result = stepLockDelay(state, makeConfig(), 16.67, false, 'none');
    expect(result).toBe('idle');
    expect(state.timer).toBe(0);
    expect(state.resets).toBe(0);
  });

  it('returns idle and never locks when subzero is enabled', () => {
    const state: LockDelayState = createLockDelayState();
    const result = stepLockDelay(state, makeConfig({ subzero: true }), 5000, true, 'none');
    expect(result).toBe('idle');
  });

  it('locks immediately on landing at 20G', () => {
    const state: LockDelayState = createLockDelayState();
    const result = stepLockDelay(state, makeConfig({ gravity: 20, subzero: false }), 16.67, true, 'none');
    expect(result).toBe('lock');
  });

  it('locks after the lock delay expires on the ground', () => {
    const state: LockDelayState = createLockDelayState();
    const config = makeConfig({ lockDelay: 500, subzero: false });
    const first = stepLockDelay(state, config, 499, true, 'none');
    expect(first).toBe('waiting');
    const second = stepLockDelay(state, config, 1, true, 'none');
    expect(second).toBe('lock');
  });

  it('resets the timer on movement until max lock resets is exhausted', () => {
    const state: LockDelayState = createLockDelayState();
    const config = makeConfig({ lockDelay: 500, maxLockResets: 2, subzero: false });
    stepLockDelay(state, config, 400, true, 'moved');
    expect(state.timer).toBe(400);
    expect(state.resets).toBe(1);
    stepLockDelay(state, config, 400, true, 'moved');
    expect(state.resets).toBe(2);
    expect(state.timer).toBe(400);
    const result = stepLockDelay(state, config, 400, true, 'moved');
    expect(state.resets).toBe(2);
    expect(state.timer).toBe(800);
    expect(result).toBe('lock');
  });
});
