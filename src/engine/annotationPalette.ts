/**
 * Shared user colour palette for drawn marks.
 *
 * Cells in the annotation and board matrices encode colour as
 * `PALETTE_CELL_OFFSET + i` where `i` indexes `userPalette`. Piece types 1..7
 * are reserved for tetromino colours (auto-colored annotations and locked
 * pieces); values at or above the offset always reference the palette, so a
 * mark keeps the colour it was drawn with even when the colour picker later
 * changes (US-8.6).
 *
 * Encoding the index in the matrix value (instead of a keyed side map) means
 * board line clears shift the colour along with the cells for free, and the
 * wire format stays `number[][]`.
 */
export const PALETTE_CELL_OFFSET = 8;

/** Cells `8..7+MAX` stay well inside a byte range on the wire. */
export const MAX_USER_PALETTE_SIZE = 56;

export const DEFAULT_ANNOTATION_COLOR = '#ffffff';

export interface PaletteRegistration {
  userPalette: string[];
  index: number;
}

/**
 * Resolves a colour to its palette index, appending it to the palette when it
 * is new. Pure: never mutates the input palette. When the palette is full and
 * the colour is unknown, it falls back to the first entry (white).
 */
export function registerPaletteColor(
  userPalette: ReadonlyArray<string>,
  color: string,
): PaletteRegistration {
  const existing = userPalette.indexOf(color);
  if (existing !== -1) return { userPalette: userPalette as string[], index: existing };
  if (userPalette.length >= MAX_USER_PALETTE_SIZE) {
    return { userPalette: userPalette as string[], index: 0 };
  }
  const next = [...userPalette, color];
  return { userPalette: next, index: next.length - 1 };
}

/** The palette colour for a cell value, or `null` when the cell is a tetromino. */
export function paletteColorFor(
  cell: number,
  userPalette: ReadonlyArray<string>,
): string | null {
  if (cell < PALETTE_CELL_OFFSET) return null;
  return userPalette[cell - PALETTE_CELL_OFFSET] ?? null;
}
