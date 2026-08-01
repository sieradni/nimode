import { useEffect, useRef } from 'react';
import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../../engine/types';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderBoard } from '../../render/BoardRenderer';
import { renderStatsOverlay } from '../../render/StatsOverlayRenderer';
import { BOARD_CELL_SIZE, type AnnotationTool } from './canvasConstants';
import { useBoardInput } from './BoardInputHandler';

export { BOARD_CELL_SIZE };
export type { AnnotationTool };

interface GameBoardCanvasProps {
  state: EngineState;
  onAnnotationPen?: (x: number, y: number, pieceType: number) => void;
  onAnnotationErase?: (x: number, y: number) => void;
  onAnnotationFloodErase?: (x: number, y: number) => void;
  onAnnotationRectFill?: (x1: number, y1: number, x2: number, y2: number, pieceType: number) => void;
  annotationTool?: AnnotationTool;
  annotationPieceType?: number;
  isDrawing?: boolean;
  onDrawingStart?: () => void;
  onDrawingEnd?: () => void;
}

export function GameBoardCanvas({
  state,
  onAnnotationPen,
  onAnnotationErase,
  onAnnotationFloodErase,
  onAnnotationRectFill,
  annotationTool = 'pen',
  annotationPieceType = 1,
  isDrawing = false,
  onDrawingStart,
  onDrawingEnd,
}: GameBoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useBoardInput(canvasRef, {
    onAnnotationPen,
    onAnnotationErase,
    onAnnotationFloodErase,
    onAnnotationRectFill,
    annotationTool,
    annotationPieceType,
    isDrawing,
    onDrawingStart,
    onDrawingEnd,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderBoard(ctx, state.board, state.activePiece, state.annotations, { cellSize: BOARD_CELL_SIZE });
    renderStatsOverlay(ctx, state.stats, canvas.width, canvas.height);
  }, [state]);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseDown(e);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseMove(e);
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseUp(e);
  };

  return (
    <canvas
      ref={canvasRef}
      data-testid="board-canvas"
      width={BOARD_WIDTH * BOARD_CELL_SIZE}
      height={VISIBLE_HEIGHT * BOARD_CELL_SIZE}
      className="rounded-lg border border-slate-800 touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
