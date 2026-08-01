import { describe, it, expect, vi } from 'vitest';
import { GameState, GameConfig, DEFAULT_CONFIG, EMPTY_INPUT_STATE } from '../types';
import { IRotationSystem } from '../interfaces/IRotationSystem';
import { IBagRandomizer } from '../interfaces/IBagRandomizer';
import { ActivePiece } from '../types/piece';
import { applyGravityToState } from '../gravityEngine';
import { createEmptyBoard } from '../boardUtils';
import { createEmptyAnnotations } from '../annotationEngine';
import { INITIAL_STATS } from '../engineState';

function createMockState(y: number): GameState {
  return {
    board: createEmptyBoard(),
    activePiece: { type: 1, x: 3, y, rotation: 0 } as ActivePiece,
    queue: { queue: [1], hold: null, canHold: true },
    stats: { ...INITIAL_STATS },
    config: { ...DEFAULT_CONFIG },
    inputState: { ...EMPTY_INPUT_STATE },
    dasCounters: { left: 0, right: 0, down: 0 },
    arrCounters: { left: 0, right: 0 },
    gameOver: false,
    paused: false,
    annotations: createEmptyAnnotations(),
  };
}

function createMockRandomizer(): IBagRandomizer {
  return {
    id: 'mock',
    name: 'Mock',
    generateBag: () => [1, 2, 3, 4, 5, 6, 7],
    peek: () => [1, 2, 3, 4, 5, 6, 7],
    pop: () => 1,
    reset: () => {},
  };
}

function createMockRotation(): IRotationSystem {
  return {
    id: 'mock',
    name: 'Mock',
    getInitialState: () => ({ x: 3, y: 19, rotation: 0 }),
    rotate: () => null,
    getKickTable: () => [],
  };
}

describe('applyGravityToState', () => {
  it('returns unchanged timer when gravity is 0 (0G float)', () => {
    const state = createMockState(38);
    const config: GameConfig = { ...DEFAULT_CONFIG, gravity: 0 };
    const result = applyGravityToState(
      state, config, 100, 16.67, createMockRandomizer(), createMockRotation(), () => {},
    );
    expect(result).toBe(100);
    expect(state.activePiece?.y).toBe(38);
  });

  it('falls one row per tick at gravity 1', () => {
    const state = createMockState(38);
    const config: GameConfig = { ...DEFAULT_CONFIG, gravity: 1 };
    const onLock = vi.fn();
    const result = applyGravityToState(
      state, config, 0, 16.67, createMockRandomizer(), createMockRotation(), onLock,
    );
    expect(state.activePiece?.y).toBe(37);
    expect(result).toBeCloseTo(0);
    expect(onLock).not.toHaveBeenCalled();
  });

  it('instantly drops to bottom at gravity 20', () => {
    const state = createMockState(38);
    const config: GameConfig = { ...DEFAULT_CONFIG, gravity: 20 };
    const onLock = vi.fn();
    applyGravityToState(
      state, config, 0, 16.67, createMockRandomizer(), createMockRotation(), onLock,
    );
    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('does not lock when subzero is true and piece lands', () => {
    const state = createMockState(1);
    const config: GameConfig = { ...DEFAULT_CONFIG, gravity: 1, subzero: true };
    const onLock = vi.fn();
    applyGravityToState(
      state, config, 0, 1000, createMockRandomizer(), createMockRotation(), onLock,
    );
    expect(onLock).not.toHaveBeenCalled();
  });
});
