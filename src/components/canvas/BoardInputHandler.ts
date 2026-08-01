import { RefObject, useState, useRef } from 'react';
import { BOARD_CELL_SIZE, type AnnotationTool } from './canvasConstants';
import { walkLineCells } from '../../utils/walkLineCells';
import { getCanvasCoordinates, isRightButton, type BoardCoord } from './boardPointerTools';

export { getCanvasCoordinates };
export type { BoardCoord };

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
  /** Reports each cell painted by the current stroke, for stroke auto-color. */
  onStrokeCell?: (x: number, y: number) => void;
  cellSize?: number;
}

type PointerEvt =
  | React.MouseEvent<HTMLCanvasElement>
  | React.TouchEvent<HTMLCanvasElement>;

export function useBoardInput(
  canvasRef: RefObject<HTMLCanvasElement>,
  callbacks: BoardInputCallbacks,
) {
  const [rectStart, setRectStart] = useState<BoardCoord | null>(null);
  const lastCell = useRef<BoardCoord | null>(null);
  // Right-drag erases regardless of the selected tool; latched on press so the
  // whole drag keeps erasing even though mousemove reports no button.
  const erasing = useRef(false);

  const cellSize = callbacks.cellSize ?? BOARD_CELL_SIZE;

  const coordsOf = (e: PointerEvt): BoardCoord | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return getCanvasCoordinates(canvas, e, cellSize);
  };

  const paint = (x: number, y: number) => {
    callbacks.onAnnotationPen?.(x, y, callbacks.annotationPieceType);
    callbacks.onStrokeCell?.(x, y);
  };

  const handleMouseDown = (e: PointerEvt) => {
    const { onAnnotationPen, onAnnotationErase, onAnnotationFloodErase, onAnnotationRectFill } = callbacks;
    if (!onAnnotationPen && !onAnnotationErase && !onAnnotationFloodErase && !onAnnotationRectFill) return;
    const coords = coordsOf(e);
    if (!coords) return;
    lastCell.current = coords;
    erasing.current = isRightButton(e);

    if (erasing.current) {
      onAnnotationErase?.(coords.x, coords.y);
      callbacks.onDrawingStart?.();
      return;
    }

    if (callbacks.annotationTool === 'pen' && onAnnotationPen) {
      paint(coords.x, coords.y);
    } else if (callbacks.annotationTool === 'erase' && onAnnotationErase) {
      onAnnotationErase(coords.x, coords.y);
    } else if (callbacks.annotationTool === 'floodErase' && onAnnotationFloodErase) {
      onAnnotationFloodErase(coords.x, coords.y);
    } else if (callbacks.annotationTool === 'rect' && onAnnotationRectFill) {
      setRectStart(coords);
    } else {
      return;
    }
    callbacks.onDrawingStart?.();
  };

  const handleMouseMove = (e: PointerEvt) => {
    if (!callbacks.isDrawing || !lastCell.current) return;
    const coords = coordsOf(e);
    if (!coords) return;
    const from = lastCell.current;
    const { annotationTool, annotationPieceType } = callbacks;

    const eraseAlong = (fn: (x: number, y: number) => void) => {
      for (const [cx, cy] of walkLineCells(from.x, from.y, coords.x, coords.y)) {
        fn(cx, cy);
      }
    };

    if (erasing.current && callbacks.onAnnotationErase) {
      eraseAlong(callbacks.onAnnotationErase);
    } else if (annotationTool === 'pen' && callbacks.onAnnotationPen) {
      eraseAlong(paint);
    } else if (annotationTool === 'erase' && callbacks.onAnnotationErase) {
      eraseAlong(callbacks.onAnnotationErase);
    } else if (annotationTool === 'rect' && rectStart && callbacks.onAnnotationRectFill) {
      callbacks.onAnnotationRectFill(rectStart.x, rectStart.y, coords.x, coords.y, annotationPieceType);
    }
    lastCell.current = coords;
  };

  const handleMouseUp = (e: PointerEvt) => {
    if (!callbacks.isDrawing) return;
    if (!erasing.current && callbacks.annotationTool === 'rect' && rectStart && callbacks.onAnnotationRectFill) {
      const coords = coordsOf(e);
      if (coords) {
        callbacks.onAnnotationRectFill(
          rectStart.x,
          rectStart.y,
          coords.x,
          coords.y,
          callbacks.annotationPieceType,
        );
      }
      setRectStart(null);
    }
    lastCell.current = null;
    erasing.current = false;
    callbacks.onDrawingEnd?.();
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
