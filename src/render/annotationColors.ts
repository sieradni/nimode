import { PIECE_COLORS } from '../engine/types';
import { DEFAULT_ANNOTATION_COLOR, paletteColorFor } from '../engine/annotationPalette';

export { DEFAULT_ANNOTATION_COLOR, PALETTE_CELL_OFFSET } from '../engine/annotationPalette';

/**
 * Resolves the fill colour of a cell in either the annotation or the board
 * layer.
 *
 * Piece-typed cells (1..7) keep their tetromino colour so auto-colored
 * shapes and locked pieces stay recognisable. Palette cells
 * (`PALETTE_CELL_OFFSET + i`) return the colour the mark was drawn with, so a
 * change to the colour picker never recolours existing marks (US-8.6).
 */
export function resolveAnnotationColor(
  cell: number,
  palette: ReadonlyArray<string> = [],
): string {
  if (cell >= 1 && cell <= 7) {
    return PIECE_COLORS[cell as keyof typeof PIECE_COLORS] ?? DEFAULT_ANNOTATION_COLOR;
  }
  return paletteColorFor(cell, palette) ?? DEFAULT_ANNOTATION_COLOR;
}
