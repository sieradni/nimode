import { BoardMatrix, ActivePiece, PIECE_COLORS, BOARD_WIDTH, VISIBLE_HEIGHT, VISIBLE_Y_OFFSET, BOARD_HEIGHT, AnnotationMatrix } from '../engine/types';
import { getPieceMatrix } from '../engine/systems/SrsPlusRotationSystem';
import { checkCollision } from '../engine/boardUtils';
import {
  BOARD_BACKGROUND, GHOST_COLOR, GHOST_LINE_WIDTH, GRID_COLOR, GRID_LINE_WIDTH,
  CELL_BORDER_COLOR, CELL_BORDER_WIDTH, ANNOTATION_ALPHA, ANNOTATION_BORDER_COLOR,
  ANNOTATION_BORDER_WIDTH, crisp,
} from './renderConstants';
import { resolveAnnotationColor } from './annotationColors';

export interface RenderOptions {
  cellSize?: number;
  /** Player colour palette for drawn marks (see `annotationPalette.ts`). */
  palette?: ReadonlyArray<string>;
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  cellSize: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(sx, sy, cellSize, cellSize);
  ctx.strokeStyle = CELL_BORDER_COLOR;
  ctx.lineWidth = CELL_BORDER_WIDTH;
  ctx.strokeRect(crisp(sx), crisp(sy), cellSize - 1, cellSize - 1);
}

function drawPieceShape(
  ctx: CanvasRenderingContext2D,
  piece: ActivePiece,
  cellSize: number,
  ghost: boolean,
): void {
  const matrix = getPieceMatrix(piece.type, piece.rotation);
  const color = PIECE_COLORS[piece.type] ?? '#888';
  const size = matrix.length;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!matrix[y]?.[x]) continue;
      const sx = (piece.x + x) * cellSize;
      const sy = (piece.y + y - VISIBLE_Y_OFFSET) * cellSize;
      if (sy < -cellSize || sy >= VISIBLE_HEIGHT * cellSize) continue;

      if (ghost) {
        // A thick white outline reads as a shadow without borrowing the
        // piece's own colour.
        ctx.strokeStyle = GHOST_COLOR;
        ctx.lineWidth = GHOST_LINE_WIDTH;
        const inset = GHOST_LINE_WIDTH / 2;
        ctx.strokeRect(sx + inset, sy + inset, cellSize - GHOST_LINE_WIDTH, cellSize - GHOST_LINE_WIDTH);
      } else {
        drawCell(ctx, sx, sy, cellSize, color);
      }
    }
  }
}

function computeGhostY(board: BoardMatrix, piece: ActivePiece): number {
  let y = piece.y;
  while (y < BOARD_HEIGHT - 1 && !checkCollision(board, { ...piece, y: y + 1 })) {
    y++;
  }
  return y;
}

function drawGrid(ctx: CanvasRenderingContext2D, cellSize: number, width: number, height: number): void {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = GRID_LINE_WIDTH;
  for (let x = 0; x <= BOARD_WIDTH; x++) {
    const gx = crisp(x * cellSize);
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let y = 0; y <= VISIBLE_HEIGHT; y++) {
    const gy = crisp(y * cellSize);
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }
}

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  board: BoardMatrix,
  activePiece: ActivePiece | null,
  annotations: AnnotationMatrix,
  options: RenderOptions = {},
): void {
  const cellSize = options.cellSize ?? 30;
  const width = BOARD_WIDTH * cellSize;
  const height = VISIBLE_HEIGHT * cellSize;

  ctx.fillStyle = BOARD_BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  for (let by = VISIBLE_Y_OFFSET; by < BOARD_HEIGHT; by++) {
    const row = board[by];
    if (!row) continue;
    for (let bx = 0; bx < BOARD_WIDTH; bx++) {
      const cell = row[bx];
      if (!cell || cell === 0) continue;
      drawCell(
        ctx,
        bx * cellSize,
        (by - VISIBLE_Y_OFFSET) * cellSize,
        cellSize,
        resolveAnnotationColor(cell, options.palette),
      );
    }
  }

  for (let by = VISIBLE_Y_OFFSET; by < BOARD_HEIGHT; by++) {
    const row = annotations[by];
    if (!row) continue;
    for (let bx = 0; bx < BOARD_WIDTH; bx++) {
      const cell = row[bx];
      if (!cell || cell === 0) continue;
      const sx = bx * cellSize;
      const sy = (by - VISIBLE_Y_OFFSET) * cellSize;
      ctx.fillStyle = resolveAnnotationColor(cell, options.palette);
      ctx.globalAlpha = ANNOTATION_ALPHA;
      ctx.fillRect(sx, sy, cellSize, cellSize);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = ANNOTATION_BORDER_COLOR;
      ctx.lineWidth = ANNOTATION_BORDER_WIDTH;
      ctx.strokeRect(crisp(sx), crisp(sy), cellSize - 1, cellSize - 1);
    }
  }

  if (activePiece) {
    const ghostY = computeGhostY(board, activePiece);
    if (ghostY !== activePiece.y) {
      drawPieceShape(ctx, { ...activePiece, y: ghostY }, cellSize, true);
    }
    drawPieceShape(ctx, activePiece, cellSize, false);
  }

  drawGrid(ctx, cellSize, width, height);
}
