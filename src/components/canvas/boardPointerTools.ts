import { BOARD_CELL_SIZE, type AnnotationTool } from './canvasConstants';
import { VISIBLE_HEIGHT } from '../../engine/types';

export interface BoardCoord {
  x: number;
  y: number;
}

const RIGHT_BUTTON = 2;

/** The right mouse button is the eraser, whichever tool is selected. */
export function isRightButton(
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
): boolean {
  return 'button' in e && e.button === RIGHT_BUTTON;
}

/** Tools whose drag paints cells that feed stroke auto-color. */
export function isPaintingTool(tool: AnnotationTool): boolean {
  return tool === 'pen';
}

export function getCanvasCoordinates(
  canvas: HTMLCanvasElement,
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  cellSize: number = BOARD_CELL_SIZE,
): BoardCoord | null {
  const rect = canvas.getBoundingClientRect();
  let clientX: number;
  let clientY: number;

  const touches = 'touches' in e ? e.touches : undefined;
  if (touches && touches.length > 0) {
    const touch = touches[0];
    if (!touch) return null;
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else if ('clientX' in e) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else {
    return null;
  }

  const x = Math.floor((clientX - rect.left) / cellSize);
  const y = Math.floor((clientY - rect.top) / cellSize) + (40 - VISIBLE_HEIGHT);
  return { x, y };
}
