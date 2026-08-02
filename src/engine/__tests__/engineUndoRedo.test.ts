import { describe, it, expect } from 'vitest';
import { GameState } from '../types';
import { PlayerStatsSnapshot } from '../undoRedoEngine';
import { saveSnapshot, restoreSnapshot } from '../engineUndoRedo';
import { PlayerStats } from '../playerStats';
import { LockDelayState, createLockDelayState } from '../lockDelayEngine';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';

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

function createBagState(randomizer: SevenBagRandomizer) {
  return randomizer.snapshot();
}

describe('engineUndoRedo', () => {
  it('should create snapshot from game state', () => {
    const state = createMockGameState();
    const stats = createMockStatsSnapshot();
    const lockDelay = createMockLockDelayState();
    const bagState = createBagState(new SevenBagRandomizer(1));

    const snapshot = saveSnapshot(state, stats, 100, lockDelay, bagState);

    expect(snapshot.state.board.length).toBe(40);
    expect(snapshot.state.activePiece).not.toBeNull();
    expect(snapshot.state.activePiece?.type).toBe(6);
    expect(snapshot.state.queue).toEqual([1, 2, 3]);
    expect(snapshot.state.hold).toBe(7);
    expect(snapshot.state.canHold).toBe(true);
    expect(snapshot.state.gameOver).toBe(false);
    expect(snapshot.state.gravityTimer).toBe(100);
    expect(snapshot.state.lockDelay).toEqual({ timer: 0, resets: 0 });
    expect(snapshot.state.bagState).toEqual(bagState);
    expect(snapshot.stats).toEqual(stats);
  });

  it('should handle activePiece being null in snapshot', () => {
    const state = createMockGameState({ activePiece: null });
    const stats = createMockStatsSnapshot();
    const lockDelay = createMockLockDelayState();
    const bagState = createBagState(new SevenBagRandomizer(1));

    const snapshot = saveSnapshot(state, stats, 100, lockDelay, bagState);

    expect(snapshot.state.activePiece).toBeNull();
  });

  it('should restore snapshot to target state', () => {
    const originalState = createMockGameState({ gameOver: false, activePiece: { type: 6, x: 3, y: 36, rotation: 0 } });
    const targetState = createMockGameState({ gameOver: true, activePiece: null });
    const stats = createMockStatsSnapshot({ pps: 2.5, piecesPlaced: 10 });
    const lockDelay = createMockLockDelayState();
    const bagState = createBagState(new SevenBagRandomizer(1));

    const snapshot = saveSnapshot(originalState, stats, 100, lockDelay, bagState);
    const playerStats = new PlayerStats();
    const randomizer = new SevenBagRandomizer(99);
    const randomizerBefore = randomizer.snapshot();

    restoreSnapshot(targetState, snapshot, playerStats, randomizer);

    expect(targetState.gameOver).toBe(false);
    expect(targetState.activePiece).not.toBeNull();
    expect(targetState.activePiece?.type).toBe(6);
    expect(targetState.activePiece?.x).toBe(3);
    expect(targetState.activePiece?.y).toBe(36);
    expect(targetState.queue.queue).toEqual([1, 2, 3]);
    expect(targetState.queue.hold).toBe(7);
    expect(targetState.queue.canHold).toBe(true);
    expect(targetState.annotations).toEqual(originalState.annotations);
    expect(randomizer.snapshot()).toEqual(bagState);
    expect(randomizer.snapshot()).not.toEqual(randomizerBefore);
  });

  it('should handle activePiece being null in restore', () => {
    const originalState = createMockGameState({ activePiece: null, gameOver: true });
    const targetState = createMockGameState({ activePiece: { type: 6, x: 3, y: 36, rotation: 0 } });
    const stats = createMockStatsSnapshot();
    const lockDelay = createMockLockDelayState();
    const bagState = createBagState(new SevenBagRandomizer(1));

    const snapshot = saveSnapshot(originalState, stats, 100, lockDelay, bagState);
    const playerStats = new PlayerStats();

    restoreSnapshot(targetState, snapshot, playerStats, new SevenBagRandomizer(99));

    expect(targetState.activePiece).toBeNull();
    expect(targetState.gameOver).toBe(true);
  });
});
