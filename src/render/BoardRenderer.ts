import { BoardMatrix, ActivePiece, PIECE_COLORS, BOARD_WIDTH, VISIBLE_HEIGHT, VISIBLE_Y_OFFSET, BOARD_HEIGHT } from '../engine/types';
import { getPieceMatrix } from '../engine/systems/SrsPlusRotationSystem';
import { checkCollision } from '../engine/boardUtils';

export interface RenderOptions {
  cellSize?: number;
}

function drawPieceShape(
  ctx: CanvasRenderingContext2D,
  piece: ActivePiece,
  cellSize: number,
  ghost: boolean
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
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, cellSize, cellSize);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(sx, sy, cellSize, cellSize);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(sx, sy, cellSize, cellSize);
      }
    }
  }
}

function computeGhostY(board: BoardMatrix, piece: ActivePiece): number {
  let y = piece.y;
  while (y > 0 && !checkCollision(board, { ...piece, y: y - 1 })) {
    y--;
  }
  return y;
}

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  board: BoardMatrix,
  activePiece: ActivePiece | null,
  options: RenderOptions = {}
): void {
  const cellSize = options.cellSize ?? 30;
  const width = BOARD_WIDTH * cellSize;
  const height = VISIBLE_HEIGHT * cellSize;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  for (let by = VISIBLE_Y_OFFSET; by < BOARD_HEIGHT; by++) {
    const row = board[by];
    if (!row) continue;
    for (let bx = 0; bx < BOARD_WIDTH; bx++) {
      const cell = row[bx];
      if (!cell || cell === 0) continue;
      const sx = bx * cellSize;
      const sy = (by - VISIBLE_Y_OFFSET) * cellSize;
      ctx.fillStyle = PIECE_COLORS[cell as keyof typeof PIECE_COLORS] ?? '#888';
      ctx.fillRect(sx, sy, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeRect(sx, sy, cellSize, cellSize);
    }
  }

  if (activePiece) {
    const ghostY = computeGhostY(board, activePiece);
    if (ghostY !== activePiece.y) {
      drawPieceShape(ctx, { ...activePiece, y: ghostY }, cellSize, true);
    }
    drawPieceShape(ctx, activePiece, cellSize, false);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= BOARD_WIDTH; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, height);
    ctx.stroke();
  }
  for (let y = 0; y <= VISIBLE_HEIGHT; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(width, y * cellSize);
    ctx.stroke();
  }
}
