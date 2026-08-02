import {
  ActivePiece,
  PieceType,
  RotationState,
  BOARD_WIDTH,
} from '../engine/types';
import { renderBoard } from './BoardRenderer';
import { renderQueue, renderHold } from './QueueHoldRenderer';
import type { InterpolatedState } from '../p2p/SpectatorBuffer';

export interface SpectatorRenderOptions {
  boardCellSize?: number;
  previewCellSize?: number;
  palette?: ReadonlyArray<string>;
}

const DEFAULT_BOARD_CELL_SIZE = 30;
const DEFAULT_PREVIEW_CELL_SIZE = 20;
export const PREVIEW_SLOT = 4;
const PREVIEW_GAP = 4;

export function renderSpectatorState(
  ctx: CanvasRenderingContext2D,
  state: InterpolatedState,
  options?: SpectatorRenderOptions,
): void {
  if (!state.hasData) return;

  const boardCellSize = options?.boardCellSize ?? DEFAULT_BOARD_CELL_SIZE;
  const previewCellSize = options?.previewCellSize ?? DEFAULT_PREVIEW_CELL_SIZE;

  const activePiece: ActivePiece | null = state.activePiece
    ? {
        type: state.activePiece.type as PieceType,
        x: state.activePiece.x,
        y: state.activePiece.y,
        rotation: state.activePiece.r as RotationState,
      }
    : null;

  renderBoard(ctx, state.matrix, activePiece, state.annotations, {
    cellSize: boardCellSize,
    palette: options?.palette ?? state.userPalette,
  });

  const boardWidth = BOARD_WIDTH * boardCellSize;

  if (state.queue.length > 0) {
    renderQueue(ctx, state.queue as PieceType[], {
      cellSize: previewCellSize,
      startX: boardWidth,
      startY: 0,
    });
  }

  if (state.hold !== null) {
    const queueHeight = state.queue.length * (PREVIEW_SLOT * previewCellSize + PREVIEW_GAP);
    renderHold(ctx, state.hold as PieceType, {
      cellSize: previewCellSize,
      startX: boardWidth,
      startY: queueHeight,
    });
  }
}
