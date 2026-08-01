import { describe, it, expect } from 'vitest';
import { EngineCore } from '../EngineCore';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { DEFAULT_CONFIG, GameConfig } from '../types';

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

describe('EngineCore subzero mode (T-10.3)', () => {
  it('subzero=true should NOT lock on contact — piece rests at bottom', () => {
    const engine = createEngine({ gravity: 1, subzero: true });

    engine.tick(2000);

    const state = engine.getState();
    expect(state.activePiece).not.toBeNull();
    const boardHasBlocks = state.board.some(row => row.some(cell => cell !== 0));
    expect(boardHasBlocks).toBe(false);
  });

  it('subzero=true should lock only on hard drop', () => {
    const engine = createEngine({ gravity: 1, subzero: true });

    engine.tick(2000);
    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(1000 / 60);

    const state = engine.getState();
    const boardHasBlocks = state.board.some(row => row.some(cell => cell !== 0));
    expect(boardHasBlocks).toBe(true);
  });

  it('subzero=false (default) should lock on contact', () => {
    const engine = createEngine({ gravity: 1, subzero: false });

    engine.tick(2000);

    const state = engine.getState();
    const boardHasBlocks = state.board.some(row => row.some(cell => cell !== 0));
    expect(boardHasBlocks).toBe(true);
  });
});
