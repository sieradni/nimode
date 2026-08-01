/** Shared drawing constants for the Canvas 2D renderers. */

/** Board backdrop. */
export const BOARD_BACKGROUND = '#1a1a2e';

/**
 * The ghost/landing indicator is drawn as a thick white outline rather than a
 * tinted copy of the piece colour, so it reads as a shadow and never competes
 * with the tetromino it belongs to.
 */
export const GHOST_COLOR = '#ffffff';
export const GHOST_LINE_WIDTH = 3;

/** Grid lines: faint, exactly one device pixel wide. */
export const GRID_COLOR = 'rgba(255,255,255,0.08)';
export const GRID_LINE_WIDTH = 1;

/** Separator drawn between adjacent locked cells. */
export const CELL_BORDER_COLOR = 'rgba(0,0,0,0.35)';
export const CELL_BORDER_WIDTH = 1;

/** Annotation cells are translucent with a light outline. */
export const ANNOTATION_ALPHA = 0.5;
export const ANNOTATION_BORDER_COLOR = 'rgba(255,255,255,0.5)';
export const ANNOTATION_BORDER_WIDTH = 2;

/**
 * Snaps a coordinate to a half-pixel centre. A 1px stroke centred on an integer
 * coordinate spans two device pixels and renders blurry; offsetting by half a
 * pixel maps it onto exactly one.
 */
export function crisp(coordinate: number): number {
  return Math.round(coordinate) + 0.5;
}
