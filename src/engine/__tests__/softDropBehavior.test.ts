import { describe, it, expect } from 'vitest';
import { EngineCore } from '../EngineCore';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { DEFAULT_CONFIG, GameConfig, MAX_SOFT_DROP_FACTOR } from '../types';

function createEngine(configOverrides?: Partial<GameConfig>) {
  const randomizer = new SevenBagRandomizer(42);
  const rotation = new SrsPlusRotationSystem();
  const engine = new EngineCore({
    bagRandomizer: randomizer,
    rotationSystem: rotation,
  });
  engine.initialize({ ...DEFAULT_CONFIG, ...configOverrides });
  return engine;
}

describe('EngineCore soft drop (US-8.8 / US-8.9)', () => {
  it('max SDF factor drops the piece to the bottom in one tick without locking', () => {
    const engine = createEngine({ sdfFactor: MAX_SOFT_DROP_FACTOR });
    engine.handleInput({ type: 'SOFT_DROP', pressed: true });
    engine.tick(1000 / 60);

    const state = engine.getState();
    expect(state.activePiece).not.toBeNull();
    expect(state.board.some((row) => row.some((cell) => cell !== 0))).toBe(false);

    const landedY = state.activePiece?.y;
    engine.tick(1000 / 60);
    expect(engine.getState().activePiece?.y).toBe(landedY);
  });

  it('a soft-dropped piece locks via the normal lock delay, not instantly', () => {
    const engine = createEngine({ sdfFactor: MAX_SOFT_DROP_FACTOR });
    engine.handleInput({ type: 'SOFT_DROP', pressed: true });
    engine.tick(1000 / 60);
    engine.handleInput({ type: 'SOFT_DROP', pressed: false });
    engine.tick(600); // lock delay (500ms) elapses

    const state = engine.getState();
    expect(state.board.some((row) => row.some((cell) => cell !== 0))).toBe(true);
  });

  it('KPP counts one soft drop press, not one per dropped cell', () => {
    const engine = createEngine({ sdfFactor: MAX_SOFT_DROP_FACTOR });
    engine.handleInput({ type: 'SOFT_DROP', pressed: true });
    engine.tick(1000 / 60);
    engine.handleInput({ type: 'SOFT_DROP', pressed: false });
    engine.tick(600);

    const stats = engine.getState().stats;
    expect(stats.piecesPlaced).toBe(1);
    expect(stats.kpp).toBe(1);
  });

  it('KPP counts a held DAS key as one input, not one per repeated cell', () => {
    const engine = createEngine({ das: 50, arr: 16 });
    engine.handleInput({ type: 'MOVE_LEFT', pressed: true });
    engine.tick(300); // DAS + ARR moves the piece several cells
    engine.handleInput({ type: 'MOVE_LEFT', pressed: false });
    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(1000 / 60);

    const stats = engine.getState().stats;
    expect(stats.piecesPlaced).toBe(1);
    expect(stats.kpp).toBe(2); // one move press + one hard drop
  });
});
