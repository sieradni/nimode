import { describe, it, expect } from 'vitest';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { createInitialGameState } from '../engineState';
import { spawnNextPiece } from '../engineActions';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { PieceType, DEFAULT_CONFIG } from '../types';

const ALL_PIECES: PieceType[] = [1, 2, 3, 4, 5, 6, 7];
const BAG_SIZE = ALL_PIECES.length;

function isPermutation(bag: PieceType[]): boolean {
  if (bag.length !== BAG_SIZE) return false;
  return [...bag].sort((a, b) => a - b).every((piece, i) => piece === ALL_PIECES[i]);
}

function groupIntoBags(pieces: PieceType[]): PieceType[][] {
  const bags: PieceType[][] = [];
  for (let i = 0; i < pieces.length; i += BAG_SIZE) {
    bags.push(pieces.slice(i, i + BAG_SIZE));
  }
  return bags;
}

function countsByPiece(pieces: PieceType[]): Record<number, number> {
  return ALL_PIECES.reduce<Record<number, number>>((counts, piece) => {
    counts[piece] = pieces.filter((p) => p === piece).length;
    return counts;
  }, {});
}

describe('SevenBagRandomizer', () => {
  it('should preview a bag containing all 7 unique pieces (1 through 7)', () => {
    const randomizer = new SevenBagRandomizer(12345);
    const bag = randomizer.peek(7);
    expect(bag).toHaveLength(7);
    expect([...bag].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should generate deterministic bags when given the same seed', () => {
    const r1 = new SevenBagRandomizer(999);
    const r2 = new SevenBagRandomizer(999);

    const bag1 = r1.peek(14);
    const bag2 = r2.peek(14);

    expect(bag1).toEqual(bag2);
  });

  it('should pop pieces sequentially from the bag', () => {
    const randomizer = new SevenBagRandomizer(42);
    const peeked = randomizer.peek(7);

    const popped = Array.from({ length: 7 }, () => randomizer.pop());
    expect(popped).toEqual(peeked);
  });

  it('reset() consumes exactly the two seeds a fresh instance uses', () => {
    const seed = 4242;
    const resetRandomizer = new SevenBagRandomizer(seed);
    resetRandomizer.reset();

    const advanced = new SevenBagRandomizer(seed + 2);

    expect(resetRandomizer.snapshot()).toEqual(advanced.snapshot());
  });
});

describe('SevenBagRandomizer distribution', () => {
  it('every complete bag is a permutation of all 7 pieces', () => {
    const randomizer = new SevenBagRandomizer(7);
    const bags = groupIntoBags(randomizer.peek(35));
    expect(bags).toHaveLength(5);
    for (const bag of bags) {
      expect(isPermutation(bag)).toBe(true);
    }
  });

  it('yields a uniform piece distribution over complete bags (peek path)', () => {
    const randomizer = new SevenBagRandomizer(2024);
    const counts = countsByPiece(randomizer.peek(7000));
    for (const piece of ALL_PIECES) {
      expect(counts[piece]).toBe(1000);
    }
  });

  it('yields a uniform piece distribution over complete bags (pop path)', () => {
    const randomizer = new SevenBagRandomizer(2024);
    const drawn: PieceType[] = Array.from({ length: 7000 }, () => randomizer.pop());
    const counts = countsByPiece(drawn);
    for (const piece of ALL_PIECES) {
      expect(counts[piece]).toBe(1000);
    }
  });

  it('pop() preserves bag boundaries across refills', () => {
    const randomizer = new SevenBagRandomizer(77);
    const drawn: PieceType[] = Array.from({ length: 7000 }, () => randomizer.pop());
    for (const bag of groupIntoBags(drawn)) {
      expect(isPermutation(bag)).toBe(true);
    }
  });

  it('different seeds produce varied bag orderings', () => {
    const orderings = new Set<string>();
    for (let seed = 0; seed < 16; seed++) {
      orderings.add(new SevenBagRandomizer(seed).peek(7).join(','));
    }
    expect(orderings.size).toBeGreaterThan(1);
  });
});

describe('SevenBagRandomizer engine integration', () => {
  it('spawnNextPiece produces valid 7-bag sequences (regression test for double-consumption bug)', () => {
    const randomizer = new SevenBagRandomizer(12345);
    const rotationSystem = new SrsPlusRotationSystem();
    const config = { ...DEFAULT_CONFIG };
    const state = createInitialGameState(randomizer, config);

    const spawned: PieceType[] = [];
    for (let i = 0; i < 28; i++) {
      spawnNextPiece(state, randomizer, rotationSystem, config);
      if (state.activePiece) {
        spawned.push(state.activePiece.type);
      }
    }

    const bags = groupIntoBags(spawned);
    for (const bag of bags) {
      expect(isPermutation(bag)).toBe(true);
    }
  });

  it('initial queue consumes pieces from randomizer (not peek)', () => {
    const randomizer = new SevenBagRandomizer(42);
    const config = { ...DEFAULT_CONFIG };
    const state = createInitialGameState(randomizer, config);

    // Initial queue should have 6 pieces (INITIAL_QUEUE_SIZE)
    expect(state.queue.queue).toHaveLength(6);

    // First spawn should consume the 7th piece of first bag
    spawnNextPiece(state, randomizer, new SrsPlusRotationSystem(), config);
    expect(state.activePiece).not.toBeNull();
    
    // Total consumed: 6 (initial) + 1 (first spawn) = 7 = one complete bag
    const firstBag = [...state.queue.queue, state.activePiece!.type];
    expect(isPermutation(firstBag)).toBe(true);
  });
});

describe('SevenBagRandomizer bag-state round trip', () => {
  it('restore(snapshot) resumes the exact bag stream (undo/redo continuity)', () => {
    const seed = 1234;
    const producer = new SevenBagRandomizer(seed);
    for (let i = 0; i < 13; i++) producer.pop();
    const bagState = producer.snapshot();
    const expectedContinuation = producer.peek(21);

    const replay = new SevenBagRandomizer(seed);
    for (let i = 0; i < 13; i++) replay.pop();
    replay.restore(bagState);

    const resumed = Array.from({ length: 21 }, () => replay.pop());
    expect(resumed).toEqual(expectedContinuation);
  });

  it('peek() matches pop() at every partial-consumption point', () => {
    for (let consumed = 0; consumed <= 30; consumed++) {
      const randomizer = new SevenBagRandomizer(77);
      for (let i = 0; i < consumed; i++) randomizer.pop();
      const peeked = randomizer.peek(21);
      const popped = Array.from({ length: 21 }, () => randomizer.pop());
      expect(peeked).toEqual(popped);
    }
  });

  it('the pop stream never repeats a piece within one 7-piece window', () => {
    const randomizer = new SevenBagRandomizer(2024);
    const drawn = Array.from({ length: 7000 }, () => randomizer.pop());
    for (const bag of groupIntoBags(drawn)) {
      expect(isPermutation(bag)).toBe(true);
    }
  });
});
