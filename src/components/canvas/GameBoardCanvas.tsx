import { useEffect, useRef, useState } from 'react';
import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../../engine/types';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderBoard } from '../../render/BoardRenderer';
import { renderStatsOverlay } from '../../render/StatsOverlayRenderer';

export const BOARD_CELL_SIZE = 30;

type AnnotationTool = 'pen' | 'erase' | 'rect';

interface GameBoardCanvasProps {
  state: EngineState;
  onAnnotationPen?: (x: number, y: number, pieceType: number) => void;
  onAnnotationErase?: (x: number, y: number) => void;
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
  onAnnotationRectFill,
  annotationTool = 'pen',
  annotationPieceType = 1,
  isDrawing = false,
  onDrawingStart,
  onDrawingEnd,
}: GameBoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderBoard(ctx, state.board, state.activePiece, state.annotations, { cellSize: BOARD_CELL_SIZE });
    renderStatsOverlay(ctx, state.stats, canvas.width, canvas.height);
  }, [state]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;
    const touches = 'touches' in e ? e.touches : undefined;
    if (touches && touches.length > 0) {
      const touch = touches[0];
      if (touch) {
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        return null;
      }
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return null;
    }
    const x = Math.floor((clientX - rect.left) / BOARD_CELL_SIZE);
    const y = Math.floor((clientY - rect.top) / BOARD_CELL_SIZE) + (40 - VISIBLE_HEIGHT);
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!onAnnotationPen && !onAnnotationErase && !onAnnotationRectFill) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    const { x, y } = coords;

    if (annotationTool === 'pen' && onAnnotationPen) {
      onAnnotationPen(x, y, annotationPieceType);
      onDrawingStart?.();
    } else if (annotationTool === 'erase' && onAnnotationErase) {
      onAnnotationErase(x, y);
      onDrawingStart?.();
    } else if (annotationTool === 'rect' && onAnnotationRectFill) {
      setRectStart({ x, y });
      onDrawingStart?.();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || annotationTool !== 'rect' || !rectStart || !onAnnotationRectFill) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    const { x, y } = coords;
    onAnnotationRectFill(rectStart.x, rectStart.y, x, y, annotationPieceType);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (annotationTool === 'rect' && rectStart && onAnnotationRectFill) {
      const coords = getCanvasCoordinates(e);
      if (coords) {
        onAnnotationRectFill(rectStart.x, rectStart.y, coords.x, coords.y, annotationPieceType);
      }
      setRectStart(null);
    }
    onDrawingEnd?.();
  };

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
