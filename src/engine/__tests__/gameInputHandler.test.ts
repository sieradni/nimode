import { describe, it, expect, vi } from 'vitest';
import { GameState } from '../types';
import { InputHandler } from '../inputHandler';
import { PlayerStats } from '../playerStats';
import { handleGameInput } from '../gameInputHandler';

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: Array.from({ length: 40 }, () => Array(10).fill(0)),
    activePiece: { type: 6, x: 3, y: 36, rotation: 0 },
    queue: { queue: [1, 2, 3], hold: null, canHold: true },
    config: { das: 133, arr: 33, sdf: 50, sdfFactor: 20, lockDelay: 500, maxLockResets: 15, gravity: 1, subzero: false, autoColor: true, spawnOffset: 1, queue: [] },
    inputState: { left: false, right: false, down: false, hardDrop: false, cw: false, ccw: false, rotate180: false, hold: false, clearHold: false, reset: false, undo: false, redo: false },
    dasCounters: { left: 0, right: 0, down: 0 },
    arrCounters: { left: 0, right: 0 },
    gameOver: false,
    paused: false,
    annotations: Array.from({ length: 40 }, () => Array(10).fill(0)),
    userPalette: ['#ffffff'],
    ...overrides,
  };
}

describe('handleGameInput', () => {
  it('records a move input on a movement press', () => {
    const state = createMockGameState();
    const playerStats = new PlayerStats();
    const recordInput = vi.spyOn(playerStats, 'recordInput');

    handleGameInput(state, { type: 'MOVE_LEFT', pressed: true }, new InputHandler(), playerStats);

    expect(recordInput).toHaveBeenCalledWith('move');
  });

  it('does not record movement on key release', () => {
    const state = createMockGameState();
    const playerStats = new PlayerStats();
    const recordInput = vi.spyOn(playerStats, 'recordInput');

    handleGameInput(state, { type: 'MOVE_RIGHT', pressed: false }, new InputHandler(), playerStats);

    expect(recordInput).not.toHaveBeenCalled();
  });

  it('records a rotation input for each rotation action', () => {
    const state = createMockGameState();
    const playerStats = new PlayerStats();
    const recordInput = vi.spyOn(playerStats, 'recordInput');

    handleGameInput(state, { type: 'ROTATE_CW' }, new InputHandler(), playerStats);
    handleGameInput(state, { type: 'ROTATE_CCW' }, new InputHandler(), playerStats);
    handleGameInput(state, { type: 'ROTATE_180' }, new InputHandler(), playerStats);

    expect(recordInput).toHaveBeenCalledTimes(3);
    expect(recordInput).toHaveBeenCalledWith('rotate');
  });

  it('records nothing when there is no active piece', () => {
    const state = createMockGameState({ activePiece: null });
    const playerStats = new PlayerStats();
    const recordInput = vi.spyOn(playerStats, 'recordInput');

    handleGameInput(state, { type: 'ROTATE_CW' }, new InputHandler(), playerStats);

    expect(recordInput).not.toHaveBeenCalled();
  });

  it('forwards one-time inputs to the InputHandler', () => {
    const state = createMockGameState();
    const inputHandler = new InputHandler();

    handleGameInput(state, { type: 'HOLD' }, inputHandler, new PlayerStats());

    expect(inputHandler.consumeOneTimeInputs().hold).toBe(true);
  });
});
