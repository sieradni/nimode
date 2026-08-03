import { describe, it, expect, vi } from 'vitest';
import { GameState, GameConfig, DEFAULT_CONFIG, EMPTY_INPUT_STATE } from '../types';
import { InputHandler } from '../inputHandler';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { createLockDelayState } from '../lockDelayEngine';
import { runFixedTick, FixedTickCallbacks } from '../stepEngine';

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: Array.from({ length: 40 }, () => Array(10).fill(0)),
    activePiece: { type: 6, x: 3, y: 36, rotation: 0 },
    queue: { queue: [1, 2, 3], hold: null, canHold: true },
    config: DEFAULT_CONFIG as GameConfig,
    inputState: { ...EMPTY_INPUT_STATE },
    dasCounters: { left: 0, right: 0, down: 0 },
    arrCounters: { left: 0, right: 0 },
    gameOver: false,
    paused: false,
    annotations: Array.from({ length: 40 }, () => Array(10).fill(0)),
    userPalette: ['#ffffff'],
    ...overrides,
  };
}

function createCallbacks(overrides: Partial<FixedTickCallbacks> = {}): FixedTickCallbacks {
  return {
    rotate: () => false,
    onReset: () => {},
    onLock: () => {},
    onKeyPress: () => {},
    onHold: () => {},
    onClearHold: () => {},
    onUndo: () => null,
    onRedo: () => null,
    rotationOccurred: () => false,
    ...overrides,
  };
}

describe('runFixedTick hold edge cases (no-op hold)', () => {
  const bagRandomizer = new SevenBagRandomizer(42);
  const rotationSystem = new SrsPlusRotationSystem();

  it('does not fire onHold when a hold is not allowed (canHold=false)', () => {
    const state = createGameState({
      queue: { queue: [1, 2, 3], hold: null, canHold: false },
    });
    const inputHandler = new InputHandler();
    inputHandler.handleInput({ type: 'HOLD' });
    const onHold = vi.fn();
    const callbacks = createCallbacks({ onHold });

    runFixedTick(
      state,
      state.config,
      inputHandler,
      bagRandomizer,
      rotationSystem,
      createLockDelayState(),
      0,
      16.67,
      callbacks,
    );

    expect(onHold).not.toHaveBeenCalled();
    // State unchanged by the failed hold.
    expect(state.queue.canHold).toBe(false);
    expect(state.queue.hold).toBeNull();
  });

  it('does not fire onHold when there is no active piece', () => {
    const state = createGameState({ activePiece: null });
    const inputHandler = new InputHandler();
    inputHandler.handleInput({ type: 'HOLD' });
    const onHold = vi.fn();
    const callbacks = createCallbacks({ onHold });

    runFixedTick(
      state,
      state.config,
      inputHandler,
      bagRandomizer,
      rotationSystem,
      createLockDelayState(),
      0,
      16.67,
      callbacks,
    );

    expect(onHold).not.toHaveBeenCalled();
  });

  it('fires onHold exactly once when a hold succeeds', () => {
    const state = createGameState();
    const inputHandler = new InputHandler();
    inputHandler.handleInput({ type: 'HOLD' });
    const onHold = vi.fn();
    const callbacks = createCallbacks({ onHold });

    runFixedTick(
      state,
      state.config,
      inputHandler,
      bagRandomizer,
      rotationSystem,
      createLockDelayState(),
      0,
      16.67,
      callbacks,
    );

    expect(onHold).toHaveBeenCalledTimes(1);
    expect(state.queue.hold).toBe(6);
  });
});