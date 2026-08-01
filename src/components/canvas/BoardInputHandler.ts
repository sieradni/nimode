import { RefObject, useState, useRef } from 'react';
import { BOARD_CELL_SIZE, type AnnotationTool } from './canvasConstants';
import { VISIBLE_HEIGHT } from '../../engine/types';
import { walkLineCells } from '../../utils/walkLineCells';

export interface BoardInputCallbacks {
  onAnnotationPen?: (x: number, y: number, pieceType: number) => void;
  onAnnotationErase?: (x: number, y: number) => void;
  onAnnotationFloodErase?: (x: number, y: number) => void;
  onAnnotationRectFill?: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    pieceType: number,
  ) => void;
  annotationTool: AnnotationTool;
  annotationPieceType: number;
  isDrawing: boolean;
  onDrawingStart?: () => void;
  onDrawingEnd?: () => void;
}

export interface BoardCoord {
  x: number;
  y: number;
}

export function getCanvasCoordinates(
  canvas: HTMLCanvasElement,
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
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
  const x = Math.floor((clientX - rect.left) / BOARD_CELL_SIZE);
  const y = Math.floor((clientY - rect.top) / BOARD_CELL_SIZE) + (40 - VISIBLE_HEIGHT);
  return { x, y };
}

export function useBoardInput(
  canvasRef: RefObject<HTMLCanvasElement>,
  callbacks: BoardInputCallbacks,
) {
  const [rectStart, setRectStart] = useState<BoardCoord | null>(null);
  const lastCell = useRef<BoardCoord | null>(null);

  const handleMouseDown = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const { onAnnotationPen, onAnnotationErase, onAnnotationFloodErase, onAnnotationRectFill } = callbacks;
    if (!onAnnotationPen && !onAnnotationErase && !onAnnotationFloodErase && !onAnnotationRectFill) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoordinates(canvas, e);
    if (!coords) return;
    lastCell.current = coords;

    if (callbacks.annotationTool === 'pen' && onAnnotationPen) {
      onAnnotationPen(coords.x, coords.y, callbacks.annotationPieceType);
      callbacks.onDrawingStart?.();
    } else if (callbacks.annotationTool === 'erase' && onAnnotationErase) {
      onAnnotationErase(coords.x, coords.y);
      callbacks.onDrawingStart?.();
    } else if (callbacks.annotationTool === 'floodErase' && onAnnotationFloodErase) {
      onAnnotationFloodErase(coords.x, coords.y);
      callbacks.onDrawingStart?.();
    } else if (callbacks.annotationTool === 'rect' && onAnnotationRectFill) {
      setRectStart(coords);
      callbacks.onDrawingStart?.();
    }
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!callbacks.isDrawing || !lastCell.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoordinates(canvas, e);
    if (!coords) return;
    const from = lastCell.current;
    const { annotationTool, annotationPieceType } = callbacks;

    if (annotationTool === 'pen' && callbacks.onAnnotationPen) {
      for (const [cx, cy] of walkLineCells(from.x, from.y, coords.x, coords.y)) {
        callbacks.onAnnotationPen(cx, cy, annotationPieceType);
      }
    } else if (annotationTool === 'erase' && callbacks.onAnnotationErase) {
      for (const [cx, cy] of walkLineCells(from.x, from.y, coords.x, coords.y)) {
        callbacks.onAnnotationErase(cx, cy);
      }
    } else if (annotationTool === 'rect' && rectStart && callbacks.onAnnotationRectFill) {
      callbacks.onAnnotationRectFill(
        rectStart.x,
        rectStart.y,
        coords.x,
        coords.y,
        annotationPieceType,
      );
    }
    lastCell.current = coords;
  };

  const handleMouseUp = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!callbacks.isDrawing) return;
    if (callbacks.annotationTool === 'rect' && rectStart && callbacks.onAnnotationRectFill) {
      const canvas = canvasRef.current;
      if (canvas) {
        const coords = getCanvasCoordinates(canvas, e);
        if (coords) {
          callbacks.onAnnotationRectFill(
            rectStart.x,
            rectStart.y,
            coords.x,
            coords.y,
            callbacks.annotationPieceType,
          );
        }
      }
      setRectStart(null);
    }
    lastCell.current = null;
    callbacks.onDrawingEnd?.();
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
