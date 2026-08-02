import { describe, it, expect, beforeEach } from 'vitest';
import { UndoRedoEngine, IUndoRedoEngine, PlayerStatsSnapshot } from '../undoRedoEngine';
import { GameState } from '../types';
import { LockDelayState, createLockDelayState } from '../lockDelayEngine';
import { BagState } from '../interfaces/IBagRandomizer';

function createBagState(): BagState {
  return { current: [1, 2, 3, 4, 5, 6, 7], next: [7, 6, 5, 4, 3, 2, 1] };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: Array.from({ length: 40 }, () => Array(10).fill(0)),
    activePiece: { type: 6, x: 3, y: 36, rotation: 0 },
    queue: { queue: [1, 2, 3], hold: 7, canHold: true },
    config: { das: 133, arr: 33, sdf: 50, sdfFactor: 20, lockDelay: 500, maxLockResets: 15, gravity: 1, subzero: false, autoColor: true, spawnOffset: 1 },
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

function createMockStatsSnapshot(overrides: Partial<PlayerStatsSnapshot> = {}): PlayerStatsSnapshot {
  return {
    pps: 1.0,
    apm: 30.0,
    kpp: 1.0,
    piecesPlaced: 5,
    linesCleared: 2,
    singles: 1,
    doubles: 1,
    triples: 0,
    quads: 0,
    tSpins: 0,
    tSpinMinis: 0,
    finesse: 0.5,
    efficiency: 0.5,
    attack: 5,
    ...overrides,
  };
}

function createMockLockDelayState(): LockDelayState {
  return createLockDelayState();
}

describe('UndoRedoEngine', () => {
  let engine: IUndoRedoEngine;

  beforeEach(() => {
    engine = new UndoRedoEngine(5);
  });

  it('should save snapshots and allow undo', () => {
    const state1 = createMockGameState({ gameOver: false });
    const state2 = createMockGameState({ gameOver: true });
    const stats = createMockStatsSnapshot();
    const lockDelay = createMockLockDelayState();

    engine.saveSnapshot(state1, stats, 0, lockDelay, createBagState());
    engine.saveSnapshot(state2, stats, 0, lockDelay, createBagState());

    expect(engine.canUndo()).toBe(true);
    expect(engine.canRedo()).toBe(false);

    const undone = engine.undo();
    expect(undone).toBeDefined();
    expect(undone?.state.gameOver).toBe(false);
    expect(engine.canUndo()).toBe(false); // Only 1 snapshot left, can't undo further
    expect(engine.canRedo()).toBe(true);
  });

  it('should allow redo after undo', () => {
    const state1 = createMockGameState({ gameOver: false });
    const state2 = createMockGameState({ gameOver: true });
    const stats = createMockStatsSnapshot();
    const lockDelay = createMockLockDelayState();

    engine.saveSnapshot(state1, stats, 0, lockDelay, createBagState());
    engine.saveSnapshot(state2, stats, 0, lockDelay, createBagState());

    engine.undo();
    const redone = engine.redo();
    expect(redone).toBeDefined();
    expect(redone?.state.gameOver).toBe(true);
    expect(engine.canUndo()).toBe(true);
    expect(engine.canRedo()).toBe(false);
  });

  it('should clear future on new snapshot after undo', () => {
    const state1 = createMockGameState({ gameOver: false });
    const state2 = createMockGameState({ gameOver: true });
    const state3 = createMockGameState({ activePiece: { type: 1, x: 0, y: 0, rotation: 0 } });
    const stats = createMockStatsSnapshot();
    const lockDelay = createMockLockDelayState();

    engine.saveSnapshot(state1, stats, 0, lockDelay, createBagState());
    engine.saveSnapshot(state2, stats, 0, lockDelay, createBagState());
    engine.undo();
    engine.saveSnapshot(state3, stats, 0, lockDelay, createBagState());

    expect(engine.canRedo()).toBe(false);
  });

  it('should respect max history size', () => {
    const engine = new UndoRedoEngine(2);
    const stats = createMockStatsSnapshot();
    const lockDelay = createMockLockDelayState();
    for (let i = 0; i < 5; i++) {
      const state = createMockGameState({ activePiece: { type: (i + 1) as import('../types').PieceType, x: i, y: i, rotation: 0 } });
      engine.saveSnapshot(state, stats, 0, lockDelay, createBagState());
    }
    expect(engine.canUndo()).toBe(true);
    engine.undo();
    engine.undo();
    expect(engine.canUndo()).toBe(false);
  });

  it('should clear history on clear()', () => {
    const state1 = createMockGameState();
    const stats = createMockStatsSnapshot();
    const lockDelay = createMockLockDelayState();
    engine.saveSnapshot(state1, stats, 0, lockDelay, createBagState());
    engine.clear();
    expect(engine.canUndo()).toBe(false);
    expect(engine.canRedo()).toBe(false);
  });

  it('returns null when undo/redo not possible', () => {
    expect(engine.undo()).toBeNull();
    expect(engine.redo()).toBeNull();
  });
});