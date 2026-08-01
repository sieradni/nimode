import { useEffect, useRef } from 'react';
import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../../engine/types';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderBoard } from '../../render/BoardRenderer';
import { BOARD_CELL_SIZE, type AnnotationTool } from './canvasConstants';
import { useBoardInput } from './BoardInputHandler';
import { setupHiDpiCanvas } from './canvasScaling';

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
  annotationColor?: string;
  isDrawing?: boolean;
  onDrawingStart?: () => void;
  onDrawingEnd?: () => void;
  onStrokeCell?: (x: number, y: number) => void;
  cellSize?: number;
}

export function GameBoardCanvas({
  state,
  onAnnotationPen,
  onAnnotationErase,
  onAnnotationFloodErase,
  onAnnotationRectFill,
  annotationTool = 'pen',
  annotationPieceType = 1,
  annotationColor,
  isDrawing = false,
  onDrawingStart,
  onDrawingEnd,
  onStrokeCell,
  cellSize = BOARD_CELL_SIZE,
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
    onStrokeCell,
    cellSize,
  });

  const width = BOARD_WIDTH * cellSize;
  const height = VISIBLE_HEIGHT * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupHiDpiCanvas(canvas, width, height);
    if (!ctx) return;
    renderBoard(ctx, state.board, state.activePiece, state.annotations, {
      cellSize,
      annotationColor,
    });
  }, [state, cellSize, width, height, annotationColor]);

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
      width={width}
      height={height}
      className="rounded-lg border border-slate-800 touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      // The right mouse button is the eraser, so suppress the browser menu.
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
