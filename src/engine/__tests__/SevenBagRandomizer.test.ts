import { describe, it, expect } from 'vitest';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { PieceType } from '../types';

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
  it('should generate a bag containing all 7 unique pieces (1 through 7)', () => {
    const randomizer = new SevenBagRandomizer(12345);
    const bag = randomizer.generateBag();
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
      orderings.add(new SevenBagRandomizer(seed).generateBag().join(','));
    }
    expect(orderings.size).toBeGreaterThan(1);
  });

  it('generateBag() always returns a fresh valid permutation', () => {
    const randomizer = new SevenBagRandomizer(1);
    for (let i = 0; i < 20; i++) {
      expect(isPermutation(randomizer.generateBag())).toBe(true);
    }
  });
});
