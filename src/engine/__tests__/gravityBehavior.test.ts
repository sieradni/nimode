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

describe('EngineCore gravity (T-10.2)', () => {
  it('gravity=0 (0G) should not auto-fall the piece', () => {
    const engine = createEngine({ gravity: 0 });
    const initialState = engine.getState();
    const startY = initialState.activePiece?.y ?? 0;

    for (let i = 0; i < 10; i++) {
      engine.tick(1000 / 60);
    }

    const finalState = engine.getState();
    expect(finalState.activePiece?.y).toBe(startY);
  });

  it('gravity=1 (1G) should fall one row per tick', () => {
    const engine = createEngine({ gravity: 1 });
    const startY = engine.getState().activePiece?.y ?? 0;

    engine.tick(1000 / 60);

    const newY = engine.getState().activePiece?.y ?? 0;
    expect(newY).toBe(startY + 1);
  });

  it('gravity=20 (20G) should instantly drop piece to landing position', () => {
    const engine = createEngine({ gravity: 20 });

    engine.tick(1000 / 60);

    const board = engine.getState().board;
    const hasPlacedBlocks = board.some(row => row.some(cell => cell !== 0));
    expect(hasPlacedBlocks).toBe(true);
  });

  it('locked pieces land inside the visible field (rows 20-39)', () => {
    const engine = createEngine({ gravity: 20 });

    for (let i = 0; i < 20; i++) {
      engine.tick(1000 / 60);
    }

    const board = engine.getState().board;
    for (let y = 0; y < 20; y++) {
      expect(board[y]!.every(cell => cell === 0)).toBe(true);
    }
    const visibleHasBlocks = board.slice(20).some(row => row.some(cell => cell !== 0));
    expect(visibleHasBlocks).toBe(true);
  });
});
