import { PieceType } from '../engine/types';

const LETTER_TO_PIECE: Record<string, PieceType> = {
  I: 1,
  J: 2,
  L: 3,
  O: 4,
  S: 5,
  T: 6,
  Z: 7,
};

const PIECE_TO_LETTER: Record<PieceType, string> = {
  0: '',
  1: 'I',
  2: 'J',
  3: 'L',
  4: 'O',
  5: 'S',
  6: 'T',
  7: 'Z',
};

/**
 * Parses an input string of tetromino letters (case-insensitive) into the
 * corresponding piece types. Non-tetromino characters are skipped.
 */
export function parsePieceInput(input: string): PieceType[] {
  const result: PieceType[] = [];
  for (const char of input) {
    const letter = char.toUpperCase();
    const piece = LETTER_TO_PIECE[letter];
    if (piece !== undefined) {
      result.push(piece);
    }
  }
  return result;
}

export function pieceToLetter(piece: PieceType): string {
  return PIECE_TO_LETTER[piece];
}