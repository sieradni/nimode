import { describe, it, expect } from 'vitest';
import { EngineCore } from '../EngineCore';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { PieceType } from '../types';

const ALL_PIECES: PieceType[] = [1, 2, 3, 4, 5, 6, 7];

function createOracle(seed: number, count: number): PieceType[] {
  const oracle = new SevenBagRandomizer(seed);
  return Array.from({ length: count }, () => oracle.pop());
}

function createEngine(seed: number): EngineCore {
  return new EngineCore({
    bagRandomizer: new SevenBagRandomizer(seed),
    rotationSystem: new SrsPlusRotationSystem(),
  });
}

function hardDrop(engine: EngineCore): void {
  engine.handleInput({ type: 'HARD_DROP' });
  engine.tick(16.67);
}

function undoOnce(engine: EngineCore): void {
  engine.handleInput({ type: 'UNDO' });
  engine.tick(16.67);
}

describe('EngineCore bag stream integrity', () => {
  function assertAligned(engine: EngineCore, stream: PieceType[], spawnIndex: number): void {
    const state = engine.getState();
    expect(state.activePiece?.type).toBe(stream[spawnIndex]);
    expect(state.queue).toEqual(stream.slice(spawnIndex + 1, spawnIndex + 7));
  }

  it('without undo, the spawn sequence and queue window stay aligned with the bag stream', () => {
    const seed = 2024;
    const stream = createOracle(seed, 100);
    const engine = createEngine(seed);

    for (let spawnIndex = 1; spawnIndex <= 10; spawnIndex++) {
      hardDrop(engine);
      assertAligned(engine, stream, spawnIndex);
    }
  });

  it('undo then continue playing keeps the bag stream aligned (regression: queue-only snapshots)', () => {
    const seed = 2024;
    const stream = createOracle(seed, 100);
    const engine = createEngine(seed);

    for (let spawnIndex = 1; spawnIndex <= 8; spawnIndex++) {
      hardDrop(engine);
      assertAligned(engine, stream, spawnIndex);
    }

    for (let i = 0; i < 3; i++) undoOnce(engine);

    for (let spawnIndex = 6; spawnIndex <= 9; spawnIndex++) {
      hardDrop(engine);
      assertAligned(engine, stream, spawnIndex);
    }
  });

  it('undo then redo back to the same position keeps the stream aligned', () => {
    const seed = 5;
    const stream = createOracle(seed, 100);
    const engine = createEngine(seed);

    for (let spawnIndex = 1; spawnIndex <= 8; spawnIndex++) {
      hardDrop(engine);
      assertAligned(engine, stream, spawnIndex);
    }
    for (let i = 0; i < 3; i++) undoOnce(engine);
    for (let i = 0; i < 3; i++) {
      engine.handleInput({ type: 'REDO' });
      engine.tick(16.67);
    }

    for (let spawnIndex = 9; spawnIndex <= 11; spawnIndex++) {
      hardDrop(engine);
      assertAligned(engine, stream, spawnIndex);
    }
  });

  it('undoing every lock rewinds to the initial stream position and replays cleanly', () => {
    const seed = 42;
    const stream = createOracle(seed, 100);
    const engine = createEngine(seed);

    for (let i = 1; i <= 6; i++) hardDrop(engine);
    for (let i = 0; i < 6; i++) undoOnce(engine);

    assertAligned(engine, stream, 0);

    for (let spawnIndex = 1; spawnIndex <= 4; spawnIndex++) {
      hardDrop(engine);
      assertAligned(engine, stream, spawnIndex);
    }
  });

  it('active piece plus queue window forms a permutation at every bag boundary until game over', () => {
    const seed = 7;
    const stream = createOracle(seed, 100);
    const engine = createEngine(seed);

    let spawnIndex = 0;
    while (!engine.getState().gameOver) {
      spawnIndex += 1;
      hardDrop(engine);
      const state = engine.getState();
      if (state.activePiece === null) break;
      expect(state.activePiece.type).toBe(stream[spawnIndex]);
      if (spawnIndex % ALL_PIECES.length === 0) {
        const window = [state.activePiece.type, ...state.queue];
        expect([...window].sort((a, b) => a - b)).toEqual([...ALL_PIECES]);
      }
    }
    expect(spawnIndex).toBeGreaterThanOrEqual(10);
  });
});
