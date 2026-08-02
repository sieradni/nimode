export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 40;
export const VISIBLE_HEIGHT = 20;
export const VISIBLE_Y_OFFSET = 20;

/**
 * Extra rows rendered above the visible playfield so that pieces spawning
 * above the visible field (row VISIBLE_Y_OFFSET and up) remain fully visible
 * (US-1.9 spawn-matching TETR.IO + US-7.7 spawn fully visible).
 *
 * With the default spawnOffset=1, the I-piece's top cell lands at row 18
 * (2 rows above VISIBLE_Y_OFFSET=20). A 4-row buffer covers spawnOffset 0–3
 * and gives comfortable headroom for the default case.
 */
export const RENDER_BUFFER_ROWS = 4;
/** Total rows the renderer draws: visible 20 + buffer 4 = 24. */
export const RENDER_HEIGHT = VISIBLE_HEIGHT + RENDER_BUFFER_ROWS;
/** Top board-row index that the renderer displays (VISIBLE_Y_OFFSET - RENDER_BUFFER_ROWS = 16). */
export const RENDER_TOP_Y = VISIBLE_Y_OFFSET - RENDER_BUFFER_ROWS;

export type BoardMatrix = number[][];
export type VisibleBoardMatrix = number[][];
