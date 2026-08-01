import { describe, it, expect } from 'vitest';
import { EngineCore } from '../EngineCore';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import type { PieceType } from '../types';

describe('EngineCore', () => {
  function createEngine() {
    const randomizer = new SevenBagRandomizer(100);
    const rotation = new SrsPlusRotationSystem();
    return new EngineCore({
      bagRandomizer: randomizer,
      rotationSystem: rotation,
    });
  }

  it('should initialize with active piece and queue', () => {
    const engine = createEngine();
    const state = engine.getState();

    expect(state.activePiece).not.toBeNull();
    expect(state.queue.length).toBeGreaterThan(0);
    expect(state.gameOver).toBe(false);
  });

  it('should process move left and right inputs', () => {
    const engine = createEngine();
    const initialX = engine.getState().activePiece?.x ?? 0;

    engine.handleInput({ type: 'MOVE_LEFT', pressed: true });
    engine.tick(200); // Trigger DAS
    const movedX = engine.getState().activePiece?.x ?? 0;

    expect(movedX).toBeLessThan(initialX);
  });

  it('should perform hold piece action', () => {
    const engine = createEngine();
    const initialPieceType = engine.getState().activePiece?.type;

    engine.handleInput({ type: 'HOLD' });
    engine.tick(16.67);

    const state = engine.getState();
    expect(state.hold).toBe(initialPieceType);
    expect(state.canHold).toBe(true);
  });

  it('setQueue should replace the upcoming queue', () => {
    const engine = createEngine();
    const customQueue: PieceType[] = [1, 2, 3, 4, 5];

    engine.setQueue(customQueue);
    const state = engine.getState();

    expect(state.queue).toEqual([1, 2, 3, 4, 5]);
  });

  it('should use custom queue for spawning after hard drop', () => {
    const engine = createEngine();
    const customQueue: PieceType[] = [1, 2, 3];

    engine.setQueue(customQueue);

    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(16.67);

    const state = engine.getState();
    expect(state.activePiece?.type).toBe(1);
  });

  it('setQueue([]) refills from the randomizer so the game does not hang', () => {
    const engine = createEngine();
    engine.setQueue([]);

    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(16.67);

    const state = engine.getState();
    expect(state.activePiece).not.toBeNull();
    expect(state.gameOver).toBe(false);
  });
});
