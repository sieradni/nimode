import { describe, it, expect } from 'vitest';
import { EngineCore } from '../EngineCore';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';

function createEngine(): EngineCore {
  return new EngineCore({
    rotationSystem: new SrsPlusRotationSystem(),
    bagRandomizer: new SevenBagRandomizer(42),
  });
}

describe('EngineCore finesse', () => {
  it('reports zero finesse for a clean hard drop from spawn', () => {
    const engine = createEngine();
    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(100);
    expect(engine.getState().stats.finesse).toBe(0);
  });

  it('reports zero finesse for a single press that moves the piece one cell', () => {
    const engine = createEngine();
    engine.handleInput({ type: 'MOVE_LEFT', pressed: true });
    engine.tick(16.67);
    engine.handleInput({ type: 'MOVE_LEFT', pressed: false });
    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(16.67);
    expect(engine.getState().stats.finesse).toBe(0);
  });

  it('counts a pressed direction that never moves the piece as an error', () => {
    const engine = createEngine();
    for (let i = 0; i < 10; i++) {
      engine.handleInput({ type: 'MOVE_LEFT', pressed: true });
      engine.handleInput({ type: 'MOVE_LEFT', pressed: false });
      engine.tick(16.67);
    }
    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(16.67);
    const stats = engine.getState().stats;
    expect(stats.piecesPlaced).toBe(1);
    expect(stats.finesse).toBeGreaterThan(0);
  });

  it('accumulates finesse errors across pieces', () => {
    const engine = createEngine();
    engine.handleInput({ type: 'ROTATE_CW' });
    engine.handleInput({ type: 'ROTATE_CCW' });
    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(100);
    expect(engine.getState().stats.finesse).toBe(2);
  });

  it('resets finesse on reset', () => {
    const engine = createEngine();
    engine.handleInput({ type: 'ROTATE_CW' });
    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(100);
    engine.reset();
    expect(engine.getState().stats.finesse).toBe(0);
  });
});
