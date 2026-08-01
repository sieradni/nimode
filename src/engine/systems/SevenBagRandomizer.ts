import { PieceType } from '../types';
import { IBagRandomizer } from '../interfaces/IBagRandomizer';

const BAG_PIECES: readonly PieceType[] = [1, 2, 3, 4, 5, 6, 7];

function shufflePieces(array: readonly PieceType[], seed?: number): PieceType[] {
  const result = [...array];
  let s = seed;

  const random = (): number => {
    if (s !== undefined) {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    }
    return Math.random();
  };

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const itemI = result[i];
    const itemJ = result[j];
    if (itemI !== undefined && itemJ !== undefined) {
      result[i] = itemJ;
      result[j] = itemI;
    }
  }
  return result;
}

export class SevenBagRandomizer implements IBagRandomizer {
  id = '7bag';
  name = '7-Bag Randomizer';
  private bag: PieceType[] = [];
  private nextBag: PieceType[] = [];
  private seed?: number;

  constructor(seed?: number) {
    this.seed = seed;
    this.refillBag();
  }

  private nextSeed(): number | undefined {
    if (this.seed === undefined) return undefined;
    const current = this.seed;
    this.seed++;
    return current;
  }

  private refillBag(): void {
    if (this.nextBag.length > 0) {
      this.bag = [...this.nextBag];
    } else {
      this.bag = shufflePieces(BAG_PIECES, this.nextSeed());
    }
    this.refillNextBag();
  }

  private refillNextBag(): void {
    this.nextBag = shufflePieces(BAG_PIECES, this.nextSeed());
  }

  generateBag(): PieceType[] {
    return shufflePieces(BAG_PIECES, this.nextSeed());
  }

  peek(count: number): PieceType[] {
    const result: PieceType[] = [];
    let bagIndex = 0;
    let currentBag = [...this.bag];
    let nextBag = [...this.nextBag];
    let tempSeed = this.seed;

    while (result.length < count) {
      if (bagIndex >= currentBag.length) {
        currentBag = nextBag;
        const seedVal = tempSeed !== undefined ? tempSeed++ : undefined;
        nextBag = shufflePieces(BAG_PIECES, seedVal);
        bagIndex = 0;
      }
      const item = currentBag[bagIndex];
      if (item !== undefined) {
        result.push(item);
      }
      bagIndex++;
    }

    return result;
  }

  pop(): PieceType {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    const piece = this.bag.shift();
    if (piece === undefined) {
      this.refillBag();
      const retry = this.bag.shift();
      return retry ?? 1;
    }
    return piece;
  }

  reset(): void {
    this.bag = [];
    this.nextBag = [];
    this.refillBag();
  }

  getBagState(): { current: PieceType[]; next: PieceType[] } {
    return { current: [...this.bag], next: [...this.nextBag] };
  }

  setBagState(state: { current: PieceType[]; next: PieceType[] }): void {
    this.bag = [...state.current];
    this.nextBag = [...state.next];
  }
}

export const sevenBagRandomizer = new SevenBagRandomizer();
