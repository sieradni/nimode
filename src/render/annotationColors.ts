import { PIECE_COLORS } from '../engine/types';

/**
 * Annotations default to white. A drawn cell only takes a tetromino colour once
 * auto-color recognises it as a real piece shape; otherwise it uses whatever
 * colour the player picked in the toolbar.
 */
export const DEFAULT_ANNOTATION_COLOR = '#ffffff';

/**
 * Marker value stored in the annotation matrix for a cell that has been drawn
 * but not identified as a tetromino. It sits outside the 1..7 piece range so it
 * can never be mistaken for a piece type.
 */
export const ANNOTATION_PLAIN = 8;

/**
 * Resolves the fill colour for an annotation cell.
 *
 * Cells holding a real piece type (1..7) keep that tetromino's colour so
 * auto-colored shapes stay recognisable; everything else uses the player's
 * chosen colour, defaulting to white.
 */
export function resolveAnnotationColor(cell: number, pickedColor?: string): string {
  if (cell >= 1 && cell <= 7) {
    return PIECE_COLORS[cell as keyof typeof PIECE_COLORS] ?? DEFAULT_ANNOTATION_COLOR;
  }
  return pickedColor ?? DEFAULT_ANNOTATION_COLOR;
}
