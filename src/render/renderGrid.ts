import { BOARD_WIDTH, RENDER_HEIGHT, RENDER_BUFFER_ROWS } from '../engine/types';
import { GRID_COLOR, GRID_LINE_WIDTH, FIELD_DIVIDER_COLOR, FIELD_DIVIDER_WIDTH, crisp } from './renderConstants';

/**
 * Draws the playfield grid. The buffer area (above the visible field) gets
 * fainter horizontal grid lines, and a brighter divider line separates it from
 * the visible playfield so players can distinguish spawn zone from field.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  width: number,
  height: number,
): void {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = GRID_LINE_WIDTH;

  for (let x = 0; x <= BOARD_WIDTH; x++) {
    const gx = crisp(x * cellSize);
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }

  for (let y = 0; y <= RENDER_HEIGHT; y++) {
    const gy = crisp(y * cellSize);
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  // Brighter divider between buffer area and visible field.
  const dividerY = crisp(RENDER_BUFFER_ROWS * cellSize);
  ctx.strokeStyle = FIELD_DIVIDER_COLOR;
  ctx.lineWidth = FIELD_DIVIDER_WIDTH;
  ctx.beginPath();
  ctx.moveTo(0, dividerY);
  ctx.lineTo(width, dividerY);
  ctx.stroke();
}
