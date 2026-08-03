import { describe, it, expect } from 'vitest';
import { EngineCore } from '../EngineCore';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { PieceType } from '../types';
import { InputEvent } from '../interfaces/IEngineCore';

type Step = 'DROP' | 'UNDO' | 'REDO';

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

function run(engine: EngineCore, step: Step): void {
  const input: InputEvent =
    step === 'DROP' ? { type: 'HARD_DROP' } :
    step === 'UNDO' ? { type: 'UNDO' } :
    { type: 'REDO' };
  engine.handleInput(input);
  engine.tick(16.67);
}

function assertAligned(engine: EngineCore, stream: PieceType[], spawnIndex: number): void {
  const state = engine.getState();
  expect(state.activePiece?.type).toBe(stream[spawnIndex]);
  expect(state.queue).toEqual(stream.slice(spawnIndex + 1, spawnIndex + 7));
}

function applySteps(engine: EngineCore, stream: PieceType[], steps: readonly Step[], start: number): number {
  let spawnIndex = start;
  for (const step of steps) {
    run(engine, step);
    if (step === 'DROP') spawnIndex += 1;
    if (step === 'UNDO') spawnIndex -= 1;
    if (step === 'REDO') spawnIndex += 1;
    if (spawnIndex < 0) continue;
    assertAligned(engine, stream, spawnIndex);
  }
  return spawnIndex;
}

describe('drop -> undo -> re-drop keeps the bag stream aligned (user-reported repro)', () => {
  it('place -> undo -> place again does not vanish or misorder the next piece', () => {
    const seed = 2026;
    const stream = createOracle(seed, 200);
    const engine = createEngine(seed);

    const spawnIndex = applySteps(engine, stream, ['DROP', 'UNDO', 'DROP'], 0);

    const state = engine.getState();
    expect(state.activePiece?.type).toBe(stream[spawnIndex]);
    expect(state.queue).toEqual(stream.slice(spawnIndex + 1, spawnIndex + 7));
  });

  it('place -> place -> undo -> undo -> redo -> redo -> place keeps stream alignment', () => {
    const seed = 77;
    const stream = createOracle(seed, 200);
    const engine = createEngine(seed);

    const spawnIndex = applySteps(engine, stream, [
      'DROP', 'DROP',
      'UNDO', 'UNDO',
      'REDO', 'REDO',
      'DROP',
    ], 0);

    const state = engine.getState();
    expect(state.activePiece?.type).toBe(stream[spawnIndex]);
    expect(state.queue).toEqual(stream.slice(spawnIndex + 1, spawnIndex + 7));
  });

  it('a long random mix of drop/undo/redo stays aligned whenever it lands >= the start', () => {
    for (const seed of [1, 3, 9, 42, 2024]) {
      const stream = createOracle(seed, 500);
      const engine = createEngine(seed);

      let spawnIndex = 0;
      const steps: Step[] = [];
      for (let i = 0; i < 60; i++) {
        const r = (i * 7 + seed) % 5;
        if (r < 2) steps.push('DROP');
        else if (r < 4 && spawnIndex > 0) steps.push('UNDO');
        else steps.push('DROP');
      }

      for (const step of steps) {
        run(engine, step);
        if (engine.getState().gameOver) break;
        if (step === 'DROP') spawnIndex += 1;
        if (step === 'UNDO') spawnIndex = Math.max(0, spawnIndex - 1);
        if (step === 'REDO') spawnIndex += 1;
        assertAligned(engine, stream, spawnIndex);
      }
    }
  });

  it('place after undo produces the same next piece as the first place', () => {
    const seed = 2024;
    const engine = createEngine(seed);

    run(engine, 'DROP');
    const first = { active: engine.getState().activePiece?.type, queue: engine.getState().queue };

    run(engine, 'UNDO');

    run(engine, 'DROP');
    const second = { active: engine.getState().activePiece?.type, queue: engine.getState().queue };

    expect(second).toEqual(first);
  });
});