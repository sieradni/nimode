import { describe, it, expect } from 'vitest';
import { GameState, GameConfig, DEFAULT_CONFIG, EMPTY_INPUT_STATE } from '../types';
import { ActivePiece } from '../types/piece';
import { applyGravityToState } from '../gravityEngine';
import { createEmptyBoard } from '../boardUtils';
import { createEmptyAnnotations } from '../annotationEngine';

function createMockState(y: number): GameState {
  return {
    board: createEmptyBoard(),
    activePiece: { type: 1, x: 3, y, rotation: 0 } as ActivePiece,
    queue: { queue: [1], hold: null, canHold: true },
    config: { ...DEFAULT_CONFIG },
    inputState: { ...EMPTY_INPUT_STATE },
    dasCounters: { left: 0, right: 0, down: 0 },
    arrCounters: { left: 0, right: 0 },
    gameOver: false,
    paused: false,
    annotations: createEmptyAnnotations(),
    userPalette: ['#ffffff'],
  };
}

describe('applyGravityToState', () => {
  it('returns unchanged timer when gravity is 0 (0G float)', () => {
    const state = createMockState(38);
    const config: GameConfig = { ...DEFAULT_CONFIG, gravity: 0 };
    const result = applyGravityToState(state, config, 100, 16.67);
    expect(result).toBe(100);
    expect(state.activePiece?.y).toBe(38);
  });

  it('falls one row downward per second at gravity 1', () => {
    const state = createMockState(37);
    const config: GameConfig = { ...DEFAULT_CONFIG, gravity: 1 };
    const result = applyGravityToState(state, config, 0, 1000);
    expect(state.activePiece?.y).toBe(38);
    expect(result).toBe(0);
  });

  it('instantly drops piece to the landing row at gravity 20', () => {
    const state = createMockState(1);
    const config: GameConfig = { ...DEFAULT_CONFIG, gravity: 20 };
    applyGravityToState(state, config, 0, 16.67);
    expect(state.activePiece?.y).toBe(38);
  });

  it('stops at the landing row without locking when subzero is true', () => {
    const state = createMockState(1);
    const config: GameConfig = { ...DEFAULT_CONFIG, gravity: 20, subzero: true };
    applyGravityToState(state, config, 0, 16.67);
    expect(state.activePiece?.y).toBe(38);
    expect(state.activePiece).not.toBeNull();
  });
});
