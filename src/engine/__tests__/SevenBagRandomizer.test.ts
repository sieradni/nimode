import { describe, it, expect } from 'vitest';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';

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
