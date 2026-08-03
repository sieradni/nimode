import { PieceType, PIECE_COLORS } from '../engine/types';
import { getPieceMatrix } from '../engine/systems/SrsPlusRotationSystem';
import { getBagBoundaryPositions } from './bagBoundaries';

export const QUEUE_PREVIEW_SIZE = 4;
export const QUEUE_GAP = 4;

export interface QueueHoldOptions {
  cellSize?: number;
  startX?: number;
  startY?: number;
  /**
   * Number of pieces remaining in the current 7-bag. When provided, a subtle
   * separator line is drawn after the last piece of each bag to mark the
   * boundary where the next bag begins.
   */
  bagRemaining?: number;
}

export function renderQueue(
  ctx: CanvasRenderingContext2D,
  queue: PieceType[],
  options?: QueueHoldOptions
): void {
  const cellSize = options?.cellSize ?? 20;
  const startX = options?.startX ?? 0;
  const startY = options?.startY ?? 0;
  const slotHeight = QUEUE_PREVIEW_SIZE * cellSize;
  const totalHeight =
    queue.length > 0
      ? queue.length * slotHeight + (queue.length - 1) * QUEUE_GAP
      : slotHeight;
  const width = QUEUE_PREVIEW_SIZE * cellSize;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(startX, startY, width, totalHeight);

  for (let i = 0; i < queue.length; i++) {
    const pieceType = queue[i]!;
    if (pieceType === 0) continue;
    const matrix = getPieceMatrix(pieceType, 0);
    const size = matrix.length;
    const offsetX = Math.floor((QUEUE_PREVIEW_SIZE - size) / 2) * cellSize;
    const offsetY = Math.floor((QUEUE_PREVIEW_SIZE - size) / 2) * cellSize;
    const pieceY = startY + i * (slotHeight + QUEUE_GAP);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!matrix[y]?.[x]) continue;
        ctx.fillStyle = PIECE_COLORS[pieceType];
        ctx.fillRect(
          startX + offsetX + x * cellSize,
          pieceY + offsetY + y * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  drawBagBoundaries(ctx, queue.length, slotHeight, width, {
    startX,
    startY,
    bagRemaining: options?.bagRemaining,
  });
}

/**
 * Draws subtle horizontal separators between queue slots where one 7-bag ends
 * and the next begins, using the shared boundary-offset math.
 */
function drawBagBoundaries(
  ctx: CanvasRenderingContext2D,
  queueLength: number,
  slotHeight: number,
  width: number,
  options: { startX: number; startY: number; bagRemaining?: number }
): void {
  const bagRemaining = options.bagRemaining;
  if (bagRemaining === undefined) return;

  const positions = getBagBoundaryPositions(queueLength, bagRemaining);
  if (positions.length === 0) return;

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const boundary of positions) {
    const y = options.startY + boundary * (slotHeight + QUEUE_GAP) - QUEUE_GAP / 2;
    ctx.moveTo(options.startX + 2, y + 0.5);
    ctx.lineTo(options.startX + width - 2, y + 0.5);
  }
  ctx.stroke();
}

export function renderHold(
  ctx: CanvasRenderingContext2D,
  hold: PieceType | null,
  options?: QueueHoldOptions
): void {
  const cellSize = options?.cellSize ?? 20;
  const startX = options?.startX ?? 0;
  const startY = options?.startY ?? 0;
  const size = QUEUE_PREVIEW_SIZE * cellSize;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(startX, startY, size, size);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(startX, startY, size, size);

  if (hold === null || hold === 0) return;

  const matrix = getPieceMatrix(hold, 0);
  const mSize = matrix.length;
  const offsetX = Math.floor((QUEUE_PREVIEW_SIZE - mSize) / 2) * cellSize;
  const offsetY = Math.floor((QUEUE_PREVIEW_SIZE - mSize) / 2) * cellSize;

  for (let y = 0; y < mSize; y++) {
    for (let x = 0; x < mSize; x++) {
      if (!matrix[y]?.[x]) continue;
      ctx.fillStyle = PIECE_COLORS[hold];
      ctx.fillRect(
        startX + offsetX + x * cellSize,
        startY + offsetY + y * cellSize,
        cellSize,
        cellSize
      );
    }
  }
}
